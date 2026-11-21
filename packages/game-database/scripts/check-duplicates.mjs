import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const ids = new Map();
const names = new Map();
const duplicates = [];

for (const file of files) {
  const config = JSON.parse(readFileSync(file, "utf8"));
  const id = String(config.id ?? "");
  const name = String(config.name ?? "").trim().toLowerCase();
  if (ids.has(id)) duplicates.push(`id ${id}: ${ids.get(id)} and ${file}`);
  if (names.has(name)) duplicates.push(`name ${name}: ${names.get(name)} and ${file}`);
  ids.set(id, file);
  names.set(name, file);
}

if (duplicates.length > 0) {
  throw new Error(`duplicate game entries:\n${duplicates.join("\n")}`);
}
console.log(`checked ${files.length} game configurations; no duplicate ids or names`);
