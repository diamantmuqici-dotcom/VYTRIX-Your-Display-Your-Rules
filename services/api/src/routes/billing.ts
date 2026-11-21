import { Readable } from 'node:stream';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../env.js';
import { requireAuth } from '../plugins/auth.js';
import { badRequest, conflict, disabled } from '../lib/errors.js';

const checkoutSchema = z.object({ plan: z.enum(['MONTHLY', 'LIFETIME']) });
const stripe = env.features.stripe ? new Stripe(env.STRIPE_SECRET_KEY) : null;

type RawRequest = FastifyRequest & { rawBody?: Buffer };

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  // Capture the exact bytes for Stripe signature verification on this route only.
  app.addHook('preParsing', async (request, _reply, payload) => {
    if (request.url.split('?')[0] !== '/billing/webhook') return payload;
    const chunks: Buffer[] = [];
    for await (const chunk of payload) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks);
    (request as RawRequest).rawBody = raw;
    return Readable.from([raw]);
  });

  app.post('/billing/checkout', { preHandler: app.authenticate }, async (request) => {
    if (!stripe || !env.features.billing) throw disabled('Billing');
    const { plan } = checkoutSchema.parse(request.body);
    const user = requireAuth(request);
    const price = plan === 'MONTHLY' ? env.STRIPE_PRICE_MONTHLY : env.STRIPE_PRICE_LIFETIME;

    const session = await stripe.checkout.sessions.create({
      mode: plan === 'MONTHLY' ? 'subscription' : 'payment',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { userId: user.id, plan },
      success_url: env.STRIPE_SUCCESS_URL,
      cancel_url: env.STRIPE_CANCEL_URL,
      allow_promotion_codes: true,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return { id: session.id, url: session.url };
  });

  app.post('/billing/webhook', async (request, reply: FastifyReply) => {
    if (!stripe || !env.features.webhooks) throw disabled('Billing webhooks');
    const signature = request.headers['stripe-signature'];
    const raw = (request as RawRequest).rawBody;
    if (typeof signature !== 'string' || !raw) throw badRequest('Missing Stripe signature or body');

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw badRequest('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      const plan = session.metadata?.plan === 'LIFETIME' ? 'LIFETIME' : 'MONTHLY';
      if (userId) {
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;
        await app.prisma.license.upsert({
          where: { userId },
          create: {
            userId, plan, status: 'ACTIVE', expiresAt: null,
            stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId,
          },
          update: {
            plan, status: 'ACTIVE',
            stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId,
          },
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await app.prisma.license.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELED', stripeSubscriptionId: null },
      });
    }

    return reply.code(200).send({ received: true });
  });

  app.get('/billing/portal', { preHandler: app.authenticate }, async (request) => {
    if (!stripe || !env.features.billing) throw disabled('Billing');
    const user = requireAuth(request);
    const license = await app.prisma.license.findUnique({ where: { userId: user.id } });
    if (!license?.stripeCustomerId) throw conflict('No billing account for this user');
    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripeCustomerId,
      return_url: env.STRIPE_CANCEL_URL,
    });
    return { url: session.url };
  });
}
