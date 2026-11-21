// Mirrors CrosshairConfig from packages/shared-types. Kept local so the
// overlay webview has no dependency on the desktop bundle.

export type CrosshairStyle = "dot" | "circle" | "cross" | "dynamic-cross";

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
}

export interface ZoomIndicatorConfig {
  enabled: boolean;
  level: number;
  label: string | null;
}

export interface OverlayConfig {
  crosshairEnabled: boolean;
  crosshair: CrosshairConfig;
  zoom: ZoomIndicatorConfig;
  hotkeyHint: string | null;
}
