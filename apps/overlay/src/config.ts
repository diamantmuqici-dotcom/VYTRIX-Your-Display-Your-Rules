import type {
  CrosshairAdvancedView, CrosshairAnimationKind, CrosshairAnimationView, CrosshairArmId,
  CrosshairArmView, CrosshairConfig, CrosshairDotView, CrosshairOutlineView,
  CrosshairShape, CrosshairStyle, OverlayConfig, OverlayGameVisibility, OverlayLayout,
} from "./types";

export const CROSSHAIR_STYLES: readonly CrosshairStyle[] = ["dot", "circle", "cross", "dynamic-cross"];
export const OVERLAY_LAYOUTS: readonly OverlayLayout[] = [
  "center", "top-left", "top-right", "bottom-left", "bottom-right",
];

const SHAPES: readonly CrosshairShape[] = [
  "classic", "plus", "small", "large", "dot", "circle", "circle-dot",
  "cross-dot", "four-lines", "static", "minimal", "precision", "geometric", "custom",
];
const ARM_IDS: readonly CrosshairArmId[] = ["top", "bottom", "left", "right"];
const DOT_SHAPES: readonly CrosshairDotView["shape"][] = ["circle", "square", "diamond"];
const OUTLINE_STYLES: readonly CrosshairOutlineView["style"][] = ["solid", "dashed"];
const ANIMATION_KINDS: readonly CrosshairAnimationKind[] = [
  "fade", "pulse", "color", "scale", "rotate", "appear",
];
const EASINGS: readonly CrosshairAnimationView["easing"][] = ["linear", "ease", "ease-in-out"];
const RENDER_QUALITIES: readonly CrosshairAdvancedView["renderQuality"][] = ["crisp", "balanced", "smooth"];

type CrosshairBase = Omit<CrosshairConfig, "advanced">;

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

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.some((item) => item === value) ? value as T : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function defaultArm(id: CrosshairArmId, base: CrosshairBase): CrosshairArmView {
  return {
    id,
    visible: base.style === "cross" || base.style === "dynamic-cross",
    length: base.length,
    thickness: base.thickness,
    innerGap: base.gap,
    outerGap: 0,
    offset: 0,
    rotation: 0,
    color: base.color,
  };
}

function defaultAdvanced(base: CrosshairBase): CrosshairAdvancedView {
  return {
    shape: base.style === "dot" ? "dot" : base.style === "circle" ? "circle" : "classic",
    arms: ARM_IDS.map((id) => defaultArm(id, base)),
    dot: {
      enabled: base.centerDot || base.style === "dot",
      size: Math.max(2, base.thickness),
      shape: "circle",
      color: base.color,
      opacity: 1,
      outline: base.outline,
      outlineThickness: 1,
      glow: false,
    },
    outline: {
      enabled: base.outline,
      thickness: 1,
      color: "#05070C",
      opacity: 0.9,
      style: "solid",
    },
    animation: {
      enabled: false,
      kind: "pulse",
      durationMs: 1200,
      speed: 1,
      intensity: 25,
      easing: "ease-in-out",
      colorTo: "#FFFFFF",
    },
    lineSpacing: 0,
    centerGap: base.gap,
    ring: base.style === "circle",
    shadow: false,
    glow: false,
    glowColor: base.color,
    renderQuality: "crisp",
  };
}

function advancedFrom(raw: unknown, base: CrosshairBase): CrosshairAdvancedView {
  const fallback = defaultAdvanced(base);
  const source = isRecord(raw) ? raw : {};
  const rawArms = Array.isArray(source.arms) ? source.arms.slice(0, 4) : [];
  const arms = ARM_IDS.map((id, index) => {
    const fallbackArm = defaultArm(id, base);
    const item = isRecord(rawArms[index]) ? rawArms[index] : null;
    if (!item) return fallbackArm;
    return {
      id,
      visible: bool(item.visible, fallbackArm.visible),
      length: integer(item.length, 0, 60, fallbackArm.length),
      thickness: integer(item.thickness, 1, 12, fallbackArm.thickness),
      innerGap: integer(item.innerGap, 0, 40, fallbackArm.innerGap),
      outerGap: integer(item.outerGap, 0, 60, fallbackArm.outerGap),
      offset: integer(item.offset, -40, 40, fallbackArm.offset),
      rotation: integer(item.rotation, -180, 180, fallbackArm.rotation),
      color: safeColor(item.color, fallbackArm.color),
    };
  });

  const dotRaw = isRecord(source.dot) ? source.dot : {};
  const outlineRaw = isRecord(source.outline) ? source.outline : {};
  const animationRaw = isRecord(source.animation) ? source.animation : {};

  return {
    shape: choice(source.shape, SHAPES, fallback.shape),
    arms,
    dot: {
      enabled: bool(dotRaw.enabled, fallback.dot.enabled),
      size: integer(dotRaw.size, 1, 24, fallback.dot.size),
      shape: choice(dotRaw.shape, DOT_SHAPES, fallback.dot.shape),
      color: safeColor(dotRaw.color, fallback.dot.color),
      opacity: clamp(dotRaw.opacity, 0.05, 1, fallback.dot.opacity),
      outline: bool(dotRaw.outline, fallback.dot.outline),
      outlineThickness: integer(dotRaw.outlineThickness, 0, 6, fallback.dot.outlineThickness),
      glow: bool(dotRaw.glow, fallback.dot.glow),
    },
    outline: {
      enabled: bool(outlineRaw.enabled, fallback.outline.enabled),
      thickness: integer(outlineRaw.thickness, 0, 8, fallback.outline.thickness),
      color: safeColor(outlineRaw.color, fallback.outline.color),
      opacity: clamp(outlineRaw.opacity, 0.05, 1, fallback.outline.opacity),
      style: choice(outlineRaw.style, OUTLINE_STYLES, fallback.outline.style),
    },
    animation: {
      enabled: bool(animationRaw.enabled, fallback.animation.enabled),
      kind: choice(animationRaw.kind, ANIMATION_KINDS, fallback.animation.kind),
      durationMs: integer(animationRaw.durationMs, 100, 10000, fallback.animation.durationMs),
      speed: clamp(animationRaw.speed, 0.1, 4, fallback.animation.speed),
      intensity: clamp(animationRaw.intensity, 0, 100, fallback.animation.intensity),
      easing: choice(animationRaw.easing, EASINGS, fallback.animation.easing),
      colorTo: safeColor(animationRaw.colorTo, fallback.animation.colorTo),
    },
    lineSpacing: integer(source.lineSpacing, 0, 40, fallback.lineSpacing),
    centerGap: integer(source.centerGap, 0, 40, fallback.centerGap),
    ring: bool(source.ring, fallback.ring),
    shadow: bool(source.shadow, fallback.shadow),
    glow: bool(source.glow, fallback.glow),
    glowColor: safeColor(source.glowColor, fallback.glowColor),
    renderQuality: choice(source.renderQuality, RENDER_QUALITIES, fallback.renderQuality),
  };
}

function crosshairFrom(raw: unknown, fallback: CrosshairConfig): CrosshairConfig {
  const source = isRecord(raw) ? raw : {};
  const base: CrosshairBase = {
    id: safeText(source.id, 120, fallback.id),
    name: safeText(source.name, 80, fallback.name),
    style: choice(source.style, CROSSHAIR_STYLES, fallback.style),
    color: safeColor(source.color, fallback.color),
    thickness: integer(source.thickness, 1, 12, fallback.thickness),
    gap: integer(source.gap, 0, 40, fallback.gap),
    length: integer(source.length, 2, 40, fallback.length),
    opacity: clamp(source.opacity, 0.1, 1, fallback.opacity),
    outline: bool(source.outline, fallback.outline),
    centerDot: bool(source.centerDot, fallback.centerDot),
    rotation: integer(source.rotation, 0, 360, fallback.rotation),
    scale: clamp(source.scale, 0.5, 3, fallback.scale),
    monitorId: typeof source.monitorId === "string" && source.monitorId.trim().length > 0
      ? safeText(source.monitorId, 120, fallback.monitorId ?? "")
      : null,
    offsetX: integer(source.offsetX, -2000, 2000, fallback.offsetX),
    offsetY: integer(source.offsetY, -2000, 2000, fallback.offsetY),
  };
  return { ...base, advanced: advancedFrom(source.advanced, base) };
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  crosshairEnabled: false,
  crosshair: crosshairFrom({}, {
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
    advanced: defaultAdvanced({
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
    }),
  }),
  zoom: { enabled: false, level: 1, label: null },
  hotkeyHint: null,
  layout: "center",
  gameVisibility: { hiddenForGames: [], onlyForGames: [] },
  visibleForGame: true,
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
    layout: OVERLAY_LAYOUTS.some((item) => item === source.layout)
      ? (source.layout as OverlayLayout)
      : defaults.layout,
    gameVisibility: gameVisibilityFrom(source.gameVisibility, defaults.gameVisibility),
    visibleForGame: typeof source.visibleForGame === "boolean"
      ? source.visibleForGame
      : defaults.visibleForGame,
  };
}

function gameVisibilityFrom(raw: unknown, fallback: OverlayGameVisibility): OverlayGameVisibility {
  const source = isRecord(raw) ? raw : {};
  const clean = (value: unknown) => Array.isArray(value)
    ? value.slice(0, 50).map((item) => safeText(item, 120, "")).filter(Boolean)
    : [];
  const only = clean(source.onlyForGames);
  return {
    hiddenForGames: clean(source.hiddenForGames),
    onlyForGames: only.length > 0 ? only : clean(fallback.onlyForGames),
  };
}
