-- VYTRIX cloud backend — initial schema (PostgreSQL)

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "Plan" AS ENUM ('TRIAL', 'MONTHLY', 'LIFETIME');
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "discordId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'TRIAL',
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "machineHash" TEXT,
    "machineName" TEXT,
    "activatedAt" TIMESTAMP(3),
    "transferAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "presets" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "preset_reports" (
    "id" UUID NOT NULL,
    "presetId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preset_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "releases" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "manifest" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "telemetry_events" (
    "id" UUID NOT NULL,
    "installHash" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_discordId_key" ON "users"("discordId");
CREATE UNIQUE INDEX "sessions_refreshHash_key" ON "sessions"("refreshHash");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
CREATE UNIQUE INDEX "reset_tokens_tokenHash_key" ON "reset_tokens"("tokenHash");
CREATE INDEX "reset_tokens_userId_idx" ON "reset_tokens"("userId");
CREATE UNIQUE INDEX "licenses_userId_key" ON "licenses"("userId");
CREATE UNIQUE INDEX "licenses_stripeSubscriptionId_key" ON "licenses"("stripeSubscriptionId");
CREATE INDEX "licenses_status_idx" ON "licenses"("status");
CREATE INDEX "presets_kind_createdAt_idx" ON "presets"("kind", "createdAt");
CREATE INDEX "presets_contentHash_idx" ON "presets"("contentHash");
CREATE UNIQUE INDEX "preset_reports_presetId_reporterId_key" ON "preset_reports"("presetId", "reporterId");
CREATE UNIQUE INDEX "releases_version_key" ON "releases"("version");
CREATE INDEX "releases_publishedAt_idx" ON "releases"("publishedAt");
CREATE INDEX "telemetry_events_installHash_idx" ON "telemetry_events"("installHash");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reset_tokens" ADD CONSTRAINT "reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "presets" ADD CONSTRAINT "presets_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "preset_reports" ADD CONSTRAINT "preset_reports_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "preset_reports" ADD CONSTRAINT "preset_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
