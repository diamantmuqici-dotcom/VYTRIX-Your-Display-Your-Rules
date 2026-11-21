# VYTRIX Game Database

Status: implemented and validated. Schema version `1`; profile schema version `1`.

## Shape

`@vytrix/game-database` stores one complete JSON record per title under `packages/game-database/data/<category>/<game-id>.json`. A title is not counted unless its record parses, validates, and has a unique id and normalized name.

Every record declares:

- `id`, `name`, optional short `detail`, `category`, `launchers`, `releaseStatus`
- `executableNames`, `processNames`, and `installationDetection`
- `detection.methods`, `detection.confidence`, `detection.requiresManualPath`, and bounded `detection.rules`
- neutral defaults for color, display, resolution, refresh, restoration, crosshair, overlay, and monitoring
- capability flags and `supportedFeatures` / `unsupportedFeatures`
- verification status, source, and `lastVerifiedAt`
- `configurationSource`, `schemaVersion`, and `profileSchemaVersion`

Profiles declare capabilities and neutral defaults. They do not claim tuned settings, guaranteed FPS, verified driver control, anti-cheat bypass, game-file modification, or injected overlays.

## Current database

| Metric | Value |
| --- | --- |
| Individual configurations | 162 |
| Categories | 9 |
| Launchers | 9 |
| Verified detection | 29 |
| Partial detection | 67 |
| Manual detection | 66 |
| Native executable hints | 141 |

Categories: `shooters`, `survival`, `sandbox`, `racing`, `rpg`, `strategy`, `horror`, `additional`, `misc`.

Launchers: `steam`, `epic`, `riot`, `xbox`, `microsoft-store`, `battle-net`, `ubisoft-connect`, `ea-app`, `manual`.

`misc` contains `snaptap` and `zoom`. Both carry a short `detail` string that the desktop library renders under the entry name and in the detail pane. SnapTap declares only `detection` (VYTRIX detects the vendored process); the tool itself runs a universal keyboard group transform in every window by default. Zoom is built into VYTRIX and declares no external detection or game-modification features. The Zoom record points at `vytrix-native-magnification-v1`; the SnapTap record points at `vytrix-vendored-snaptap-v1`.

Hard unsupported feature tokens on every record: `game-file-modification`, `anti-cheat-bypass`, `guaranteed-fps-gain`. Crosshair and overlay stay off by default unless a title is explicitly marked supported; the current database marks neither as universally supported.

## Public API

- `validateGameConfiguration(input, basePath?)` — validates one record and returns a typed `GameConfiguration`.
- `validateGameDatabase(input)` — validates the full set, enforces minimum count, unique ids/names, category coverage, capability/feature consistency, and hard unsupported tokens.
- `GAME_CONFIGURATIONS`, `gameCount()`, `getGameConfiguration(id)`, `getGameConfigurationByName(name)`
- `allCategories()`, `allLaunchers()`
- `searchGames(configurations, filters)` — query, category, launcher, detection, configuration status, favorites, and limit filters.
- `compatibilitySummary(configuration)` — plain-language capability view for UI surfaces.

## Generation and validation

```powershell
cd VYTRIX
npm run generate:games
npm run validate:games
npm run check:games
```

`generate:games` rebuilds the JSON records from the reviewed seed table, writes `data/index.json`, writes `src/generated/game-index.ts`, and emits the Rust executable hint table at `apps/desktop/src-tauri/src/games/generated_hints.rs`.

`validate:games` compiles the TypeScript package first, then validates every JSON file and checks that `data/index.json` matches the files on disk. It exits non-zero on malformed JSON, missing fields, invalid categories or versions, duplicate ids/names, unsupported feature claims, or index drift.

`check:games` performs a duplicate-only check without requiring a build.

## Desktop and native wiring

- `apps/desktop/src/data/games.ts` converts database records to `GameEntry` values, then appends legacy verified/manual entries that do not duplicate an id or normalized name.
- `apps/desktop/src/pages/GameProfiles/index.tsx` exposes category, launcher, detection, verification, configuration status, release status, and supported-feature filters and detail rows.
- `apps/desktop/src-tauri/src/games/mod.rs` checks a preserved legacy hint table first, then the generated database hint table. Detection remains read-only: foreground window, process id, and executable name only.

## Tests

`npm test -w @vytrix/game-database` covers count, schema validity, registry lookup, search filters, compatibility summaries, duplicate rejection, and invalid configuration rejection.

`cargo test -w` is not applicable; from `apps/desktop/src-tauri`, `cargo test --message-format=short` covers native hint resolution and legacy hint preservation alongside the existing native suite.

## Known limits

- Process hints are published names, not a promise that a title is installed or running.
- Manual entries require an executable path from the user.
- Verification timestamps are `null` until a title is independently re-audited.
- `unreleased` and `unknown` release statuses are surfaced rather than guessed.
- Native detection remains executable-name based; no game memory, file, or anti-cheat interaction exists.
