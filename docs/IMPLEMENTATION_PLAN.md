# VYTRIX Implementation Plan

## Working rule

Ship complete units. Each phase ends with build, test, fix, manifest update, matrix update, and a logical commit. No feature is marked complete until it compiles and has a passing test or a verified manual check.

## Phase 0 — Audit

Status: complete.

Artifacts: `docs/PROJECT_AUDIT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/FILE_MANIFEST.md`, `docs/FEATURE_MATRIX.md`.

## Phase 1 — Brand and design

Status: mostly complete.

Present: original SVG/PNG/ICO assets, color tokens, typography tokens, Tailwind theme, Framer Motion usage, reduced-motion setting.

Remaining: replace any placeholder website media with real screenshots captured from the built desktop app; add dedicated design-system tests; add `.editorconfig`.

## Phase 2 — Desktop foundation

Status: complete.

Present: Tauri 2 shell, React/TS/Vite/Tailwind, Zustand-style app store, SQLite storage, narrow typed IPC, global error boundary behavior in App shell, command registry foundation.

Remaining: split `App.tsx` into `app/*` structure; add `Router.tsx`, `AppProviders.tsx`, `ErrorBoundary.tsx`, `AppShell.tsx`, and navigation config files.

## Phase 3 — Display and color engine

Status: partial.

Present: monitor list, display apply/rollback, color clamping, per-monitor settings, color studio, display effects, theme system, GPU backend reporting.

Remaining: RGB curves, white point, shadow/highlight advanced controls, per-game color resolution, real vendor API linkage or explicit capability gating, calibration history, rollback edge-case tests.

## Phase 4 — 160+ game database

Status: complete.

Artifacts: `packages/game-database/`, `docs/GAME_DATABASE.md`, generated desktop catalog metadata, and generated Rust executable hints.

Present: 160 individual schema-valid JSON records across 8 categories and 9 launchers; typed schema, validation, registry, search, compatibility summary, and version gates; deterministic generation and duplicate checks; desktop library filters and capability metadata; native detection with preserved legacy hints and generated database hints.

Validation: 6 package tests pass; `npm run validate:games` reports 160 configurations with 29 verified, 65 partial, and 66 manual entries; `npm run check:games` reports no duplicate ids or names; desktop build/typecheck/tests pass; Rust check passes and 12 native tests pass.

Acceptance met: `npm run validate:games` exits 0 and reports 160 valid unique configurations.

## Phase 5 — SmartSwitch

Status: missing as a dedicated module; process detection foundation exists.

Build: profile resolver, priority conflict handling, current-settings snapshot, supported-settings apply, game-exit restore, crash recovery, switch history. Reuse display restoration and native detection.

Acceptance: automated test proves restore replay and conflict resolution; manual Windows test proves game start/stop restores desktop color state.

## Phase 6 — Customization

Status: partial.

Present: crosshair editor, overlay window, preset library, themes, display effects.

Remaining: overlay layouts/position management, per-game visibility, crosshair export/import test coverage, preset comparison UI, theme import/export.

## Phase 7 — Diagnostics and system tools

Status: partial.

Present: optimizer allowlist, performance metrics, diagnostics summary in native command.

Remaining: Vision Lab test patterns and report export, DiagnosticsPage, performance history charts, optimizer restore-history export, background application view.

## Phase 8 — Intelligence

Status: missing.

Build `VYTRIX AI` with detected facts / calculated values / recommendations / estimates / unknown labels, local fallback rules, privacy prompts, confirmation before apply. Do not claim optical measurement without hardware.

## Phase 9 — Website and cloud

Status: partial.

Present: marketing, docs, download, pricing, auth, account, presets, legal, security/changelog/discord routes; Fastify auth/license/presets/releases/telemetry.

Remaining: dashboard, library, creators, devices, billing, admin, support, trust; API route groups for users/devices/games/updates/downloads/moderation/admin; expanded Prisma models; migrations and tests.

## Phase 10 — Mobile control

Status: complete for core flow.

Present: LAN agent, pairing, QR URI, permissions, expiring token, mobile client with real fetch, timeout, bounded attempts, clamped values.

Remaining: encrypted transport hardening beyond LAN bearer flow, device-side UX polish, integration test on real phone/LAN.

## Phase 11 — Production

Status: partial.

Present: release scripts, signing script, checksum flow, updater crate, CI workflows, domain check script, docs.

Remaining: signing key, real public key, manifest signature, Authenticode, installer/portable artifact generation and verification, deployed URL, VM smoke matrix, performance measurements.

## Command gates

After each phase:

```powershell
cd VYTRIX
npm run build
npm run typecheck
npm test
npm run validate:games
npm run check:games
cd apps/desktop/src-tauri
cargo check --message-format=short
cargo test --message-format=short
```

Release gate additionally requires actual files under `VYTRIX/release/` and a signed `latest.json`.
