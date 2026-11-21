# VYTRIX Feature Matrix

Legend: `Working` = implemented and tested. `Partial` = working core with named gaps. `Missing` = not implemented. `External` = blocked on provisioning or hardware/vendor SDK.

## Desktop

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Tauri 2 shell | Working | `apps/desktop/src-tauri/src/lib.rs`, builds pass |
| Sidebar and pages | Partial | 13 pages implemented; 24-entry navigation spec not fully covered |
| Settings persistence | Working | SQLite storage commands + app store |
| Native IPC | Working | 17 registered commands, fail-closed frontend bridge |
| Command palette / Ctrl+K | Missing | not implemented |
| Global search | Missing | not implemented |
| Favorites / reorder sidebar | Partial | preset favorites exist; sidebar ordering does not |
| Error boundary | Partial | shell fallback exists; dedicated route-level recovery missing |

## Display and color

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Monitor enumeration | Working | `list_monitors` |
| Resolution / refresh apply | Working | `display_apply`, validation, rollback |
| Rollback | Working | `display_rollback` |
| Saturation / vibrance / RGB / gamma / brightness | Partial | clamped values and UI exist; driver-level apply is backend-dependent |
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
| Verified game hints | Partial | 41 verified entries in `games.ts` |
| 160 individual configurations | Missing | `packages/game-database/` not yet created |
| Game search/filter | Partial | basic UI search; no full category/launcher/detection filters |
| Custom games | Missing | no custom entry flow |
| Profile duplicate/export/import | Partial | color presets exist; game-profile version missing |
| Automatic switching | Missing | no resolver/restore orchestrator |
| Switch history | Missing | no persisted transition log |

## Customization

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Crosshair editor | Partial | editor and native overlay sync exist |
| Crosshair shapes/animation/export | Missing | advanced editor not implemented |
| Transparent overlay window | Working | second Vite entry + native window |
| Overlay widgets/themes/opacity/position | Partial | base overlay state; no widget manager |
| Per-game overlay visibility | Missing | compatibility gating not implemented |
| Preset library | Partial | import/export/validation and local library exist |
| Preset comparison | Missing | no side-by-side diff |
| Themes | Working | theme settings and UI present |

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
