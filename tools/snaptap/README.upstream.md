# SnapKey v1.8.0 — universal game autodetect + ban-risk awareness

Keyboard group input handler — last-input-wins counter-strafe assist.
Base: [cafali/SnapKey](https://github.com/cafali/SnapKey) (MIT) — tray app,
profiles and config format carry over. This build adds game autodetection,
a smaller detection surface, and a per-title snap-tap ban-risk readout.

Binary filename stays `SnapKey_v1.7.0.exe` on purpose: that is the path the
registry Run key points at. Renaming it breaks autostart.

## Quick start

1. Start `SnapKey_v1.7.0.exe`. Start the game whenever — autodetect picks it up.
2. Tray icon appears. Right-click for menu, double-click to toggle on/off.
   Hover the tray icon: the tooltip shows
   `SnapKey: <game> (tN <risk> risk)` while a game is focused,
   `SnapKey: no game` otherwise.
3. Hold A, press D — A releases after a humanized delay. Same for W/S and any
   group you define.
4. No per-game config. CS2, Rust, Apex, Tarkov, Valorant, ROB RUN, anything
   fullscreen with a GPU context attached resolves on its own.
5. Right-click → **Detected** shows the title, anti-cheat tier, ban-risk
   level and the policy note behind that level.

## Startup (registry Run key)

SnapKey registers itself under the per-user Run key so it starts at logon
and game autodetect is on from the first foreground poll:

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Run
  SnapKey = "C:\Users\diama\Downloads\Tools\snaptap\SnapKey_v1.7.0.exe"
```

To add/remove it manually:

```
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v SnapKey /d "\"C:\Users\diama\Downloads\Tools\snaptap\SnapKey_v1.7.0.exe\""
reg delete HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v SnapKey
```

The working directory is anchored to the exe folder at launch (v1.6.1
startup fix), so `config.cfg`, `icon.ico` and `meta\profiles\` resolve
correctly even though Windows launches Run-key apps with System32 as the
working dir. Keep `autoDetect=1` in `config.cfg` and every game is picked
up automatically — no per-game entries needed. One instance per install
folder; if SnapKey is already running the second launch exits quietly
(tray icon indicates on/off).

## Autodetect

Three passes, in order:

1. **Built-in table** — ~150 titles matched by foreground executable name, each
   carrying an anti-cheat tier that sets the jitter range (cs2 = 8–18ms,
   Rust/Apex/Tarkov = 11–24ms, Valorant = 14–28ms, no-AC titles = 6–14ms).
   A name match is enough; windowed play still snaps.
2. **Suffix rules** — Unreal-style shipped games (`*-shipping.exe`,
   `*-win64-shipping.exe`, `*-client.exe`) are treated as known without
   needing the exact title in the table. Catches Delta Force, Marvel Rivals
   and future UE releases on day one.
3. **Score heuristic** — unknown title: process must have a graphics API
   loaded (`d3d9/11/12`, `dxgi`, `vulkan`, `opengl`, `nvogl`, `amdgl`, ...)
   **and** the foreground window must cover `coverPct`% of the monitor
   (default 95%). Borderless-70% + game-store path (`steamapps`, `epic games`,
   `gog`, `riot games`, …) + GPU also qualifies, so borderless windowed
   games snap too. Browsers, terminals, editors, capture tools, engine
   editors, shell/text hosts and launchers are excluded by name before the
   check.

Everything else is pass-through. Outside a game the tool does nothing —
the hook is not even installed.

### ROB RUN and ban-risk awareness

ROB RUN (Steam app `4262460`, Kefir, released 4 Nov 2026) is a Unity IL2CPP
title launched through `start_protected_game.exe` with Easy Anti-Cheat. It is
mapped as `rob run.exe` → `TIER_HARD` (jitter 11–24ms). The launcher and the
EAC/BattlEye bootstrap processes are on the exclusion list, so the brief
foreground flash during startup is never mistaken for a game.

The anti-cheat tier answers *how hard the client looks*. The ban-risk level
answers *what a snap gets you*. Both are shown in the tray tooltip, the
Detected dialog and the log:

| Level | Meaning |
|---|---|
| `low` | no anti-cheat on record for the title |
| `medium` | VAC / light AC; automation policy varies by title |
| `high` | EAC / BattlEye kernel client, or an explicitly documented ban |
| `extreme` | Vanguard kernel AC; strict automation enforcement |

Explicit policy overrides: CS2/CS:GO are `high` — Valve drew a clear line on
19 Aug 2024 and banned snap-tap / keyboard automation. ROB RUN is `high` by
anti-cheat class (EAC kernel client, no published snap-tap allowance). Valorant
is `extreme` for Vanguard. Everything else inherits from its AC tier.

"Undetected" is not a claim this build makes. A `WH_KEYBOARD_LL` hook plus
`SendInput` runs in usermode: flag stripping and provenance scrubbing clean up
the downstream usermode hook chain, but they do not defeat kernel input
inspection or server-side timing/statistical analysis. Those surfaces stay
outside this tool. The risk readout is there so the trade-off is visible
before you launch a title, not hidden behind a tier number.

### What v1.7 fixed

- **GPU cache bug (v1.6.1):** a game that loaded D3D after the first poll was
  stuck "not a game" until restart — the negative module scan never expired.
  Now negatives rescan every `gfxRescanMs` (2s), positives every 30s.
- **Pixel-perfect fullscreen:** v1.6.1 required `GetWindowRect` to match the
  monitor within 2px. DPI scaling, DWM shadows and ultrawide rounding broke
  it. v1.7 uses area % (`coverPct`, default 95%) instead, plus a borderless
  style check — no more false negatives from pixel math.
- **Gate flapping:** the v1.6.1 log shows `gate closed/open in <1s` at start
  (alt-tab / mode switch). v1.7 opens instantly but closes only after
  `closeDebounceMs` (400ms) of consecutive non-game polls, so transient
  flicker no longer drains the pending queue. `detected` is also logged only
  on a real title switch, not on every re-open.
- **Process naming:** `QueryFullProcessImageName` falls back to a toolhelp
  process snapshot when `OpenProcess` is denied (elevated/system PIDs), and
  the process runs DPI-aware so coverage % is measured in matching units.
- **Log growth:** `snaptap.log` rotates at 256KB (`snaptap.log.1`).

### Footprint while idle

| State | Hook | Injection |
|---|---|---|
| No game focused | not installed | none |
| Game focused | installed, refreshed every 45–90s (jittered) | only snap release / sticky resume |
| Foreground leaves game | removed after `idleUnhookMs` (default 3s) | pending queue dropped |

### Injection hygiene

- Our injected events leave the hook with `dwExtraInfo` zeroed and the
  `LLKHF_INJECTED` / `LLKHF_LOWER_IL_INJECTED` flags cleared for the rest of
  the chain — downstream hooks see hardware-shaped events, no tool tag.
- The internal tag is 64 random bits regenerated every launch. No constant
  exists between runs to fingerprint.
- Delays are triangular, per-title, never flat and never 0.
- On `high`/`extreme` risk titles the delay window drifts ±3ms per snap inside
  the tier floor, so a fixed 11–24ms band never becomes the signature itself.
- `skipChancePct` drops a snap occasionally if you want the fire rate to look
  less mechanical (default 0).
- Stealth mode randomizes the window class per launch and derives the mutex
  from the install path hash — no readable names in the object tree.

## Settings (`config.cfg`)

| Key | Default | What it does |
|---|---|---|
| `autoDetect` | `1` | Game autodetection. `0` = whitelist mode (`activeOn` only). |
| `requireFullscreen` | `1` | Unknown titles must cover the monitor. `0` = GPU alone decides. Known titles skip this. |
| `coverPct` | `95` | Unknown titles: monitor % area required. `0` = ignore coverage. Lower to 80-85 for small borderless windows. |
| `closeDebounceMs` | `400` | Gate-close hysteresis (open is instant). `0` = close instantly. |
| `gfxRescanMs` | `2000` | Negative GPU-scan retry interval. Positive scans expire in 30s. |
| `minHoldMs` | `12` | Physical-hold debounce floor. `0` = off. |
| `activeOn` | *(empty)* | Whitelist-mode process list. Empty = always active. |
| `autoExclude` | *(empty)* | Extra names to never classify as a game. Wildcards ok (`*helper.exe`). |
| `autoInclude` | *(empty)* | Extra names to always classify as a game. Wildcards ok. |
| `jitterMinMs` / `jitterMaxMs` | `8` / `18` | Whitelist-mode delay range. |
| `tierNoneMinMs` / `Max` | `6` / `14` | No-AC titles. |
| `tierSoftMinMs` / `Max` | `8` / `18` | VAC / light AC. |
| `tierHardMinMs` / `Max` | `11` / `24` | EAC / BattlEye. |
| `tierKeenMinMs` / `Max` | `14` / `28` | Vanguard / kernel AC. |
| `settleMs` | `0` | Extra dwell before a sticky resume press. |
| `idleUnhookMs` | `3000` | Unhook after this long with no game focused. `0` = stay hooked. |
| `skipChancePct` | `0` | Percent chance a snap is dropped instead of fired. Max 20. |
| `banRiskLog` | `1` | Log the policy note when a high/extreme-risk title is detected. |
| `pollMs` | `100` | Foreground poll interval. |
| `toggleKey` / `killKey` / `reloadKey` | `0` | Hotkeys, ASCII codes, `0` = off. |
| `stealth` | `0` | No tray icon, no readable object names. |
| `tray` | `1` | Tray icon. Implied off when `stealth=1`. |
| `logFile` | `snaptap.log` | Event log, appended and rotated at 256KB. Empty = off. |

Per-title overrides, any time, no rebuild:

```
[Game]
exe=cs2.exe
jitterMinMs=9
jitterMaxMs=20
settleMs=2
tier=1
```

`tier`: 0 none, 1 soft, 2 hard, 3 keen.

## Profiles

`meta\profiles\` holds key-group presets (WASD, ESDF, ARROW, AZERTY, CUSTOM).
Tray menu → Select Profile applies one and restarts. Each profile carries the
full settings block, so switching keeps your hotkeys, tiers and jitter.
Groups support unlimited keys: add `key5=`, `key6=`, ... in a `[Group]` block.
New `[Group]` block = new snap pair.

> Profiles saved before v1.7 still load fine — missing v4 keys fall back to
> their defaults (`coverPct=95`, `closeDebounceMs=400`, …). Re-save a profile
> after loading it if you want the new keys written into the file.

## Behavior notes

- Physical input always passes through untouched.
- The automatic release/press is the only synthetic input, delayed by the
  per-title triangular jitter and tagged so the state machine can never
  double-release or stick a key.
- When the foreground leaves the game, everything goes quiet; queued actions
  drop instead of landing in another app.
- One instance per install folder; the tray icon reflects on/off state and
  the tooltip names the detected game.

## Logs

`logFile=snaptap.log` records startup config, detected title + tier + risk on
every title switch, the policy note for high/extreme titles (unless
`banRiskLog=0`), hotkey toggles, config reloads, hook install/remove/refresh,
and every fired release/press with timestamps. Rotated to `snaptap.log.1`
past 256KB. Delete it occasionally.

## Build

MinGW (verified, produces the shipped binary):

```
g++ -std=c++17 -O2 -mwindows -static -static-libgcc -static-libstdc++ ^
    -Wall -Wextra -Wno-missing-field-initializers SnapKey-ud-v1.7.0.cpp ^
    -o SnapKey_v1.7.0.exe -lwinmm -lshell32 -lpsapi
```

MSVC:

```
cl /std:c++17 /O2 /EHsc /DNDEBUG /link /SUBSYSTEM:WINDOWS winmm.lib shell32.lib psapi.lib ^
    SnapKey-ud-v1.7.0.cpp /Fe:SnapKey_v1.7.0.exe
```

## Credits

- cafali, minteeaa, Yaw-Dev — original SnapKey, MIT License
- v1.4.x input path: physical pass-through, provenance strip, stream-pairing
  fix, foreground gate, stealth names, hotkeys, watchdog
- v1.5.0: autodetect table + generic heuristic, per-title jitter tiers, idle
  unhook, per-session injection tag, config v3
- v1.6.0: glitch hardening — 12ms physical-hold debounce, pending queue
  drain on gate transition, 500ms max-age discard, minimum sticky-resume gap
- v1.6.1: startup fix (exe-dir working dir for registry Run launches), tray
  menu restored (Version Info / Autodetect toggle / Detected / Rebind /
  Help), resume gap now enforced, suppress pairing survives lock/gate
- v1.7.0: detection deep-think — ~150-title table + shipping suffix rules +
  score heuristic (GPU + coverage% + borderless + store path), gate-close
  debounce, GPU cache TTL fix, coverage-% instead of pixel match, DPI-aware
  + elevated-PID fallback, live tray tooltip, log rotation, config v4
- v1.8.0: ROB RUN (Steam 4262460 / EAC) classification, anti-cheat launcher
  exclusions, per-title ban-risk model in tray/log/dialog, bounded ±3ms
  jitter drift on high/extreme titles, `banRiskLog` config key

License: MIT (see LICENSE).
