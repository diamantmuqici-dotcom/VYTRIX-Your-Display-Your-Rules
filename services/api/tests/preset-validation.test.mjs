import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize, validatePreset } from '../src/lib/preset-validation.ts';

const valid = () => ({
  schemaVersion: 1,
  kind: 'crosshair',
  name: 'Clean Dot',
  description: 'Inert crosshair preset.',
  payload: { center: { size: 4, color: '#00e5ff', outline: true }, gaps: [3, 3, 3, 3] },
});

test('accepts a bounded inert preset and computes a sha256 content hash', () => {
  const result = validatePreset(valid());
  assert.equal(result.ok, true);
  assert.match(result.contentHash, /^[0-9a-f]{64}$/);
  assert.ok(result.bytes > 0 && result.bytes <= 262_144);
  assert.equal(result.preset.schemaVersion, 1);
});

test('rejects a wrong schema version or kind', () => {
  assert.equal(validatePreset({ ...valid(), schemaVersion: 2 }).ok, false);
  assert.equal(validatePreset({ ...valid(), kind: 'script' }).ok, false);
});

test('rejects executable-looking keys at any depth', () => {
  const nested = valid();
  nested.payload.center.onclick = 'alert(1)';
  const result = validatePreset(nested);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('onclick')));
});

test('normalizes separators when checking forbidden keys', () => {
  const input = valid();
  input.payload.on_load = true;
  const result = validatePreset(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('on_load')));
});

test('rejects prototype pollution keys', () => {
  const input = valid();
  input.payload.__proto__ = { polluted: true };
  assert.equal(validatePreset(input).ok, false);
});

test('rejects payloads above the 262144 byte limit', () => {
  const input = valid();
  input.payload = {};
  const chunk = 'a'.repeat(7_000);
  for (let i = 0; i < 40; i += 1) input.payload[`k${String(i).padStart(3, '0')}`] = chunk;
  const result = validatePreset(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('262144')));
});

test('canonical hash is independent of key order', () => {
  const a = { x: 1, y: { b: 2, a: 3 } };
  const b = { y: { a: 3, b: 2 }, x: 1 };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(validatePreset({ ...valid(), payload: a }).contentHash,
               validatePreset({ ...valid(), payload: b }).contentHash);
});
