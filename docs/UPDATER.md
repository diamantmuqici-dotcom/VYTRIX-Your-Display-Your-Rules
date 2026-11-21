# VYTRIX Updater

The updater is a standalone Rust CLI at `apps/updater`. It does not run inside
the desktop app and holds no privileges until the user confirms an install.

## Endpoint

Default manifest URL: `https://vytrix.gg/api/releases/latest.json`.

The CLI accepts HTTPS URLs on `vytrix.gg` and its subdomains only. Loopback
HTTP (`localhost`, `127.0.0.1`) is accepted for local testing via
`--manifest-url`. Any other scheme or host is rejected before a request is
made.

## Manifest format

```json
{
  "version": "1.2.3",
  "publishedAt": "2026-11-21T00:00:00Z",
  "files": [
    {
      "name": "VYTRIX_1.2.3_x64.msi",
      "url": "https://vytrix.gg/releases/1.2.3/VYTRIX_1.2.3_x64.msi",
      "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "size": 12345
    }
  ],
  "signature": "3045..."
}
```

- `version`: semantic release version.
- `publishedAt`: RFC 3339 timestamp. Displayed after parsing; parsing failure
  falls back to the raw string and is not fatal.
- `files[]`: artifacts. `name` must be a bare file name, no path separators.
- `sha256`: lowercase or uppercase hex; canonicalization lowercases it.
- `size`: exact byte length as an integer.
- `signature`: lowercase hex of the Ed25519 signature. Empty means unsigned.

## Canonical bytes

The signature is not over the JSON text. Both `apps/updater/src/main.rs` and
`scripts/sign-manifest.mjs` build the same UTF-8 byte string:

```
VYTRIX-RELEASE-MANIFEST-V1\n
version=<version>\n
publishedAt=<publishedAt>\n
file=<name>\n
url=<url>\n
sha256=<sha256 lowercased>\n
size=<decimal integer>\n
```

For multiple files, the four-line `file/url/sha256/size` block repeats in array
order. Lines are joined with LF and one trailing LF is appended. The
`signature` field is excluded. String fields must not contain CR or LF.

The Rust unit test `canonical_bytes_match_the_shared_spec` pins a full fixture.
Changing the canonical format requires updating the Rust test, the Node signer,
and this document in the same commit.

## Verification flow

1. Fetch manifest with a blocking HTTPS client and a 20-second default timeout.
2. Enforce endpoint allowlist.
3. Parse JSON into the typed manifest. Malformed JSON is fatal.
4. Load the embedded Ed25519 public key from `apps/updater/public_key.hex`.
   Comment lines beginning with `#` are ignored.
5. Reject the all-zero placeholder key with a `FILL` error.
6. Hex-decode the 64-byte signature and verify it against the canonical bytes.
   Any failure aborts before a single artifact is downloaded.
7. For each file: enforce endpoint allowlist and bare file name, download,
   compare exact byte length, compute SHA-256, compare to manifest value.
8. Write the artifact and a `<name>.sha256` sidecar containing
   `<lowercase hex>  <name>\n`.
9. Select the verified `.msi`, falling back to the verified `.exe`.
10. Ask `Install this update now? [y/N]` unless `--yes` was passed.
11. Launch `msiexec /i` for MSI or the EXE directly. Non-Windows hosts stop
    after verification with an explicit error.

Nothing is written to disk before step 5 passes. Nothing is installed before
every artifact passes steps 7 and 8.

## Offline behavior

An unreachable endpoint, DNS failure, timeout, or non-success HTTP status is
reported as `Update check skipped` and the CLI exits `0` without touching
files. Verification failures, malformed data, disallowed URLs, unsafe names,
and I/O errors exit `1`. Treat exit `1` as "do not install".

## Usage

```powershell
cd apps/updater
cargo run -- --check-only
cargo run -- --yes --out-dir "$env:TEMP\vytrix-update"
cargo run -- --manifest-url http://localhost:8787/latest.json --out-dir .\tmp
```

See `apps/updater/README.md` for the full flag table and key-generation
commands.
