import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateGameDatabase } from "../dist/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");

const files = readdirSync(dataDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) =>
    readdirSync(join(dataDir, entry.name))
      .filter((file) => file.endsWith(".json"))
      .map((file) => join(dataDir, entry.name, file)),
  )
  .sort();

const configurations = files.map((file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const report = validateGameDatabase(configurations);
const index = JSON.parse(readFileSync(join(dataDir, "index.json"), "utf8"));
const indexedIds = new Set(index.map((config) => config.id));
const fileIds = new Set(configurations.map((config) => config.id));

if (index.length !== configurations.length) {
  throw new Error(`index has ${index.length} entries but ${configurations.length} files exist`);
}
for (const id of indexedIds) {
  if (!fileIds.has(id)) throw new Error(`index references missing configuration ${id}`);
}
for (const id of fileIds) {
  if (!indexedIds.has(id)) throw new Error(`configuration ${id} is missing from index`);
}

console.log(
  `validated ${report.count} game configurations ` +
    `(verified=${report.verified}, manual=${report.manual}, categories=${report.categories.length}, launchers=${report.launchers.length})`,
);
