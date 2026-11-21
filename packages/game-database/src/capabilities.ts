export const FEATURE_TOKENS = [
  "detection",
  "color-profiles",
  "display-profiles",
  "crosshair",
  "overlay",
  "monitoring",
  "restoration",
  "game-file-modification",
  "anti-cheat-bypass",
  "guaranteed-fps-gain",
] as const;

export type FeatureToken = (typeof FEATURE_TOKENS)[number];

export const HARD_UNSUPPORTED_FEATURES: readonly FeatureToken[] = [
  "game-file-modification",
  "anti-cheat-bypass",
  "guaranteed-fps-gain",
];

export function isFeatureToken(value: string): value is FeatureToken {
  return (FEATURE_TOKENS as readonly string[]).includes(value);
}
