# VYTRIX FAQ

## Is an account required?

No. Settings, profiles, presets, color controls, overlay, and monitoring work
locally without a network connection. Cloud features are additive and report
an explicit unavailable state when offline.

## Does VYTRIX inject into games or read game memory?

No. Game detection reads process names and window titles from launcher
manifests. There is no DLL injection, no process memory access, no code hook,
and no game-file modification.

## Does it include an aimbot or ESP?

No. The overlay is a transparent window with no hidden-player detection and no
anti-cheat evasion. The crosshair tool draws a fixed reticle on that window.

## Which GPUs are supported?

NVIDIA NVAPI, AMD ADL, and Intel IGCL are used where available. The active
backend is shown per monitor as `nvapi`, `adl`, `igcl`, or `software`. A
software path is labelled as such and never presented as hardware vibrance.

## Are display changes permanent?

Resolution and refresh-rate changes write a rollback token first and require
confirmation within fifteen seconds. Losing focus or declining restores the
previous mode. Optimizer settings store their previous values and expose an
undo action and a backup export.

## Why does Windows warn about the installer?

Unsigned binaries trigger SmartScreen until they build reputation. See
`docs/INSTALLATION.md` for the exact verification steps and how checksum
verification fits in. Manifest signing and Authenticode code signing are separate controls.

## How do I verify a download?

Download the `.sha256` sidecar next to the artifact and compare with
`Get-FileHash`. See `docs/INSTALLATION.md`. The updater performs the same check
automatically before it offers to install, and additionally verifies the
Ed25519 signature on the release manifest.

## What does the updater do when I am offline?

It prints `Update check skipped`, exits successfully, and changes no files.
The app keeps working normally.

## Can I stay on an older version?

Yes. Keep the old installer. The updater always fetches the latest signed
manifest, so to stay pinned, do not run it and disable automatic checks in
Settings.

## How are community presets handled?

`.vytrixpreset` files are inert JSON with a schema version and a content hash.
Unknown versions are rejected. No eval, dynamic import, scripts, or archived
executables are supported.

## Where do I report a security issue?

`security@vytrix.gg`. Include the affected version, reproduction steps, and
impact. Do not attach credentials or live tokens. See `docs/SECURITY.md`.

## Where are the release keys?

The private key is never in the repository. It lives in the release secret
store and the GitHub Actions secret `VYTRIX_RELEASE_PRIVATE_KEY`. Only its raw
public key is committed, in `apps/updater/public_key.hex`.
