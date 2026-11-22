import type {
  OptimizationTask, PlatinumView, PowerPlanStatus, TaskOutcome, WindowsInfo,
} from "@vytrix/shared-types";
import { invokeNative, isTauriRuntime } from "./tauri";

/** Task state is read from the OS on load; nothing is inferred from a static list. */
export async function optimizerTasks(): Promise<OptimizationTask[] | null> {
  if (!isTauriRuntime()) return null;
  const result = await invokeNative<OptimizationTask[]>("optimizer_tasks");
  return result.ok ? result.data : null;
}

export async function optimizerPowerPlan(): Promise<PowerPlanStatus | null> {
  if (!isTauriRuntime()) return null;
  const result = await invokeNative<PowerPlanStatus>("optimizer_power_plan");
  return result.ok ? result.data : null;
}

export async function optimizerApply(id: string): Promise<TaskOutcome | null> {
  const result = await invokeNative<TaskOutcome>("optimizer_apply", { id });
  return result.ok ? result.data : null;
}

export async function optimizerRestore(id: string): Promise<TaskOutcome | null> {
  const result = await invokeNative<TaskOutcome>("optimizer_restore", { id });
  return result.ok ? result.data : null;
}

export async function optimizerApplyAll(): Promise<TaskOutcome[] | null> {
  const result = await invokeNative<TaskOutcome[]>("optimizer_apply_all");
  return result.ok ? result.data : null;
}

export async function optimizerOs(): Promise<WindowsInfo | null> {
  if (!isTauriRuntime()) return null;
  const result = await invokeNative<WindowsInfo>("optimizer_os");
  return result.ok ? result.data : null;
}

export async function optimizerProfile(): Promise<PlatinumView | null> {
  if (!isTauriRuntime()) return null;
  const result = await invokeNative<PlatinumView>("optimizer_profile");
  return result.ok ? result.data : null;
}

export async function optimizerPlatinumApplyAll(): Promise<TaskOutcome[] | null> {
  const result = await invokeNative<TaskOutcome[]>("optimizer_platinum_apply_all");
  return result.ok ? result.data : null;
}

export async function optimizerPlatinumRestoreAll(): Promise<TaskOutcome[] | null> {
  const result = await invokeNative<TaskOutcome[]>("optimizer_platinum_restore_all");
  return result.ok ? result.data : null;
}

let lastPresetName: string | null = null;

export async function setActiveColorPreset(name: string): Promise<void> {
  if (lastPresetName === name) return;
  lastPresetName = name;
  const result = await invokeNative<void>("color_set_active_preset", { name });
  if (!result.ok) lastPresetName = null;
}
