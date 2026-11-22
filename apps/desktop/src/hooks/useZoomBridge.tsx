import { useEffect, useRef } from "react";
import type { ZoomStatus } from "@vytrix/shared-types";
import { setOverlayZoom } from "@/services/overlay";
import { configureZoom, getZoomStatus, releaseZoom } from "@/services/zoom";
import { isTauriRuntime } from "@/services/tauri";
import { useApp } from "@/stores/app";

/** Pushes zoom settings to native and mirrors native status into the overlay. */
export function ZoomBridge() {
  const { state, log } = useApp();
  const signatureRef = useRef("");
  const lastEventRef = useRef("");

  // The binding owns the mode. settings.zoomMode mirrors it for older saves.
  const zoomBind = state.hotkeys.find((item) => item.action === "toggle-zoom");
  const zoomMode = zoomBind?.mode ?? state.settings.zoomMode;
  const zoomLevel = state.settings.zoomLevel;
  const zoomKeysText = zoomBind?.keys.join(">") ?? "";
  const zoomBindEnabled = zoomBind?.enabled !== false;
  const signature = `${zoomMode}|${zoomLevel}|${zoomBindEnabled ? zoomKeysText : ""}`;

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void getZoomStatus().then((result) => {
      if (!active || !result.ok) return;
      void setOverlayZoom(result.data.enabled, result.data.level);
      lastEventRef.current = `${result.data.enabled}|${result.data.level}|${result.data.detail}`;
    });
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<ZoomStatus>("vytrix://zoom", (event) => {
        if (!active) return;
        const status = event.payload;
        void setOverlayZoom(status.enabled, status.level);
        const marker = `${status.enabled}|${status.level}|${status.detail}`;
        if (marker !== lastEventRef.current) {
          lastEventRef.current = marker;
          log(`Zoom ${status.detail}`);
        }
      });
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, [log]);

  useEffect(() => {
    if (!isTauriRuntime() || signatureRef.current === signature) return;
    let active = true;
    const keys = zoomBindEnabled && zoomKeysText ? zoomKeysText.split(">") : [];
    const task = keys.length > 0 || zoomMode === "toggle"
      ? configureZoom(zoomMode, keys, zoomLevel)
      : releaseZoom();
    void task.then((result) => {
      if (!active) return;
      if (!result.ok) {
        // Keep the old signature so the next state change retries immediately.
        signatureRef.current = "";
        log(`Zoom setup failed: ${result.error.message}`);
        return;
      }
      signatureRef.current = signature;
      const status = result.data;
      void setOverlayZoom(status.enabled, status.level);
      lastEventRef.current = `${status.enabled}|${status.level}|${status.detail}`;
    });
    return () => { active = false; };
  }, [signature, zoomMode, zoomLevel, zoomBindEnabled, zoomKeysText, log]);

  return null;
}
