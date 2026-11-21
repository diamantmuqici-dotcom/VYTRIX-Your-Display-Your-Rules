import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../src/", import.meta.url);

test("every section has a page implementation", () => {
  const sections = readFileSync(new URL("app/sections.ts", root), "utf8");
  const ids = [...sections.matchAll(/id:\s*"([a-z-]+)"/g)].map((match) => match[1]);
  const app = readFileSync(new URL("App.tsx", root), "utf8");
  for (const id of ids) assert.ok(app.includes(`"${id}":`), `missing page mapping for ${id}`);
  assert.ok(ids.length >= 13, `expected 13+ sections, found ${ids.length}`);
});

test("native bridge fails closed outside tauri", () => {
  const bridge = readFileSync(new URL("services/tauri.ts", root), "utf8");
  assert.match(bridge, /RUNTIME_UNAVAILABLE/);
  assert.match(bridge, /Native runtime not connected/);
});

test("game catalog ships verified and manual tiers", () => {
  const games = readFileSync(new URL("data/games.ts", root), "utf8");
  assert.match(games, /verifiedDetection:\s*Boolean/);
  assert.match(games, /ROB RUN/);
  assert.match(games, /GTA VI/);
});

test("optimizer never targets security services", () => {
  const tasks = readFileSync(new URL("data/optimizer.ts", root), "utf8");
  assert.doesNotMatch(tasks, /Defender|firewall|Windows Update/i);
});

test("phone control drives the native LAN agent", () => {
  const page = readFileSync(new URL("pages/PhoneControl/index.tsx", root), "utf8");
  for (const command of ["phone_start", "phone_stop", "phone_status", "phone_rotate_code", "phone_unpair", "phone_permissions"]) {
    assert.ok(page.includes(`"${command}"`), `missing native command ${command}`);
  }
  assert.doesNotMatch(page, /makeToken|crypto\.getRandomValues|vytrix:\/\/pair\?host=localhost/);
  assert.match(page, /Native runtime required/);
});

test("phone bridge forwards inbound commands into the store", () => {
  const bridge = readFileSync(new URL("hooks/usePhoneBridge.tsx", root), "utf8");
  for (const event of ["vytrix://phone-color", "vytrix://phone-preset", "vytrix://phone-crosshair", "vytrix://phone-paired"]) {
    assert.ok(bridge.includes(event), `missing event subscription ${event}`);
  }
  assert.match(bridge, /clampColorSettings/);
  assert.match(bridge, /setOverlayEnabled/);
  assert.match(bridge, /phone_presets/);
});
