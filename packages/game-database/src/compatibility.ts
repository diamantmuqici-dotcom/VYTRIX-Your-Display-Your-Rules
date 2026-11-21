import type { GameConfiguration } from "./schema.js";

export interface CompatibilitySummary {
  id: string;
  name: string;
  detection: string;
  color: string;
  display: string;
  crosshair: string;
  overlay: string;
  monitoring: string;
  restoration: string;
  notes: string[];
}

function supportText(level: string): string {
  if (level === "supported") return "supported";
  if (level === "restricted") return "compatibility checked";
  return "unknown";
}

export function compatibilitySummary(config: GameConfiguration): CompatibilitySummary {
  const notes = [...config.compatibilityNotes];
  if (config.detection.requiresManualPath) notes.push("Executable path must be supplied manually.");
  if (config.capabilities.overlay !== "supported") {
    notes.push("Overlay stays off by default until per-title compatibility is confirmed.");
  }
  if (config.capabilities.crosshair !== "supported") {
    notes.push("Crosshair stays off by default until per-title compatibility is confirmed.");
  }

  return {
    id: config.id,
    name: config.name,
    detection: config.capabilities.automaticDetection ? config.detection.confidence : "manual",
    color: config.capabilities.colorProfiles ? "profile capability" : "unavailable",
    display: config.capabilities.displayProfiles ? "hardware-detect" : "unavailable",
    crosshair: supportText(config.capabilities.crosshair),
    overlay: supportText(config.capabilities.overlay),
    monitoring: config.capabilities.performanceMonitoring ? "enabled where metrics exist" : "unavailable",
    restoration: config.capabilities.restoration ? "automatic" : "manual",
    notes,
  };
}
