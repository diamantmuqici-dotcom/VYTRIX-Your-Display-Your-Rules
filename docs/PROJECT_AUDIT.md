# VYTRIX Project Audit

Date: 2026-11-21
Repository: `VYTRIX/` inside `C:\Users\diama\Desktop\11\Aether`
Branch: `privacy/sovereign-edition`
Head before audit: `9182c46 feat(vytrix): unified display and performance suite`

## Scope

This audit covers the `VYTRIX/` tree only. The parent `Aether` directory contains unrelated untracked files and is not part of this product.

No destructive Git command was run. No database, user file, or existing source file was deleted. Generated `.next`, `src-tauri/gen`, and emitted shared-types JS files were removed from Git tracking only; they remain on disk and are now ignored.

## Repository shape

- Workspace manager: npm workspaces. `pnpm-workspace.yaml` is present but pnpm is not installed.
- Apps: `desktop`, `overlay`, `mobile-control`, `updater`, `website`.
- Services: `api`, `workers`.
- Packages: `shared-types`, `design-system`, `validation`, `preset-format`, `config`.
- Native desktop: Tauri 2, Rust, SQLite, Win32 FFI modules.
- Website: Next.js App Router.
- Backend: Fastify 5, Prisma, PostgreSQL schema/migration/seed.
- Toolchain available: Node v24.21.0, npm 11.19.0, rustc/cargo 1.99.1.

## Existing working features

- Native IPC commands registered: `system_summary`, `list_monitors`, `display_apply`, `display_rollback`, `sample_metrics`, `register_hotkey`, `gpu_backend`, `detect_game`, optimizer commands, SQLite storage commands, overlay commands, and phone commands.
- Windows display enumeration, validated apply payload, rollback path, and explicit confirmation flow.
- Real foreground-process/window-title game detection. No game-file writes, memory reads, or injection.
- Reversible optimizer allowlist with previous-value capture and restore.
- Real CPU/RAM/GPU/metric sampling where Windows exposes values; unavailable metrics stay null.
- Native global hotkeys with action strings and crosshair/zoom/profile dispatch.
- Separate transparent overlay window; no injection or anti-cheat bypass.
- LAN-only Phone Control agent with explicit pairing, 6-digit code, 5-minute token, 16KB body cap, permission gates, and native state events.
- SQLite local settings/profile/preset/history storage.
- Next.js public/auth/legal website surfaces with shared design tokens.
- Fastify auth, licensing, presets, releases, telemetry, Stripe env gating, Discord OAuth env gating.
- Original vector/raster branding assets and release/checksum/signing scripts.
- Tests passing at audit time: desktop Rust 10/10, preset tests 4/4, desktop UI tests 6/6, API tests 15/15, updater tests 3/3.

## Missing or incomplete against master specification

1. **Audit documents** — `PROJECT_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, `FILE_MANIFEST.md`, and `FEATURE_MATRIX.md` were absent. This commit adds them.
2. **Game database package** — `packages/game-database/` does not exist. Current game data lives in `apps/desktop/src/data/games.ts` as 41 verified entries plus a text catalog of roughly 236 names; those names are not individual schema-valid profile records.
3. **Desktop page coverage** — implemented pages are 13. The specification requires additional surfaces including Vision Lab, Diagnostics, SmartSwitch, Device Manager, Gaming Intelligence, About, Admin, and several dedicated game/library/detail routes.
4. **Feature modules** — `src/features/` tree is absent. Logic currently sits in pages, hooks, services, and stores.
5. **Native module granularity** — Rust modules are consolidated (`commands/mod.rs`, `gpu/mod.rs`, etc.) rather than split into the requested per-concern files.
6. **Vision Lab / AI / Gaming Intelligence** — no implementation yet. Do not claim these as working.
7. **Automated QA layout** — `tests/unit`, `tests/integration`, `tests/e2e`, `tests/security`, and `tests/performance` do not exist. Existing tests are package-local.
8. **PowerShell build scripts** — `scripts/*.ps1` are absent. Existing scripts are `.mjs`.
9. **Root support files** — `.editorconfig`, `turbo.json`, root `CONTRIBUTING.md`, and root `SECURITY.md` are absent. Documentation exists under `docs/`.
10. **Installer artifacts** — no `VYTRIX-Setup-x64.exe`, portable executable, checksums, or signed `latest.json` exist yet. Build scripts exist; artifacts have not been produced.
11. **Release provisioning** — signing key, public key hex, manifest signature, Authenticode thumbprint, deployed domain, object storage, and PostgreSQL instance are still external FILLs.
12. **GPU vendor backends** — NVAPI/ADL/IGCL are not linked. The GPU backend reports `software`/`unavailable`; no fake vendor support is presented.
13. **Website gaps** — routes such as `dashboard`, `devices`, `billing`, `library`, `creators`, `documentation`, `trust`, `support`, and `admin` are not present. Marketing/auth/legal routes are present.
14. **Backend route gaps** — users, devices, games, updates, downloads, moderation, and admin route groups are not present.
15. **Database model coverage** — schema covers users, sessions, licenses, presets, reports, releases, telemetry, and Stripe data. Device, CreatorProfile, GameConfiguration, ratings, favorites, support tickets, entitlements, and several retention fields are not yet modeled.

## Security review

- Frontend native calls outside Tauri fail closed with `RUNTIME_UNAVAILABLE`.
- Preset files are inert JSON with schema version, content hash, bounded parsing, and executable-field rejection.
- Phone agent binds LAN only while running, creates no firewall rule, and enforces permissions natively.
- Optimizer exposes only a fixed allowlist; no arbitrary registry path crosses IPC.
- Auth uses Argon2id and hashed refresh sessions; Stripe/Discord integrations are env-gated.
- Update manifest signature is intentionally empty until a real private key is provisioned; updater rejects the zero public key placeholder.
- No embedded secrets were found in tracked files. `.pem` and `.env` are ignored.

## Duplication and drift

- Game names overlap between verified entries and the text catalog; this must be normalized in the game-database phase.
- `docs/ARCHITECTURE.md` describes GPU vendor backends as if available; implementation currently reports software/unavailable. Update the doc during the GPU phase.
- Root `package.json` description contains a mojibake character; fix during the root-files phase.

## Audit conclusion

The repository is a working foundation, not a finished commercial release. The next highest-value work is the 160+ individual game-configuration database with validation, followed by SmartSwitch restoration, Vision Lab, missing desktop/website/cloud surfaces, and release provisioning. Build the missing functionality in complete units; keep all existing green builds green.
