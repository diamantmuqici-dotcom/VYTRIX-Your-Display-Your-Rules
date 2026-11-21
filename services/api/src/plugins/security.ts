import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';

/** CORS, cookies, global rate limiting and response hardening headers. */
export function registerSecurity(app: FastifyInstance): void {
  const origins = env.CORS_ORIGIN === '*'
    ? true
    : env.CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);

  app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: { httpOnly: true, sameSite: 'lax', path: '/' },
  });

  app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cache-Control', 'no-store');
    if (env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return payload;
  });
}
