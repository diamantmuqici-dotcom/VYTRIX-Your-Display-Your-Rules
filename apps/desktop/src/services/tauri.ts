import type { CommandResult } from "@vytrix/shared-types";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Native calls fail closed outside the Tauri runtime; no simulated values. */
export async function invokeNative<T>(command: string, args?: Record<string, unknown>): Promise<CommandResult<T>> {
  if (!isTauriRuntime()) {
    return { ok: false, error: { code: "RUNTIME_UNAVAILABLE", message: "Native runtime not connected" } };
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const data = await invoke<T>(command, args);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: { code: "NATIVE_ERROR", message: error instanceof Error ? error.message : String(error) },
    };
  }
}
