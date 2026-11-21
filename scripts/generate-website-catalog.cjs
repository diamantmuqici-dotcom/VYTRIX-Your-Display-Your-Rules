// Regenerates apps/website/lib/game-catalog.generated.ts from the single
// generated game index. Run from anywhere with:
//   node scripts/generate-website-catalog.cjs
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(
  root,
  "packages/game-database/src/generated/game-index.ts",
);
const out = path.join(root, "apps/website/lib/game-catalog.generated.ts");

let text = fs.readFileSync(src, "utf8");
const eq = text.indexOf("=");
const start = text.indexOf("[", eq);
const end = text.lastIndexOf("]");
if (eq < 0 || start < 0 || end < 0) {
  throw new Error("game-index array not found");
}
const games = JSON.parse(text.slice(start, end + 1));

const CATEGORY_LABELS = {
  shooters: "Competitive shooters",
  survival: "Survival & sandbox",
  sandbox: "Roblox & indie",
  racing: "Racing & simulation",
  rpg: "RPG & open world",
  strategy: "MOBA & strategy",
  horror: "Horror & adventure",
  additional: "More popular titles",
  misc: "Utilities & input tools",
};

// Honest, data-derived copy. No invented screenshots or fake branding.
function blurb(game) {
  const launchers =
    game.launchers && game.launchers.length
      ? game.launchers.join(", ")
      : "manual path";
  const exec =
    game.executableNames && game.executableNames.length
      ? game.executableNames[0]
      : null;
  return [
    `VYTRIX recognises ${game.name} by ${launchers}${
      exec ? ` and the ${exec} executable` : ""
    }.`,
    "When it launches, a saved display and color profile is applied at the Windows display layer, with the original state restored on exit.",
  ].join(" ");
}

const rows = games.map((g) => ({
  id: g.id,
  name: g.name,
  category: g.category,
  categoryLabel: CATEGORY_LABELS[g.category] ?? g.category,
  launchers: g.launchers ?? [],
  executableNames: g.executableNames ?? [],
  detectionConfidence: g.detection?.confidence ?? "manual",
  detectionMethods: g.detection?.methods ?? [],
  verificationStatus: g.verification?.status ?? "unverified",
  verificationSource: g.verification?.source ?? "",
  releaseStatus: g.releaseStatus ?? "unknown",
  capabilities: {
    colorProfiles: Boolean(g.capabilities?.colorProfiles),
    displayProfiles: Boolean(g.capabilities?.displayProfiles),
    performanceMonitoring: Boolean(g.capabilities?.performanceMonitoring),
    restoration: Boolean(g.capabilities?.restoration),
    crosshair: g.capabilities?.crosshair ?? "unknown",
    overlay: g.capabilities?.overlay ?? "unknown",
  },
  supportedFeatures: g.supportedFeatures ?? [],
  unsupportedFeatures: g.unsupportedFeatures ?? [],
  blurb: blurb(g),
}));

const counts = {};
for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
const verified = rows.filter((r) => r.verificationStatus === "verified").length;
const community = rows.filter((r) => r.verificationStatus === "community").length;
const exeHints = rows.filter((r) => r.executableNames.length > 0).length;

const body = `// GENERATED FILE — do not edit by hand.
// Source: packages/game-database/src/generated/game-index.ts
// Regenerate with: node scripts/generate-website-catalog.cjs
export interface GameCatalogEntry {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  launchers: string[];
  executableNames: string[];
  detectionConfidence: "verified" | "partial" | "manual";
  detectionMethods: string[];
  verificationStatus: "verified" | "community" | "unverified";
  verificationSource: string;
  releaseStatus: string;
  capabilities: {
    colorProfiles: boolean;
    displayProfiles: boolean;
    performanceMonitoring: boolean;
    restoration: boolean;
    crosshair: string;
    overlay: string;
  };
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  blurb: string;
}

export const gameCatalog: GameCatalogEntry[] = ${JSON.stringify(rows, null, 2)};

export const gameCatalogStats = {
  total: ${rows.length},
  categories: ${Object.keys(counts).length},
  verified: ${verified},
  community: ${community},
  executableHints: ${exeHints},
  byCategory: ${JSON.stringify(counts)},
} as const;
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body, "utf8");
console.log(
  `wrote ${path.relative(root, out)} — ${rows.length} games, ${
    Object.keys(counts).length
  } categories`,
);
