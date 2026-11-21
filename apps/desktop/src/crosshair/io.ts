import type { CrosshairDesign, CrosshairGameProfile } from "@vytrix/shared-types";
import { createPreset, parsePreset, serializePreset, shareCode, parseShareCode } from "@vytrix/preset-format";
import { normalizeDesign } from "./validate";

export const CROSSHAIR_FORMAT = "crosshair-studio" as const;
export const CROSSHAIR_SCHEMA_VERSION = 1 as const;

export interface CrosshairFile {
  format: typeof CROSSHAIR_FORMAT;
  version: typeof CROSSHAIR_SCHEMA_VERSION;
  name: string;
  design: CrosshairDesign;
}

function envelope(design: CrosshairDesign): CrosshairFile {
  return {
    format: CROSSHAIR_FORMAT,
    version: CROSSHAIR_SCHEMA_VERSION,
    name: design.name,
    design,
  };
}

/** Uses the existing hash-verified, behavior-free preset container. */
export function exportDesignText(design: CrosshairDesign): string {
  const preset = createPreset({
    kind: "crosshair",
    name: design.name,
    description: `${CROSSHAIR_FORMAT} v${CROSSHAIR_SCHEMA_VERSION}`,
    author: "VYTRIX",
    payload: envelope(design) as unknown as Record<string, unknown>,
  });
  return serializePreset(preset);
}

export function importDesignText(text: string): CrosshairDesign {
  const preset = parsePreset(text.trim());
  if (preset.kind !== "crosshair") throw new Error("not a crosshair configuration");
  const payload = preset.payload as unknown as Partial<CrosshairFile>;
  if (payload.format !== CROSSHAIR_FORMAT || payload.version !== CROSSHAIR_SCHEMA_VERSION) {
    throw new Error("unsupported crosshair format version");
  }
  return normalizeDesign(payload.design);
}

export function exportDesignCode(design: CrosshairDesign): string {
  const preset = createPreset({
    kind: "crosshair",
    name: design.name,
    description: `${CROSSHAIR_FORMAT} v${CROSSHAIR_SCHEMA_VERSION}`,
    author: "VYTRIX",
    payload: envelope(design) as unknown as Record<string, unknown>,
  });
  return shareCode(preset);
}

export function importDesignCode(code: string): CrosshairDesign {
  const preset = parseShareCode(code.trim());
  if (preset.kind !== "crosshair") throw new Error("not a crosshair design");
  const payload = preset.payload as unknown as Partial<CrosshairFile>;
  if (payload.format !== CROSSHAIR_FORMAT || payload.version !== CROSSHAIR_SCHEMA_VERSION) {
    throw new Error("unsupported crosshair format version");
  }
  return normalizeDesign(payload.design);
}

export function exportCollectionText(name: string, designs: CrosshairDesign[]): string {
  const preset = createPreset({
    kind: "crosshair",
    name,
    description: "crosshair-studio collection v1",
    author: "VYTRIX",
    payload: { format: CROSSHAIR_FORMAT, version: CROSSHAIR_SCHEMA_VERSION, name, designs } as unknown as Record<string, unknown>,
  });
  return serializePreset(preset);
}

export function importCollectionText(text: string): { name: string; designs: CrosshairDesign[] } {
  const preset = parsePreset(text.trim());
  if (preset.kind !== "crosshair") throw new Error("not a crosshair collection");
  const payload = preset.payload as unknown as { name?: unknown; designs?: unknown };
  if (!Array.isArray(payload.designs) || payload.designs.length === 0) throw new Error("collection has no designs");
  if (payload.designs.length > 100) throw new Error("collection too large");
  return {
    name: String(payload.name ?? "Imported collection").slice(0, 80),
    designs: payload.designs.map((item) => normalizeDesign(item)),
  };
}

export function exportProfilesText(profiles: CrosshairGameProfile[]): string {
  const preset = createPreset({
    kind: "game-profile",
    name: "Crosshair game profiles",
    description: "crosshair-studio profiles v1",
    author: "VYTRIX",
    payload: { format: CROSSHAIR_FORMAT, version: CROSSHAIR_SCHEMA_VERSION, profiles } as unknown as Record<string, unknown>,
  });
  return serializePreset(preset);
}

export function importProfilesText(text: string): CrosshairGameProfile[] {
  const preset = parsePreset(text.trim());
  if (preset.kind !== "game-profile") throw new Error("not a game profile file");
  const payload = preset.payload as unknown as { profiles?: unknown };
  if (!Array.isArray(payload.profiles)) throw new Error("profile file has no profiles");
  return payload.profiles.slice(0, 100).map((item) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const gameId = String(source.gameId ?? "").replace(/[^\w-]/g, "").slice(0, 120);
    if (!gameId) throw new Error("profile has no game identifier");
    return {
      id: String(source.id ?? `profile-${Date.now()}`).replace(/[^\w-]/g, "").slice(0, 120),
      gameId,
      gameName: String(source.gameName ?? gameId).slice(0, 120),
      designId: String(source.designId ?? "").replace(/[^\w-]/g, "").slice(0, 120),
      presetId: typeof source.presetId === "string" ? source.presetId.slice(0, 120) : null,
      autoSwitch: source.autoSwitch === true,
      lastUsed: Number.isFinite(source.lastUsed) ? Number(source.lastUsed) : 0,
    };
  });
}
