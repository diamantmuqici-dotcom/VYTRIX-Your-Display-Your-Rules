# @vytrix/mobile-control

Mobile-first companion controller for VYTRIX. It talks to the desktop agent over the local network while a game is running and uses the same design tokens as the desktop suite: `#080B12`, `#111827`, `#00D9FF`, `#8B5CF6`.

## Pairing

1. Open **Phone Control** in the VYTRIX desktop app and start the pairing window.
2. Read the six-digit code shown there.
3. On the phone, enter the agent root address, for example `http://192.168.1.20:8753`, and the code.
4. Tap **Connect**.

Traffic is LAN-only: `http://<pc-ip>:<port>` over the same Wi-Fi network. The desktop Phone Control window must be open for the agent to accept pairing. The token TTL is 5 minutes; when it expires the app clears the session locally and returns to the Pair view. The session token is kept in memory only — no `localStorage`, no `sessionStorage`, no cookies.

## Agent endpoints

The typed client in `src/client.ts` uses real `fetch()` calls with an `AbortController` timeout of 6 seconds and at most 3 attempts per command:

- `POST /pair` with `{ code }`
- `GET /state`
- `POST /color` with `{ settings }`
- `POST /preset` with `{ id }`
- `POST /crosshair` with `{ enabled }`

Subsequent requests carry `Authorization: Bearer <token>`. Failed requests stay failed: the UI shows the error and leaves the reported device state untouched. There are no simulated successes or offline sample data.

All outgoing color values are clamped to the same ranges as `packages/validation`: saturation/vibrance 0–300, gamma 50–250, brightness/contrast and RGB channels 0–200, hue 0–360, temperature 1000–12000K (or `null`). Non-finite values are rejected with an error.

## Views

- **Pair** — address, six-digit PIN input, connect button, and a hand-off QR of the pairing URI.
- **Controls** — color sliders with a live preview and an explicit Apply action, preset grid, and crosshair toggle.
- **Status** — live state from `GET /state`, manual refresh, and disconnect.

## Commands

```powershell
npm install
npm run dev -w @vytrix/mobile-control
npm run typecheck -w @vytrix/mobile-control
npm run build -w @vytrix/mobile-control
```

Dev server binds to `0.0.0.0:1422` so the page can be opened on a phone. Build output: `apps/mobile-control/dist`.
