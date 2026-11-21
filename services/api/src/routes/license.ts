import type { FastifyInstance } from 'fastify';
import type { License } from '@prisma/client';
import { z } from 'zod';
import { env } from '../env.js';
import { requireAuth } from '../plugins/auth.js';
import { conflict, notFound } from '../lib/errors.js';
import {
  evaluateLicense, matchesMachine, transitionActivate, transitionTransfer,
  type LicenseView,
} from '../lib/license.js';
import { hashMachineId, isValidMachineId } from '../lib/machine.js';

const activateSchema = z.object({
  machineId: z.string().refine(isValidMachineId, 'Invalid machine id'),
  name: z.string().trim().min(1).max(80),
});
const verifySchema = z.object({ machineId: z.string().optional() });

function toView(license: License | null): LicenseView | null {
  if (!license) return null;
  return {
    plan: license.plan,
    status: license.status,
    machineHash: license.machineHash,
    machineName: license.machineName,
    activatedAt: license.activatedAt,
    transferAt: license.transferAt,
    expiresAt: license.expiresAt,
  };
}

function publicLicense(license: LicenseView) {
  return {
    plan: license.plan,
    status: license.status,
    machineName: license.machineName,
    activatedAt: license.activatedAt,
    transferAt: license.transferAt,
    expiresAt: license.expiresAt,
    machineBound: license.machineHash !== null,
  };
}

async function ensureLicense(app: FastifyInstance, userId: string): Promise<License> {
  return app.prisma.license.upsert({
    where: { userId },
    create: { userId, plan: 'TRIAL', status: 'ACTIVE' },
    update: {},
  });
}

async function persist(app: FastifyInstance, id: string, next: LicenseView): Promise<void> {
  await app.prisma.license.update({
    where: { id },
    data: {
      status: next.status,
      machineHash: next.machineHash,
      machineName: next.machineName,
      activatedAt: next.activatedAt,
      transferAt: next.transferAt,
      expiresAt: next.expiresAt,
    },
  });
}

export async function licenseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/license', { preHandler: app.authenticate }, async (request) => {
    const user = requireAuth(request);
    const license = await app.prisma.license.findUnique({ where: { userId: user.id } });
    const view = toView(license);
    return { license: view ? publicLicense(view) : null, ...evaluateLicense(view) };
  });

  app.post('/license/activate', { preHandler: app.authenticate }, async (request) => {
    const user = requireAuth(request);
    const body = activateSchema.parse(request.body);
    const record = await ensureLicense(app, user.id);
    const machineHash = hashMachineId(body.machineId, env.MACHINE_ID_PEPPER);
    const result = transitionActivate(toView(record), machineHash, body.name);

    if (!result.ok || !result.next) {
      throw conflict('License cannot be activated on this machine', {
        verdict: result.verdict,
        availableAt: result.availableAt,
      });
    }

    await persist(app, record.id, result.next);
    return { action: result.action, license: publicLicense(result.next) };
  });

  app.post('/license/transfer', { preHandler: app.authenticate }, async (request) => {
    const user = requireAuth(request);
    const record = await app.prisma.license.findUnique({ where: { userId: user.id } });
    if (!record) throw notFound('No license found');
    const result = transitionTransfer(toView(record));

    if (!result.ok || !result.next) {
      throw conflict('License transfer is not available yet', {
        verdict: result.verdict,
        availableAt: result.availableAt,
      });
    }

    await persist(app, record.id, result.next);
    return {
      action: result.action,
      machineBound: false,
      nextTransferAvailableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  });

  app.get('/license/verify', { preHandler: app.authenticate }, async (request) => {
    const user = requireAuth(request);
    const { machineId } = verifySchema.parse(request.query ?? {});
    const record = await app.prisma.license.findUnique({ where: { userId: user.id } });
    const view = toView(record);
    const evaluation = evaluateLicense(view);
    const machineMatch = machineId && view
      ? matchesMachine(view, hashMachineId(machineId, env.MACHINE_ID_PEPPER))
      : null;

    return {
      valid: evaluation.valid && machineMatch !== false,
      verdict: evaluation.verdict,
      plan: view?.plan ?? null,
      expiresAt: evaluation.expiresAt,
      machineBound: evaluation.machineBound,
      machineMatch,
    };
  });
}
