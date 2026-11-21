import type { GameConfiguration } from "./schema.js";

export interface GameSearchFilters {
  query?: string;
  category?: string;
  launcher?: string;
  detection?: "all" | "verified" | "partial" | "manual";
  configurationStatus?: "all" | "ready" | "manual";
  favoriteIds?: readonly string[];
  limit?: number;
}

function contains(values: readonly string[], needle: string): boolean {
  return values.some((value) => value.toLowerCase().includes(needle));
}

export function searchGames(
  configurations: readonly GameConfiguration[],
  filters: GameSearchFilters = {},
): GameConfiguration[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const favorites = new Set(filters.favoriteIds ?? []);
  const limit = Math.max(0, Math.min(500, filters.limit ?? 500));

  const result = configurations.filter((config) => {
    if (query) {
      const haystack = [
        config.name,
        config.id,
        config.category,
        ...config.launchers,
        ...config.executableNames,
        ...config.processNames,
      ];
      if (!contains(haystack, query)) return false;
    }
    if (filters.category && config.category !== filters.category) return false;
    if (filters.launcher && !config.launchers.includes(filters.launcher)) return false;
    if (filters.detection && filters.detection !== "all" && config.detection.confidence !== filters.detection) return false;
    if (filters.configurationStatus === "ready" && config.detection.requiresManualPath) return false;
    if (filters.configurationStatus === "manual" && !config.detection.requiresManualPath) return false;
    if (filters.favoriteIds && !favorites.has(config.id)) return false;
    return true;
  });

  return result.slice(0, limit);
}
