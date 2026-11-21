# @vytrix/overlay

Transparent, always-on-top webview surface for VYTRIX. This frontend is served into the `overlay` window declared in `apps/desktop/src-tauri/tauri.conf.json` (label `overlay`, fullscreen, transparent, always on top, cursor events ignored).

The surface draws a crosshair with SVG and a small zoom/hotkey readout with CSS. It reads its configuration through the Tauri command `overlay_config` and listens for `vytrix://hotkey` events to toggle visibility. It never reads game memory, never injects into a game, never captures screenshots, and never sends input to a game.

## Develop

```powershell
npm install
npm run dev -w @vytrix/overlay
```

Point the desktop app's `overlay` webview at `http://localhost:1421/` for development. In a packaged build, point it at the built `apps/overlay/dist` or copy that output into the desktop frontend assets. The desktop app remains the owner of window state and hotkeys.

## Configuration

`overlay_config` returns an object shaped like:

```ts
{
  crosshairEnabled: boolean,
  crosshair: CrosshairConfig, // id, name, style, color, thickness, gap, length,
                              // opacity, outline, centerDot, rotation, scale,
                              // monitorId, offsetX, offsetY
  zoom: { enabled: boolean, level: number, label: string | null },
  hotkeyHint: string | null
}
```

Every value is normalized before render: `opacity` 0.1–1, `thickness` 1–12, `gap` 0–40, `length` 2–40, `scale` 0.5–3, `rotation` 0–360, offsets -2000–2000, zoom 1–8. Styles are limited to `dot`, `circle`, `cross`, and `dynamic-cross`. Invalid strings and colors fall back to inert defaults.

Outside Tauri, `invoke` and `listen` are unavailable, so the app uses inert defaults: nothing is drawn. That keeps plain-browser preview honest.

## Commands

```powershell
npm run typecheck -w @vytrix/overlay
npm run build -w @vytrix/overlay
```

Build output: `apps/overlay/dist`.
