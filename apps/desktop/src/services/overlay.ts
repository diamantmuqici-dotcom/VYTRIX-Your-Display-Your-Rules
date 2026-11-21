import type {
  CommandResult, CrosshairConfig, OverlayGameVisibility, OverlayLayout, OverlayView,
} from "@vytrix/shared-types";
import { invokeNative } from "./tauri";

export function getOverlayConfig(): Promise<CommandResult<OverlayView>> {
  return invokeNative<OverlayView>("overlay_config");
}

async function update(mutate: (view: OverlayView) => OverlayView): Promise<CommandResult<OverlayView>> {
  const current = await getOverlayConfig();
  if (!current.ok) return current;
  return invokeNative<OverlayView>("overlay_set", { config: mutate(current.data) });
}

export function setOverlayEnabled(enabled: boolean): Promise<CommandResult<OverlayView>> {
  return update((view) => ({ ...view, crosshairEnabled: enabled }));
}

export function setOverlayCrosshair(crosshair: CrosshairConfig): Promise<CommandResult<OverlayView>> {
  return update((view) => ({ ...view, crosshair }));
}

export function toggleOverlayZoom(): Promise<CommandResult<OverlayView>> {
  return update((view) => ({
    ...view,
    zoom: { ...view.zoom, enabled: !view.zoom.enabled },
  }));
}

const LAYOUTS: readonly OverlayLayout[] = [
  "center", "top-left", "top-right", "bottom-left", "bottom-right",
];

export function setOverlayLayout(layout: OverlayLayout): Promise<CommandResult<OverlayView>> {
  const safe = LAYOUTS.includes(layout) ? layout : "center";
  return update((view) => ({ ...view, layout: safe }));
}

export function setOverlayHotkeyHint(hint: string | null): Promise<CommandResult<OverlayView>> {
  const clean = hint?.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 80) ?? "";
  return update((view) => ({ ...view, hotkeyHint: clean || null }));
}

/** Both lists are bounded by the native sanitizer; cap here as well. */
export function setOverlayGameRules(
  rules: OverlayGameVisibility,
): Promise<CommandResult<OverlayView>> {
  const clean = (list: string[]) => list
    .map((name) => name.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 50);
  return update((view) => ({
    ...view,
    gameVisibility: {
      hiddenForGames: clean(rules.hiddenForGames),
      onlyForGames: clean(rules.onlyForGames),
    },
  }));
}
