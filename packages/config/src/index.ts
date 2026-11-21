export const PRODUCT = {
  name: "VYTRIX",
  tagline: "YOUR DISPLAY. YOUR RULES.",
  version: "0.1.0",
  website: "https://vytrix.gg",
} as const;

export const LIMITS = {
  maxLocalPresets: 200,
  maxCrosshairDesigns: 100,
  maxGameProfiles: 500,
  maxPresetBytes: 262144,
  maxHistoryEntries: 1000,
} as const;

export const TIMING = {
  displayConfirmMs: 15000,
  defaultPollIntervalMs: 2000,
  minimalPollIntervalMs: 5000,
  phoneTokenTtlMs: 300000,
  toastDurationMs: 3600,
} as const;

let apiBaseUrl = "http://127.0.0.1:3001";

export const ENDPOINTS = {
  get api() { return apiBaseUrl; },
  releaseManifest: "https://vytrix.gg/api/releases/latest.json",
} as const;

export function setApiBaseUrl(url: string): void {
  if (/^https?:\/\//.test(url)) apiBaseUrl = url.replace(/\/$/, "");
}

export const SECTIONS = [
  "overview", "game-profiles", "color-studio", "display", "preset-library", "crosshair",
  "effects", "optimizer", "performance", "hotkeys", "phone-control", "themes", "settings",
] as const;

export type SectionId = (typeof SECTIONS)[number];
