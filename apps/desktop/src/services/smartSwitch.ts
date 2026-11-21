import type {
  ColorSettings,
  SwitchProfile,
  SwitchRecord,
  SwitchStatus,
} from "@vytrix/shared-types";
import { invokeNative, isTauriRuntime } from "./tauri";

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: { message: string } }): T | null {
  return result.ok ? result.data : null;
}

export function smartSwitchStatus(): Promise<SwitchStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<SwitchStatus>("smart_switch_status").then(unwrap);
}

export function smartSwitchHistory(limit = 50): Promise<SwitchRecord[]> {
  if (!isTauriRuntime()) return Promise.resolve([]);
  return invokeNative<SwitchRecord[]>("smart_switch_history", { limit }).then(
    (result) => (result.ok ? result.data : []),
  );
}

export function setSmartSwitchEnabled(
  enabled: boolean,
  desktopColor?: ColorSettings | null,
): Promise<SwitchStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<SwitchStatus>("smart_switch_set_enabled", {
    enabled,
    desktopColor: desktopColor ?? null,
  }).then(unwrap);
}

export function syncSmartSwitchProfiles(
  profiles: SwitchProfile[],
): Promise<SwitchStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<SwitchStatus>("smart_switch_sync_profiles", { profiles }).then(unwrap);
}
