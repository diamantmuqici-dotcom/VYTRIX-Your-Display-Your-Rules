// Optional development seed. All credentials below are local placeholders.
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Dev-Only-Password-123!';
const ADMIN_PASSWORD = 'Dev-Only-Admin-123!';

async function seedUser(email, displayName, role, password) {
  const passwordHash = await argon2.hash(password);
  return prisma.user.upsert({
    where: { email },
    create: {
      email, displayName, role, passwordHash,
      licenses: { create: { plan: role === 'ADMIN' ? 'LIFETIME' : 'TRIAL', status: 'ACTIVE' } },
    },
    update: { displayName, role, passwordHash },
  });
}

const demo = await seedUser('dev@vytrix.local', 'Local Dev', 'USER', DEMO_PASSWORD);
await seedUser('admin@vytrix.local', 'Local Admin', 'ADMIN', ADMIN_PASSWORD);

const payload = {
  schemaVersion: 1,
  kind: 'crosshair',
  name: 'Clean Dot',
  description: 'Inert sample preset for local development.',
  payload: { center: { size: 4, color: '#00e5ff', outline: true }, gaps: [3, 3, 3, 3] },
};

await prisma.preset.upsert({
  where: { id: '00000000-0000-4000-8000-000000000001' },
  create: {
    id: '00000000-0000-4000-8000-000000000001',
    authorId: demo.id,
    kind: payload.kind,
    name: payload.name,
    description: payload.description,
    payload,
    contentHash: '0000000000000000000000000000000000000000000000000000000000000000',
  },
  update: {},
});

console.log('VYTRIX dev seed complete.');
await prisma.$disconnect();
