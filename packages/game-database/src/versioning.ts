import { GAME_DATABASE_SCHEMA_VERSION, GAME_PROFILE_SCHEMA_VERSION } from "./schema.js";

export function isCurrentGameSchema(version: unknown): boolean {
  return version === GAME_DATABASE_SCHEMA_VERSION;
}

export function isCurrentProfileSchema(version: unknown): boolean {
  return version === GAME_PROFILE_SCHEMA_VERSION;
}

export function assertCurrentGameSchema(version: unknown): void {
  if (!isCurrentGameSchema(version)) {
    throw new Error(`unsupported game schema version: ${String(version)}`);
  }
}

export function assertCurrentProfileSchema(version: unknown): void {
  if (!isCurrentProfileSchema(version)) {
    throw new Error(`unsupported profile schema version: ${String(version)}`);
  }
}
