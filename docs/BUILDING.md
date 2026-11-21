# Building VYTRIX

## Prerequisites

- Windows 10 or 11 x64 (native display/GPU commands require Windows)
- Node.js 20 or newer, npm 10 or newer
- Rust 1.77 or newer with the `msvc` target
- Visual Studio 2022 Build Tools with C++ workload and Windows SDK
- WebView2 Runtime (present on Windows 11, installable on Windows 10)

## Commands

```powershell
npm install
npm run build        # shared packages, then desktop frontend
npm run typecheck
npm test
npm run dev          # frontend in browser; native calls report unsupported
```

Native bundle, once the Rust command modules are connected:

```powershell
cd apps/desktop/src-tauri
cargo check
cargo build --release
npx tauri build
```

Output lands in `apps/desktop/src-tauri/target/release/bundle` and is staged into `release/` by `scripts/release.ps1`.

## Website and API

```powershell
npm run site:dev
npm run api:dev
```

Copy `.env.example` to `.env` and fill values before starting the API. Never commit `.env`.

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/dev.ps1` | Start desktop frontend and API in watch mode |
| `scripts/build.ps1` | Clean, install, typecheck, test, build |
| `scripts/test.ps1` | Run all workspace test suites |
| `scripts/release.ps1` | Produce signed release artifacts and checksums |
| `scripts/build-release.mjs` | Build Tauri bundles, hash artifacts, stage unsigned manifest + sidecars |
| `scripts/sign-manifest.mjs` | Sign `dist-release/manifest.json` with the Ed25519 release key |
| `scripts/check-domain.mjs` | Report DNS resolution for `vytrix.gg` without claiming ownership |
| `scripts/gen_branding.py` | Regenerate the core raster brand assets from vector geometry |
| `scripts/gen_social.py` | Regenerate social card and Discord icon |

## Updater and release tooling

The updater is a standalone crate, not part of the desktop workspace:

```powershell
cd apps/updater
cargo check
cargo test
cargo run -- --check-only
```

`apps/updater/public_key.hex` ships as an all-zero placeholder. Replace it with
the real 32-byte release public key before shipping; the updater rejects the
placeholder and fails closed. Key generation is in `apps/updater/README.md`.

Stage and sign a release from the repository root:

```powershell
node scripts/build-release.mjs
$env:VYTRIX_RELEASE_PRIVATE_KEY = "C:\secrets\release-private-key.pem"
node scripts/sign-manifest.mjs
```

Use `--skip-build` when the Tauri bundle was already produced. The manifest is
unsigned until the signing step, which checks the private key against the
embedded public key. Full runbook: `docs/RELEASING.md`. Automated gates:
`docs/SECURITY-CHECKLIST.md`.
