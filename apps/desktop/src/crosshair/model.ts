import type {
  CrosshairAdvanced, CrosshairAnimationModel, CrosshairArm, CrosshairArmId,
  CrosshairDesign, CrosshairDotModel, CrosshairOutlineModel, CrosshairShape,
  CrosshairStudioSettings, CrosshairStyle,
} from "@vytrix/shared-types";

export const ARM_IDS: readonly CrosshairArmId[] = ["top", "bottom", "left", "right"];

export const SHAPES: readonly CrosshairShape[] = [
  "classic", "plus", "small", "large", "dot", "circle", "circle-dot",
  "cross-dot", "four-lines", "static", "minimal", "precision", "geometric", "custom",
];

export const SHAPE_DETAIL: Record<CrosshairShape, string> = {
  classic: "Four balanced arms with a center gap",
  plus: "Continuous arms crossing at the center",
  small: "Short arms for precision aiming",
  large: "Long high-visibility arms",
  dot: "Center dot only",
  circle: "Outer ring only",
  "circle-dot": "Outer ring with a center dot",
  "cross-dot": "Four arms with a center dot",
  "four-lines": "Independently adjustable arms",
  static: "Fixed arms with no dynamic ring",
  minimal: "Two short opposite arms",
  precision: "Thin long arms with a fine dot",
  geometric: "Arms plus a diamond guide",
  custom: "Fully manual element combination",
};

export const COLOR_PRESETS: ReadonlyArray<{ name: string; value: string }> = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF3B3B" },
  { name: "Green", value: "#4ADE80" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Cyan", value: "#00D9FF" },
  { name: "Yellow", value: "#FDE047" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#F472B6" },
  { name: "Orange", value: "#FB923C" },
];

export const PRESET_CATEGORIES: readonly string[] = [
  "Minimal", "Competitive", "Precision", "Classic", "Dot Crosshairs",
  "Circle Crosshairs", "Colorful", "Large", "Small", "Creative", "Community", "Custom",
];

export const DEFAULT_STUDIO_SETTINGS: CrosshairStudioSettings = {
  defaultDesignId: "default-dot",
  previewBackground: "dark",
  renderQuality: "crisp",
  overlayStartEnabled: false,
  animationEnabled: false,
  autoGameSwitch: true,
  showHotkeyHint: false,
};

export function defaultArms(color: string, thickness: number, length: number, gap: number): CrosshairArm[] {
  return ARM_IDS.map((id) => ({
    id,
    visible: true,
    length,
    thickness,
    innerGap: gap,
    outerGap: 0,
    offset: 0,
    rotation: 0,
    color,
  }));
}

export function defaultDot(color: string): CrosshairDotModel {
  return {
    enabled: true, size: 2, shape: "circle", color,
    opacity: 1, outline: false, outlineThickness: 1, glow: false,
  };
}

export function defaultOutline(): CrosshairOutlineModel {
  return { enabled: true, thickness: 1, color: "#05070C", opacity: 0.9, style: "solid" };
}

export function defaultAnimation(): CrosshairAnimationModel {
  return {
    enabled: false, kind: "pulse", durationMs: 1200, speed: 1,
    intensity: 25, easing: "ease-in-out", colorTo: "#FFFFFF",
  };
}

export function defaultAdvanced(color: string, thickness: number, length: number, gap: number): CrosshairAdvanced {
  return {
    shape: "classic",
    arms: defaultArms(color, thickness, length, gap),
    dot: defaultDot(color),
    outline: defaultOutline(),
    animation: defaultAnimation(),
    lineSpacing: 0,
    centerGap: gap,
    ring: false,
    shadow: false,
    glow: false,
    glowColor: color,
    renderQuality: "crisp",
  };
}

export const DEFAULT_DESIGN: CrosshairDesign = {
  id: "default-dot",
  name: "Precision Dot",
  style: "dot",
  color: "#00D9FF",
  thickness: 2,
  gap: 0,
  length: 4,
  opacity: 0.9,
  outline: true,
  centerDot: true,
  rotation: 0,
  scale: 1,
  monitorId: null,
  offsetX: 0,
  offsetY: 0,
  advanced: defaultAdvanced("#00D9FF", 2, 4, 0),
};

/** Legacy style values are retained because the native overlay still uses them. */
export function legacyStyleFor(shape: CrosshairShape): CrosshairStyle {
  if (shape === "dot") return "dot";
  if (shape === "circle" || shape === "circle-dot" || shape === "geometric") return "circle";
  if (shape === "cross-dot") return "dynamic-cross";
  return "cross";
}

interface SeedInput {
  id: string;
  name: string;
  category: string;
  description: string;
  shape: CrosshairShape;
  color: string;
  thickness: number;
  length: number;
  gap: number;
  opacity: number;
  centerDot: boolean;
}

const SEEDS: SeedInput[] = [
  { id: "seed-minimal-cyan", name: "Clean Line", category: "Minimal", description: "Two short cyan ticks, no clutter.", shape: "minimal", color: "#00D9FF", thickness: 2, length: 7, gap: 5, opacity: 0.95, centerDot: false },
  { id: "seed-competitive-red", name: "Hot Target", category: "Competitive", description: "High-contrast red arms for fast target acquisition.", shape: "classic", color: "#FF3B3B", thickness: 2, length: 11, gap: 6, opacity: 1, centerDot: false },
  { id: "seed-precision-green", name: "Fine Point", category: "Precision", description: "Long thin arms with a fine green dot.", shape: "precision", color: "#4ADE80", thickness: 1, length: 14, gap: 7, opacity: 0.95, centerDot: true },
  { id: "seed-classic-white", name: "Standard White", category: "Classic", description: "Neutral four-arm crosshair.", shape: "classic", color: "#FFFFFF", thickness: 2, length: 10, gap: 5, opacity: 0.9, centerDot: false },
  { id: "seed-dot-magenta", name: "Single Pixel", category: "Dot Crosshairs", description: "Minimal magenta center dot.", shape: "dot", color: "#F472B6", thickness: 3, length: 3, gap: 0, opacity: 1, centerDot: true },
  { id: "seed-circle-amber", name: "Ring Sight", category: "Circle Crosshairs", description: "Amber ring with a centered point.", shape: "circle-dot", color: "#FDE047", thickness: 2, length: 12, gap: 0, opacity: 0.9, centerDot: true },
  { id: "seed-colorful-purple", name: "Violet Split", category: "Colorful", description: "Alternating arm colors, original palette.", shape: "four-lines", color: "#A855F7", thickness: 3, length: 12, gap: 8, opacity: 1, centerDot: false },
  { id: "seed-large-cyan", name: "Wide Frame", category: "Large", description: "Long cyan arms for low-resolution displays.", shape: "large", color: "#00D9FF", thickness: 3, length: 20, gap: 12, opacity: 0.85, centerDot: false },
  { id: "seed-small-white", name: "Tight Group", category: "Small", description: "Compact white arms for close-range play.", shape: "small", color: "#FFFFFF", thickness: 2, length: 5, gap: 3, opacity: 1, centerDot: true },
  { id: "seed-creative-orange", name: "Solar", category: "Creative", description: "Geometric guide with warm orange arms.", shape: "geometric", color: "#FB923C", thickness: 2, length: 13, gap: 9, opacity: 0.95, centerDot: true },
  { id: "seed-community-blue", name: "Blueprint", category: "Community", description: "Community-style cross with distinct outline.", shape: "cross-dot", color: "#3B82F6", thickness: 3, length: 12, gap: 6, opacity: 1, centerDot: true },
  { id: "seed-custom-pink", name: "Pink Frame", category: "Custom", description: "Fully separated arms with a ring guide.", shape: "custom", color: "#F472B6", thickness: 2, length: 15, gap: 10, opacity: 0.9, centerDot: false },
];

export interface CrosshairPreset extends CrosshairDesign {
  category: string;
  description: string;
  favorite: boolean;
  builtIn: boolean;
}

export const BUILTIN_CROSSHAIR_PRESETS: CrosshairPreset[] = SEEDS.map((seed) => {
  const advanced = defaultAdvanced(seed.color, seed.thickness, seed.length, seed.gap);
  advanced.shape = seed.shape;
  advanced.dot.enabled = seed.centerDot;
  advanced.outline.enabled = seed.shape !== "minimal" && seed.shape !== "dot";
  if (seed.shape === "minimal") {
    advanced.arms = advanced.arms.map((arm) => ({ ...arm, visible: arm.id === "left" || arm.id === "right" }));
  }
  if (seed.shape === "geometric") {
    advanced.glow = true;
    advanced.glowColor = seed.color;
  }
  if (seed.shape === "four-lines") {
    advanced.arms = advanced.arms.map((arm, index) => ({
      ...arm,
      color: index % 2 === 0 ? seed.color : "#A855F7",
    }));
  }
  return {
    id: seed.id,
    name: seed.name,
    style: legacyStyleFor(seed.shape),
    color: seed.color,
    thickness: seed.thickness,
    gap: seed.gap,
    length: seed.length,
    opacity: seed.opacity,
    outline: advanced.outline.enabled,
    centerDot: seed.centerDot,
    rotation: 0,
    scale: 1,
    monitorId: null,
    offsetX: 0,
    offsetY: 0,
    advanced,
    category: seed.category,
    description: seed.description,
    favorite: false,
    builtIn: true,
  };
});

export const PRESET_COLLECTIONS: ReadonlyArray<{ id: string; name: string; designIds: string[]; createdAt: number }> = [
  { id: "collection-competitive", name: "Competitive", designIds: ["seed-competitive-red", "seed-precision-green", "seed-minimal-cyan"], createdAt: 0 },
  { id: "collection-minimal", name: "Minimal", designIds: ["seed-minimal-cyan", "seed-dot-magenta", "seed-small-white"], createdAt: 0 },
  { id: "collection-creative", name: "Creative", designIds: ["seed-creative-orange", "seed-colorful-purple", "seed-community-blue"], createdAt: 0 },
];
