import { GAME_CATEGORIES } from "./categories.js";
import { FEATURE_TOKENS, HARD_UNSUPPORTED_FEATURES } from "./capabilities.js";
import { LAUNCHERS } from "./launchers.js";
import {
  GAME_DATABASE_SCHEMA_VERSION,
  GAME_PROFILE_SCHEMA_VERSION,
  type GameConfiguration,
} from "./schema.js";

const DETECTION_METHODS = new Set([
  "executable",
  "process",
  "window-title",
  "launcher-library",
  "launcher-registry",
  "store-package",
  "manual-path",
]);

const RULE_TYPES = new Set([
  "executable",
  "process",
  "window-title",
  "launcher-library",
  "launcher-registry",
  "store-package",
  "manual-path",
]);

const INSTALLATION_METHODS = new Set([
  "launcher-library",
  "launcher-registry",
  "store-package",
  "manual-path",
]);

const SUPPORT_LEVELS = new Set(["supported", "restricted", "unknown"]);
const VERIFICATION_STATUSES = new Set(["verified", "community", "unverified"]);
const RELEASE_STATUSES = new Set(["released", "unreleased", "discontinued", "unknown"]);
const FEATURE_SET = new Set<string>(FEATURE_TOKENS);
const PROCESS_NAME = /^[a-z0-9][a-z0-9._+ -]{0,118}$/i;
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_ASSET = /^[a-z0-9][a-z0-9/_.-]{0,158}$/i;

export interface GameDatabaseReport {
  count: number;
  categories: string[];
  launchers: string[];
  verified: number;
  manual: number;
}

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "expected object");
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string, max = 240, min = 1): string {
  if (typeof value !== "string") fail(path, "expected string");
  if (value.length < min || value.length > max) fail(path, `length must be ${min}-${max}`);
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path, "expected boolean");
  return value;
}

function stringArray(value: unknown, path: string, max: number, validator?: (item: string, itemPath: string) => void): string[] {
  if (!Array.isArray(value)) fail(path, "expected array");
  if (value.length > max) fail(path, `max ${max} entries`);
  return value.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const text = string(item, itemPath, 240);
    validator?.(text, itemPath);
    return text;
  });
}

function assertProcessName(value: string, path: string): void {
  if (!PROCESS_NAME.test(value) || value.includes("\\") || value.includes("/")) {
    fail(path, "expected a bare process name without path separators");
  }
}

function supportLevel(value: unknown, path: string): string {
  const text = string(value, path, 20);
  if (!SUPPORT_LEVELS.has(text)) fail(path, "unsupported support level");
  return text;
}

function isoDateOrNull(value: unknown, path: string): string | null {
  if (value === null) return null;
  const text = string(value, path, 40);
  if (Number.isNaN(Date.parse(text))) fail(path, "expected ISO date or null");
  return text;
}

function expectedSupportedFeatures(config: {
  capabilities: GameConfiguration["capabilities"];
}): Set<string> {
  const result = new Set<string>();
  if (config.capabilities.automaticDetection) result.add("detection");
  if (config.capabilities.colorProfiles) result.add("color-profiles");
  if (config.capabilities.displayProfiles) result.add("display-profiles");
  if (config.capabilities.crosshair === "supported") result.add("crosshair");
  if (config.capabilities.overlay === "supported") result.add("overlay");
  if (config.capabilities.performanceMonitoring) result.add("monitoring");
  if (config.capabilities.restoration) result.add("restoration");
  return result;
}

export function validateGameConfiguration(input: unknown, basePath = "game"): GameConfiguration {
  const raw = object(input, basePath);

  const id = string(raw["id"], "game.id", 100);
  if (!SAFE_ID.test(id)) fail("game.id", "expected lowercase kebab-case id");

  const name = string(raw["name"], "game.name", 120);
  const category = string(raw["category"], "game.category", 40);
  if (!(GAME_CATEGORIES as readonly string[]).includes(category)) fail("game.category", "invalid category");

  const launchers = stringArray(raw["launchers"], "game.launchers", 4);
  if (launchers.length === 0) fail("game.launchers", "at least one launcher is required");
  if (new Set(launchers).size !== launchers.length) fail("game.launchers", "duplicate launcher");
  for (const launcher of launchers) {
    if (!(LAUNCHERS as readonly string[]).includes(launcher)) fail("game.launchers", `unknown launcher ${launcher}`);
  }

  const executableNames = stringArray(raw["executableNames"], "game.executableNames", 32, assertProcessName)
    .map((item) => item.toLowerCase());
  const processNames = stringArray(raw["processNames"], "game.processNames", 32, assertProcessName)
    .map((item) => item.toLowerCase());

  const rawDetection = object(raw["detection"], "game.detection");
  const methods = stringArray(rawDetection["methods"], "game.detection.methods", 8);
  for (const method of methods) {
    if (!DETECTION_METHODS.has(method)) fail("game.detection.methods", `unknown method ${method}`);
  }
  const confidence = string(rawDetection["confidence"], "game.detection.confidence", 20);
  if (!new Set(["verified", "partial", "manual"]).has(confidence)) fail("game.detection.confidence", "invalid confidence");
  const requiresManualPath = boolean(rawDetection["requiresManualPath"], "game.detection.requiresManualPath");
  const rawRules = rawDetection["rules"];
  if (!Array.isArray(rawRules) || rawRules.length > 32) fail("game.detection.rules", "expected array with max 32 rules");
  const rules = rawRules.map((entry, index) => {
    const rule = object(entry, `game.detection.rules[${index}]`);
    const type = string(rule["type"], `game.detection.rules[${index}].type`, 40);
    if (!RULE_TYPES.has(type)) fail(`game.detection.rules[${index}].type`, "unknown rule type");
    const value = string(rule["value"], `game.detection.rules[${index}].value`, 160);
    return { type: type as GameConfiguration["detection"]["rules"][number]["type"], value };
  });

  const hints = [...executableNames, ...processNames];
  if (confidence !== "manual" && hints.length === 0) fail("game.detection.confidence", "automatic or partial confidence requires a process hint");
  if (confidence === "manual" && !requiresManualPath) fail("game.detection.requiresManualPath", "manual confidence requires manual path");

  const installationDetection = string(raw["installationDetection"], "game.installationDetection", 40);
  if (!INSTALLATION_METHODS.has(installationDetection)) fail("game.installationDetection", "unknown method");

  const icon = string(raw["icon"], "game.icon", 160);
  if (!SAFE_ASSET.test(icon)) fail("game.icon", "expected a safe relative asset path");

  const rawDefaults = object(raw["defaults"], "game.defaults");
  const defaults: GameConfiguration["defaults"] = {
    colorProfileId: string(rawDefaults["colorProfileId"], "game.defaults.colorProfileId", 80),
    displayProfileId: string(rawDefaults["displayProfileId"], "game.defaults.displayProfileId", 80),
    resolutionProfileId: string(rawDefaults["resolutionProfileId"], "game.defaults.resolutionProfileId", 80),
    refreshRateProfileId: string(rawDefaults["refreshRateProfileId"], "game.defaults.refreshRateProfileId", 80),
    restorationMode: string(rawDefaults["restorationMode"], "game.defaults.restorationMode", 80),
    crosshairEnabled: boolean(rawDefaults["crosshairEnabled"], "game.defaults.crosshairEnabled"),
    overlayEnabled: boolean(rawDefaults["overlayEnabled"], "game.defaults.overlayEnabled"),
    monitoringEnabled: boolean(rawDefaults["monitoringEnabled"], "game.defaults.monitoringEnabled"),
  };

  const rawCapabilities = object(raw["capabilities"], "game.capabilities");
  const capabilities: GameConfiguration["capabilities"] = {
    automaticDetection: boolean(rawCapabilities["automaticDetection"], "game.capabilities.automaticDetection"),
    colorProfiles: boolean(rawCapabilities["colorProfiles"], "game.capabilities.colorProfiles"),
    displayProfiles: boolean(rawCapabilities["displayProfiles"], "game.capabilities.displayProfiles"),
    crosshair: supportLevel(rawCapabilities["crosshair"], "game.capabilities.crosshair") as GameConfiguration["capabilities"]["crosshair"],
    overlay: supportLevel(rawCapabilities["overlay"], "game.capabilities.overlay") as GameConfiguration["capabilities"]["overlay"],
    performanceMonitoring: boolean(rawCapabilities["performanceMonitoring"], "game.capabilities.performanceMonitoring"),
    restoration: boolean(rawCapabilities["restoration"], "game.capabilities.restoration"),
  };

  if (!capabilities.automaticDetection && confidence !== "manual") {
    fail("game.capabilities.automaticDetection", "non-manual detection requires automaticDetection");
  }
  if (capabilities.crosshair !== "supported" && defaults.crosshairEnabled) {
    fail("game.defaults.crosshairEnabled", "crosshair cannot default on for a restricted capability");
  }
  if (capabilities.overlay !== "supported" && defaults.overlayEnabled) {
    fail("game.defaults.overlayEnabled", "overlay cannot default on for a restricted capability");
  }
  if (!capabilities.performanceMonitoring && defaults.monitoringEnabled) {
    fail("game.defaults.monitoringEnabled", "monitoring cannot default on for an unsupported capability");
  }

  const compatibilityNotes = stringArray(raw["compatibilityNotes"], "game.compatibilityNotes", 20);
  const supportedFeatures = stringArray(raw["supportedFeatures"], "game.supportedFeatures", 12);
  const unsupportedFeatures = stringArray(raw["unsupportedFeatures"], "game.unsupportedFeatures", 12);
  for (const feature of [...supportedFeatures, ...unsupportedFeatures]) {
    if (!FEATURE_SET.has(feature)) fail("game.features", `unknown feature token ${feature}`);
  }
  if (new Set(supportedFeatures).size !== supportedFeatures.length) fail("game.supportedFeatures", "duplicate feature");
  if (new Set(unsupportedFeatures).size !== unsupportedFeatures.length) fail("game.unsupportedFeatures", "duplicate feature");

  const allowed = expectedSupportedFeatures({ capabilities });
  for (const feature of supportedFeatures) {
    if (!allowed.has(feature)) fail("game.supportedFeatures", `unsupported feature declared as supported: ${feature}`);
  }
  for (const feature of unsupportedFeatures) {
    if (allowed.has(feature)) fail("game.unsupportedFeatures", `supported feature declared unsupported: ${feature}`);
  }
  for (const feature of HARD_UNSUPPORTED_FEATURES) {
    if (!unsupportedFeatures.includes(feature)) fail("game.unsupportedFeatures", `missing hard unsupported feature ${feature}`);
  }

  const rawVerification = object(raw["verification"], "game.verification");
  const status = string(rawVerification["status"], "game.verification.status", 20);
  if (!VERIFICATION_STATUSES.has(status)) fail("game.verification.status", "invalid verification status");
  const verification: GameConfiguration["verification"] = {
    status: status as GameConfiguration["verification"]["status"],
    source: string(rawVerification["source"], "game.verification.source", 200),
    lastVerifiedAt: isoDateOrNull(rawVerification["lastVerifiedAt"], "game.verification.lastVerifiedAt"),
  };

  const releaseStatus = string(raw["releaseStatus"], "game.releaseStatus", 20);
  if (!RELEASE_STATUSES.has(releaseStatus)) fail("game.releaseStatus", "invalid release status");

  if (raw["schemaVersion"] !== GAME_DATABASE_SCHEMA_VERSION) {
    fail("game.schemaVersion", `expected ${GAME_DATABASE_SCHEMA_VERSION}`);
  }
  if (raw["profileSchemaVersion"] !== GAME_PROFILE_SCHEMA_VERSION) {
    fail("game.profileSchemaVersion", `expected ${GAME_PROFILE_SCHEMA_VERSION}`);
  }

  return {
    id,
    name,
    category,
    launchers,
    executableNames,
    processNames,
    detection: { methods, requiresManualPath, confidence: confidence as GameConfiguration["detection"]["confidence"], rules },
    installationDetection,
    icon,
    defaults,
    capabilities,
    compatibilityNotes,
    supportedFeatures,
    unsupportedFeatures,
    configurationSource: string(raw["configurationSource"], "game.configurationSource", 200),
    releaseStatus: releaseStatus as GameConfiguration["releaseStatus"],
    verification,
    schemaVersion: GAME_DATABASE_SCHEMA_VERSION,
    profileSchemaVersion: GAME_PROFILE_SCHEMA_VERSION,
  };
}

export function validateGameDatabase(input: readonly unknown[]): GameDatabaseReport {
  if (input.length < 160) fail("database", `expected at least 160 entries, received ${input.length}`);

  const configs = input.map((entry, index) => validateGameConfiguration(entry, `database[${index}]`));
  const ids = new Set<string>();
  const names = new Set<string>();
  const categories = new Set<string>();
  const launchers = new Set<string>();
  let verified = 0;
  let manual = 0;

  for (const config of configs) {
    if (ids.has(config.id)) fail("database", `duplicate game id ${config.id}`);
    const normalizedName = config.name.trim().toLowerCase();
    if (names.has(normalizedName)) fail("database", `duplicate game name ${config.name}`);
    ids.add(config.id);
    names.add(normalizedName);
    categories.add(config.category);
    for (const launcher of config.launchers) launchers.add(launcher);
    if (config.detection.confidence === "verified") verified += 1;
    if (config.detection.confidence === "manual") manual += 1;
  }

  for (const category of GAME_CATEGORIES) {
    if (!categories.has(category)) fail("database", `missing category ${category}`);
  }

  return {
    count: configs.length,
    categories: [...categories].sort(),
    launchers: [...launchers].sort(),
    verified,
    manual,
  };
}
