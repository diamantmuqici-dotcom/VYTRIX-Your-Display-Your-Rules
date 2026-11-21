export type ThemeName = "dark" | "light" | "midnight" | "cyan" | "purple" | "red";

export type GpuBackend = "nvapi" | "adl" | "igcl" | "software" | "unavailable";

export interface DisplayMode {
  width: number;
  height: number;
  refreshRate: number;
  scaling: number;
  hdrEnabled: boolean;
}

export interface MonitorInfo {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  isPrimary: boolean;
  currentMode: DisplayMode;
  supportedModes: DisplayMode[];
  backend: GpuBackend;
}

export interface ColorSettings {
  saturation: number;
  vibrance: number;
  gamma: number;
  brightness: number;
  contrast: number;
  hue: number;
  red: number;
  green: number;
  blue: number;
  temperatureK: number | null;
}

export type ColorField = keyof ColorSettings;

export type Language = "en" | "fr" | "de" | "ru";

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  settings: ColorSettings;
  thumbnail: string;
  builtIn: boolean;
}

export type Launcher =
  | "steam"
  | "epic"
  | "riot"
  | "xbox"
  | "microsoft-store"
  | "battle-net"
  | "ubisoft-connect"
  | "ea-app"
  | "manual";

export interface GameEntry {
  id: string;
  name: string;
  launcher: Launcher;
  executableHints: string[];
  verifiedDetection: boolean;
  icon: string;
  category?: string;
  launchers?: Launcher[];
  detectionConfidence?: "verified" | "partial" | "manual";
  verificationStatus?: "verified" | "community" | "unverified";
  supportedFeatures?: string[];
  unsupportedFeatures?: string[];
  configurationStatus?: "ready" | "manual";
  releaseStatus?: "released" | "unreleased" | "discontinued" | "unknown";
  configurationSource?: string;
}

export interface GameProfile {
  id: string;
  gameId: string;
  name: string;
  color: ColorSettings;
  resolution: DisplayMode | null;
  applyCrosshair: boolean;
  crosshairId: string | null;
  performanceNote: string;
  autoSwitch: boolean;
}

export type CrosshairStyle = "dot" | "circle" | "cross" | "dynamic-cross";

export interface CrosshairConfig {
  id: string;
  name: string;
  style: CrosshairStyle;
  color: string;
  thickness: number;
  gap: number;
  length: number;
  opacity: number;
  outline: boolean;
  centerDot: boolean;
  rotation: number;
  scale: number;
  monitorId: string | null;
  offsetX: number;
  offsetY: number;
}

export interface HotkeyBinding {
  action: HotkeyAction;
  keys: string[];
  mouseButton: number | null;
  enabled: boolean;
}

export type HotkeyAction =
  | "toggle-color"
  | "next-preset"
  | "previous-preset"
  | "open-color-studio"
  | "toggle-crosshair"
  | "toggle-zoom"
  | "switch-profile"
  | "restore-defaults";

export type RiskLevel = "low" | "medium" | "high";

export interface OptimizationTask {
  id: string;
  category: "performance" | "input" | "privacy" | "appearance";
  name: string;
  description: string;
  benefit: string;
  risk: RiskLevel;
  currentState: string;
  recommendedState: string;
  applied: boolean;
  previousValue: string | null;
}

export interface MetricSample {
  timestamp: number;
  cpu: number;
  gpu: number | null;
  ram: number;
  vram: number | null;
  disk: number;
  networkKbps: number;
  temperatureC: number | null;
  fps: number | null;
  frameTimeMs: number | null;
  fpsMeasured: boolean;
}

export interface DiagnosticReport {
  generatedAt: number;
  appVersion: string;
  windowsVersion: string;
  cpuName: string;
  gpuName: string;
  ramGb: number;
  monitors: MonitorInfo[];
  samples: MetricSample[];
}

export interface SystemSummary {
  appVersion: string;
  windowsVersion: string;
  cpuName: string;
  gpuName: string;
  ramGb: number;
  activeMonitor: string;
  activeGame: string | null;
  activeProfile: string | null;
  activeColorPreset: string;
  optimizationStatus: "clean" | "applied" | "unknown";
}

export interface AppSettings {
  theme: ThemeName;
  accent: string;
  cornerRadius: number;
  uiScale: number;
  animationIntensity: number;
  reducedMotion: boolean;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  notifications: boolean;
  language: Language;
  autoGameSwitch: boolean;
  telemetryOptIn: boolean;
  monitorId: string | null;
}

export interface PresetFile {
  schemaVersion: 1;
  kind: "color" | "crosshair" | "game-profile";
  name: string;
  description: string;
  author: string;
  createdAt: string;
  payload: Record<string, unknown>;
  contentHash: string;
}

export interface OverlayView {
  crosshairEnabled: boolean;
  crosshair: CrosshairConfig;
  zoom: { enabled: boolean; level: number; label: string | null };
  hotkeyHint: string | null;
}

export interface PhoneSession {
  enabled: boolean;
  port: number;
  host: string;
  code: string;
  paired: boolean;
  expiresAt: number;
  pairingExpiresAt: number;
}

export interface PhonePermissions {
  saturation: boolean;
  vibrance: boolean;
  gamma: boolean;
  brightness: boolean;
  presets: boolean;
  crosshair: boolean;
  effects: boolean;
}

export interface PhoneState {
  color: ColorSettings;
  presetId: string | null;
  crosshairEnabled: boolean;
  expiresAt: number;
}

export type CommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
