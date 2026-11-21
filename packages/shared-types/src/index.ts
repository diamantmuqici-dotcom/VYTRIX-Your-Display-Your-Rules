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

/**
 * Color controls are per-channel transfer-function parameters applied through
 * SetDeviceGammaRamp. A ramp cannot mix channels, so hue and saturation are
 * implemented as channel-gain shaping, not per-pixel HSV rotation.
 */
export interface ColorSettings {
  /** Chroma expansion around each channel's neutral pivot. 100 is neutral. */
  saturation: number;
  /** Low-saturation protection weighted toward midtones. 100 is neutral. */
  vibrance: number;
  /** Master transfer gamma. 100 is neutral. */
  gamma: number;
  brightness: number;
  contrast: number;
  /** Channel-phase hue bias in degrees; requires hueStrength above zero. */
  hue: number;
  /** Strength of the channel-phase hue bias. 0 disables it. */
  hueStrength: number;
  red: number;
  green: number;
  blue: number;
  temperatureK: number | null;
  /** Per-channel black-point lift. Negative values crush. */
  redLift: number;
  greenLift: number;
  blueLift: number;
  /** Per-channel transfer gamma. 100 is neutral. */
  redGamma: number;
  greenGamma: number;
  blueGamma: number;
  /** Shadow, midtone and highlight weighting in the transfer curve. */
  shadow: number;
  midtone: number;
  highlight: number;
  /** Global black and white points. */
  blackPoint: number;
  whitePoint: number;
  /** Additional chroma ceiling independent of saturation. 100 is neutral. */
  gamut: number;
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
  detail?: string;
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

/** Advanced shape vocabulary. Legacy `style` is kept for native/overlay compat. */
export type CrosshairShape =
  | "classic" | "plus" | "small" | "large" | "dot" | "circle" | "circle-dot"
  | "cross-dot" | "four-lines" | "static" | "minimal" | "precision"
  | "geometric" | "custom";

export type CrosshairArmId = "top" | "bottom" | "left" | "right";

export interface CrosshairArm {
  id: CrosshairArmId;
  visible: boolean;
  length: number;
  thickness: number;
  innerGap: number;
  outerGap: number;
  offset: number;
  rotation: number;
  color: string;
}

export interface CrosshairDotModel {
  enabled: boolean;
  size: number;
  shape: "circle" | "square" | "diamond";
  color: string;
  opacity: number;
  outline: boolean;
  outlineThickness: number;
  glow: boolean;
}

export interface CrosshairOutlineModel {
  enabled: boolean;
  thickness: number;
  color: string;
  opacity: number;
  style: "solid" | "dashed";
}

export type CrosshairAnimationKind = "fade" | "pulse" | "color" | "scale" | "rotate" | "appear";

export interface CrosshairAnimationModel {
  enabled: boolean;
  kind: CrosshairAnimationKind;
  durationMs: number;
  speed: number;
  intensity: number;
  easing: "linear" | "ease" | "ease-in-out";
  colorTo: string;
}

export interface CrosshairAdvanced {
  shape: CrosshairShape;
  arms: CrosshairArm[];
  dot: CrosshairDotModel;
  outline: CrosshairOutlineModel;
  animation: CrosshairAnimationModel;
  lineSpacing: number;
  centerGap: number;
  ring: boolean;
  shadow: boolean;
  glow: boolean;
  glowColor: string;
  renderQuality: "crisp" | "balanced" | "smooth";
}

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
  advanced?: CrosshairAdvanced;
}

/** Fully normalized design used by the studio. `advanced` is always present. */
export interface CrosshairDesign extends CrosshairConfig {
  advanced: CrosshairAdvanced;
}

export interface CrosshairCollection {
  id: string;
  name: string;
  designIds: string[];
  createdAt: number;
}

export interface CrosshairGameProfile {
  id: string;
  gameId: string;
  gameName: string;
  designId: string;
  presetId: string | null;
  autoSwitch: boolean;
  lastUsed: number;
}

export interface CrosshairStudioSettings {
  defaultDesignId: string;
  previewBackground: "dark" | "light" | "grid" | "target" | "transparent";
  renderQuality: "crisp" | "balanced" | "smooth";
  overlayStartEnabled: boolean;
  animationEnabled: boolean;
  autoGameSwitch: boolean;
  showHotkeyHint: boolean;
}

export interface RecentCrosshair {
  id: string;
  usedAt: number;
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
  | "restore-defaults"
  | "next-crosshair"
  | "previous-crosshair"
  | "toggle-overlay"
  | "open-crosshair-studio"
  | "save-crosshair";

export type ZoomMode = "toggle" | "hold";

export interface ZoomStatus {
  enabled: boolean;
  mode: ZoomMode;
  level: number;
  keys: string[];
  available: boolean;
  detail: string;
}

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

/** Matches the native display::DisplayMode serde shape used by SmartSwitch. */
export interface SwitchDisplayMode {
  width: number;
  height: number;
  refresh_rate: number;
  bits_per_pixel: number;
}

export interface SwitchProfile {
  id: string;
  game: string;
  priority: number;
  enabled: boolean;
  color: ColorSettings;
  display: SwitchDisplayMode | null;
}

export interface SwitchRecord {
  time: number;
  game: string;
  action: string;
  detail: string;
  priority: number;
}

export interface SwitchStatus {
  enabled: boolean;
  currentGame: string | null;
  currentProfile: string | null;
  profileCount: number;
  historyCount: number;
  pollIntervalMs: number;
}

export interface SwitchEvent {
  kind: string;
  game: string;
  profileId: string | null;
  priority: number;
  restored: boolean;
  detail?: string;
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
  zoomMode: ZoomMode;
  zoomLevel: number;
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

export type OverlayLayout = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface OverlayGameVisibility {
  hiddenForGames: string[];
  onlyForGames: string[];
}

export interface OverlayView {
  crosshairEnabled: boolean;
  crosshair: CrosshairConfig;
  zoom: { enabled: boolean; level: number; label: string | null };
  hotkeyHint: string | null;
  layout: OverlayLayout;
  gameVisibility: OverlayGameVisibility;
  visibleForGame: boolean;
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
