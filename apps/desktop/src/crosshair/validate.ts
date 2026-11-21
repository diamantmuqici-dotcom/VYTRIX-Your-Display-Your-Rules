import type {
  CrosshairAdvanced, CrosshairAnimationModel, CrosshairArm, CrosshairArmId,
  CrosshairDesign, CrosshairDotModel, CrosshairOutlineModel, CrosshairShape,
} from "@vytrix/shared-types";
import { finite, isHexColor, safeText } from "@vytrix/validation";
import { ARM_IDS, SHAPES, defaultAdvanced } from "./model";

const FORBIDDEN = new Set([
  "script", "code", "exec", "execute", "command", "cmd", "eval", "function",
  "handler", "callback", "onload", "onclick", "constructor", "prototype",
  "__proto__", "import", "require", "path", "filepath", "url", "endpoint",
  "webhook", "token", "secret", "password", "dll", "process", "registry",
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function assertBehaviorFree(value: unknown, depth = 0): void {
  if (depth > 10) throw new Error("configuration nesting too deep");
  if (Array.isArray(value)) {
    if (value.length > 128) throw new Error("configuration array too large");
    for (const item of value) assertBehaviorFree(item, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN.has(key.toLowerCase())) throw new Error(`rejected field: ${key}`);
    assertBehaviorFree(child, depth + 1);
  }
}

function color(value: unknown, fallback: string): string {
  return isHexColor(value) ? (value as string).toUpperCase() : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(Math.min(max, Math.max(min, finite(value, fallback))) * 100) / 100;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.some((item) => item === value) ? value as T : fallback;
}

function armFrom(raw: unknown, id: CrosshairArmId, fallback: CrosshairArm, colorFallback: string): CrosshairArm {
  const source = record(raw);
  return {
    id,
    visible: bool(source.visible, fallback.visible),
    length: num(source.length, 0, 60, fallback.length),
    thickness: num(source.thickness, 1, 12, fallback.thickness),
    innerGap: num(source.innerGap, 0, 40, fallback.innerGap),
    outerGap: num(source.outerGap, 0, 60, fallback.outerGap),
    offset: num(source.offset, -40, 40, fallback.offset),
    rotation: num(source.rotation, -180, 180, fallback.rotation),
    color: color(source.color, colorFallback),
  };
}

function dotFrom(raw: unknown, fallback: CrosshairDotModel, colorFallback: string): CrosshairDotModel {
  const source = record(raw);
  return {
    enabled: bool(source.enabled, fallback.enabled),
    size: num(source.size, 1, 24, fallback.size),
    shape: oneOf(source.shape, ["circle", "square", "diamond"] as const, fallback.shape),
    color: color(source.color, colorFallback),
    opacity: num(source.opacity, 0.05, 1, fallback.opacity),
    outline: bool(source.outline, fallback.outline),
    outlineThickness: num(source.outlineThickness, 0, 6, fallback.outlineThickness),
    glow: bool(source.glow, fallback.glow),
  };
}

function outlineFrom(raw: unknown, fallback: CrosshairOutlineModel): CrosshairOutlineModel {
  const source = record(raw);
  return {
    enabled: bool(source.enabled, fallback.enabled),
    thickness: num(source.thickness, 0, 8, fallback.thickness),
    color: color(source.color, fallback.color),
    opacity: num(source.opacity, 0.05, 1, fallback.opacity),
    style: oneOf(source.style, ["solid", "dashed"] as const, fallback.style),
  };
}

function animationFrom(raw: unknown, fallback: CrosshairAnimationModel): CrosshairAnimationModel {
  const source = record(raw);
  return {
    enabled: bool(source.enabled, fallback.enabled),
    kind: oneOf(source.kind, ["fade", "pulse", "color", "scale", "rotate", "appear"] as const, fallback.kind),
    durationMs: num(source.durationMs, 100, 10000, fallback.durationMs),
    speed: num(source.speed, 0.1, 4, fallback.speed),
    intensity: num(source.intensity, 0, 100, fallback.intensity),
    easing: oneOf(source.easing, ["linear", "ease", "ease-in-out"] as const, fallback.easing),
    colorTo: color(source.colorTo, fallback.colorTo),
  };
}

/** Validates untrusted imported advanced data and clamps every numeric field. */
export function normalizeAdvanced(raw: unknown, fallback: CrosshairAdvanced, colorFallback: string): CrosshairAdvanced {
  assertBehaviorFree(raw);
  const source = record(raw);
  const armsRaw = Array.isArray(source.arms) ? source.arms.slice(0, 4) : [];
  const arms = ARM_IDS.map((id, index) => armFrom(
    armsRaw.find((item) => record(item).id === id) ?? armsRaw[index] ?? {},
    id,
    fallback.arms.find((arm) => arm.id === id) ?? fallback.arms[0]!,
    colorFallback,
  ));
  return {
    shape: oneOf<CrosshairShape>(source.shape, SHAPES, fallback.shape),
    arms,
    dot: dotFrom(source.dot, fallback.dot, colorFallback),
    outline: outlineFrom(source.outline, fallback.outline),
    animation: animationFrom(source.animation, fallback.animation),
    lineSpacing: num(source.lineSpacing, 0, 40, fallback.lineSpacing),
    centerGap: num(source.centerGap, 0, 40, fallback.centerGap),
    ring: bool(source.ring, fallback.ring),
    shadow: bool(source.shadow, fallback.shadow),
    glow: bool(source.glow, fallback.glow),
    glowColor: color(source.glowColor, colorFallback),
    renderQuality: oneOf(source.renderQuality, ["crisp", "balanced", "smooth"] as const, fallback.renderQuality),
  };
}

/** Fully bounded, behavior-free design normalization used on load and import. */
export function normalizeDesign(raw: unknown, fallback = {} as Partial<CrosshairDesign>): CrosshairDesign {
  assertBehaviorFree(raw);
  const source = record(raw);
  const base = { ...defaultAdvanced("#00D9FF", 2, 6, 5), ...(fallback.advanced ?? {}) };
  const baseColor = isHexColor(source.color) ? source.color as string : isHexColor(fallback.color) ? fallback.color as string : "#00D9FF";
  const thickness = num(source.thickness, 1, 12, num(fallback.thickness, 1, 12, 2));
  const length = num(source.length, 0, 60, num(fallback.length, 0, 60, 10));
  const gap = num(source.gap, 0, 40, num(fallback.gap, 0, 40, 6));
  const derived = defaultAdvanced(baseColor, thickness, length, gap);
  const advanced = raw && typeof raw === "object" && "advanced" in source
    ? normalizeAdvanced(source.advanced, { ...derived, ...base }, baseColor)
    : { ...derived, ...base };

  const style = oneOf(source.style, ["dot", "circle", "cross", "dynamic-cross"] as const,
    oneOf(fallback.style, ["dot", "circle", "cross", "dynamic-cross"] as const, "cross"));

  return {
    id: safeText(source.id, 120) || safeText(fallback.id, 120) || `design-${Date.now()}`,
    name: safeText(source.name, 80) || safeText(fallback.name, 80) || "Custom crosshair",
    style,
    color: baseColor,
    thickness,
    gap,
    length,
    opacity: num(source.opacity, 0.05, 1, num(fallback.opacity, 0.05, 1, 0.95)),
    outline: bool(source.outline, advanced.outline.enabled),
    centerDot: bool(source.centerDot, advanced.dot.enabled),
    rotation: num(source.rotation, 0, 360, num(fallback.rotation, 0, 360, 0)),
    scale: num(source.scale, 0.5, 3, num(fallback.scale, 0.5, 3, 1)),
    monitorId: typeof source.monitorId === "string" && source.monitorId.trim()
      ? safeText(source.monitorId, 120) : null,
    offsetX: num(source.offsetX, -2000, 2000, num(fallback.offsetX, -2000, 2000, 0)),
    offsetY: num(source.offsetY, -2000, 2000, num(fallback.offsetY, -2000, 2000, 0)),
    advanced,
  };
}

/** Keeps legacy global controls and the advanced element model in sync. */
export function syncLegacy(design: CrosshairDesign): CrosshairDesign {
  const advanced = design.advanced;
  return {
    ...design,
    color: advanced.arms[0]?.color ?? design.color,
    thickness: Math.max(...advanced.arms.filter((arm) => arm.visible).map((arm) => arm.thickness), 1),
    gap: advanced.centerGap,
    length: Math.max(...advanced.arms.filter((arm) => arm.visible).map((arm) => arm.length), 1),
    opacity: design.opacity,
    outline: advanced.outline.enabled,
    centerDot: advanced.dot.enabled,
    advanced,
  };
}

export function cloneDesign(design: CrosshairDesign, id: string, name: string): CrosshairDesign {
  return normalizeDesign({
    ...design,
    id,
    name,
    advanced: {
      ...design.advanced,
      arms: design.advanced.arms.map((arm) => ({ ...arm })),
      dot: { ...design.advanced.dot },
      outline: { ...design.advanced.outline },
      animation: { ...design.advanced.animation },
    },
  });
}

export function shapePreset(shape: CrosshairShape, color: string, thickness: number, length: number, gap: number): CrosshairAdvanced {
  const base = defaultAdvanced(color, thickness, length, gap);
  base.shape = shape;
  switch (shape) {
    case "plus":
      base.arms = base.arms.map((arm) => ({ ...arm, innerGap: 0 }));
      base.dot.enabled = false;
      break;
    case "small":
      base.arms = base.arms.map((arm) => ({ ...arm, length: Math.max(2, Math.round(length * 0.55)) }));
      break;
    case "large":
      base.arms = base.arms.map((arm) => ({ ...arm, length: Math.min(60, Math.round(length * 1.7)) }));
      break;
    case "dot":
      base.arms = base.arms.map((arm) => ({ ...arm, visible: false }));
      base.dot.enabled = true;
      base.dot.size = Math.max(2, Math.round(thickness * 1.5));
      break;
    case "circle":
    case "circle-dot":
      base.arms = base.arms.map((arm) => ({ ...arm, visible: false }));
      base.dot.enabled = shape === "circle-dot";
      base.ring = true;
      break;
    case "cross-dot":
      base.dot.enabled = true;
      break;
    case "four-lines":
      base.lineSpacing = Math.min(40, Math.round(gap / 2));
      break;
    case "static":
      base.animation.enabled = false;
      break;
    case "minimal":
      base.arms = base.arms.map((arm) => ({ ...arm, visible: arm.id === "left" || arm.id === "right" }));
      base.dot.enabled = false;
      break;
    case "precision":
      base.arms = base.arms.map((arm) => ({ ...arm, thickness: Math.max(1, thickness - 1), length: Math.min(60, length + 4) }));
      base.dot.enabled = true;
      base.dot.size = Math.max(1, Math.round(thickness / 2));
      break;
    case "geometric":
      base.glow = true;
      base.dot.enabled = true;
      break;
    case "custom":
    case "classic":
    default:
      break;
  }
  return base;
}
