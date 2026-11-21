# VYTRIX

**YOUR DISPLAY. YOUR RULES.**

A unified Windows 10/11 gaming display and performance suite: desktop app, in-game overlay, website, cloud API, and updater in one monorepo.

## Status

Phase 1 — Foundation. The monorepo, original brand identity, design system, typed domain model, preset format, desktop shell with all fourteen sections, website foundation, and documentation are in place. Native Windows integrations land in Phase 2 onward.

## Layout

| Path | Role |
| --- | --- |
| `apps/desktop` | Tauri 2 shell — React + TypeScript frontend, Rust backend |
| `apps/overlay` | Lightweight standalone overlay host |
| `apps/website` | Next.js public site and authenticated dashboard |
| `apps/mobile-control` | LAN-only phone companion web UI |
| `services/api` | Fastify cloud API |
| `packages/design-system` | Shared design tokens and CSS |
| `packages/shared-types` | Domain types shared across apps |
| `packages/preset-format` | Versioned, inert preset file format |
| `packages/validation` | Input validation helpers |
| `packages/config` | Config defaults and runtime constants |
| `database` | Prisma schema and migrations |
| `assets/branding` | Original VYTRIX vector identity |
| `installers` | Windows packaging assets |
| `docs` | Architecture, security, building, installation, API |

## Quick start

```powershell
npm install
npm run build
npm run dev
```

The desktop frontend runs in a browser without Tauri for UI development. Native display, GPU, and system commands require the Tauri runtime on Windows and report an explicit unsupported state elsewhere — no simulated values.

## Principles

- No DLL injection, no game memory access, no game-file modification.
- No anti-cheat evasion and no hidden-player detection.
- Every Windows optimization records its previous value and is reversible.
- The app is fully functional locally without an account or network.
- All community content is inert data, never code.

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md`.

## Release and infrastructure

| Path | Role |
| --- | --- |
| `apps/updater` | Standalone Rust CLI: signed manifest verification, SHA-256 checks, installer launch |
| `scripts/build-release.mjs` | Build, hash artifacts, stage unsigned `dist-release/manifest.json` |
| `scripts/sign-manifest.mjs` | Sign the staged manifest with the Ed25519 release key |
| `scripts/check-domain.mjs` | Report current DNS resolution for `vytrix.gg` |
| `.github/workflows` | CI on push/PR and tagged Windows releases |

```powershell
node scripts/check-domain.mjs
node scripts/build-release.mjs
node scripts/sign-manifest.mjs
cd apps/updater
cargo check
cargo run -- --check-only
```

The updater ships with a placeholder public key that must be replaced with the
real release key before shipping; see `apps/updater/README.md` and
`docs/RELEASING.md`. Release documentation lives in `docs/RELEASING.md`,
`docs/UPDATER.md`, `docs/INSTALLATION.md`, `docs/FAQ.md`, and
`docs/SECURITY-CHECKLIST.md`.
