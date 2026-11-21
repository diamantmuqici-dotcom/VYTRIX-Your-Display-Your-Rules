# @vytrix/updater

A standalone Rust CLI that checks `https://vytrix.gg/api/releases/latest.json`,
verifies the Ed25519 manifest signature, verifies SHA-256 for every artifact,
writes `.sha256` sidecars, and only then offers to run the installer.

It is offline-tolerant: an unreachable endpoint or non-success HTTP status is
reported and the process exits successfully without changing files. A bad
signature, bad hash, bad size, malformed manifest, disallowed URL, or unsafe
artifact name is fatal and nothing is installed.

## FILL — replace the placeholder public key

`public_key.hex` ships with an all-zero key. That is a placeholder, not a
signing key. Verification fails closed until it is replaced with the real
release public key. The CLI prints a `FILL` error naming the file when it
detects the placeholder.

Generate the release keypair once, keep the private key out of the repository,
and commit only the raw 32-byte public key:

```bash
openssl genpkey -algorithm ED25519 -out release-private-key.pem
chmod 600 release-private-key.pem
openssl pkey -in release-private-key.pem -pubout -out release-public-key.pem

# Raw 32-byte hex expected by apps/updater/public_key.hex and by sign-manifest.mjs
openssl pkey -in release-private-key.pem -pubout -outform DER | tail -c 32 | xxd -p -c 64
```

Put that single lowercase hex line in `apps/updater/public_key.hex`, replacing
the zeros. Store `release-private-key.pem` in the release secret store and in
the GitHub Actions secret `VYTRIX_RELEASE_PRIVATE_KEY`. `*.pem` is gitignored.

## Usage

```powershell
cd apps/updater

cargo check
cargo run -- --check-only
cargo run -- --yes --out-dir "$env:TEMP\vytrix-update"
cargo run -- --manifest-url http://localhost:8787/latest.json --out-dir .\tmp-update
```

| Flag | Meaning |
| --- | --- |
| `--manifest-url <URL>` | Override the default endpoint. HTTPS + vytrix.gg host enforced; loopback HTTP allowed for local tests. |
| `--out-dir <DIR>` | Download directory. Default `vytrix-update`. |
| `--public-key <FILE>` | Override the embedded key file (key rotation testing). |
| `--check-only` | Verify the signature and print the release. No downloads. |
| `-y`, `--yes` | Skip the `Install this update now? [y/N]` prompt. |
| `--timeout-secs <N>` | HTTP timeout. Default 20. |

Exit codes: `0` success (including offline/cancelled), `1` any verification or
I/O failure. Automation should treat `1` as "do not install".

## Manifest format

```json
{
  "version": "1.2.3",
  "publishedAt": "2026-11-21T00:00:00Z",
  "files": [
    {
      "name": "VYTRIX_1.2.3_x64.msi",
      "url": "https://vytrix.gg/releases/1.2.3/VYTRIX_1.2.3_x64.msi",
      "sha256": "0123456789abcdef...",
      "size": 12345
    }
  ],
  "signature": "abcdef..."
}
```

`signature` is lowercase hex of the Ed25519 signature over the canonical bytes
described below.

## Canonical bytes (must match `scripts/sign-manifest.mjs`)

The signature covers a UTF-8 string, not the raw JSON file. Build these lines
in order, join with LF (`\n`), and append one trailing LF:

1. `VYTRIX-RELEASE-MANIFEST-V1`
2. `version=<version>`
3. `publishedAt=<publishedAt>`
4. For each `files[]` entry, in array order:
   - `file=<name>`
   - `url=<url>`
   - `sha256=<sha256 lowercased>`
   - `size=<size as decimal integer>`

The `signature` field is excluded. String fields must not contain CR or LF.
The Rust unit test `canonical_bytes_match_the_shared_spec` pins the exact bytes.

## Install selection

The verified `.msi` artifact is preferred; otherwise the verified `.exe`
(NSIS) artifact is used. On Windows, MSI installers are launched through
`msiexec /i`. No installer runs before every file has passed both the size and
SHA-256 checks.
