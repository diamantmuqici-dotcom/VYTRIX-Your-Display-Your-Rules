import { test } from "node:test";
import assert from "node:assert/strict";
import { createPreset, serializePreset, parsePreset, shareCode, parseShareCode } from "../dist/index.js";

test("round trip preserves payload", () => {
  const file = createPreset({ kind: "color", name: "Ultra Vivid", description: "test", author: "vytrix", payload: { saturation: 180, gamma: 110 } });
  const parsed = parsePreset(serializePreset(file));
  assert.equal(parsed.name, "Ultra Vivid");
  assert.deepEqual(parsed.payload, { saturation: 180, gamma: 110 });
});

test("share code round trip", () => {
  const file = createPreset({ kind: "crosshair", name: "Dot", description: "", author: "", payload: { style: "dot", thickness: 2 } });
  assert.deepEqual(parseShareCode(shareCode(file)).payload, file.payload);
});

test("rejects executable fields", () => {
  assert.throws(() => createPreset({ kind: "color", name: "x", description: "", author: "", payload: { script: "alert(1)" } }), /forbidden/);
  assert.throws(() => createPreset({ kind: "color", name: "x", description: "", author: "", payload: { nested: { eval: "1" } } }), /forbidden/);
});

test("rejects tampered hash and unknown schema", () => {
  const file = createPreset({ kind: "color", name: "x", description: "", author: "", payload: { saturation: 120 } });
  const tampered = { ...file, payload: { saturation: 300 } };
  assert.throws(() => parsePreset(JSON.stringify(tampered)), /hash mismatch/);
  assert.throws(() => parsePreset(JSON.stringify({ ...file, schemaVersion: 99 })), /schema/);
});
