import type { CrosshairAdvanced, CrosshairDesign, CrosshairShape } from "@vytrix/shared-types";
import { COLOR_PRESETS, SHAPES, defaultAdvanced } from "./model";
import { normalizeDesign } from "./validate";

export type RandomScope = "all" | "shape" | "color" | "size" | "elements";

/** Local PRNG. No Math.random in the deterministic test path. */
function makeRng(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

const pick = <T,>(rng: () => number, values: readonly T[]): T =>
  values[Math.floor(rng() * values.length) % values.length]!;

const between = (rng: () => number, min: number, max: number): number =>
  Math.round(min + rng() * (max - min));

export function randomizeDesign(base: CrosshairDesign, scope: RandomScope, seed = Date.now()): CrosshairDesign {
  const rng = makeRng(seed);
  const color = pick(rng, COLOR_PRESETS).value;
  const shape = pick(rng, SHAPES) as CrosshairShape;
  const thickness = between(rng, 1, 5);
  const length = between(rng, 4, 20);
  const gap = between(rng, 0, 12);
  let advanced: CrosshairAdvanced = {
    ...base.advanced,
    arms: base.advanced.arms.map((arm) => ({ ...arm })),
    dot: { ...base.advanced.dot },
    outline: { ...base.advanced.outline },
    animation: { ...base.advanced.animation },
  };

  if (scope === "all" || scope === "shape") {
    const seeded = defaultAdvanced(color, thickness, length, gap);
    seeded.shape = shape;
    seeded.ring = shape === "circle" || shape === "circle-dot" || shape === "geometric";
    seeded.dot.enabled = shape === "dot" || shape === "circle-dot" || shape === "cross-dot" || shape === "precision" || shape === "geometric";
    seeded.arms = seeded.arms.map((arm) => ({
      ...arm,
      visible: shape === "dot" || shape === "circle" || shape === "circle-dot" ? false
        : shape === "minimal" ? (arm.id === "left" || arm.id === "right")
          : true,
    }));
    advanced = { ...advanced, ...seeded };
  }
  if (scope === "all" || scope === "color") {
    const accent = pick(rng, COLOR_PRESETS).value;
    advanced = {
      ...advanced,
      glowColor: accent,
      dot: { ...advanced.dot, color: accent },
      outline: { ...advanced.outline, color: pick(rng, COLOR_PRESETS).value },
      arms: advanced.arms.map((arm, index) => ({
        ...arm,
        color: index === 1 && rng() > 0.7 ? pick(rng, COLOR_PRESETS).value : accent,
      })),
    };
  }
  if (scope === "all" || scope === "size") {
    advanced = {
      ...advanced,
      centerGap: gap,
      lineSpacing: between(rng, 0, 8),
      arms: advanced.arms.map((arm) => ({
        ...arm,
        length: between(rng, 3, 24),
        thickness: between(rng, 1, 5),
        innerGap: gap,
      })),
      dot: { ...advanced.dot, size: between(rng, 1, 8) },
    };
  }
  if (scope === "elements") {
    advanced = {
      ...advanced,
      shadow: rng() > 0.6,
      glow: rng() > 0.7,
      ring: rng() > 0.65,
      outline: { ...advanced.outline, enabled: rng() > 0.3 },
      dot: { ...advanced.dot, enabled: rng() > 0.4 },
      arms: advanced.arms.map((arm) => ({ ...arm, visible: rng() > 0.15 })),
    };
  }

  const style = advanced.shape === "dot" ? "dot" as const
    : advanced.ring ? "circle" as const
      : advanced.dot.enabled ? "dynamic-cross" as const : "cross" as const;

  return normalizeDesign({
    ...base,
    name: `${base.name} · ${shape}`,
    style,
    color: advanced.arms[0]?.color ?? color,
    thickness: advanced.arms[0]?.thickness ?? thickness,
    length: advanced.arms[0]?.length ?? length,
    gap: advanced.centerGap,
    outline: advanced.outline.enabled,
    centerDot: advanced.dot.enabled,
    advanced,
  });
}
