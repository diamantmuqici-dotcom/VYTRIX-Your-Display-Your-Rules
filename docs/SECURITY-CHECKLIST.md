# Security Checklist

These are automated gates for VYTRIX. Each must pass before a release is
published. The commands are PowerShell and use `rg` (ripgrep). They inspect
source directories only, so documentation that names a forbidden API does not
trip them.

```powershell
$src = @(
  'apps/desktop/src-tauri/src',
  'apps/updater/src',
  'services/api/src',
  'apps/desktop/src'
)
```

Run all checks from the repository root. A check fails when it prints a throw.

## 1. No process-memory or injection APIs

Forbidden: `CreateRemoteThread`, `WriteProcessMemory`, `NtWriteVirtualMemory`,
`ZwWriteVirtualMemory`, or `OpenProcess` combined with `VM_WRITE`.

```powershell
$pattern = 'CreateRemoteThread|WriteProcessMemory|NtWriteVirtualMemory|ZwWriteVirtualMemory|OpenProcess\s*\([^)]*VM_WRITE'
$hits = rg -n --no-heading $pattern $src
if ($LASTEXITCODE -eq 0) { throw "process-memory API found:`n$hits" }
if ($LASTEXITCODE -gt 1) { throw 'rg failed' }
```

## 2. No keyboard hooks or key-state polling

Forbidden: `SetWindowsHookEx`, `WH_KEYBOARD`, `WH_KEYBOARD_LL`,
`GetAsyncKeyState`, `GetKeyState`. Global hotkeys are registered with the OS,
not read from the input stream.

```powershell
$pattern = 'SetWindowsHookEx|WH_KEYBOARD|WH_KEYBOARD_LL|GetAsyncKeyState|GetKeyState'
$hits = rg -n --no-heading $pattern $src
if ($LASTEXITCODE -eq 0) { throw "keyboard hook API found:`n$hits" }
if ($LASTEXITCODE -gt 1) { throw 'rg failed' }
```

## 3. No driver installation

Forbidden: kernel service creation and driver loading APIs.

```powershell
$pattern = 'SERVICE_KERNEL_DRIVER|ZwLoadDriver|NtLoadDriver|sc\.exe\s+create|New-Service|CreateService'
$hits = rg -n --no-heading $pattern $src
if ($LASTEXITCODE -eq 0) { throw "driver/service install API found:`n$hits" }
if ($LASTEXITCODE -gt 1) { throw 'rg failed' }
```

## 4. No service or scheduled-task creation

Forbidden: `CreateService`, `schtasks`, `Register-ScheduledTask`, and silent
background installers.

```powershell
$pattern = 'CreateService|schtasks|Register-ScheduledTask|Start-Process\s+.*-WindowStyle\s+Hidden'
$hits = rg -n --no-heading $pattern $src
if ($LASTEXITCODE -eq 0) { throw "persistence API found:`n$hits" }
if ($LASTEXITCODE -gt 1) { throw 'rg failed' }
```

## 5. Network endpoint allowlist

Plain HTTP is accepted only for loopback test servers. Production endpoints
must be HTTPS on `vytrix.gg` or a subdomain.

```powershell
$hits = rg -n --no-heading 'http://' $src
if ($LASTEXITCODE -eq 0) {
  $bad = $hits | Where-Object { $_ -notmatch 'localhost|127\.0\.0\.1' }
  if ($bad) { throw "plain HTTP outside loopback:`n$bad" }
}
```

The updater enforces this at runtime with `validate_endpoint`. Its unit test
`endpoint_allowlist_enforced` rejects `http://example.com` and
`https://evil.example` while accepting `https://vytrix.gg` and loopback HTTP.

Review any `https://` literal in source that is not on `vytrix.gg` or a
subdomain before release; vendor SDK hosts are the expected exception.

## 6. SHA-256 verification and sidecars

```powershell
rg -n 'Sha256::digest|sha256=' apps/updater/src/main.rs
rg -n "createHash\('sha256'\)" scripts/build-release.mjs
rg -n '\.sha256' apps/updater/src/main.rs
```

All three must return matches. The updater compares both exact byte length and
SHA-256 before writing an artifact, and writes a `<name>.sha256` sidecar.

## 7. Manifest signature verification

```powershell
rg -n 'verify_signature|key\.verify|Ed25519' apps/updater/src/main.rs
rg -n "sign\(null" scripts/sign-manifest.mjs
```

All must return matches. The all-zero placeholder key must be rejected:

```powershell
cargo test --manifest-path apps/updater/Cargo.toml
```

The tests `placeholder_key_is_rejected`,
`canonical_bytes_match_the_shared_spec`, and `endpoint_allowlist_enforced`
must all pass.

## 8. No committed secrets

```powershell
git ls-files '*.pem'
```

Output must be empty. `*.pem`, `.env`, `target/`, and `dist-release/` are
gitignored.

## 9. Script and workflow syntax

```powershell
node --check scripts/build-release.mjs
node --check scripts/sign-manifest.mjs
node --check scripts/check-domain.mjs
```

CI runs these gates on every push and pull request via
`.github/workflows/ci.yml`, plus `npm run build`, `npm test`,
`npm run typecheck`, and cargo check/test in both Rust crates.
