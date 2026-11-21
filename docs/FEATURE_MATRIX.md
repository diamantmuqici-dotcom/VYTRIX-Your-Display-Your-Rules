# VYTRIX Feature Matrix

Legend: `Working` = implemented and tested. `Partial` = working core with named gaps. `Missing` = not implemented. `External` = blocked on provisioning or hardware/vendor SDK.

## Desktop

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Tauri 2 shell | Working | `apps/desktop/src-tauri/src/lib.rs`, builds pass |
| Sidebar and pages | Partial | 13 pages implemented; 24-entry navigation spec not fully covered |
| Settings persistence | Working | SQLite storage commands + app store |
| Native IPC | Working | 26 registered commands, fail-closed frontend bridge |
| Localization (EN/FR/DE/RU) | Working | 192 keys in each dictionary; language selection rewrites shell and key pages |
| Command palette / Ctrl+K | Missing | not implemented |
| Global search | Missing | not implemented |
| Favorites / reorder sidebar | Partial | preset favorites exist; sidebar ordering does not |
| Error boundary | Partial | shell fallback exists; dedicated route-level recovery missing |

## Display and color

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Monitor enumeration | Working | `list_monitors` |
| Resolution / refresh apply | Working | `display_apply`, validation, rollback |
| Custom resolution / Hz | Working | bounded width 640-16384, height 360-8640, refresh 24-360 in `Display` |
| Rollback | Working | `display_rollback`, confirmation timer cleared on confirm/rollback |
| Saturation / vibrance / RGB / gamma / brightness | Working | `color_apply` writes bounded 3x256 ramps via documented `SetDeviceGammaRamp`; `color_reset` restores baseline |
| Color temperature (Kelvin) | Working | `temperature_gains` Planckian approximation drives the ramp: lower K warms (red up, blue down), higher K cools; 6500K neutral; preview tints live in both Color Studio panes |
| RGB curves | Missing | no control or model |
| Black/white point, shadows, highlights | Missing | no control or model |
| Per-monitor profiles | Partial | monitor setting exists; full per-monitor profile map missing |
| HDR toggle | Partial | contract only; no hardware API claim |
| GPU vendor APIs | External | NVAPI/ADL/IGCL not linked; software/unavailable reported |
| Calibration history | Missing | no persisted history |

## Games and SmartSwitch

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Process/window detection | Working | `detect_game`, native foreground detection |
| Steam library detection | Working | read-only `SteamPath`, `libraryfolders.vdf`, `appmanifest_*.acf` parsing via `steam_installations` |
| Verified game hints | Working | 29 verified, 66 partial, 65 manual; 140 native executable hints |
| 160 individual configurations | Working | 160 schema-valid records in `packages/game-database/data`; validation reports no duplicates |
| Game search/filter | Working | query plus category, launcher, and detection filters in `GameProfiles` |
| Custom games | Working | add-game flow with launcher and executable hint |
| Profile duplicate/export/import | Partial | game-profile duplicate and export exist; import and version migration missing |
| Automatic switching | Working | `smart_switch` resolves by priority with deterministic tie-break, polls foreground at 1.5s, replays desktop color/display on exit |
| Switch history | Working | bounded 100-entry in-memory transition log via `smart_switch_history`, read-only Settings panel |

## Customization

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Crosshair editor | Working | eight-section studio; native overlay sync; versioned hash-verified design, collection, and game-profile IO |
| Crosshair shapes/animation/export | Working | 14 bounded shapes, per-arm/dot/outline/ring controls, six CSS animation kinds, seeded randomizer, bounded native + overlay renderer |
| Transparent overlay window | Working | second Vite entry + native window |
| Overlay layouts/position | Working | 5 whitelisted anchors driven by CSS variables in the overlay webview |
| Per-game overlay visibility | Working | `game_is_visible` hidden/allow rules evaluated on foreground poll |
| Preset library | Partial | import/export/validation and local library exist; no community backend |
| Preset comparison | Working | side-by-side table across 10 color fields with difference highlighting |
| Themes | Working | theme settings, UI, and bounded JSON import/export |

## Diagnostics and performance

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| CPU/RAM metrics | Working | real sampled values |
| GPU/VRAM/temperature | Partial | only where Windows exposes; otherwise null |
| FPS measurement | Missing | not fabricated; no reliable provider linked |
| Performance history | Partial | chart component and state exist; persistence gap |
| Vision Lab | Missing | no test patterns or report |
| Optimizer allowlist | Working | fixed safe tasks, backup/restore |
| Restore point creation | Missing | not implemented |
| Diagnostics report | Partial | native summary command exists; export page missing |

## Intelligence

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Hardware analyzer | Missing | no implementation |
| Local recommendation engine | Missing | no implementation |
| Cloud AI | External | no provider/credentials and no consent flow |
| Recommendation confirmation | Missing | no apply gate |

## Cloud and website

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Website public pages | Working | landing, features, download, pricing, docs, FAQ, legal |
| Auth pages | Working | login, signup, forgot-password, account |
| Dashboard / library / creators | Missing | routes not present |
| Devices / billing / admin | Missing | routes not present |
| Accounts and JWT refresh | Working | Fastify + Argon2id + session hashes |
| Licensing | Working | license routes and tests |
| Community presets | Partial | upload/list/report; ratings/favorites/follows missing |
| PostgreSQL schema | Partial | core models present; expanded models missing |
| Object storage | Partial | local/S3 abstraction; no deployed bucket |
| Stripe | External | env-gated; no keys |

## Phone and overlay apps

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Phone QR pairing | Working | native URI and mobile parser aligned on port 8753 |
| LAN-only agent | Working | explicit start, no relay/firewall rule |
| Token expiry | Working | 5-minute code/token deadlines |
| Permission gates | Working | `PhonePermissions` enforced natively |
| Color/preset/crosshair control | Working | real native state events |
| Standalone overlay app | Working | builds and renders native config |

## Release

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Signed manifest script | Working | `scripts/sign-manifest.mjs` |
| SHA-256 script | Working | `scripts/build-release.mjs` |
| Updater validation | Working | Rust tests pass; rejects placeholder key |
| Installer executable | External | artifact not built |
| Portable executable | External | artifact not built |
| Deployment URL | External | `vytrix.gg` does not resolve; no claim of ownership |
| Authenticode | External | thumbprint not provisioned |
