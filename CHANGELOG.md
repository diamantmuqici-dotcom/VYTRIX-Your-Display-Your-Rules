# Changelog

## 0.3.0 — 2026-11-22

- Replaced the hardcoded `Balanced` Overview label with the exact applied color preset name, persisted in native storage and updated whenever a preset or custom color is applied.
- Replaced the static optimizer list with a live native catalog of 23 reversible Windows settings read from the OS at runtime; previous values are saved before each write and verified after apply and restore.
- Added a real high-performance power plan created through `powercfg /duplicatescheme`, activated on apply, with the prior scheme recorded for restore.
- Added `Apply all optimizations` and `Restore all` bulk controls, plus a live power plan status panel.
- Expanded the built-in color preset library from 18 to 45 presets with distinct channel, transfer and temperature targets and matching previews.
- Added native IPC commands for optimizer state, apply, restore, apply-all, power plan status and active-preset persistence, with strict ID validation at the boundary.
- Updated the top-bar version chip to read the real product version instead of a stale literal.

## 0.2.2 — 2026-11-22

- Corrected ROB RUN configuration support: the real settings file is a flat Unity JSON document in `%USERPROFILE%\AppData\LocalLow\Kefir\ROB RUN\settings\settings_*.dat`, not an Unreal `GameUserSettings.ini`.
- Added automatic detection of the ROB RUN `LocalLow` settings directory and `.dat`/`.json` manual-path support.
- Added a type-preserving flat-JSON editor. Booleans, integers, floats and strings keep their original type, absent keys are never created, and opaque values such as `controls` are preserved.
- Replaced the Unreal-only settings catalog for ROB RUN with verified keys observed in the real file. Present keys with no verified target are listed as unsupported and never written.
- Added tests using a copy of the real ROB RUN `.dat`, covering parsing, supported-key discovery, type-preserving writes, folder resolution and detection.
- Updated the manual path picker and placeholder to show the real `.dat` location, and corrected `docs/POTATO_MODE.md`.

## 0.2.1 — 2026-11-22

- Fixed Potato Mode manual configuration path registration rejecting valid Windows paths. Paths copied with Explorer's "Copy as path" now have surrounding quotes removed, `%ENV%` variables and `~` prefixes are expanded, and folders are resolved to a contained `GameUserSettings.ini`.
- Added a native file picker to the manual configuration path field so a config file can be selected without typing a path.
- Broadened ROB RUN detection to cover publisher-prefixed AppData folders via a bounded child scan.
- Replaced the opaque "configuration file does not exist" error with an actionable message naming the resolved path.
- Added four Rust tests covering quote stripping, environment expansion, folder layout resolution and missing-file guidance.

## 0.2.0 — 2026-11-22

- Added COMPLETE POTATO MODE 2.0: a dedicated graphics optimization center with four levels (LOW / MEDIUM / HIGH / ULTRA), collapsible explanations and advanced customization.
- Added hardware detection with vendor abstraction for NVIDIA, AMD and Intel, a recommended level with manual override, and no automatic application of ULTRA.
- Added ROB RUN first-profile setup: Steam, game-library, config and manual-path detection, writes limited to verified existing keys, unrelated entries preserved, running games never force-closed.
- Added reusable game profiles with four-state comparison, labelled illustrative previews and a ten-step apply workflow with backup and integrity-checked restore.
- Added benchmark, bottleneck, network, auto-mode, history and diagnostics tooling, plus EN/FR/DE/RU localization for all static UI strings.
- Added `docs/POTATO_MODE.md` distinguishing shipped behavior from planned work; no invented FPS figures and no driver writes without a verified API.

## 0.1.1 — 2026-11-21

- Added `misc` game-database category with short how-to details rendered in the library and detail pane.
- Added SnapTap as a vendored standalone tool: full source, config, five profiles, tray icons, MIT license, upstream README and prebuilt binary, with a dedicated sidebar page.
- Added Utility zoom through the documented Windows Magnification API: toggle and hold modes, selectable 1.0-8.0 level, native bind polling and live status.
- Added public website feature cards and metadata for SnapTap and utility zoom.
- Raised catalog to 162 configurations across 9 categories; localized new keys in EN/FR/DE/RU.

## 0.1.0 — 2026-11-21

- Repository, workspace configuration and build scripts.
- Original VYTRIX vector identity: horizontal logo, standalone icon, monochrome and gradient variants, Windows icon, favicon.
- Design system: color, typography, radius, shadow and motion tokens shared by desktop and website.
- Typed domain model for color settings, game profiles, presets, monitors, hotkeys and diagnostics.
- Versioned preset file format with validation and no executable content.
- Desktop shell: sidebar, top bar, all fourteen sections, settings persistence and theme engine.
- Website foundation: home, features, download, pricing, trust, support and legal routes.
- Fastify API skeleton with health and release-manifest routes.
- Prisma schema covering users, licenses, devices, presets, community content, releases and security events.
- Architecture, security, building and installation documentation.
