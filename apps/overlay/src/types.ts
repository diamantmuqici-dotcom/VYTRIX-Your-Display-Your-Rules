// Local mirror of the VYTRIX crosshair contract. Kept standalone so the
// overlay webview has no dependency on the desktop bundle.

export type CrosshairStyle = "dot" | "circle" | "cross" | "dynamic-cross";

export type CrosshairArmId = "top" | "bottom" | "left" | "right";

export type CrosshairShape =
  | "classic" | "plus" | "small" | "large" | "dot" | "circle" | "circle-dot"
  | "cross-dot" | "four-lines" | "static" | "minimal" | "precision"
  | "geometric" | "custom";

export interface CrosshairArmView {
  id: CrosshairArmId;
  visible: boolean;
  length: number;
  thickness: number;
  innerGap: number;
  outerGap: number;
  offset: number;
  rotation: number;
  color: string;
}

export interface CrosshairDotView {
  enabled: boolean;
  size: number;
  shape: "circle" | "square" | "diamond";
  color: string;
  opacity: number;
  outline: boolean;
  outlineThickness: number;
  glow: boolean;
}

export interface CrosshairOutlineView {
  enabled: boolean;
  thickness: number;
  color: string;
  opacity: number;
  style: "solid" | "dashed";
}

export type CrosshairAnimationKind = "fade" | "pulse" | "color" | "scale" | "rotate" | "appear";

export interface CrosshairAnimationView {
  enabled: boolean;
  kind: CrosshairAnimationKind;
  durationMs: number;
  speed: number;
  intensity: number;
  easing: "linear" | "ease" | "ease-in-out";
  colorTo: string;
}

export interface CrosshairAdvancedView {
  shape: CrosshairShape;
  arms: CrosshairArmView[];
  dot: CrosshairDotView;
  outline: CrosshairOutlineView;
  animation: CrosshairAnimationView;
  lineSpacing: number;
  centerGap: number;
  ring: boolean;
  shadow: boolean;
  glow: boolean;
  glowColor: string;
  renderQuality: "crisp" | "balanced" | "smooth";
}

export interface CrosshairConfig {
  id: string;
  name: string;
  style: CrosshairStyle;
  color: string;
  thickness: number;
  gap: number;
  length: number;
  opacity: number;
  outline: boolean;
  centerDot: boolean;
  rotation: number;
  scale: number;
  monitorId: string | null;
  offsetX: number;
  offsetY: number;
  advanced: CrosshairAdvancedView;
}

export interface ZoomIndicatorConfig {
  enabled: boolean;
  level: number;
  label: string | null;
}

export type OverlayLayout = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface OverlayGameVisibility {
  hiddenForGames: string[];
  onlyForGames: string[];
}

export interface OverlayConfig {
  crosshairEnabled: boolean;
  crosshair: CrosshairConfig;
  zoom: ZoomIndicatorConfig;
  hotkeyHint: string | null;
  layout: OverlayLayout;
  gameVisibility: OverlayGameVisibility;
  visibleForGame: boolean;
}
