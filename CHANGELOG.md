# Changelog

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
