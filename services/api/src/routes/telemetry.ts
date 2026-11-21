import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';
import { sha256Hex } from '../lib/crypto.js';

const pingSchema = z.object({
  installId: z.string().uuid(),
  appVersion: z.string().min(1).max(40).regex(/^[0-9A-Za-z.+-]+$/),
});

/** Opt-in anonymous install ping — no event payload is accepted or stored. */
export async function telemetryRoutes(app: FastifyInstance): Promise<void> {
  app.post('/telemetry', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    if (!env.features.telemetry) return reply.code(204).send();
    const body = pingSchema.parse(request.body);
    await app.prisma.telemetryEvent.create({
      data: { installHash: sha256Hex(body.installId), appVersion: body.appVersion },
    });
    return reply.code(204).send();
  });
}
