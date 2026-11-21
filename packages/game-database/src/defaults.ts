export const NEUTRAL_COLOR_PROFILE_ID = "vytrix-neutral-v1";
export const HARDWARE_DISPLAY_PROFILE_ID = "hardware-detect-v1";
export const DETECT_MONITOR_RESOLUTION_ID = "detect-monitor-v1";
export const DETECT_MAX_REFRESH_ID = "detect-supported-maximum-v1";
export const AUTOMATIC_RESTORATION_ID = "automatic-restore-v1";
export const DEFAULT_ICON = "assets/branding/vytrix-icon.svg";

export const BASE_COMPATIBILITY_NOTES: readonly string[] = [
  "Profiles declare capabilities, not claimed optimal game settings.",
  "Settings apply only when the detected monitor and GPU backend expose support.",
  "Original display state is restored on game exit, app exit, and failed apply.",
  "No game files are modified and no code is injected.",
];

export const RESTRICTED_OVERLAY_NOTE =
  "External overlay use may be restricted by the title or its anti-cheat; VYTRIX uses a transparent native window only where permitted.";
