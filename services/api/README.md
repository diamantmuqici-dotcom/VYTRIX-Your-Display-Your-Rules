# @vytrix/api

Cloud backend for the VYTRIX Windows gaming display suite — **YOUR DISPLAY. YOUR RULES.**

Node 20+ · Fastify 5 · TypeScript · Prisma · PostgreSQL · Zod.

## Setup

From the repository root (`VYTRIX/`):

```bash
npm install
npm run db:generate -w @vytrix/api      # generate Prisma Client from database/schema.prisma
```

Configure the API:

```bash
cp services/api/.env.example services/api/.env
# edit .env: set DATABASE_URL, JWT_SECRET (32+ chars), MACHINE_ID_PEPPER (16+ chars)
```

Create the database and apply the hand-written migration:

```bash
npm run db:migrate -w @vytrix/api
# optional dev data (placeholder credentials only):
node database/seed.mjs
```

Run it:

```bash
npm run dev -w @vytrix/api       # tsx watch
npm run build -w @vytrix/api     # prisma generate + tsc -> dist/
npm run start -w @vytrix/api     # node dist/server.js
npm run typecheck -w @vytrix/api
npm run test -w @vytrix/api
```

`GET /health` returns `200` with feature flags and storage driver when the database is reachable.

## Configuration and feature gating

All configuration is validated by Zod at boot; invalid values stop startup with a readable error.
Optional integrations are **disabled**, never simulated:

| Feature | Required env | Behavior when unset |
|---|---|---|
| Stripe checkout/portal | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LIFETIME`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` | `503 feature_disabled` |
| Stripe webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `503 feature_disabled` |
| Discord OAuth2 | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` | `503 feature_disabled` |
| Signed releases | `RELEASE_SIGNING_PUBLIC_KEY` | `POST /releases` returns `503` |
| Admin CI token | `ADMIN_RELEASE_TOKEN` | Admin JWT role required instead |
| S3 storage | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | local disk under `STORAGE_LOCAL_DIR` |
| Telemetry | `TELEMETRY_ENABLED=false` to disable | `204` with no write |

## Routes

- **Auth** — `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`; `GET /auth/me`, `/auth/discord`, `/auth/discord/callback`.
- **License** — `GET /license`, `POST /license/activate`, `POST /license/transfer`, `GET /license/verify`.
- **Billing** — `POST /billing/checkout`, `POST /billing/webhook`, `GET /billing/portal`.
- **Releases** — `GET /releases/latest`, `POST /releases`.
- **Presets** — `GET /presets`, `GET /presets/:id`, `POST /presets`, `POST /presets/:id/report`.
- **Telemetry** — `POST /telemetry`.

Passwords are Argon2id hashes. Access tokens are 15-minute JWTs; refresh tokens are rotated on every
`/auth/refresh` and stored only as SHA-256 hashes. Password reset tokens are stored hashed with a
one-hour expiry; the raw token is returned only when `NODE_ENV != production`.

## Licensing

One license per user. Activation binds a machine id that is SHA-256 hashed with `MACHINE_ID_PEPPER`
before storage — raw ids never touch the database. A trial starts its seven-day clock on first
activation; lifetime licenses have no expiry; monthly licenses are driven by Stripe webhooks.
A machine transfer (explicit or by activating on a different machine) starts a seven-day cooldown.

## Signed release manifests

Generate an Ed25519 keypair once:

```bash
openssl genpkey -algorithm ed25519 -out release.key
openssl pkey -in release.key -pubout -out release.pub
```

Set `RELEASE_SIGNING_PUBLIC_KEY` to the contents of `release.pub` (real newlines or `\n` escapes).
Signatures are base64-encoded Ed25519 signatures over the canonical JSON of the manifest **without**
the `signature` field. Canonical JSON means recursively sorted object keys, no whitespace, arrays in
order:

```json
{"files":[{"name":"VYTRIX-Setup.exe","sha256":"<64 lowercase hex>","size":12345678,"url":"https://..."}],"notes":"","publishedAt":"2026-01-01T00:00:00.000Z","version":"1.4.0"}
```

Every file entry must carry a lowercase hex SHA-256 digest and a byte size. `POST /releases` rejects
bad signatures with `401` and bad digests with `400`. `GET /releases/latest` returns that manifest
plus the `signature` field.

## Community presets

Presets are inert data, schema version 1, of kind `color`, `crosshair`, or `game-profile`.
`POST /presets` runs the same validator as the shared preset-format package: bounded strings,
arrays and depth, a 262,144-byte ceiling, and recursive rejection of executable-looking keys
(`script`, `code`, `exec`, `command`, `eval`, `handler`, `callback`, `onload`, `onclick`, `require`,
`import`, `path`, `url`, `endpoint`, …). `contentHash` is the SHA-256 of the canonically serialized
`payload` object.
