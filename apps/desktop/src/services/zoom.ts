import type { CommandResult, ZoomMode, ZoomStatus } from "@vytrix/shared-types";
import { invokeNative } from "./tauri";

export const ZOOM_LEVEL_MIN = 1;
export const ZOOM_LEVEL_MAX = 8;

export function normalizeZoomMode(value: string): ZoomMode {
  return value === "toggle" ? "toggle" : "hold";
}

export function normalizeZoomLevel(value: number): number {
  if (!Number.isFinite(value)) return 2;
  return Math.min(ZOOM_LEVEL_MAX, Math.max(ZOOM_LEVEL_MIN, Math.round(value * 4) / 4));
}

function cleanKeys(keys: readonly string[]): string[] {
  return keys
    .map((key) => key.trim().toUpperCase().slice(0, 24))
    .filter(Boolean)
    .slice(0, 4);
}

export function getZoomStatus(): Promise<CommandResult<ZoomStatus>> {
  return invokeNative<ZoomStatus>("zoom_status");
}

export function configureZoom(
  mode: ZoomMode,
  keys: readonly string[],
  level: number,
): Promise<CommandResult<ZoomStatus>> {
  return invokeNative<ZoomStatus>("zoom_configure", {
    mode: normalizeZoomMode(mode),
    keys: cleanKeys(keys),
    level: normalizeZoomLevel(level),
  });
}

export function toggleZoom(): Promise<CommandResult<ZoomStatus>> {
  return invokeNative<ZoomStatus>("zoom_toggle");
}

export function releaseZoom(): Promise<CommandResult<ZoomStatus>> {
  return invokeNative<ZoomStatus>("zoom_release");
}
