import type { SectionId } from "@vytrix/config";
import {
  LayoutDashboard, Gamepad2, Palette, Monitor, Library, Crosshair,
  WandSparkles, Wrench, Activity, Keyboard, Smartphone, Paintbrush, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SectionDefinition {
  id: SectionId;
  index: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SECTION_DEFS: SectionDefinition[] = [
  { id: "overview", index: "01", label: "Overview", description: "System state and quick actions.", icon: LayoutDashboard },
  { id: "game-profiles", index: "02", label: "Game Profiles", description: "Per-game display configurations.", icon: Gamepad2 },
  { id: "color-studio", index: "03", label: "Color Studio", description: "Professional color calibration.", icon: Palette },
  { id: "display", index: "04", label: "Display & Monitor", description: "Resolution, refresh rate and HDR.", icon: Monitor },
  { id: "preset-library", index: "05", label: "Preset Library", description: "Built-in and community looks.", icon: Library },
  { id: "crosshair", index: "06", label: "Crosshair Studio", description: "Transparent overlay designs.", icon: Crosshair },
  { id: "effects", index: "07", label: "Display Effects", description: "Reversible visual accessibility effects.", icon: WandSparkles },
  { id: "optimizer", index: "08", label: "Windows Optimizer", description: "Reversible Windows tuning.", icon: Wrench },
  { id: "performance", index: "09", label: "Performance", description: "Live system telemetry.", icon: Activity },
  { id: "hotkeys", index: "10", label: "Hotkeys", description: "Registered shortcuts and conflicts.", icon: Keyboard },
  { id: "phone-control", index: "11", label: "Phone Control", description: "LAN-only paired companion.", icon: Smartphone },
  { id: "themes", index: "12", label: "Themes", description: "Appearance and personalization.", icon: Paintbrush },
  { id: "settings", index: "13", label: "Settings", description: "Application configuration and data.", icon: Settings },
];
