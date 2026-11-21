import { createPublicKey, verify as verifySignature } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';
import { disabled, notFound, unauthorized } from '../lib/errors.js';
import { canonicalize } from '../lib/preset-validation.js';

const fileSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().refine((value) => {
    if (!URL.canParse(value)) return false;
    return ['http:', 'https:'].includes(new URL(value).protocol);
  }, 'file url must be http(s)'),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 must be 64 lowercase hex chars'),
  size: z.number().int().nonnegative().max(1_000_000_000),
});

const releaseSchema = z.object({
  version: z.string().min(1).max(64).regex(/^[0-9A-Za-z][0-9A-Za-z.+-]*$/),
  publishedAt: z.string().datetime(),
  notes: z.string().max(8_000).optional(),
  files: z.array(fileSchema).min(1).max(64),
  signature: z.string().min(1).max(2_048),
});

export async function releaseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/releases/latest', async () => {
    const latest = await app.prisma.release.findFirst({ orderBy: { publishedAt: 'desc' } });
    if (!latest) throw notFound('No releases published');
    const manifest = latest.manifest;
    if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
      throw new Error('Stored release manifest is malformed');
    }
    return { ...manifest, signature: latest.signature };
  });

  app.post('/releases', { preHandler: app.requireAdmin }, async (request, reply) => {
    if (!env.features.releases) throw disabled('Signed releases');
    const body = releaseSchema.parse(request.body);
    const { signature, ...manifest } = body;
    const payload = canonicalize({
      version: manifest.version,
      publishedAt: manifest.publishedAt,
      notes: manifest.notes ?? '',
      files: manifest.files,
    });

    let valid = false;
    try {
      const publicKey = createPublicKey(env.RELEASE_SIGNING_PUBLIC_KEY.replace(/\\n/g, '\n'));
      valid = verifySignature(
        null,
        Buffer.from(payload, 'utf8'),
        publicKey,
        Buffer.from(signature, 'base64'),
      );
    } catch {
      throw new Error('RELEASE_SIGNING_PUBLIC_KEY is not a valid Ed25519 public key');
    }
    if (!valid) throw unauthorized('Release manifest signature is invalid');

    await app.prisma.release.upsert({
      where: { version: body.version },
      create: {
        version: body.version,
        publishedAt: new Date(body.publishedAt),
        manifest,
        signature,
      },
      update: {
        publishedAt: new Date(body.publishedAt),
        manifest,
        signature,
      },
    });
    return reply.code(201).send({ version: body.version, published: true });
  });
}
