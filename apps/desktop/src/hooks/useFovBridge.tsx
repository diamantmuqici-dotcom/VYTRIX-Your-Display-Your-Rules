import { useEffect, useRef } from "react";
import type { ZoomStatus } from "@vytrix/shared-types";
import { FOV_REFERENCE } from "@/services/zoom";
import { releaseFov, setFov } from "@/services/zoom";
import { isTauriRuntime } from "@/services/tauri";
import { useApp } from "@/stores/app";

/** Keeps the screen-space FOV lens active wherever zoom is not overriding it. */
export function FovBridge() {
  const { state, log } = useApp();
  const stateRef = useRef(state);
  stateRef.current = state;
  const appliedRef = useRef<number | null>(null);
  const reapplyingRef = useRef(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<ZoomStatus>("vytrix://zoom", (event) => {
        if (!active || reapplyingRef.current) return;
        const detail = event.payload.detail;
        if (detail !== "idle" && detail !== "released") return;
        const degrees = stateRef.current.settings.fovDegrees;
        if (degrees >= FOV_REFERENCE) return;
        reapplyingRef.current = true;
        void setFov(degrees).then((result) => {
          if (result.ok) appliedRef.current = degrees;
          else log(`FOV restore failed: ${result.error.message}`);
        }).finally(() => { reapplyingRef.current = false; });
      });
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, [log]);

  useEffect(() => {
    if (!isTauriRuntime() || appliedRef.current === state.settings.fovDegrees) return;
    const degrees = state.settings.fovDegrees;
    const task = degrees >= FOV_REFERENCE ? releaseFov() : setFov(degrees);
    void task.then((result) => {
      if (!result.ok) {
        appliedRef.current = null;
        log(`FOV setup failed: ${result.error.message}`);
        return;
      }
      appliedRef.current = degrees;
    });
  }, [state.settings.fovDegrees, log]);

  return null;
}
