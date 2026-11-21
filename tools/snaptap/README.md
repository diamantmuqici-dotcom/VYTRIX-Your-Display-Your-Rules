# SnapTap in VYTRIX

SnapTap is a standalone Win32 keyboard group input tool vendored into VYTRIX
under the `misc` category. It is not a VYTRIX module: it runs as its own
process, owns its own low-level keyboard hook, and is catalogued in the Game
Profiles library as `SnapTap` so it appears beside the game configurations.

## What is included

| Path | Purpose |
| --- | --- |
| `SnapKey-ud-v1.7.0.cpp` | Full v1.8.0 source, MIT, upstream `cafali/SnapKey` base |
| `config.cfg` | Group bindings and the complete v1.8.0 settings block |
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
    -o SnapKey_v1.7.0.exe -lwinmm -lshell32 -lpsapi
```

MSVC:

```bat
cl /std:c++17 /O2 /EHsc /DNDEBUG /link /SUBSYSTEM:WINDOWS winmm.lib shell32.lib psapi.lib ^
    SnapKey-ud-v1.7.0.cpp /Fe:SnapKey_v1.7.0.exe
```

## Run

Launch `bin/SnapKey_v1.7.0.exe`. The tray icon toggles on double-click; the
right-click menu selects profiles and shows detection state. Groups are
last-input-wins: hold A, press D, and A releases after the configured delay.

`config.cfg` and `profiles/` are read next to the executable. `reloadKey`
re-reads the file without a restart. Every setting, including `autoDetect`,
`coverPct`, `idleUnhookMs`, `skipChancePct` and the per-tier jitter ranges, is
documented in `config.cfg` and `README.upstream.md`.

## Boundary

- VYTRIX reads no keyboard input for this tool and does not drive it.
- The tool uses `WH_KEYBOARD_LL` and `SendInput`; it does not inject code into
  games, read game memory, or modify game files.
- Anti-cheat tiers and ban-risk readouts are informational. They are not an
  undetected claim; kernel anti-cheat and server-side input analysis are
  outside a low-level hook tool.
- The `misc` catalog entry declares only `detection` as a supported feature.
  No display, color, overlay, crosshair, monitoring or restoration profile is
  applied to it.
