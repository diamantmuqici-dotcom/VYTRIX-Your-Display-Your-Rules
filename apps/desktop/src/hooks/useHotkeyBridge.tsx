import { useEffect, useRef } from "react";
import type { ColorSettings, HotkeyAction } from "@vytrix/shared-types";
import { defaultBindingMode, HOTKEY_ACTIONS } from "@/app/bindings";
import { invokeNative, isTauriRuntime } from "@/services/tauri";
import { setOverlayCrosshair, setOverlayEnabled } from "@/services/overlay";
import { toggleZoom } from "@/services/zoom";
import { useApp } from "@/stores/app";

const ACTIONS: readonly HotkeyAction[] = HOTKEY_ACTIONS;

function isAction(value: string): value is HotkeyAction {
  return (ACTIONS as readonly string[]).includes(value);
}

interface HoldEvent {
  action: string;
  pressed: boolean;
}

interface HoldSnapshot {
  action: HotkeyAction;
  color: ColorSettings;
  crosshair: boolean;
}

/** Registers saved bindings on startup and dispatches OS/hold hotkey events. */
export function HotkeyBridge() {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const lastTuned = useRef(app.state.color);
  const profileIndex = useRef(-1);
  const holdSnapshot = useRef<HoldSnapshot | null>(null);
  const holdRegistered = useRef<Set<string>>(new Set());

  const signature = app.state.hotkeys
    .map((binding) => `${binding.action}:${binding.keys.join("+")}:${binding.mode ?? defaultBindingMode(binding.action)}:${binding.enabled}`)
    .join("|");

  // Re-register only when a bind, mode or enabled flag actually changes.
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    const sync = async () => {
      const bindings = appRef.current.state.hotkeys;
      const desiredHold = new Set<string>();
      for (const binding of bindings) {
        if (!binding.enabled) continue;
        const mode = binding.mode ?? defaultBindingMode(binding.action);
        // Zoom hold is polled by the magnification controller itself.
        if (binding.action === "toggle-zoom" && mode === "hold") continue;
        if (mode === "hold") {
          const result = await invokeNative("register_hold_binding", {
            action: binding.action,
            keys: binding.keys,
          });
          if (result.ok) desiredHold.add(binding.action);
        } else {
          await invokeNative("unregister_hold_binding", { action: binding.action });
          await invokeNative("register_hotkey", { action: binding.action, keys: binding.keys });
        }
      }
      for (const action of holdRegistered.current) {
        if (!desiredHold.has(action)) await invokeNative("unregister_hold_binding", { action });
      }
      if (active) holdRegistered.current = desiredHold;
    };
    void sync();
    return () => { active = false; };
  }, [signature]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unToggle = await listen<string>("vytrix://hotkey", (event) => {
        if (active && isAction(event.payload)) dispatch(event.payload);
      });
      const unHold = await listen<HoldEvent>("vytrix://hotkey-hold", (event) => {
        if (!active || !isAction(event.payload.action)) return;
        dispatchHold(event.payload.action, event.payload.pressed);
      });
      if (active) dispose = () => { unToggle(); unHold(); };
      else { unToggle(); unHold(); }
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

  const dispatchHold = (action: HotkeyAction, pressed: boolean) => {
    if (action === "toggle-zoom") return;
    const api = appRef.current;
    const state = api.state;
    if (pressed) {
      holdSnapshot.current = {
        action,
        color: { ...state.color },
        crosshair: state.crosshairEnabled,
      };
      switch (action) {
        case "toggle-color":
          api.setColor({ ...lastTuned.current });
          api.log("Color tuning held active");
          break;
        case "restore-defaults":
          api.setColor({ ...state.baseline });
          api.log("Normal colors held active");
          break;
        case "toggle-crosshair":
        case "toggle-overlay":
          api.setCrosshairEnabled(true);
          void setOverlayEnabled(true);
          api.log(`${action} held active`);
          break;
        case "switch-profile": {
          if (state.profiles.length === 0) break;
          profileIndex.current = (profileIndex.current + 1) % state.profiles.length;
          const next = state.profiles[profileIndex.current]!;
          api.setColor(next.color);
          if (next.applyCrosshair && next.crosshairId) {
            const design = state.crosshairs.find((item) => item.id === next.crosshairId);
            if (design) void setOverlayCrosshair(design);
          }
          api.log(`Profile held: ${next.name}`);
          break;
        }
        default:
          dispatch(action);
          break;
      }
      return;
    }
    const snapshot = holdSnapshot.current;
    if (!snapshot || snapshot.action !== action) return;
    holdSnapshot.current = null;
    api.setColor(snapshot.color);
    api.setCrosshairEnabled(snapshot.crosshair);
    void setOverlayEnabled(snapshot.crosshair);
    api.log(`${action} released`);
  };

  return null;
}
