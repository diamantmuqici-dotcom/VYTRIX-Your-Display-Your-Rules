import Fastify from 'fastify';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from './env.js';
import { ApiError } from './lib/errors.js';
import { createStorage } from './lib/storage.js';
import { registerAuth } from './plugins/auth.js';
import { registerDb } from './plugins/db.js';
import { registerSecurity } from './plugins/security.js';
import { authRoutes } from './routes/auth.js';
import { billingRoutes } from './routes/billing.js';
import { licenseRoutes } from './routes/license.js';
import { presetRoutes } from './routes/presets.js';
import { releaseRoutes } from './routes/releases.js';
import { telemetryRoutes } from './routes/telemetry.js';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  },
  bodyLimit: 1_048_576,
  trustProxy: true,
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ApiError) {
    return reply.code(error.statusCode).send({
      error: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
  }
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'validation_error',
      message: 'Invalid request',
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return reply.code(409).send({ error: 'conflict', message: 'Unique constraint violated' });
    if (error.code === 'P2025') return reply.code(404).send({ error: 'not_found', message: 'Record not found' });
  }
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    const message = (error as { message?: unknown }).message;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({
        error: 'request_error',
        message: typeof message === 'string' ? message : 'Request error',
      });
    }
  }
  request.log.error(error);
  return reply.code(500).send({ error: 'internal_error', message: 'Unexpected server error' });
});

app.setNotFoundHandler((request, reply) => {
  return reply.code(404).send({ error: 'not_found', message: `Route ${request.method} ${request.url} not found` });
});

registerSecurity(app);
registerDb(app);
registerAuth(app);
app.decorate('storage', createStorage({
  endpoint: env.S3_ENDPOINT || undefined,
  region: env.S3_REGION,
  bucket: env.S3_BUCKET || undefined,
  accessKeyId: env.S3_ACCESS_KEY_ID || undefined,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY || undefined,
  publicBaseUrl: env.S3_PUBLIC_BASE_URL || undefined,
  localDir: env.STORAGE_LOCAL_DIR,
}));

app.get('/health', async () => {
  await app.prisma.$queryRaw`SELECT 1`;
  return {
    status: 'ok',
    service: '@vytrix/api',
    storage: app.storage.driver,
    features: env.features,
    timestamp: new Date().toISOString(),
  };
});

await authRoutes(app);
await licenseRoutes(app);
await billingRoutes(app);
await releaseRoutes(app);
await presetRoutes(app);
await telemetryRoutes(app);

await app.ready();

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, 'VYTRIX API shutting down');
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error, 'shutdown failed');
    process.exit(1);
  }
};
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error, 'failed to start VYTRIX API');
  process.exit(1);
}
