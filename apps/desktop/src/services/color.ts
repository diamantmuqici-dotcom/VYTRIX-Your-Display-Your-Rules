import type { ColorSettings } from "@vytrix/shared-types";
import { invokeNative, isTauriRuntime } from "./tauri";

export interface ColorApplyStatus {
  ok: boolean;
  message: string;
  backend: string;
  device?: string;
}

type Listener = (status: ColorApplyStatus) => void;

let timer: number | null = null;
let queued: { color: ColorSettings; monitorId: string | null } | null = null;
let queuedListener: Listener | undefined;

/** Queue a gamma-ramp write so slider drags do not flood the native runtime. */
export function applyColor(
  color: ColorSettings,
  onResult?: Listener,
  monitorId: string | null = null,
): void {
  queued = { color: { ...color }, monitorId };
  queuedListener = onResult;
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    const payload = queued;
    const listener = queuedListener;
    queued = null;
    queuedListener = undefined;
    if (payload) void dispatch(payload.color, payload.monitorId, listener);
  }, 90);
}

export function applyColorNow(
  color: ColorSettings,
  onResult?: Listener,
  monitorId: string | null = null,
): Promise<ColorApplyStatus | null> {
  if (timer !== null) { window.clearTimeout(timer); timer = null; }
  queued = null;
  queuedListener = undefined;
  return dispatch(color, monitorId, onResult);
}

function dispatch(color: ColorSettings, monitorId: string | null, onResult?: Listener): Promise<ColorApplyStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<ColorApplyStatus>("color_apply", { color, monitorId }).then((result) => {
    if (!result.ok) {
      const failure: ColorApplyStatus = {
        ok: false, message: result.error.message, backend: "unavailable",
      };
      onResult?.(failure);
      return failure;
    }
    onResult?.(result.data);
    return result.data;
  });
}

export function resetColor(monitorId: string | null = null, onResult?: Listener): Promise<ColorApplyStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<ColorApplyStatus>("color_reset", { monitorId }).then((result) => {
    const status: ColorApplyStatus = result.ok
      ? result.data
      : { ok: false, message: result.error.message, backend: "unavailable" };
    onResult?.(status);
    return status;
  });
}

/** Recovery for a display left tinted by a killed session with no saved ramp. */
export function resetColorLinear(monitorId: string | null = null, onResult?: Listener): Promise<ColorApplyStatus | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<ColorApplyStatus>("color_reset_linear", { monitorId }).then((result) => {
    const status: ColorApplyStatus = result.ok
      ? result.data
      : { ok: false, message: result.error.message, backend: "unavailable" };
    onResult?.(status);
    return status;
  });
}
