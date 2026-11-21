# Contributing to VYTRIX

## Development baseline

- Windows 10 x64 build 19041+ or Windows 11 x64.
- Node 20+, npm 9+, Rust 1.77+ with the MSVC toolchain.
- PostgreSQL 15+ only for cloud/API work. Desktop core runs offline.

## Workflow

1. Branch from `privacy/sovereign-edition`.
2. Keep changes scoped to one phase or feature.
3. Add tests for every behavior change.
4. Update `docs/FILE_MANIFEST.md` and `docs/FEATURE_MATRIX.md`.
5. Run `npm run build`, `npm run typecheck`, `npm test`, and the relevant cargo checks.
6. Commit a logical checkpoint.

## Code rules

- Native operations belong in Rust commands, not frontend JavaScript.
- No fake telemetry, GPU claims, AI claims, downloads, or system changes.
- Presets are inert data only.
- No game memory reads, process injection, or anti-cheat bypass.
- Bounded input, typed results, and fail-closed errors at every boundary.
