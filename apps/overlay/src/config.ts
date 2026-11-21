import type { CrosshairConfig, CrosshairStyle, OverlayConfig } from "./types";

export const CROSSHAIR_STYLES: readonly CrosshairStyle[] = ["dot", "circle", "cross", "dynamic-cross"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function integer(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(clamp(value, min, max, fallback));
}

function safeText(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
  return cleaned.length > 0 ? cleaned : fallback;
}

function safeColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function safeStyle(value: unknown, fallback: CrosshairStyle): CrosshairStyle {
  return typeof value === "string" && CROSSHAIR_STYLES.some((style) => style === value)
    ? (value as CrosshairStyle)
    : fallback;
}

function crosshairFrom(raw: unknown, fallback: CrosshairConfig): CrosshairConfig {
  const source = isRecord(raw) ? raw : {};
  return {
    id: safeText(source.id, 120, fallback.id),
    name: safeText(source.name, 80, fallback.name),
    style: safeStyle(source.style, fallback.style),
    color: safeColor(source.color, fallback.color),
    thickness: integer(source.thickness, 1, 12, fallback.thickness),
    gap: integer(source.gap, 0, 40, fallback.gap),
    length: integer(source.length, 2, 40, fallback.length),
    opacity: clamp(source.opacity, 0.1, 1, fallback.opacity),
    outline: typeof source.outline === "boolean" ? source.outline : fallback.outline,
    centerDot: typeof source.centerDot === "boolean" ? source.centerDot : fallback.centerDot,
    rotation: integer(source.rotation, 0, 360, fallback.rotation),
    scale: clamp(source.scale, 0.5, 3, fallback.scale),
    monitorId: typeof source.monitorId === "string" && source.monitorId.trim().length > 0
      ? safeText(source.monitorId, 120, fallback.monitorId ?? "")
      : null,
    offsetX: integer(source.offsetX, -2000, 2000, fallback.offsetX),
    offsetY: integer(source.offsetY, -2000, 2000, fallback.offsetY),
  };
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  crosshairEnabled: false,
  crosshair: {
    id: "inert-default",
    name: "Default",
    style: "cross",
    color: "#00D9FF",
    thickness: 2,
    gap: 6,
    length: 10,
    opacity: 0.95,
    outline: true,
    centerDot: true,
    rotation: 0,
    scale: 1,
    monitorId: null,
    offsetX: 0,
    offsetY: 0,
  },
  zoom: { enabled: false, level: 1, label: null },
  hotkeyHint: null,
};

export function normalizeOverlayConfig(raw: unknown): OverlayConfig {
  const source = isRecord(raw) ? raw : {};
  const defaults = DEFAULT_OVERLAY_CONFIG;
  const crosshairRaw = isRecord(source.crosshair) ? source.crosshair : source;
  const zoomRaw = isRecord(source.zoom) ? source.zoom : {};
  return {
    crosshairEnabled: typeof source.crosshairEnabled === "boolean"
      ? source.crosshairEnabled
      : defaults.crosshairEnabled,
    crosshair: crosshairFrom(crosshairRaw, defaults.crosshair),
    zoom: {
      enabled: typeof zoomRaw.enabled === "boolean" ? zoomRaw.enabled : defaults.zoom.enabled,
      level: clamp(zoomRaw.level, 1, 8, defaults.zoom.level),
      label: typeof zoomRaw.label === "string" && zoomRaw.label.trim().length > 0
        ? safeText(zoomRaw.label, 40, "")
        : null,
    },
    hotkeyHint: typeof source.hotkeyHint === "string" && source.hotkeyHint.trim().length > 0
      ? safeText(source.hotkeyHint, 80, "")
      : null,
  };
}
