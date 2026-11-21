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

Validation: 6 package tests pass; `npm run validate:games` reports 160 configurations with 29 verified, 66 partial, and 65 manual entries; `npm run check:games` reports no duplicate ids or names; desktop build/typecheck/tests pass; Rust check passes and 19 native tests pass.

Operator ticket (custom resolution, German/Russian, language switching, Rob Run color control): complete. Bounded custom width/height/Hz in `Display`; 192-key EN/FR/DE/RU dictionaries wired into the shell and key pages; `color_apply`/`color_reset` write real gamma ramps through documented Win32 APIs; read-only Steam manifest resolution makes Rob Run detectable. Desktop 11 UI tests and 19 Rust tests pass.

Acceptance met: `npm run validate:games` exits 0 and reports 160 valid unique configurations.

## Phase 5 — SmartSwitch

Status: complete as a dedicated native module; process detection foundation reused.

Build: `src-tauri/src/smart_switch/mod.rs` provides a pure `resolve_profile`/`plan_transition` resolver with highest-priority-wins and deterministic id tie-break, a 1.5s foreground poll loop, exit grace window, desktop color snapshot, replay of `color.apply` and `display.rollback(None)`, and a bounded 100-entry switch history. Four IPC commands (`smart_switch_status`, `smart_switch_history`, `smart_switch_set_enabled`, `smart_switch_sync_profiles`) are wired through a fail-closed frontend service and a `vytrix://smart-switch` event bridge. Settings exposes the master toggle and a read-only history panel; EN/FR/DE/RU each carry five new keys.

Acceptance: automated evidence passes — 5 native tests cover priority conflict, deterministic tie-break, direct-switch restore-first, exit restore, and no-op idempotency; `ui.test.mjs` asserts the full native-to-UI wiring. Manual Windows game start/stop restore replay remains an operator-side check on real hardware.

Validation: 24 Rust tests pass, 12 desktop tests pass, typecheck and desktop build pass.

## Phase 6 — Customization

Status: complete.

Present: crosshair editor, overlay window, preset library, themes, display effects.

Shipped this phase: five anchor layouts (`center` + four corners) whitelisted in native `sanitize` and mirrored in the overlay webview via CSS anchor variables; per-game visibility rules (`hiddenForGames`/`onlyForGames`) stored on `OverlayView`, sanitized to 50 bounded titles, and evaluated by pure `game_is_visible` (hidden wins, unknown game visible) on every SmartSwitch foreground poll with a `vytrix://overlay-config` emit on change; crosshair export/import round trip validated through `@vytrix/preset-format`; preset comparison table across ten color fields with difference highlighting; theme files exported/imported as inert JSON with every field bounded and hex-validated before apply.

Acceptance: 3 new native tests (layout whitelist + bounded game lists, hidden-vs-allow precedence, allow-list gating) and a full UI wiring test pass. 27 Rust tests, 13 desktop tests, typecheck, and desktop build all green.

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
