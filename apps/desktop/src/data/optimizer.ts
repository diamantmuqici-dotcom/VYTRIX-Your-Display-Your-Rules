import type { OptimizationTask } from "@vytrix/shared-types";

type Seed = [OptimizationTask["category"], string, string, string, OptimizationTask["risk"], string, string];

const SEEDS: Seed[] = [
  ["performance", "Game Mode", "Prioritizes the foreground game process.", "May reduce background throughput.", "low", "Unknown", "Enabled"],
  ["performance", "Game Bar recording", "Disables background capture hooks.", "Removes recording shortcut overlays.", "low", "Unknown", "Disabled"],
  ["performance", "Background applications", "Limits store app activity during play.", "Some app notifications may pause.", "medium", "Unknown", "Optimized"],
  ["performance", "Power plan", "Selects high performance when plugged in.", "Higher idle power draw.", "medium", "Balanced", "High performance"],
  ["performance", "Windowed game optimization", "Reduces composition overhead for borderless windows.", "None observed.", "low", "Unknown", "Enabled"],
  ["performance", "Startup application review", "Lists startup entries for manual review.", "No automatic changes.", "low", "Not reviewed", "Reviewed"],
  ["performance", "Temporary file cleanup", "Removes application temp files only.", "No system files are removed.", "low", "Unknown", "Clean"],
  ["input", "Mouse acceleration", "Disables pointer acceleration for consistent aim.", "Changes desktop pointer feel.", "medium", "Unknown", "Disabled"],
  ["input", "Sticky Keys shortcut", "Removes the five-shift activation shortcut.", "Accessibility shortcut changes.", "medium", "Unknown", "Shortcut off"],
  ["input", "Keyboard filter settings", "Reviews repeat delay and rate.", "None observed.", "low", "Unknown", "Reviewed"],
  ["privacy", "Diagnostic data", "Reviews Windows telemetry level.", "No services are disabled.", "low", "Unknown", "Minimum"],
  ["privacy", "Background permissions", "Reviews apps with background access.", "App sync may pause.", "medium", "Unknown", "Reviewed"],
  ["privacy", "Advertising ID", "Reviews per-user advertising identifier.", "Personalized ads change.", "low", "Unknown", "Off"],
  ["appearance", "Transparency effects", "Disables translucent UI for lower composition cost.", "Visual change only.", "low", "Unknown", "Disabled"],
  ["appearance", "Windows animations", "Reduces non-essential animation work.", "Visual change only.", "low", "Unknown", "Reduced"],
  ["appearance", "Notification preferences", "Reviews focus-assist state.", "Alerts may be suppressed.", "low", "Unknown", "Focus assist"],
];

export const OPTIMIZER_TASKS: OptimizationTask[] = SEEDS.map(([category, name, description, benefit, risk, currentState, recommendedState], index) => ({
  id: `task-${index}`,
  category,
  name,
  description,
  benefit,
  risk,
  currentState,
  recommendedState,
  applied: false,
  previousValue: null,
}));
