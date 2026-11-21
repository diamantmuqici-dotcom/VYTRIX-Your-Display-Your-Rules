export const GAME_CATEGORIES = [
  "shooters",
  "survival",
  "sandbox",
  "racing",
  "rpg",
  "strategy",
  "horror",
  "additional",
  "misc",
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  shooters: "Competitive shooters",
  survival: "Survival and sandbox",
  sandbox: "Roblox and independent games",
  racing: "Racing and simulation",
  rpg: "RPG and open world",
  strategy: "MOBA, strategy and multiplayer",
  horror: "Horror, adventure and action",
  additional: "Additional popular games",
  misc: "Utilities and input tools",
};

export const CATEGORY_DIRS: Record<GameCategory, string> = {
  shooters: "shooters",
  survival: "survival",
  sandbox: "sandbox",
  racing: "racing",
  rpg: "rpg",
  strategy: "strategy",
  horror: "horror",
  additional: "additional",
  misc: "misc",
};

export function isGameCategory(value: string): value is GameCategory {
  return (GAME_CATEGORIES as readonly string[]).includes(value);
}
