import type { CommandResult, CrosshairConfig, OverlayView } from "@vytrix/shared-types";
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
