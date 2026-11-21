# VYTRIX Architecture

## Shape

One product, four runtimes, one design system.

```
apps/desktop   Tauri 2 window -> React UI  -> IPC commands -> Rust modules
apps/overlay   separate always-on-top window, own event loop, shared tokens
apps/website   Next.js public + authenticated surfaces
services/api   Fastify + PostgreSQL, owned by the desktop app but not required
```

`packages/*` is dependency-safe shared code. Nothing in `packages/*` imports from an app. Dependency direction is strictly acyclic:

```
design-system <- desktop / website / overlay
shared-types  <- everything
validation    <- preset-format, api, desktop
preset-format <- desktop, website, api
config        <- everything
```

## Desktop process model

The React frontend owns presentation and local UI state only. Every privileged operation crosses a narrow IPC boundary in `src-tauri/src/commands`. Rust checks the caller, validates the payload, performs the operation, and returns a typed result or a typed error. The frontend never receives raw registry access, arbitrary process control, or file paths outside the app data directory.

Rust modules:

| Module | Responsibility |
| --- | --- |
| `display` | Windows display config via ChangeDisplaySettingsEx, monitor enumeration, safe rollback |
| `gpu` | NVIDIA NVAPI, AMD ADL, Intel IGCL where available; software fallback explicitly labelled |
| `games` | Process and window-title detection from launcher manifests; no file or memory writes |
| `optimizer` | Reversible Windows settings with before-values, undo, and backup export |
| `overlay` | Transparent movable window; no injection, no hooks |
| `monitoring` | Low-footprint sampling of CPU, GPU, RAM, VRAM, temperature where exposed |
| `hotkeys` | Explicitly registered global shortcuts with conflict detection |
| `security` | Payload validation, path containment, permission gating |
| `storage` | SQLite settings, profiles, presets, history |

## Color pipeline

`ColorSettings` is the single source of truth. The GPU module reports which backend is active per monitor: `nvapi`, `adl`, `igcl`, or `software`. The UI displays that name next to every control. A software path never claims to be hardware digital vibrance.

Application flow: resolve target monitor -> clamp values -> backend apply -> persist snapshot -> emit state change. Restoration replays the saved snapshot captured before a game profile activated.

## Game profiles

Detection reads running process names and window titles and matches them against launcher manifests. Detection never reads game memory, never writes game files, and never injects. Profiles are keyed by executable identity plus launcher. Verified detections are marked separately from manually configurable entries.

## Preset format

`.vytrixpreset` is JSON with a `schemaVersion`, a content hash, and no executable fields. Import parses, validates, clamps, and rejects unknown schema versions. No eval, no dynamic import, no scripts, no archived executables.

## Display changes

A resolution or refresh-rate change writes a rollback token first, applies the mode, and requires an in-app confirmation within fifteen seconds. No confirmation or a lost focus event restores the previous mode automatically.

## Updates

Release metadata is signed. The updater fetches metadata, verifies the signature and SHA-256, shows notes and version, asks for approval, installs, and preserves user profiles and backups. Failure rolls back where the platform allows. The app never downloads and silently executes a file.

## Offline behavior

Settings, profiles, presets, overlays, color controls and monitoring run without a network connection or account. Cloud features are additive and degrade to an explicit unavailable state.

## Phase plan

1. Foundation — repository, branding, design system, shell, settings, website foundation. **(this build)**
2. Core display engine — monitor detection, color studio, GPU backends, restoration.
3. Gaming — detection, profiles, automatic switching, preset library, crosshair, hotkeys, overlay.
4. System tools — optimizer, backup/restore, performance monitor, resolution/HDR.
5. Cloud — accounts, auth, database, community, devices, phone control, licensing.
6. Website — full public and authenticated surfaces.
7. Production — audit, benchmarks, installer, portable build, updater, release automation.
