import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../plugins/auth.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { PRESET_KINDS, validatePreset } from '../lib/preset-validation.js';

const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  kind: z.enum(PRESET_KINDS).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().nonnegative().max(100_000).default(0),
});
const idSchema = z.object({ id: z.string().uuid() });
const reportSchema = z.object({ reason: z.string().trim().min(3).max(500) });

function publicPreset(preset: {
  id: string; kind: string; name: string; description: string;
  contentHash: string; createdAt: Date;
}) {
  return {
    id: preset.id,
    kind: preset.kind,
    name: preset.name,
    description: preset.description,
    contentHash: preset.contentHash,
    createdAt: preset.createdAt,
  };
}

export async function presetRoutes(app: FastifyInstance): Promise<void> {
  app.get('/presets', async (request) => {
    const query = listSchema.parse(request.query ?? {});
    const where: Prisma.PresetWhereInput = {
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.q ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await app.prisma.$transaction([
      app.prisma.preset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: { author: { select: { id: true, displayName: true } }, _count: { select: { reports: true } } },
      }),
      app.prisma.preset.count({ where }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items: items.map((item) => ({
        ...publicPreset(item),
        author: item.author,
        reports: item._count.reports,
      })),
    };
  });

  app.get('/presets/:id', async (request) => {
    const { id } = idSchema.parse(request.params);
    const preset = await app.prisma.preset.findUnique({
      where: { id },
      include: { author: { select: { id: true, displayName: true } } },
    });
    if (!preset) throw notFound('Preset not found');
    return { ...publicPreset(preset), author: preset.author, payload: preset.payload };
  });

  app.post('/presets', { preHandler: app.authenticate }, async (request, reply) => {
    const user = requireAuth(request);
    const result = validatePreset(request.body);
    if (!result.ok) throw badRequest('Invalid preset', result.errors);

    const preset = await app.prisma.preset.create({
      data: {
        authorId: user.id,
        kind: result.preset.kind,
        name: result.preset.name,
        description: result.preset.description,
        payload: result.preset as unknown as Prisma.InputJsonValue,
        contentHash: result.contentHash,
      },
    });
    return reply.code(201).send({ ...publicPreset(preset), payload: preset.payload });
  });

  app.post('/presets/:id/report', { preHandler: app.authenticate }, async (request, reply) => {
    const user = requireAuth(request);
    const { id } = idSchema.parse(request.params);
    const { reason } = reportSchema.parse(request.body);
    if (!(await app.prisma.preset.findUnique({ where: { id }, select: { id: true } }))) {
      throw notFound('Preset not found');
    }
    try {
      const report = await app.prisma.presetReport.create({
        data: { presetId: id, reporterId: user.id, reason },
      });
      return reply.code(201).send({ id: report.id, createdAt: report.createdAt });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw conflict('Preset already reported by this account');
      }
      throw error;
    }
  });
}
