import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateGameDatabase } from "../dist/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");

function readConfigurations() {
  const files = readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(dataDir, entry.name))
        .filter((file) => file.endsWith(".json"))
        .map((file) => join(dataDir, entry.name, file)),
    )
    .sort();

  return files.map((file) => {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      throw new Error(`${file}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof data === "string" ? data : `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const configurations = readConfigurations().sort((a, b) => a.name.localeCompare(b.name));
const report = validateGameDatabase(configurations);

write(join(dataDir, "index.json"), configurations);

const generatedIndex = [
  'import type { GameConfiguration } from "../schema.js";',
  "",
  "export const gameConfigurations: readonly GameConfiguration[] = ",
  `${JSON.stringify(configurations, null, 2)};`,
  "",
].join("\n");
write(join(root, "src", "generated", "game-index.ts"), generatedIndex);

const hintPairs = new Map();
for (const config of configurations) {
  for (const hint of [...config.executableNames, ...config.processNames]) {
    const key = hint.toLowerCase();
    if (!hintPairs.has(key)) hintPairs.set(key, config.name);
  }
}
const rustRows = [...hintPairs.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([exe, name]) => `    (${JSON.stringify(exe)}, ${JSON.stringify(name)}),`)
  .join("\n");
const rust = [
  "// Generated from packages/game-database/data by generate-index.mjs.",
  "// Bare process names only. No memory reads, injection, or anti-cheat interaction.",
  "pub static GAME_HINTS: &[(&str, &str)] = &[",
  rustRows,
  "];",
  "",
].join("\n");
write(join(root, "..", "..", "apps", "desktop", "src-tauri", "src", "games", "generated_hints.rs"), rust);

console.log(
  `indexed ${report.count} configurations across ${report.categories.length} categories ` +
    `with ${hintPairs.size} native executable hints`,
);
