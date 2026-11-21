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

test("display exposes a bounded custom resolution and refresh control", () => {
  const page = readFileSync(new URL("pages/Display/index.tsx", root), "utf8");
  for (const token of ["display.custom", "display.width", "display.height", "display.hz", "display.useCustom", "display_apply"]) {
    assert.ok(page.includes(token), `missing custom mode token ${token}`);
  }
  assert.match(page, /WIDTH_BOUNDS/);
  assert.match(page, /HEIGHT_BOUNDS/);
  assert.match(page, /HZ_BOUNDS/);
  assert.match(page, /customWidth.*customHeight.*customHz/s);
});

test("language selection ships German and Russian and rewrites the shell", () => {
  const settings = readFileSync(new URL("pages/Settings/index.tsx", root), "utf8");
  const i18n = readFileSync(new URL("i18n/index.ts", root), "utf8");
  const app = readFileSync(new URL("App.tsx", root), "utf8");
  const panel = readFileSync(new URL("components/ui/Panel.tsx", root), "utf8");
  assert.match(i18n, /value: "de"/);
  assert.match(i18n, /value: "ru"/);
  assert.match(i18n, /const DE:/);
  assert.match(i18n, /const RU:/);
  assert.match(settings, /LANGUAGE_OPTIONS/);
  assert.match(settings, /setSetting\("language"/);
  assert.match(app, /useT\(\)/);
  assert.match(panel, /useTranslateText\(\)/);
});

test("every English UI string has German, French and Russian translations", () => {
  const source = readFileSync(new URL("i18n/index.ts", root), "utf8");
  const sections = source.split(/const (EN|FR|DE|RU)\b/).slice(1);
  const dictionaries = new Map();
  for (let index = 0; index < sections.length; index += 2) {
    const keys = [...sections[index + 1].matchAll(/^[ \t]{2}"([^"]+)":/gm)].map((match) => match[1]);
    dictionaries.set(sections[index], new Set(keys));
  }
  const english = dictionaries.get("EN");
  assert.ok(english.size >= 180, `expected full UI coverage, found ${english.size}`);
  for (const language of ["FR", "DE", "RU"]) {
    const translated = dictionaries.get(language);
    assert.ok(translated, `missing ${language} dictionary`);
    const missing = [...english].filter((key) => !translated.has(key));
    assert.deepEqual(missing, [], `${language} is missing ${missing.length} UI keys`);
  }
});

test("color changes reach the native gamma-ramp backend", () => {
  const store = readFileSync(new URL("stores/app.tsx", root), "utf8");
  const service = readFileSync(new URL("services/color.ts", root), "utf8");
  const native = readFileSync(new URL("../src-tauri/src/color.rs", root), "utf8");
  const lib = readFileSync(new URL("../src-tauri/src/lib.rs", root), "utf8");
  assert.match(store, /pushColor\(color\)/);
  assert.match(service, /"color_apply"/);
  assert.match(service, /"color_reset"/);
  assert.match(native, /SetDeviceGammaRamp/);
  assert.match(native, /GetDeviceGammaRamp/);
  assert.match(lib, /commands::color_apply/);
  assert.match(lib, /commands::color_reset/);
});

test("color temperature is real: correct Kelvin direction and visible preview", () => {
  const native = readFileSync(new URL("../src-tauri/src/color.rs", root), "utf8");
  const presets = readFileSync(new URL("data/presets.ts", root), "utf8");
  const studio = readFileSync(new URL("pages/ColorStudio/index.tsx", root), "utf8");
  const store = readFileSync(new URL("stores/app.tsx", root), "utf8");

  // Native ramp must derive red/blue from absolute Kelvin, not an inverted warmth term.
  assert.match(native, /fn temperature_gains\(kelvin: f64\)/);
  assert.match(native, /Lower Kelvin favors red \(warm\), higher Kelvin favors blue \(cool\)/);
  assert.match(native, /gains\[0\] \*= temp_gains\[0\]/);
  assert.match(native, /gains\[2\] \*= temp_gains\[2\]/);
  assert.doesNotMatch(native, /0\.12 \* warmth/);
  assert.match(native, /temperature_warms_low_kelvin_and_cools_high_kelvin/);

  // The preview must render a temperature tint in both before and after panes.
  assert.match(presets, /export function temperatureTint\(kelvin/);
  assert.match(presets, /rgb\(255,150,60\)/);
  assert.match(presets, /rgb\(120,160,255\)/);
  assert.match(studio, /baselineTint = temperatureTint\(state\.baseline\.temperatureK\)/);
  assert.match(studio, /currentTint = temperatureTint\(state\.color\.temperatureK\)/);
  assert.match(studio, /style=\{baselineTint\}/);
  assert.match(studio, /style=\{currentTint\}/);

  // Temperature changes must still reach the native ramp on every slider move.
  assert.match(store, /setColorField[\s\S]*pushColor\(color\)/);
});

test("Rob Run resolves through read-only Steam manifests", () => {
  const steam = readFileSync(new URL("../src-tauri/src/steam.rs", root), "utf8");
  const gameProfiles = readFileSync(new URL("pages/GameProfiles/index.tsx", root), "utf8");
  const config = readFileSync(new URL("../../../packages/game-database/data/sandbox/rob-run.json", root), "utf8");
  const parsed = JSON.parse(config);
  assert.match(steam, /libraryfolders\.vdf/);
  assert.match(steam, /appmanifest_/);
  assert.match(steam, /SteamPath/);
  assert.match(gameProfiles, /"steam_installations"/);
  assert.match(gameProfiles, /steamMatch/);
  assert.match(gameProfiles, /applyColorNow/);
  assert.deepEqual(parsed.launchers, ["steam"]);
  assert.ok(parsed.detection.methods.includes("launcher-library"));
  assert.equal(parsed.detection.requiresManualPath, false);
});

test("smart switch resolves conflicts and replays desktop restore", () => {
  const mod = readFileSync(new URL("../src-tauri/src/smart_switch/mod.rs", root), "utf8");
  const lib = readFileSync(new URL("../src-tauri/src/lib.rs", root), "utf8");
  const commands = readFileSync(new URL("../src-tauri/src/commands/mod.rs", root), "utf8");
  const service = readFileSync(new URL("services/smartSwitch.ts", root), "utf8");
  const bridge = readFileSync(new URL("hooks/useSmartSwitchBridge.tsx", root), "utf8");
  const settings = readFileSync(new URL("pages/Settings/index.tsx", root), "utf8");
  const app = readFileSync(new URL("App.tsx", root), "utf8");

  assert.match(mod, /pub fn resolve_profile/);
  assert.match(mod, /pub fn plan_transition/);
  assert.match(mod, /restore_first/);
  assert.match(mod, /display\.rollback\(None\)/);
  assert.match(mod, /vytrix:\/\/smart-switch/);
  assert.match(mod, /highest_priority_wins/);
  assert.match(mod, /equal_priority_resolves_deterministically_by_id/);
  assert.match(mod, /conflicting_switch_restores_previous_profile_first/);

  assert.match(lib, /pub mod smart_switch;/);
  assert.match(lib, /commands::smart_switch_status/);
  assert.match(lib, /commands::smart_switch_sync_profiles/);
  assert.match(lib, /SmartSwitch::spawn_polling/);
  assert.match(commands, /smart_switch_set_enabled/);
  assert.match(commands, /smart_switch_history/);

  assert.match(service, /"smart_switch_status"/);
  assert.match(service, /"smart_switch_set_enabled"/);
  assert.match(bridge, /vytrix:\/\/smart-switch/);
  assert.match(settings, /setSmartSwitchEnabled/);
  assert.match(settings, /smartSwitchHistory/);
  assert.match(app, /SmartSwitchBridge/);
});

test("customization ships overlay layout, per-game rules, compare, and theme io", () => {
  const native = readFileSync(new URL("../src-tauri/src/overlay/mod.rs", root), "utf8");
  const smartSwitch = readFileSync(new URL("../src-tauri/src/smart_switch/mod.rs", root), "utf8");
  const service = readFileSync(new URL("services/overlay.ts", root), "utf8");
  const overlayApp = readFileSync(new URL("../../overlay/src/App.tsx", root), "utf8");
  const overlayConfig = readFileSync(new URL("../../overlay/src/config.ts", root), "utf8");
  const crosshair = readFileSync(new URL("pages/Crosshair/index.tsx", root), "utf8");
  const presets = readFileSync(new URL("pages/PresetLibrary/index.tsx", root), "utf8");
  const themes = readFileSync(new URL("pages/Themes/index.tsx", root), "utf8");
  const shared = readFileSync(new URL("../../../packages/shared-types/src/index.ts", root), "utf8");

  assert.match(native, /pub fn game_is_visible/);
  assert.match(native, /pub fn apply_game_visibility/);
  assert.match(native, /layout_is_whitelisted_and_game_lists_are_bounded/);
  assert.match(smartSwitch, /apply_game_visibility\(game\.as_deref\(\)\)/);
  assert.match(service, /setOverlayLayout/);
  assert.match(service, /setOverlayGameRules/);
  assert.match(overlayApp, /data-layout/);
  assert.match(overlayApp, /visibleForGame/);
  assert.match(overlayConfig, /OVERLAY_LAYOUTS/);
  assert.match(shared, /export type OverlayLayout/);
  assert.match(shared, /export interface OverlayGameVisibility/);

  // crosshair export/import round trip is wired to the validated preset format
  assert.match(crosshair, /createPreset\(\{ kind: "crosshair"/);
  assert.match(crosshair, /serializePreset\(file\)/);
  assert.match(crosshair, /parseShareCode\(shareInput\.trim\(\)\)/);
  assert.match(crosshair, /file\.kind !== "crosshair"/);
  assert.match(crosshair, /setOverlayGameRules/);

  assert.match(presets, /COMPARE_FIELDS/);
  assert.match(presets, /Preset comparison/);
  assert.match(presets, /className=\{a === b \? "" : "diff"\}/);

  assert.match(themes, /parseThemeFile/);
  assert.match(themes, /\^#\[0-9a-fA-F\]\{6\}\$/);
  assert.match(themes, /vytrix-theme\.json/);
});
