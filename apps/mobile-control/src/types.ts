// Mirrors ColorSettings from packages/shared-types. The mobile client keeps a
// local copy so it can be built and served without the desktop bundle.

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

export interface PresetSummary {
  id: string;
  name: string;
  category: string;
  thumbnail: string | null;
}

export interface DeviceState {
  deviceName: string;
  agentVersion: string;
  paired: boolean;
  expiresAt: number;
  color: ColorSettings;
  activePresetId: string | null;
  crosshairEnabled: boolean;
  presets: PresetSummary[];
}

export interface PairSession {
  token: string;
  expiresAt: number;
}
