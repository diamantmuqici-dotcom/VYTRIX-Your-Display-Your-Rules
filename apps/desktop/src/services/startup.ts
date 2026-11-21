import { invokeNative, isTauriRuntime } from "./tauri";

export type StartupTarget = "vytrix" | "snaptap";
export type StartupMode = "off" | "registry" | "folder";

export interface StartupView {
  target: string;
  mode: StartupMode;
  executable: string;
  launcher: string;
  present: boolean;
}

/** Read-only status. Fails closed to null outside Tauri or on a native error. */
export function startupStatus(target: StartupTarget): Promise<StartupView | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<StartupView>("startup_status", { target }).then((result) =>
    result.ok ? result.data : null,
  );
}

/** Apply a per-user logon entry; returns the reconciled state or null on error. */
export function startupConfigure(
  target: StartupTarget,
  mode: StartupMode,
): Promise<StartupView | null> {
  if (!isTauriRuntime()) return Promise.resolve(null);
  return invokeNative<StartupView>("startup_configure", { target, mode }).then((result) =>
    result.ok ? result.data : null,
  );
}
