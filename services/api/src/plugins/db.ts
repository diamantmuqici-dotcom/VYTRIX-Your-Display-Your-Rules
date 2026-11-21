import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

/** Attach a single PrismaClient to the app and disconnect it on shutdown. */
export function registerDb(app: FastifyInstance): void {
  const prisma = new PrismaClient({ log: ['warn', 'error'] });
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}
