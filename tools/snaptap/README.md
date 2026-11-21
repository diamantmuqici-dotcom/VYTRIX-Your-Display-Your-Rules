# SnapTap in VYTRIX

SnapTap is a standalone Win32 keyboard group input tool vendored into VYTRIX
under the `misc` category. It is not a VYTRIX module: it runs as its own
process, owns its own low-level keyboard hook, and is catalogued in the Game
Profiles library as `SnapTap` so it appears beside the game configurations.

## What is included

| Path | Purpose |
| --- | --- |
| `SnapKey-ud-v1.7.0.cpp` | Full v1.10.0 source, MIT, upstream `cafali/SnapKey` base |
| `config.cfg` | Group bindings and the complete v1.10.0 settings block |
| `profiles/*.cfg` | WASD, ESDF, ARROW, AZERTY and CUSTOM profiles |
| `bin/SnapKey_v1.7.0.exe` | Prebuilt binary; the filename is fixed by the upstream autostart Run key |
| `icon.ico`, `icon_off.ico` | Tray states |
| `LICENSE` | Upstream MIT license |
| `README.upstream.md` | Unmodified upstream documentation and config reference |

VYTRIX does not modify the vendored source. The binary is shipped so the tool
is usable without a compiler; the source is shipped so the build is auditable.

## Build

MinGW-w64, verified against the shipped binary:

```bat
g++ -std=c++17 -O2 -mwindows -static -static-libgcc -static-libstdc++ ^
    -Wall -Wextra -Wno-missing-field-initializers SnapKey-ud-v1.7.0.cpp ^
    -o SnapKey_v1.7.0.exe -lwinmm -lshell32 -lpsapi -ladvapi32
```

MSVC:

```bat
cl /std:c++17 /O2 /EHsc /DNDEBUG /link /SUBSYSTEM:WINDOWS winmm.lib shell32.lib psapi.lib ^
    SnapKey-ud-v1.7.0.cpp /Fe:SnapKey_v1.7.0.exe
```
(MSVC links `advapi32` through the default libraries; MinGW needs it listed
explicitly for the per-user Run key calls.)

## Run

Launch `bin/SnapKey_v1.7.0.exe`. The tray icon toggles on double-click; the
right-click menu selects profiles and shows detection state. Groups are
last-input-wins: hold A, press D, and A releases after the configured delay.

`config.cfg` and `profiles/` are read next to the executable. `reloadKey`
re-reads the file without a restart. Universal mode is on by default
(`universal=1`): the group transform runs in every window with no foreground
classification, no per-title risk policy and no idle unhook. It uses the global
`jitterMinMs`/`jitterMaxMs` range. Set `universal=0` for the legacy autodetect
or whitelist mode, which keeps the title table, per-tier jitter ranges,
`coverPct`, `idleUnhookMs`, `skipChancePct` and `banRiskLog`. All settings are
documented in `config.cfg` and `README.upstream.md`.

## Start with Windows

The tray menu has a **Start with Windows** submenu with three choices. All three
are per-user and need no elevation or service:

- **Off** — no automatic start.
- **Registry Run key** — writes
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\SnapKey` to the quoted
  executable path. This is the default (`startupMode=registry`).
- **shell:startup folder** — writes a `SnapKey.cmd` launcher into the current
  user's Startup folder that `cd`s to the exe directory before launching, so
  `config.cfg`, icons and profiles resolve at logon.

Selecting a choice removes the other two entry points, applies the new one, and
persists `startupMode` in `config.cfg`. On every launch the tool reconciles the
logon entry with the saved choice. The VYTRIX app exposes the same chooser under
Settings → Startup for both VYTRIX and SnapTap. The executable filename stays
`SnapKey_v1.7.0.exe` because the upstream autostart key depends on it.

## Boundary

- VYTRIX reads no keyboard input for this tool and does not drive it.
- The tool uses `WH_KEYBOARD_LL` and `SendInput`; it does not inject code into
  games, read game memory, or modify game files.
- Universal mode is a general keyboard utility, not a detection-evasion
  feature. No anti-cheat bypass or undetected result is claimed.
- Anti-cheat tiers and ban-risk readouts apply only in `universal=0` detection
  mode and are informational.
- The `misc` catalog entry declares only `detection` as a supported feature.
  No display, color, overlay, crosshair, monitoring or restoration profile is
  applied to it.
