import type { CommandResult } from "@vytrix/shared-types";
import { invokeNative } from "./tauri";

export interface LevelInfo {
  level: number;
  key: "off" | "light" | "medium" | "full";
  name: string;
  tagline: string;
  overview: string;
  textures: string;
  environment: string;
  effects: string;
  driver: string;
  performance: string;
  tradeoffs: string;
  compatibility: string;
  restoration: string;
  gameplay: string;
  restartRequired: boolean;
  idealFor: string[];
}

export interface HardwareInfo {
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  gpuName: string;
  gpuVendor: string;
  vramMb: number | null;
  driverVersion: string;
  ramTotalGb: number;
  ramAvailableGb: number;
  resolution: string;
  refreshHz: number | null;
  maxRefreshHz: number | null;
  monitorName: string;
  installDrive: string;
  freeSpaceGb: number | null;
  driveType: string;
  detectedAt: number;
}

export interface CompatibilityRow {
  vendor: string;
  label: string;
  detected: boolean;
  driverProfile: string;
  gameConfig: string;
  note: string;
}

export interface GameInfo {
  id: string;
  name: string;
  platform: string;
  detected: boolean;
  installDir: string;
  executable: string;
  running: boolean;
  configPath: string;
  configFound: boolean;
  level: number;
  lastOptimized: number | null;
  configStatus: string;
}

export type SettingCategory = "texture" | "environment" | "effects" | "distance" | "driver";
export type SettingMechanism = "gameConfigIni" | "driverProfile" | "unsupported";

export interface GraphicsSetting {
  id: string;
  category: SettingCategory;
  name: string;
  mechanism: SettingMechanism;
  supported: boolean;
  supportReason: string;
  currentValue: string | null;
  recommendedValue: string | null;
  selectedValue: string | null;
  explanation: string;
  performanceRelevance: string;
  visualImpact: string;
  restartRequired: boolean;
  vendor: string;
}

export interface Recommendation {
  level: number;
  reason: string;
}

export interface SettingChange {
  id: string;
  name: string;
  from: string | null;
  to: string | null;
  mechanism: SettingMechanism;
  status: string;
  detail: string;
}

export interface ApplyStep {
  index: number;
  label: string;
  status: string;
  detail: string;
}

export interface ApplyResult {
  gameId: string;
  level: number;
  steps: ApplyStep[];
  changes: SettingChange[];
  failures: string[];
  restartRequired: boolean;
  backupId: string;
  completedAt: number;
}

export interface ApplyPlan {
  gameId: string;
  level: number;
  changes: SettingChange[];
  skipped: string[];
  hardwareNote: string;
  gameRunning: boolean;
  restartRequired: boolean;
  recommendedLevel: number;
  recommendationReason: string;
}

export interface BackupInfo {
  gameId: string;
  level: number;
  createdAt: number;
  appVersion: string;
  configPath: string;
  valueCount: number;
  verifiedCount: number;
  integrity: string;
  recoverable: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  gameId: string;
  fromLevel: number;
  toLevel: number;
  event: string;
  changed: number;
  verified: number;
  failed: number;
  backupId: string;
  detail: string;
}

export interface BenchmarkResult {
  id: string;
  gameId: string;
  level: number;
  startedAt: number;
  durationMs: number;
  sampleCount: number;
  measuredSamples: number;
  avgFps: number | null;
  low1Fps: number | null;
  avgFrameMs: number | null;
  avgGpu: number | null;
  avgCpu: number | null;
  resolution: string;
  gpuName: string;
  cpuName: string;
  note: string;
}

export interface BottleneckReport {
  classification: string;
  confidence: string;
  sampleCount: number;
  avgGpu: number | null;
  avgCpu: number | null;
  avgVram: number | null;
  avgRam: number | null;
  explanation: string;
  advice: string;
}

export interface NetProbeResult {
  host: string;
  port: number;
  samples: number;
  minMs: number | null;
  avgMs: number | null;
  maxMs: number | null;
  lossPercent: number;
  note: string;
}

export const getLevels = (): Promise<CommandResult<LevelInfo[]>> => invokeNative<LevelInfo[]>("potato_levels");
export const getHardware = (): Promise<CommandResult<HardwareInfo>> => invokeNative<HardwareInfo>("potato_hardware");
export const refreshHardware = (): Promise<CommandResult<HardwareInfo>> => invokeNative<HardwareInfo>("potato_refresh_hardware");
export const getGames = (): Promise<CommandResult<GameInfo[]>> => invokeNative<GameInfo[]>("potato_games");
export const getSettings = (gameId: string): Promise<CommandResult<GraphicsSetting[]>> =>
  invokeNative<GraphicsSetting[]>("potato_settings", { gameId });
export const getCompatibility = (): Promise<CommandResult<CompatibilityRow[]>> =>
  invokeNative<CompatibilityRow[]>("potato_compatibility");
export const getRecommendation = (): Promise<CommandResult<Recommendation>> =>
  invokeNative<Recommendation>("potato_recommend");
export const getPlan = (gameId: string, level: number): Promise<CommandResult<ApplyPlan>> =>
  invokeNative<ApplyPlan>("potato_plan", { gameId, level });
export const applyLevel = (gameId: string, level: number): Promise<CommandResult<ApplyResult>> =>
  invokeNative<ApplyResult>("potato_apply", { gameId, level });
export const restoreGame = (gameId: string): Promise<CommandResult<ApplyResult>> =>
  invokeNative<ApplyResult>("potato_restore", { gameId });
export const getBackupInfo = (gameId: string): Promise<CommandResult<BackupInfo | null>> =>
  invokeNative<BackupInfo | null>("potato_backup_info", { gameId });
export const getHistory = (limit = 50): Promise<CommandResult<HistoryEntry[]>> =>
  invokeNative<HistoryEntry[]>("potato_history", { limit });
export const setManualPath = (gameId: string, path: string): Promise<CommandResult<null>> =>
  invokeNative<null>("potato_set_manual_path", { gameId, path });
export const startBenchmark = (gameId: string, level: number): Promise<CommandResult<BenchmarkResult>> =>
  invokeNative<BenchmarkResult>("potato_benchmark_start", { gameId, level });
export const tickBenchmark = (): Promise<CommandResult<BenchmarkResult>> =>
  invokeNative<BenchmarkResult>("potato_benchmark_tick");
export const benchmarkStatus = (): Promise<CommandResult<BenchmarkResult>> =>
  invokeNative<BenchmarkResult>("potato_benchmark_status");
export const stopBenchmark = (): Promise<CommandResult<BenchmarkResult>> =>
  invokeNative<BenchmarkResult>("potato_benchmark_stop");
export const getBenchmarkHistory = (limit = 20): Promise<CommandResult<BenchmarkResult[]>> =>
  invokeNative<BenchmarkResult[]>("potato_benchmark_history", { limit });
export const getBottleneck = (): Promise<CommandResult<BottleneckReport>> =>
  invokeNative<BottleneckReport>("potato_bottleneck");
export const runBottleneckWindow = (seconds: number, intervalMs: number): Promise<CommandResult<BottleneckReport>> =>
  invokeNative<BottleneckReport>("potato_bottleneck_window", { seconds, intervalMs });
export const probeNetwork = (host: string, port: number, count: number): Promise<CommandResult<NetProbeResult>> =>
  invokeNative<NetProbeResult>("potato_net_probe", { host, port, count });
export const getDiagnostics = (gameId: string): Promise<CommandResult<string>> =>
  invokeNative<string>("potato_diagnostics", { gameId });

export function levelName(level: number): string {
  return ["OFF / ORIGINAL QUALITY", "LIGHT OPTIMIZATION", "BALANCED PERFORMANCE", "FULL POTATO"][level] ?? "UNKNOWN";
}

export function levelShort(level: number): string {
  return ["OFF", "LIGHT", "MEDIUM", "FULL"][level] ?? "?";
}
