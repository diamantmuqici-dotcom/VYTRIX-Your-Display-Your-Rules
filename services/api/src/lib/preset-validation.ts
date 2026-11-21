import { sha256Hex } from './crypto.js';

export const MAX_PRESET_BYTES = 262_144;
export const PRESET_KINDS = ['color', 'crosshair', 'game-profile'] as const;
export type PresetKind = (typeof PRESET_KINDS)[number];

const FORBIDDEN_TOKENS = [
  'script', 'code', 'exec', 'execute', 'command', 'cmd', 'eval', 'function',
  'handler', 'callback', 'onload', 'onclick', 'constructor', 'prototype',
  'import', 'require', 'path', 'filepath', 'url', 'endpoint',
] as const;

const MAX_STRING = 8_192;
const MAX_KEY_LENGTH = 128;
const MAX_ARRAY = 256;
const MAX_KEYS = 256;
const MAX_DEPTH = 16;
const MAX_NUMBER = 1e15;

export interface PresetV1 {
  schemaVersion: 1;
  kind: PresetKind;
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

export type ValidationResult =
  | { ok: true; preset: PresetV1; contentHash: string; bytes: number }
  | { ok: false; errors: string[] };

function isForbiddenKey(key: string): boolean {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return true;
  const normalized = key.toLowerCase().replace(/[\s._-]/g, '');
  return FORBIDDEN_TOKENS.some((token) => normalized.includes(token));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function walk(value: unknown, path: string, depth: number, errors: string[]): void {
  if (depth > MAX_DEPTH) {
    errors.push(`${path}: nesting exceeds ${MAX_DEPTH}`);
    return;
  }
  if (value === null) return;

  const type = typeof value;
  if (type === 'string') {
    if ((value as string).length > MAX_STRING) errors.push(`${path}: string exceeds ${MAX_STRING} chars`);
    return;
  }
  if (type === 'number') {
    const num = value as number;
    if (!Number.isFinite(num) || Math.abs(num) > MAX_NUMBER) errors.push(`${path}: invalid number`);
    return;
  }
  if (type === 'boolean') return;

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) errors.push(`${path}: array exceeds ${MAX_ARRAY} items`);
    for (let i = 0; i < value.length; i += 1) walk(value[i], `${path}[${i}]`, depth + 1, errors);
    return;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length > MAX_KEYS) errors.push(`${path}: object exceeds ${MAX_KEYS} keys`);
    for (const key of keys) {
      if (isForbiddenKey(key)) {
        errors.push(`${path}.${key}: forbidden key`);
        continue;
      }
      if (key.length > MAX_KEY_LENGTH) errors.push(`${path}: key exceeds ${MAX_KEY_LENGTH} chars`);
      walk(value[key], `${path}.${key}`, depth + 1, errors);
    }
    return;
  }

  errors.push(`${path}: unsupported value type ${type}`);
}

/** Deterministic serialization: object keys sorted recursively, arrays preserved. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as Record<string, unknown>)[key])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Validate an untrusted community preset. Rejects executable-looking fields at
 * every depth, enforces size/count bounds and computes a canonical content hash.
 */
export function validatePreset(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(input)) return { ok: false, errors: ['preset must be a JSON object'] };

  const allowedTopLevel = new Set(['schemaVersion', 'kind', 'name', 'description', 'payload']);
  for (const key of Object.keys(input)) {
    if (!allowedTopLevel.has(key)) errors.push(`${key}: unknown top-level field`);
  }

  if (input['schemaVersion'] !== 1) errors.push('schemaVersion must equal 1');

  const kind = input['kind'];
  if (typeof kind !== 'string' || !PRESET_KINDS.includes(kind as PresetKind)) {
    errors.push(`kind must be one of ${PRESET_KINDS.join(', ')}`);
  }

  const name = input['name'];
  if (typeof name !== 'string' || name.trim().length < 1 || name.length > 120) {
    errors.push('name must be 1-120 characters');
  }

  const description = input['description'] ?? '';
  if (typeof description !== 'string' || description.length > 2_000) {
    errors.push('description must be at most 2000 characters');
  }

  const payload = input['payload'];
  if (!isPlainObject(payload)) {
    errors.push('payload must be a JSON object');
  } else {
    walk(payload, 'payload', 0, errors);
  }

  if (errors.length > 0 || !isPlainObject(payload) || typeof name !== 'string' ||
      typeof description !== 'string' || typeof kind !== 'string' ||
      !PRESET_KINDS.includes(kind as PresetKind)) {
    return { ok: false, errors };
  }

  const preset: PresetV1 = {
    schemaVersion: 1,
    kind: kind as PresetKind,
    name: name.trim(),
    description,
    payload,
  };

  const bytes = Buffer.byteLength(canonicalize(preset), 'utf8');
  if (bytes > MAX_PRESET_BYTES) {
    return { ok: false, errors: [`preset exceeds ${MAX_PRESET_BYTES} bytes`] };
  }

  return { ok: true, preset, contentHash: sha256Hex(canonicalize(payload)), bytes };
}
