import { useEffect, useRef } from "react";
import type { SwitchEvent } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime } from "@/services/tauri";
import { smartSwitchStatus } from "@/services/smartSwitch";

/** Subscribes to native SmartSwitch transitions and mirrors status into the store. */
export function SmartSwitchBridge() {
  const app = useApp();
  const { notify } = useToast();
  const appRef = useRef(app);
  const toastRef = useRef(notify);
  appRef.current = app;
  toastRef.current = notify;

  useEffect(() => {
    void smartSwitchStatus().then((status) => {
      if (status) appRef.current.setSmartSwitchStatus(status);
    });
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlisten = await listen<SwitchEvent>("vytrix://smart-switch", (event) => {
          if (!active) return;
          const payload = event.payload;
          if (payload.kind === "error") {
            appRef.current.log(`SmartSwitch: ${payload.detail ?? payload.kind}`);
            return;
          }
          if (payload.kind === "switch" || payload.kind === "restore") {
            const message = payload.kind === "switch"
              ? `SmartSwitch: ${payload.game} -> ${payload.profileId ?? "profile"}`
              : `SmartSwitch: desktop restored`;
            appRef.current.log(message);
            toastRef.current(message);
          }
          void smartSwitchStatus().then((status) => {
            if (active && status) appRef.current.setSmartSwitchStatus(status);
          });
        });
        if (active) dispose = unlisten;
        else unlisten();
      } catch {
        // native event bridge unavailable in browser preview
      }
    })();
    return () => { active = false; dispose(); };
  }, []);

  return null;
}
