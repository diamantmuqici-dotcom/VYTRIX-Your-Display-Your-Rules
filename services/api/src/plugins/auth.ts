import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../env.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyToken } from '../lib/jwt.js';
import type { AuthUser } from '../types/augment.js';

function bearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token === '' ? null : token;
}

/** Extract an authenticated user or throw 401. */
export function requireAuth(request: FastifyRequest): AuthUser {
  if (!request.auth) throw unauthorized();
  return request.auth;
}

/** Install the access-token and admin-token guards on the root instance. */
export function registerAuth(app: FastifyInstance): void {
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    const token = bearer(request);
    if (!token) throw unauthorized();
    const claims = verifyToken(token, env.JWT_SECRET, 'access');
    if (!claims) throw unauthorized('Invalid or expired access token');
    request.auth = { id: claims.sub, role: claims.role, email: '' };
  });

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearer(request);
    if (env.features.adminToken && token === env.ADMIN_RELEASE_TOKEN) {
      request.auth = { id: 'ci-admin', email: 'ci@vytrix.local', role: 'ADMIN' };
      return;
    }
    await app.authenticate(request, reply);
    const user = requireAuth(request);
    if (user.role.toUpperCase() !== 'ADMIN') throw forbidden();
  });
}
