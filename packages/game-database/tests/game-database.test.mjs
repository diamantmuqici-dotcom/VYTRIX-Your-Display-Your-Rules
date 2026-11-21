import assert from "node:assert/strict";
import { test } from "node:test";

import {
  GAME_CONFIGURATIONS,
  GAME_CATEGORIES,
  gameCount,
  getGameConfiguration,
  getGameConfigurationByName,
  allCategories,
  allLaunchers,
  searchGames,
  compatibilitySummary,
  validateGameConfiguration,
  validateGameDatabase,
} from "../dist/index.js";

test("database contains at least 160 schema-valid individual configurations", () => {
  assert.ok(GAME_CONFIGURATIONS.length >= 160);
  assert.equal(gameCount(), GAME_CONFIGURATIONS.length);
  const report = validateGameDatabase(GAME_CONFIGURATIONS);
  assert.equal(report.count, GAME_CONFIGURATIONS.length);
  assert.deepEqual(report.categories, [...GAME_CATEGORIES].sort());
});

test("registry resolves exact names, ids, categories, and launchers", () => {
  const cs2 = getGameConfiguration("counter-strike-2");
  assert.ok(cs2);
  assert.equal(cs2.name, "Counter-Strike 2");
  assert.equal(getGameConfigurationByName("valorant")?.id, "valorant");
  assert.ok(allCategories().includes("horror"));
  assert.ok(allLaunchers().includes("steam"));
});

test("search filters by query, category, launcher, and configuration status", () => {
  const byQuery = searchGames(GAME_CONFIGURATIONS, { query: "counter-strike" });
  assert.ok(byQuery.some((config) => config.id === "counter-strike-2"));

  const byCategory = searchGames(GAME_CONFIGURATIONS, { category: "racing", limit: 500 });
  assert.ok(byCategory.length > 0);
  assert.ok(byCategory.every((config) => config.category === "racing"));

  const byLauncher = searchGames(GAME_CONFIGURATIONS, { launcher: "riot" });
  assert.ok(byLauncher.some((config) => config.id === "league-of-legends"));

  const manual = searchGames(GAME_CONFIGURATIONS, { configurationStatus: "manual", limit: 500 });
  assert.ok(manual.length > 0);
  assert.ok(manual.every((config) => config.detection.requiresManualPath));
});

test("compatibility summaries expose capability state and hard unsupported features", () => {
  const config = getGameConfiguration("valorant");
  assert.ok(config);
  const summary = compatibilitySummary(config);
  assert.equal(summary.detection, config.detection.confidence);
  assert.ok(config.unsupportedFeatures.includes("anti-cheat-bypass"));
  assert.ok(config.unsupportedFeatures.includes("game-file-modification"));
  assert.ok(config.unsupportedFeatures.includes("guaranteed-fps-gain"));
});

test("duplicate ids and names are rejected", () => {
  const base = GAME_CONFIGURATIONS.map((config, index) => ({
    ...structuredClone(config),
    id: `duplicate-test-${index}`,
    name: `Duplicate Test ${index}`,
  }));

  const duplicateId = structuredClone(base);
  duplicateId[1].id = duplicateId[0].id;
  assert.throws(() => validateGameDatabase(duplicateId), /duplicate game id/);

  const duplicateName = structuredClone(base);
  duplicateName[1].name = duplicateName[0].name;
  assert.throws(() => validateGameDatabase(duplicateName), /duplicate game name/);
});

test("invalid configurations are rejected without mutating the source", () => {
  const valid = structuredClone(GAME_CONFIGURATIONS[0]);
  assert.doesNotThrow(() => validateGameConfiguration(valid));

  const badId = structuredClone(valid);
  badId.id = "Bad ID!";
  assert.throws(() => validateGameConfiguration(badId), /lowercase kebab-case id/);

  const fakeFeature = structuredClone(valid);
  fakeFeature.supportedFeatures.push("anti-cheat-bypass");
  assert.throws(() => validateGameConfiguration(fakeFeature), /unsupported feature declared as supported/);

  const fakeDetection = structuredClone(valid);
  fakeDetection.capabilities.automaticDetection = false;
  fakeDetection.detection.confidence = "verified";
  assert.throws(() => validateGameConfiguration(fakeDetection), /non-manual detection requires automaticDetection/);

  const badPath = structuredClone(valid);
  badPath.executableNames = ["C:\\Windows\\System32\\game.exe"];
  assert.throws(() => validateGameConfiguration(badPath), /bare process name/);
});
