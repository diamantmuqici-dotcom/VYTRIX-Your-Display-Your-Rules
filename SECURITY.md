# VYTRIX Security

## Supported versions

Version `0.1.x` is under active development. Security fixes land on `privacy/sovereign-edition`.

## Reporting

Send vulnerability details through the project's private channel. Include the affected commit, component, reproduction steps, and impact. Do not publish exploit details before a fix is available.

## Security model

- Desktop core is local-first; cloud failure never removes local functionality.
- Native IPC is narrow and validated; no arbitrary shell execution.
- Presets are data-only JSON with content hashes and schema checks.
- Updates require signed metadata and SHA-256 verification.
- Community content is untrusted and validated before import.
- Phone Control is LAN-only with explicit pairing and expiring tokens.
- No game injection, memory reads, or security-product disabling.

## Release requirements

Before a public release: provision the signing key, replace the updater public-key placeholder, sign `latest.json`, generate checksums, build installer and portable artifacts, and complete the Windows smoke matrix.
