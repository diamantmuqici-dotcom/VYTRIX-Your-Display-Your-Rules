import { useEffect, useRef } from "react";
import type { ColorSettings } from "@vytrix/shared-types";
import { clampColorSettings } from "@vytrix/validation";
import { invokeNative, isTauriRuntime } from "@/services/tauri";
import { setOverlayEnabled } from "@/services/overlay";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";

interface IdPayload { id: string }
interface EnabledPayload { enabled: boolean }
interface ReasonPayload { reason: string }

/** Applies inbound phone commands to the same store the desktop UI writes. */
export function PhoneBridge() {
  const app = useApp();
  const { notify } = useToast();
  const appRef = useRef(app);
  appRef.current = app;
  const toastRef = useRef(notify);
  toastRef.current = notify;

  const presets = app.state.presets;

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void invokeNative<void>("phone_presets", {
      presets: presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        category: preset.category,
        thumbnail: preset.thumbnail || null,
      })),
    });
  }, [presets]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    const unsubscribes: Array<() => void> = [];

    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const subscribe = <T,>(event: string, handler: (payload: T) => void) => {
        void listen<T>(event, (received) => {
          if (active) handler(received.payload);
        }).then((unlisten) => {
          if (active) unsubscribes.push(unlisten);
          else unlisten();
        });
      };

      subscribe<ColorSettings>("vytrix://phone-color", (payload) => {
        appRef.current.setColor(clampColorSettings(payload));
        appRef.current.log("Color updated from phone");
        toastRef.current("Color updated from phone");
      });

      subscribe<IdPayload>("vytrix://phone-preset", ({ id }) => {
        const preset = appRef.current.state.presets.find((item) => item.id === id);
        if (!preset) {
          appRef.current.log(`Phone requested unavailable preset: ${id}`);
          toastRef.current("Phone requested an unavailable preset", "error");
          return;
        }
        appRef.current.applyPreset(preset);
        appRef.current.log(`Preset applied from phone: ${preset.name}`);
        toastRef.current(`Preset applied: ${preset.name}`);
      });

      subscribe<{ crosshairEnabled: boolean }>("vytrix://overlay-config", ({ crosshairEnabled }) => {
        appRef.current.setCrosshairEnabled(crosshairEnabled);
      });

      subscribe<EnabledPayload>("vytrix://phone-crosshair", ({ enabled }) => {
        appRef.current.setCrosshairEnabled(enabled);
        void setOverlayEnabled(enabled);
        appRef.current.log(enabled ? "Crosshair enabled from phone" : "Crosshair disabled from phone");
      });

      subscribe<Record<string, never>>("vytrix://phone-paired", () => {
        appRef.current.log("Phone device paired");
        toastRef.current("Phone device paired");
      });

      subscribe<ReasonPayload>("vytrix://phone-disconnected", ({ reason }) => {
        appRef.current.log(`Phone session ended: ${reason}`);
        toastRef.current("Phone session ended");
      });
    })();

    return () => {
      active = false;
      unsubscribes.forEach((unlisten) => unlisten());
    };
  }, []);

  return null;
}
