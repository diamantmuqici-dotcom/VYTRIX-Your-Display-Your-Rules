import { useEffect, useRef } from "react";
import type { HotkeyAction } from "@vytrix/shared-types";
import { invokeNative, isTauriRuntime } from "@/services/tauri";
import { setOverlayCrosshair, setOverlayEnabled } from "@/services/overlay";
import { toggleZoom } from "@/services/zoom";
import { useApp } from "@/stores/app";

const ACTIONS: readonly HotkeyAction[] = [
  "toggle-color", "next-preset", "previous-preset", "open-color-studio",
  "toggle-crosshair", "toggle-zoom", "switch-profile", "restore-defaults",
  "next-crosshair", "previous-crosshair", "toggle-overlay", "open-crosshair-studio", "save-crosshair",
];

function isAction(value: string): value is HotkeyAction {
  return ACTIONS.includes(value as HotkeyAction);
}

/** Registers saved hotkeys on startup and dispatches OS hotkey events. */
export function HotkeyBridge() {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const registered = useRef(false);
  const lastTuned = useRef(app.state.color);
  const profileIndex = useRef(-1);

  useEffect(() => {
    if (!isTauriRuntime() || registered.current) return;
    registered.current = true;
    for (const binding of appRef.current.state.hotkeys.filter((item) => item.enabled)) {
      void invokeNative("register_hotkey", { action: binding.action, keys: binding.keys });
    }
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<string>("vytrix://hotkey", (event) => {
        if (active && isAction(event.payload)) dispatch(event.payload);
      });
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, []);

  const dispatch = (action: HotkeyAction) => {
    const api = appRef.current;
    const state = api.state;
    switch (action) {
      case "toggle-color": {
        const isBaseline = JSON.stringify(state.color) === JSON.stringify(state.baseline);
        if (isBaseline) {
          api.setColor(lastTuned.current);
          api.log("Color tuning restored by hotkey");
        } else {
          lastTuned.current = state.color;
          api.setColor({ ...state.baseline });
          api.log("Color tuning disabled by hotkey");
        }
        break;
      }
      case "next-preset":
      case "previous-preset": {
        if (state.presets.length === 0) break;
        const index = state.presets.findIndex((preset) => JSON.stringify(preset.settings) === JSON.stringify(state.color));
        const delta = action === "next-preset" ? 1 : -1;
        const next = state.presets[(index + delta + state.presets.length) % state.presets.length]!;
        api.applyPreset(next);
        api.log(`Preset applied by hotkey: ${next.name}`);
        break;
      }
      case "open-color-studio":
        api.setSection("color-studio");
        break;
      case "toggle-crosshair":
        api.log("Crosshair toggled by hotkey");
        break;
      case "toggle-zoom":
        if (state.settings.zoomMode === "toggle") {
          void toggleZoom().then((result) => {
            if (!result.ok) api.log(`Zoom toggle failed: ${result.error.message}`);
          });
          api.log("Zoom toggled by hotkey");
        } else {
          api.log("Zoom hold bind is driven natively while held");
        }
        break;
      case "switch-profile": {
        if (state.profiles.length === 0) { api.setSection("game-profiles"); break; }
        profileIndex.current = (profileIndex.current + 1) % state.profiles.length;
        const next = state.profiles[profileIndex.current]!;
        api.setColor(next.color);
        if (next.applyCrosshair && next.crosshairId) {
          const design = state.crosshairs.find((item) => item.id === next.crosshairId);
          if (design) void setOverlayCrosshair(design);
        }
        api.setSection("game-profiles");
        api.log(`Profile applied by hotkey: ${next.name}`);
        break;
      }
      case "restore-defaults":
        api.setColor({ ...state.baseline });
        api.log("Defaults restored by hotkey");
        break;
      case "next-crosshair":
      case "previous-crosshair": {
        const designs = state.crosshairs;
        if (designs.length === 0) break;
        const current = designs.findIndex((item) => item.id === state.crosshairRecent[0]?.id);
        const index = current < 0 ? 0 : (current + (action === "next-crosshair" ? 1 : -1) + designs.length) % designs.length;
        const next = designs[index]!;
        api.markCrosshairUsed(next.id);
        void setOverlayCrosshair(next);
        api.log(`Crosshair applied by hotkey: ${next.name}`);
        break;
      }
      case "toggle-overlay": {
        const next = !state.crosshairEnabled;
        api.setCrosshairEnabled(next);
        void setOverlayEnabled(next);
        api.log(next ? "Overlay enabled by hotkey" : "Overlay disabled by hotkey");
        break;
      }
      case "open-crosshair-studio":
        api.setSection("crosshair");
        break;
      case "save-crosshair": {
        const target = state.crosshairs.find((item) => item.id === state.crosshairRecent[0]?.id)
          ?? state.crosshairs.find((item) => item.id === state.crosshairStudio.defaultDesignId)
          ?? state.crosshairs[0];
        if (!target) break;
        api.setCrosshairDesign(target);
        api.markCrosshairUsed(target.id);
        void setOverlayCrosshair(target);
        api.log(`Crosshair saved by hotkey: ${target.name}`);
        break;
      }
    }
  };

  return null;
}
