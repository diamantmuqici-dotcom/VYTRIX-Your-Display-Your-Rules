**Website:** [diamantmuqici-dotcom.github.io/VYTRIX-Your-Display-Your-Rules](https://diamantmuqici-dotcom.github.io/VYTRIX-Your-Display-Your-Rules/)

# VYTRIX

**YOUR DISPLAY. YOUR RULES.**

VYTRIX is an open-source Windows 10/11 gaming display and performance suite. One
desktop app controls per-monitor color, resolution, crosshairs, game profiles,
and system telemetry — through documented Win32 APIs, with no game injection,
no kernel driver, and no background service.

- **Download:** [latest public release](https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules/releases/latest)
- **Source:** [this repository](https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules)
- **License:** [MIT](./LICENSE) — fully open source
- **Platform:** Windows 10/11 x64

---

## What it does

VYTRIX owns your display's color transfer curve while it runs, and gives it
back when you quit. Every control writes a real 3×256 WORD gamma ramp through
`SetDeviceGammaRamp` on a device context opened with `CreateDCW("DISPLAY", …)`
for the selected monitor. No value in the color studio is cosmetic.

### Color Studio

- **Temperature (Kelvin)** — Planckian approximation, 2500K–10000K, 6500K neutral. Lower K warms, higher K cools.
- **RGB channels** — independent red, green, and blue gain from 0–200, with a 100 baseline that reproduces your display's clean ramp.
- **Hue** — bounded channel-phase rotation gated by an explicit strength control.
- **Saturation / Vibrance / Gamut** — real bounded per-channel mid-pivot expansion, not label changes.
- **Lift / Gamma / Tone** — black lift, gamma curve, and highlight tone shaping.
- **Contrast / Brightness** — applied to the same composed ramp.
- **Vivid 300** — a real preset: saturation 300, vibrance 300, gamut 250, contrast 108. The number is the value.
- **Live preview** — both preview panes tint in real time, including Kelvin direction.
- **Per-display targeting** — pick the monitor in the studio; the ramp is written to that `DISPLAY` device. The selection persists and re-applies.
- **Clean baseline** — VYTRIX writes a canonical linear ramp at startup, clearing any tint left behind by a crashed session. Quitting restores that same linear baseline. A standalone [gamma reset script](./scripts/reset-gamma.ps1) is included as an escape hatch.
- **Presets** — versioned, inert, validated, bounded. Executable fields are rejected. Community content is treated as untrusted.

### Display and monitor

- Enumerate attached displays and read their current mode.
- Apply resolution and refresh rate with validation and a timed rollback confirmation.
- Custom resolution (640–16384 × 360–8640) and refresh (24–360 Hz) within bounded ranges.
- HDR contract surfaced without claiming hardware support that is not there.
- GPU vendor SDKs are **not** linked; the backend honestly reports `software` / `unavailable` instead of guessing `nvapi` / `adl` / `igcl`.

### Game profiles and SmartSwitch

- Foreground process/window detection, polled every 1.5 s.
- Read-only Steam library discovery via `SteamPath`, `libraryfolders.vdf`, and `appmanifest_*.acf` — no game files are modified.
- **162 individual configurations**, each schema-valid with detection rules, neutral defaults, capability flags, compatibility notes, verification status, an icon, and a source. No shared stub records.
- The `misc` category holds input/display utilities beside the game records. Each entry carries a short `detail` line in the library so its use is visible before selection.
- Search and filter by query, category, launcher, and detection status. Add custom games.
- Automatic profile switching by priority with deterministic tie-breaking. Desktop color and display state are replayed on game exit — no synthetic "reset".
- Bounded 100-entry switch history.

### Utility tools in misc

- **SnapTap** — full vendored SnapKey v1.8.0 source, `config.cfg`, five profiles, tray icons, MIT license, upstream README, and the prebuilt `SnapKey_v1.7.0.exe`. It is catalogued for detection only; VYTRIX does not read its keyboard input, inject code, read game memory, or modify game files. A dedicated SnapTap sidebar page lists the bundled files, build commands, config keys, and boundary.
- **Zoom** — real full-screen magnification through the documented Windows `MagInitialize` / `MagSetFullscreenTransform` / `MagUninitialize` API, bounded to 1.0–8.0. Toggle mode flips on a bind press. Hold mode polls the bound keys with `GetAsyncKeyState` and restores the display on release. Default bind: `Alt + Z`; mode, level, status, and manual controls live in Display Effects.

### Crosshair Studio

- Eight-section editor, 14 bounded shapes, per-arm/dot/outline/ring controls.
- Six CSS animation kinds and a seeded randomizer.
- Transparent fullscreen overlay webview with five whitelisted anchors.
- Per-game visibility rules evaluated on foreground poll.
- Versioned, hash-verified design/collection/profile import and export.
- 13 boundable hotkey actions with conflict reporting.

### Effects, optimizer, and performance

- Reversible visual accessibility effects.
- Reversible Windows optimizer with a fixed allowlist and backup/restore — no arbitrary shell execution.
- Live CPU/RAM telemetry from real sampled counters. GPU/VRAM/temperature appear only where Windows exposes them; otherwise `null`. No fabricated FPS.

### Phone Control

- LAN-only native HTTP agent on port 8753. No relay, no UPnP, no firewall rule.
- Explicit start, QR pairing, 6-digit code, 5-minute code and token TTLs.
- Native permission gates and bounded request bodies.
- Real color, preset, and crosshair state events — no simulated control.

### Localization and themes

- Full EN / FR / DE / RU dictionaries, 276 keys each, enforced equal by tests.
- Theme settings, UI, and bounded JSON import/export.

### Website, account, and updates

- Next.js marketing site — landing, features, presets, pricing, security, changelog, docs, FAQ, download, Discord, and legal pages.
- Fastify API with Argon2id, JWT refresh, session hashes, licensing, and community preset routes.
- Prisma/PostgreSQL schema, local/S3 storage abstraction.
- Release tooling: SHA-256 sidecars, a signed-manifest script, and an updater that rejects placeholder keys.
- GitHub Actions rebuild and test the whole workspace on every push; tag pushes build and publish a release; pushes to `main` deploy the website to GitHub Pages.

---

## Install

1. Go to the [latest release](https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules/releases/latest).
2. Download `VYTRIX-x64-portable.exe` and its `.sha256` sidecar.
3. Verify: `certutil -hashfile VYTRIX-x64-portable.exe SHA256`.
4. Run it. No installer, no service, no admin rights needed for color control.

Requires Windows 10/11 x64 and the WebView2 runtime (preinstalled on Windows 11).

If a previous force-killed session left a tint on your display, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reset-gamma.ps1
```

---

## Build from source

Prerequisites: **Node 24**, **npm**, **Rust stable** with the
`x86_64-pc-windows-msvc` target, and the WebView2 SDK (Tauri picks it up from
the installed Edge WebView2 runtime).

```powershell
npm ci
npm run build          # all workspace packages + desktop frontend
npm test               # preset, game-database, and UI tests
npm run typecheck      # every TypeScript workspace
npm run validate:games # schema-validate all 162 configs, including misc
npm run check:games    # duplicate id/name check
```

Run the desktop app in development:

```powershell
npm run dev
```

Build the portable executable:

```powershell
cd apps\desktop\src-tauri
npx @tauri-apps/cli build --no-bundle
# output: target\release\vytrix.exe
```

Build the website static export:

```powershell
npm run site:build
# output: apps\website\out\
```

Full details live in [`docs/BUILDING.md`](./docs/BUILDING.md) and
[`docs/INSTALLATION.md`](./docs/INSTALLATION.md).

---

## Repository layout

| Path | Role |
| --- | --- |
| `apps/desktop` | Tauri 2 shell — React + TypeScript frontend, Rust backend |
| `apps/overlay` | Standalone transparent overlay host |
| `apps/website` | Next.js public site (static export to GitHub Pages) |
| `apps/mobile-control` | LAN-only phone companion web UI |
| `apps/updater` | Signed-update verifier in Rust |
| `services/api` | Fastify cloud API |
| `packages/design-system` | Shared design tokens and CSS |
| `packages/shared-types` | Domain types shared across apps |
| `packages/preset-format` | Versioned, inert preset file format |
| `packages/validation` | Input validation helpers |
| `packages/config` | Config defaults and runtime constants |
| `packages/game-database` | 162 individual configs across 9 categories + generated index/hints |
| `database` | Prisma schema and migrations |
| `assets/branding` | Original VYTRIX vector identity |
| `scripts` | Release staging, manifest signing, gamma reset |
| `docs` | Architecture, building, installation, feature matrix, audit, and more |
| `.github/workflows` | CI, tagged release, and Pages deploy |

---

## Scope and honesty

VYTRIX uses only documented Win32 APIs. There is no DLL injection, no game
memory access, no protected-file modification, no anti-cheat bypass, no hidden
driver or service, and no arbitrary shell execution. Vendor GPU SDKs are not
linked. Where hardware data is unavailable, the app reports `null` or
`unavailable` rather than inventing a number. See
[`docs/FEATURE_MATRIX.md`](./docs/FEATURE_MATRIX.md) for the exact status of
every feature.

Licensed under [MIT](./LICENSE). Contributions welcome.
