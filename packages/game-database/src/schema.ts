export const GAME_DATABASE_SCHEMA_VERSION = 1;
export const GAME_PROFILE_SCHEMA_VERSION = 1;

export type DetectionConfidence = "verified" | "partial" | "manual";
export type VerificationStatus = "verified" | "community" | "unverified";
export type SupportLevel = "supported" | "restricted" | "unknown";
export type ReleaseStatus = "released" | "unreleased" | "discontinued" | "unknown";

export type GameDetectionRuleType =
  | "executable"
  | "process"
  | "window-title"
  | "launcher-library"
  | "launcher-registry"
  | "store-package"
  | "manual-path";

export interface GameDetectionRule {
  type: GameDetectionRuleType;
  value: string;
}

export interface GameDetection {
  methods: string[];
  requiresManualPath: boolean;
  confidence: DetectionConfidence;
  rules: GameDetectionRule[];
}

export interface GameDefaults {
  colorProfileId: string;
  displayProfileId: string;
  resolutionProfileId: string;
  refreshRateProfileId: string;
  restorationMode: string;
  crosshairEnabled: boolean;
  overlayEnabled: boolean;
  monitoringEnabled: boolean;
}

export interface GameCapabilities {
  automaticDetection: boolean;
  colorProfiles: boolean;
  displayProfiles: boolean;
  crosshair: SupportLevel;
  overlay: SupportLevel;
  performanceMonitoring: boolean;
  restoration: boolean;
}

export interface GameVerification {
  status: VerificationStatus;
  source: string;
  lastVerifiedAt: string | null;
}

export interface GameConfiguration {
  id: string;
  name: string;
  detail?: string;
  category: string;
  launchers: string[];
  executableNames: string[];
  processNames: string[];
  detection: GameDetection;
  installationDetection: string;
  icon: string;
  defaults: GameDefaults;
  capabilities: GameCapabilities;
  compatibilityNotes: string[];
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  configurationSource: string;
  releaseStatus: ReleaseStatus;
  verification: GameVerification;
  schemaVersion: number;
  profileSchemaVersion: number;
}
