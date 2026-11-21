import type { PresetFile } from "@vytrix/shared-types";
import { isPlainObject, parseJsonBounded, safeText } from "@vytrix/validation";

export const SCHEMA_VERSION = 1 as const;
export const MAX_PRESET_BYTES = 262144;
export const MAX_DEPTH = 12;

// Fields that could carry behavior are rejected at every depth.
const FORBIDDEN_KEYS = new Set([
  "script", "code", "exec", "execute", "command", "cmd", "eval", "function",
  "handler", "callback", "onload", "onclick", "constructor", "prototype",
  "__proto__", "import", "require", "path", "filepath", "url", "endpoint",
  "webhook", "token", "secret", "password", "dll", "process", "registry",
]);

function hashPart(text: string, seed: number): string {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function contentHash(value: unknown): string {
  const canonical = canonicalize(value);
  return hashPart(canonical, 0x811c9dc5) + hashPart(canonical, 0x9e3779b9);
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",")}}`;
  }
  return "null";
}

function sanitizeNode(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) throw new Error("preset nesting too deep");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, 4096);
  if (Array.isArray(value)) {
    if (value.length > 512) throw new Error("preset array too large");
    return value.map((item) => sanitizeNode(item, depth + 1));
  }
  if (!isPlainObject(value)) throw new Error("unsupported preset value");
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).slice(0, 128)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lower)) throw new Error(`forbidden preset field: ${key}`);
    output[key] = sanitizeNode(value[key], depth + 1);
  }
  return output;
}

export interface CreatePresetInput {
  kind: PresetFile["kind"];
  name: string;
  description: string;
  author: string;
  payload: Record<string, unknown>;
}

export function createPreset(input: CreatePresetInput): PresetFile {
  if (!["color", "crosshair", "game-profile"].includes(input.kind)) throw new Error("invalid preset kind");
  const file: Omit<PresetFile, "contentHash"> = {
    schemaVersion: SCHEMA_VERSION,
    kind: input.kind,
    name: safeText(input.name, 80) || "Untitled",
    description: safeText(input.description, 300),
    author: safeText(input.author, 80) || "local",
    createdAt: new Date().toISOString(),
    payload: sanitizeNode(input.payload, 0) as Record<string, unknown>,
  };
  return { ...file, contentHash: contentHash(file) };
}

export function serializePreset(file: PresetFile): string {
  return JSON.stringify(file, null, 2);
}

export function parsePreset(text: string): PresetFile {
  const raw = parseJsonBounded<unknown>(text, MAX_PRESET_BYTES);
  if (!isPlainObject(raw)) throw new Error("preset must be an object");
  if (raw["schemaVersion"] !== SCHEMA_VERSION) throw new Error("unsupported preset schema version");
  if (!["color", "crosshair", "game-profile"].includes(String(raw["kind"]))) throw new Error("invalid preset kind");
  if (!isPlainObject(raw["payload"])) throw new Error("preset payload must be an object");

  const candidate: PresetFile = {
    schemaVersion: SCHEMA_VERSION,
    kind: raw["kind"] as PresetFile["kind"],
    name: safeText(raw["name"], 80),
    description: safeText(raw["description"], 300),
    author: safeText(raw["author"], 80),
    createdAt: safeText(raw["createdAt"], 40),
    payload: sanitizeNode(raw["payload"], 0) as Record<string, unknown>,
    contentHash: safeText(raw["contentHash"], 64),
  };

  const expected = contentHash({
    schemaVersion: candidate.schemaVersion,
    kind: candidate.kind,
    name: candidate.name,
    description: candidate.description,
    author: candidate.author,
    createdAt: candidate.createdAt,
    payload: candidate.payload,
  });
  if (expected !== candidate.contentHash) throw new Error("preset hash mismatch");
  return candidate;
}

export function shareCode(file: PresetFile): string {
  const json = serializePreset(file);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `VYTRIX1.${btoa(binary)}`;
}

export function parseShareCode(code: string): PresetFile {
  if (!code.startsWith("VYTRIX1.")) throw new Error("invalid share code");
  const binary = atob(code.slice(8));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (bytes.byteLength > MAX_PRESET_BYTES) throw new Error("share code too large");
  return parsePreset(new TextDecoder().decode(bytes));
}
