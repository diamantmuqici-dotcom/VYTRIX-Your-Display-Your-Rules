# Releasing VYTRIX

This is the full Windows release runbook. Every release is built twice-verified:
signed manifest, then per-file SHA-256. An unsigned or unverifiable manifest
must never be published to `https://vytrix.gg/api/releases/latest.json`.

DNS resolution of `vytrix.gg` does not by itself establish registration or
ownership. Run `node scripts/check-domain.mjs` for the current resolver answer
before planning a publication; it reports facts only.

## 1. One-time release key setup

Generate the Ed25519 keypair once on a clean machine:

```bash
openssl genpkey -algorithm ED25519 -out release-private-key.pem
chmod 600 release-private-key.pem
openssl pkey -in release-private-key.pem -pubout -out release-public-key.pem
```

Print the raw 32-byte public key:

```bash
openssl pkey -in release-private-key.pem -pubout -outform DER | tail -c 32 | xxd -p -c 64
```

**FILL:** replace the all-zero placeholder in `apps/updater/public_key.hex`
with that single lowercase hex line. Until this is done, the updater rejects
every manifest with a `FILL` error and refuses to install.

Store the private key in the GitHub Actions secret `VYTRIX_RELEASE_PRIVATE_KEY`
either as the PEM text or as an absolute path to a PEM on the runner. `*.pem`
is gitignored; never commit it. Rotating the key means shipping a new updater
with a new embedded public key.

## 2. Version and prerequisites

- Update `version` in `apps/desktop/src-tauri/tauri.conf.json` and `package.json`.
- Windows 11 runner (or Windows 10/11 with VS 2022 Build Tools, C++ workload,
  Windows SDK, and WebView2 Runtime).
- Node 24, Rust stable with `x86_64-pc-windows-msvc`.
- `npx @tauri-apps/cli` available from the root devDependency.

## 3. Build and stage

```powershell
node scripts/check-domain.mjs
npm ci
npm run build
npm test
npm run typecheck
cd apps/desktop/src-tauri
cargo check
cargo test
npx @tauri-apps/cli build
cd ..\..\..
node scripts/build-release.mjs --skip-build
```

`build-release.mjs` also works end to end without `--skip-build`: it runs
`npm run build` and the Tauri build itself. Use `--skip-build` in CI after a
Tauri build has already produced the bundle.

It writes `dist-release/manifest.json`:

```json
{
  "version": "1.2.3",
  "publishedAt": "2026-11-21T00:00:00Z",
  "files": [
    {
      "name": "VYTRIX_1.2.3_x64.msi",
      "url": "https://vytrix.gg/releases/1.2.3/VYTRIX_1.2.3_x64.msi",
      "sha256": "...",
      "size": 12345
    }
  ],
  "signature": ""
}
```

One `<name>.sha256` sidecar per artifact is written alongside it. The manifest
is unsigned at this point by design.

Override the download base with `VYTRIX_RELEASE_BASE_URL` and the bundle source
with `VYTRIX_BUNDLE_DIR` when staging a nonstandard layout.

## 4. Sign the manifest

```powershell
$env:VYTRIX_RELEASE_PRIVATE_KEY = "C:\secrets\release-private-key.pem"
node scripts/sign-manifest.mjs
```

The script refuses to sign when the embedded public key is still the
placeholder, when the key is not Ed25519, or when the key does not match
`apps/updater/public_key.hex`. It prints the public key and the signature hex,
then fills `manifest.signature`. See `docs/UPDATER.md` for the exact canonical
byte format that both the signer and the updater use.

## 5. Verify before upload

```powershell
# Confirm every sidecar matches the file it describes
Get-ChildItem dist-release\*.sha256 | ForEach-Object {
  $line = Get-Content $_.FullName
  $expected = ($line -split '\s+')[0]
  $target = Join-Path dist-release (($line -split '\s+')[1])
  $actual = (Get-FileHash $target -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "checksum mismatch: $target" }
  "ok $target"
}

# Confirm the signature verifies against the embedded key
cd apps\updater
cargo run -- --manifest-url http://localhost:8787/latest.json --check-only
```

Serve `dist-release/manifest.json` from a local static server on port 8787 for
the last command. The updater allows loopback HTTP only for testing; shipping
builds accept HTTPS on `vytrix.gg` and its subdomains only.

## 6. Upload

1. Copy the installer artifacts from `apps/desktop/src-tauri/target/release/bundle`
   to the release path used by the manifest URLs. The path must match the `url`
   fields byte for byte.
2. Publish the signed `dist-release/manifest.json` at
   `https://vytrix.gg/api/releases/latest.json`. The API endpoint is owned by
   the API workstream; coordinate the deployment so the new manifest and the
   new artifact files go live together.
3. Attach all artifacts and the signed manifest to the GitHub release. The
   `release.yml` workflow does this automatically on a `v*` tag and gates the
   signing step on `VYTRIX_RELEASE_PRIVATE_KEY`.

## 7. VirusTotal and reputation

Submit each installer before announcing the release:

```bash
curl --request POST --url https://www.virustotal.com/api/v3/files \
  --header "x-apikey: $VIRUSTOTAL_API_KEY" \
  --form "file=@VYTRIX_1.2.3_x64.msi"
```

Record the analysis URL in the release notes. An unsigned Windows binary will
trigger SmartScreen warnings; see `docs/INSTALLATION.md` for the user-facing
text. Code signing with an Authenticode certificate is a separate step from
manifest signing and is configured in `tauri.conf.json` under
`bundle.windows.certificateThumbprint`.

## 8. Rollback

If a release must be pulled, republish the previous signed manifest to the
latest endpoint and remove the bad artifacts from the release path. The updater
verifies the manifest signature on every check, so reverting the endpoint is
sufficient to stop new installs. Keep old artifacts available for users who
need to repair an existing installation.

## Release checklist

- [ ] Domain resolver state checked (`node scripts/check-domain.mjs`)
- [ ] Version bumped in both manifests
- [ ] `npm run build`, `npm test`, `npm run typecheck` green
- [ ] `cargo check` / `cargo test` green in desktop and updater
- [ ] Real public key embedded; placeholder removed
- [ ] Artifacts built for msi and nsis
- [ ] `dist-release/manifest.json` generated with sidecars
- [ ] Manifest signed; signature matches embedded key
- [ ] Sidecars re-verified with `Get-FileHash`
- [ ] Artifacts and manifest uploaded to matching paths
- [ ] VirusTotal analyses recorded
- [ ] GitHub release published with attachments
