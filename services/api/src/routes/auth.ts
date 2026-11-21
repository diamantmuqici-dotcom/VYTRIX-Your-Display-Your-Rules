import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@prisma/client';
import { z } from 'zod';
import { env } from '../env.js';
import { requireAuth } from '../plugins/auth.js';
import { randomToken, sha256Hex } from '../lib/crypto.js';
import { parseDurationMs } from '../lib/duration.js';
import { badRequest, conflict, disabled, unauthorized } from '../lib/errors.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { evaluateLicense } from '../lib/license.js';

const PASSWORD = z.string().min(12).max(128);
const EMAIL = z.string().trim().toLowerCase().email().max(254);
const REFRESH_COOKIE = 'vytrix_refresh';
const STATE_COOKIE = 'vytrix_discord_state';

const registerSchema = z.object({
  email: EMAIL,
  password: PASSWORD,
  displayName: z.string().trim().min(1).max(80),
});
const loginSchema = z.object({ email: EMAIL, password: z.string().min(1).max(128) });
const refreshSchema = z.object({ refreshToken: z.string().min(10).optional() }).default({});
const forgotSchema = z.object({ email: EMAIL });
const resetSchema = z.object({ token: z.string().min(10), newPassword: PASSWORD });

async function issueSession(app: FastifyInstance, reply: FastifyReply, user: User) {
  const refreshTtl = parseDurationMs(env.REFRESH_TOKEN_TTL);
  const accessToken = signToken({
    userId: user.id, role: user.role, type: 'access',
    secret: env.JWT_SECRET, ttl: env.ACCESS_TOKEN_TTL,
  });
  const refreshToken = signToken({
    userId: user.id, role: user.role, type: 'refresh',
    secret: env.JWT_SECRET, ttl: env.REFRESH_TOKEN_TTL,
  });

  await app.prisma.session.create({
    data: {
      userId: user.id,
      refreshHash: sha256Hex(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtl),
    },
  });

  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(refreshTtl / 1000),
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(parseDurationMs(env.ACCESS_TOKEN_TTL) / 1000),
    tokenType: 'Bearer',
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  };
}

function fromRequest(request: FastifyRequest): string | null {
  const bodyToken = (request.body as { refreshToken?: unknown } | undefined)?.refreshToken;
  if (typeof bodyToken === 'string' && bodyToken.length > 0) return bodyToken;
  return request.cookies[REFRESH_COOKIE] ?? null;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    if (await app.prisma.user.findUnique({ where: { email: body.email } })) {
      throw conflict('Email already registered');
    }
    const passwordHash = await hashPassword(body.password);
    let user: User;
    try {
      user = await app.prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          displayName: body.displayName,
          licenses: { create: { plan: 'TRIAL', status: 'ACTIVE' } },
        },
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw conflict('Email already registered');
      }
      throw error;
    }
    return reply.code(201).send(await issueSession(app, reply, user));
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      throw unauthorized('Invalid email or password');
    }
    return issueSession(app, reply, user);
  });

  app.post('/auth/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const token = body.refreshToken ?? request.cookies[REFRESH_COOKIE] ?? null;
    if (!token) throw unauthorized();

    const claims = verifyToken(token, env.JWT_SECRET, 'refresh');
    if (!claims) throw unauthorized('Invalid or expired refresh token');

    const refreshHash = sha256Hex(token);
    const stored = await app.prisma.session.findFirst({ where: { refreshHash } });
    if (!stored || stored.revoked || stored.expiresAt.getTime() <= Date.now()) {
      throw unauthorized('Refresh session expired');
    }
    if (stored.refreshHash !== refreshHash) throw unauthorized('Refresh session expired');

    const user = await app.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw unauthorized();

    await app.prisma.session.update({ where: { id: stored.id }, data: { revoked: true } });
    return issueSession(app, reply, user);
  });

  app.post('/auth/logout', async (request, reply) => {
    const token = fromRequest(request);
    if (token) {
      await app.prisma.session.updateMany({
        where: { refreshHash: sha256Hex(token), revoked: false },
        data: { revoked: true },
      });
    } else {
      const user = requireAuth(request);
      await app.prisma.session.updateMany({ where: { userId: user.id }, data: { revoked: true } });
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const user = requireAuth(request);
    const record = await app.prisma.user.findUnique({
      where: { id: user.id },
      include: { licenses: true },
    });
    if (!record) throw unauthorized();
    const license = record.licenses[0] ?? null;
    return {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      role: record.role,
      discordId: record.discordId,
      createdAt: record.createdAt,
      license: license ? { plan: license.plan, ...evaluateLicense({
        plan: license.plan, status: license.status, machineHash: license.machineHash,
        machineName: license.machineName, activatedAt: license.activatedAt,
        transferAt: license.transferAt, expiresAt: license.expiresAt,
      }) } : null,
    };
  });

  app.post('/auth/forgot-password', async (request, reply) => {
    const { email } = forgotSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(202).send({ accepted: true });

    const token = randomToken(32);
    await app.prisma.resetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256Hex(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    if (env.NODE_ENV === 'production') return reply.code(202).send({ accepted: true });
    return { accepted: true, token };
  });

  app.post('/auth/reset-password', async (request) => {
    const { token, newPassword } = resetSchema.parse(request.body);
    const record = await app.prisma.resetToken.findFirst({
      where: { tokenHash: sha256Hex(token), used: false, expiresAt: { gt: new Date() } },
    });
    if (!record) throw badRequest('Invalid or expired reset token');

    const passwordHash = await hashPassword(newPassword);
    await app.prisma.$transaction([
      app.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      app.prisma.resetToken.update({ where: { id: record.id }, data: { used: true } }),
      app.prisma.session.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);
    return { ok: true };
  });

  // Discord OAuth2 — scaffolded but fully wired when all DISCORD_* values are present.
  app.get('/auth/discord', async (_request, reply) => {
    if (!env.features.discord) throw disabled('Discord OAuth2');
    const state = randomToken(24);
    reply.setCookie(STATE_COOKIE, state, {
      httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/', maxAge: 600,
    });
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify email',
      state,
      prompt: 'consent',
    });
    return reply.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  });

  app.get('/auth/discord/callback', async (request, reply) => {
    if (!env.features.discord) throw disabled('Discord OAuth2');
    const query = request.query as { code?: string; state?: string };
    const state = request.cookies[STATE_COOKIE];
    if (!query.code || !query.state || !state || query.state !== state) {
      throw badRequest('Invalid OAuth state');
    }
    reply.clearCookie(STATE_COOKIE, { path: '/' });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: query.code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    });
    if (!tokenResponse.ok) throw unauthorized('Discord token exchange failed');

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) throw unauthorized('Discord token exchange failed');

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userResponse.ok) throw unauthorized('Discord profile lookup failed');
    const profile = (await userResponse.json()) as { id?: string; email?: string; username?: string };
    if (!profile.id || !profile.email) throw badRequest('Discord account missing email');

    let user = await app.prisma.user.findFirst({
      where: { OR: [{ discordId: profile.id }, { email: profile.email.toLowerCase() }] },
    });
    if (!user) {
      user = await app.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          passwordHash: await hashPassword(randomToken(32)),
          displayName: (profile.username ?? 'Discord user').slice(0, 80),
          discordId: profile.id,
          licenses: { create: { plan: 'TRIAL', status: 'ACTIVE' } },
        },
      });
    } else if (!user.discordId) {
      user = await app.prisma.user.update({ where: { id: user.id }, data: { discordId: profile.id } });
    }
    return issueSession(app, reply, user);
  });
}
