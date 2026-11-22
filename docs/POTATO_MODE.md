# COMPLETE POTATO MODE 2.0

Graphics optimization center in VYTRIX. It reads real hardware and game configuration, builds a reversible plan, writes only verified keys, and re-reads every value before reporting success.

## What it does

- Detects CPU, GPU, VRAM, driver, RAM, display, and storage from cached Windows APIs. Refresh is explicit only.
- Detects ROB RUN from Steam/library metadata, running processes and its real Unity settings file at `%USERPROFILE%\AppData\LocalLow\Kefir\ROB RUN\settings\settings_*.dat`.
- Builds a four-level plan from settings that already exist in a game config file (flat Unity JSON in `.dat` for ROB RUN, INI for the generic Unreal profile).
- Preserves a single baseline backup with SHA-256 integrity and restores the original values on OFF or Restore.
- Records an apply/restore history with per-setting outcomes.
- Measures FPS/frame-time when a telemetry source is present and reports missing values as missing.
- Runs a bottleneck sampling window using measured telemetry only.
- Runs a one-shot TCP latency probe. No background polling is performed by Potato Mode.
- Supports export/import of settings bundles and copying diagnostics to the clipboard.

## What it does not do

- No driver profile writes. NVAPI, ADL, and IGCL write paths are not linked in this build.
- No NVIDIA-only values on AMD or Intel hardware.
- No fake FPS, fake benchmarks, or guaranteed gains.
- No changes to asset files or anti-cheat components.
- No forced process termination. If the game is running, apply is refused until it closes.
- No display-mode or refresh-rate changes.
- No simulated values in browser preview. Native calls fail closed when the Tauri runtime is not connected.

## Levels

| Level | Name | Meaning |
|---|---|---|
| 0 | OFF / ORIGINAL QUALITY | Restores the verified baseline and reports per-setting restoration results. |
| 1 | LIGHT / LIGHT OPTIMIZATION | Modest reductions: reduces the most expensive settings first while keeping the remaining appearance mostly intact. |
| 2 | MEDIUM / BALANCED PERFORMANCE | Noticeable simplification with a balance between clarity and performance. |
| 3 | FULL / MAXIMUM SIMPLIFICATION | Strongest simplification supported by the detected keys. Never auto-selected. |

Each level exposes sections for overview, textures, environment, effects, driver, performance, visual trade-offs, compatibility, restoration, gameplay visibility, and restart. The driver section states that profile writes are unsupported in this build.

## Supported settings

A setting is supported only when its key is already present in the detected game configuration. The code never adds an unknown key and never writes a driver profile.

ROB RUN keys (flat JSON in `settings_*.dat`, writable when present in the file):

- Textures: `render_scale_setting`, `anisotropic_filtering`, `streaming_mipmaps_memory_budget`, `global_texture_mipmap_limit`, `lod_cross_fade_setting`.
- Environment: `cast_shadow_setting`, `additional_lights_setting`, `screen_space_reflections_setting`, `settings_grass`, `settings_water`.
- Effects: `anti_aliasing_mode_id_setting`, `post_processing_setting`, `depth_of_field`, `auto_exposure_setting`.
- Distance/detail: `grass_vibile_distance_factor_setting`, `renderers_culling_preset_id_setting`.
- Present but never written (no verified mapping): `setting_quality`, `hdr_setting`, `frame_rate_setting`, `lod_bias_setting`, `fullscreen_setting`, `resolution_setting`. The opaque `controls` string is preserved byte-for-byte.

Generic Unreal profile keys (INI, writable when present in the file): `sg.TextureQuality`, `sg.ShadowQuality`, `sg.ViewDistanceQuality`, `sg.FoliageQuality`, `sg.EffectsQuality`, `sg.PostProcessQuality`, `sg.ReflectionQuality`, `sg.GlobalIlluminationQuality`, `sg.AntiAliasingQuality`, `bUseVSync`.

JSON writes preserve the original value type: booleans stay booleans, integers stay integers, floats stay floats, and strings stay strings. Keys absent from the file are never created.

Driver controls (listed but always unsupported in this build):

- NVIDIA: texture LOD bias, texture filtering quality, anisotropic filtering, mipmap bias, power management mode.
- AMD: per-game tuning.
- Intel: graphics tuning.

All driver controls are marked unsupported because NVAPI, ADL, and IGCL write paths are not linked. Only the game-config keys above can be written.

The settings catalog and per-level values live in `src-tauri/src/potato/detect.rs`. The apply path in `src-tauri/src/potato/mod.rs` uses top-level JSON keys for ROB RUN and `section::key` IDs for INI, validates the game and level, checks that the game is not running, creates or reuses the baseline backup, writes only documented keys, and verifies reads before success. A copy of the real ROB RUN `.dat` is used as a test fixture in `src-tauri/tests/fixtures/`.

## GPU and game support

- NVIDIA, AMD, and Intel GPUs are detected and displayed in the compatibility table.
- NVIDIA-only profile values are not written to any vendor in this build.
- ROB RUN is the first game profile. Its config is Unity JSON in a `.dat` under `LocalLow`, not an Unreal `.ini`. Additional profiles use the same reusable game-profile architecture.
- Detection sources: Steam/library metadata, install directory, executable, running process, `LocalLow\Kefir\ROB RUN\settings\settings_*.dat`, and manual path.
- Manual paths accept `.dat`, `.json`, `.ini`, `.cfg` and `.txt`. A folder pointing at the ROB RUN settings directory resolves to its `settings_*.dat` file. Paths are parsed on registration, so an unsupported format fails before any write.
- Config writes require a located config. Without one, the page reports "Manual path needed" and remains read-only.

## Restarts and running games

- Applying a level changes configuration files. Restart the game to load the new values.
- Apply is blocked while the detected game process is running. Nothing is force-closed.
- OFF and Restore also require the game to be closed before writes proceed.

## Backup and restoration

- The first write creates a baseline backup record containing original values and SHA-256 integrity.
- Switching between LIGHT, MEDIUM, and FULL reuses the same baseline. It does not overwrite the original with the last optimization.
- OFF and Restore write baseline values back with integrity checking.
- Unrelated keys, nested/opaque values and original JSON types are preserved. The engine only modifies known keys already present in the file.
- If the backup is missing or modified, integrity is reported and restoration is marked not recoverable.
- Manual recovery is available from the Backup and restoration panel. The backup file and its recorded hash are both shown.

## Benchmark, bottleneck, and network

- Benchmark start/tick/stop uses `MonitorState.sample()`. Samples are recorded once per second.
- Average FPS, 1% low FPS, frame time, duration, resolution, level, and GPU/CPU fields come from measured samples. Missing telemetry fields remain `null` with an explicit note.
- Benchmark history and CSV/JSON export are available.
- Bottleneck detection runs over a selected sampling window and classifies GPU, CPU, VRAM, memory, or other with an explanation based on measured counters.
- The network probe is a one-shot TCP connect test to a supplied host and port. It does not alter network settings.

## Automatic mode

Automatic mode runs only when the button is pressed. It selects the suggested level, checks process state, applies, verifies, and reports each step. It has no background polling, never starts or closes a game, and refuses to change files while the game is running. Explicit permission is required to run it.

## UI and localization

- Premium dark purple/near-black styling with cyan/blue accents, cards, gradients, and lightweight motion.
- Beginner view shows the selector, four-state comparison, recommendation, and apply workflow.
- Advanced view adds hardware, compatibility, settings, benchmark, bottleneck, network, automatic mode, history, and diagnostics panels.
- The four preview cards are illustrative stylized graphics, not game screenshots.
- Static UI strings are localized in English, French, German, and Russian.
- Long explanatory paragraphs returned by the backend render with an English fallback when no translation key exists.

## Diagnosing failures

| Symptom | Cause | Action |
|---|---|---|
| "No game profile loaded" | No profile selected or detection failed. | Select a detected game or register a manual path. |
| "Manual path needed" | Config file was not located. | Register `%USERPROFILE%\AppData\LocalLow\Kefir\ROB RUN\settings\settings_*.dat` with the Register path button. |
| "The game is running" | Detected process still active. | Close the game, then apply again. No process is terminated automatically. |
| "Integrity: modified" | Backup hash does not match the record. | Use manual recovery from the Backup and restoration panel. |
| "No benchmark run recorded yet" | Benchmark was not run or no telemetry source exists. | Start a benchmark while measured telemetry is available. |
| "Results come from measured telemetry only" | Some telemetry fields were missing. | Review samples; missing fields stay empty instead of being estimated. |
| "Native runtime not connected" | Browser preview without Tauri IPC. | Run the installed desktop app. |

## Verified vs planned

Verified in this build:

- Hardware detection and refresh-only reporting.
- Game detection, manual path registration, and supported-key discovery for ROB RUN Unity JSON and generic Unreal INI.
- Type-preserving JSON writes verified against a copy of the real ROB RUN settings file.
- Four-level plan/apply/restore with baseline backup and SHA-256 integrity.
- Per-setting verification and per-failure reporting.
- Benchmark, bottleneck sampling, network probe, history, diagnostics, export/import, and clipboard copy.
- EN/FR/DE/RU static UI translation and typecheck/build verification.

Planned, not implemented:

- Vendor driver profile writes via NVAPI, ADL, or IGCL.
- Additional game profiles beyond the reusable profile scaffold.
- Real game screenshots for the four-state comparison.
- Localized backend-generated explanatory paragraphs.

## Build

Rust: `cargo check --message-format=short`, `cargo test potato::`.

Frontend: `npm run typecheck`, `npm run build`.

All graphics settings are read-only until Apply is pressed. Backups are stored locally in the VYTRIX application data directory.
