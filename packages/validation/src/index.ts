import type { ColorSettings, DisplayMode } from "@vytrix/shared-types";

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const COLOR_RANGES: Record<keyof ColorSettings, readonly [number, number, number]> = {
  saturation: [0, 300, 100],
  vibrance: [0, 300, 100],
  gamma: [50, 250, 100],
  brightness: [0, 200, 100],
  contrast: [0, 200, 100],
  hue: [0, 360, 0],
  red: [0, 200, 100],
  green: [0, 200, 100],
  blue: [0, 200, 100],
  temperatureK: [1000, 12000, 6500],
};

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
  saturation: 100,
  vibrance: 100,
  gamma: 100,
  brightness: 100,
  contrast: 100,
  hue: 0,
  red: 100,
  green: 100,
  blue: 100,
  temperatureK: 6500,
};

export function clampColorSettings(input: Partial<ColorSettings>): ColorSettings {
  const result: ColorSettings = { ...DEFAULT_COLOR_SETTINGS };
  for (const key of Object.keys(COLOR_RANGES) as (keyof ColorSettings)[]) {
    const [min, max, fallback] = COLOR_RANGES[key];
    const raw = input[key];
    if (key === "temperatureK") {
      result.temperatureK = raw === null ? null : clamp(finite(raw, fallback), min, max);
    } else {
      (result[key] as number) = clamp(finite(raw, fallback), min, max);
    }
  }
  return result;
}

export function clampDisplayMode(input: Partial<DisplayMode>): DisplayMode {
  return {
    width: Math.round(clamp(finite(input.width, 1920), 640, 7680)),
    height: Math.round(clamp(finite(input.height, 1080), 480, 4320)),
    refreshRate: Math.round(clamp(finite(input.refreshRate, 60), 24, 480)),
    scaling: Math.round(clamp(finite(input.scaling, 100), 50, 200)),
    hdrEnabled: input.hdrEnabled === true,
  };
}

export function safeText(value: unknown, maxLength = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, maxLength).trim();
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function parseJsonBounded<T>(text: string, maxBytes = 262144): T {
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("payload too large");
  const value: unknown = JSON.parse(text);
  return value as T;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
