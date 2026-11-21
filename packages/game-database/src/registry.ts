import { gameConfigurations } from "./generated/game-index.js";
import type { GameConfiguration } from "./schema.js";

export const GAME_CONFIGURATIONS: readonly GameConfiguration[] = gameConfigurations;

const byId = new Map<string, GameConfiguration>();
const byName = new Map<string, GameConfiguration>();

for (const config of GAME_CONFIGURATIONS) {
  byId.set(config.id, config);
  byName.set(config.name.trim().toLowerCase(), config);
}

export function gameCount(): number {
  return GAME_CONFIGURATIONS.length;
}

export function getGameConfiguration(id: string): GameConfiguration | null {
  return byId.get(id) ?? null;
}

export function getGameConfigurationByName(name: string): GameConfiguration | null {
  return byName.get(name.trim().toLowerCase()) ?? null;
}

export function allCategories(): string[] {
  return [...new Set(GAME_CONFIGURATIONS.map((config) => config.category))].sort();
}

export function allLaunchers(): string[] {
  return [...new Set(GAME_CONFIGURATIONS.flatMap((config) => config.launchers))].sort();
}
