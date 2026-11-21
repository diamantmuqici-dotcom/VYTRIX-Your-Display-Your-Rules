# VYTRIX Security Model

## Boundaries

- Frontend has no privileged capability beyond the declared Tauri permission set.
- All native operations go through validated commands in `src-tauri/src/commands`.
- Administrator privileges are never requested by default. A specific operation that needs elevation explains why and asks explicitly.
- Cloud traffic is HTTPS only. Local phone control binds to loopback/LAN, requires pairing, uses short-lived tokens, and opens no firewall rule automatically.

## Explicitly absent

- No DLL injection, code hooks, or process memory access.
- No game-file modification.
- No keylogging or keyboard-event recording. Hotkeys are registered with the OS, not polled from input streams.
- No hidden drivers, services, scheduled tasks, or background installers.
- No disabling of Defender, firewall, Update, or essential Windows services.
- No destructive registry scripts.
- No arbitrary administrator command execution from the UI.
- No unverified executable updates.
- No hardcoded secrets or plaintext passwords; credentials use Windows DPAPI where applicable.

## Data handling

Telemetry is opt-in. Local settings and profiles live in the app data directory and remain usable offline. Account data, licenses, and community content live in PostgreSQL behind the API. Community presets are inert JSON treated as untrusted input; every field is validated and clamped before use.

## Release integrity

Every release manifest is signed and every binary has a published SHA-256. The updater checks both before install. Verification steps are published on the website Trust Center.

## Reporting

Vulnerability reports: `security@vytrix.gg` (-configured via `VULNERABILITY_REPORT_EMAIL`). Include affected version, reproduction steps and impact. Do not attach live credentials.
