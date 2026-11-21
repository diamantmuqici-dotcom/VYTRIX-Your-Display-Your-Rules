import type { ColorPreset, ColorSettings } from "@vytrix/shared-types";
import { DEFAULT_COLOR_SETTINGS } from "@vytrix/validation";

type PresetSeed = [string, string, string, Partial<ColorSettings>];

const SEEDS: PresetSeed[] = [
  ["Ultra Vivid", "Competitive", "High saturation and vibrance for punchy targets.", { saturation: 190, vibrance: 175, contrast: 112, brightness: 102 }],
  ["Natural", "Balanced", "Neutral reference with no channel shifts.", {}],
  ["Cinematic", "Cinematic", "Low brightness, deep contrast, warm tint.", { brightness: 88, contrast: 124, saturation: 112, temperatureK: 5600 }],
  ["Crystal Clear", "Balanced", "Clean midtones and slight contrast lift.", { contrast: 110, gamma: 96, saturation: 110 }],
  ["Deep Blue", "Competitive", "Cool blue bias with raised vibrance.", { blue: 118, red: 92, saturation: 140, temperatureK: 8200 }],
  ["Arctic", "Cinematic", "Cold, pale, low-saturation winter look.", { temperatureK: 9800, saturation: 82, brightness: 106 }],
  ["Emerald", "Cinematic", "Green-shifted film response.", { green: 116, red: 90, saturation: 122 }],
  ["Sunset", "Cinematic", "Warm amber highlights and soft contrast.", { temperatureK: 4600, saturation: 128, contrast: 108 }],
  ["Desert Glow", "Cinematic", "Dry warm tone with lifted reds.", { temperatureK: 5000, red: 112, green: 96, blue: 88 }],
  ["Neon", "Competitive", "Aggressive magenta-cyan separation.", { saturation: 210, vibrance: 190, red: 110, blue: 116 }],
  ["Vintage", "Cinematic", "Faded film with reduced contrast.", { contrast: 86, saturation: 78, temperatureK: 5200 }],
  ["Noir", "Cinematic", "High-contrast monochrome-leaning look.", { saturation: 8, contrast: 142, brightness: 92 }],
  ["Pastel", "Balanced", "Soft, light, low-contrast palette.", { contrast: 84, brightness: 110, saturation: 88 }],
  ["Warm Film", "Cinematic", "Orange push with gentle highlight rolloff.", { temperatureK: 4900, saturation: 116, gamma: 104 }],
  ["Cold Film", "Cinematic", "Blue push with muted reds.", { temperatureK: 9000, saturation: 104, red: 88 }],
  ["Competitive", "Competitive", "Flat, readable, no color distraction.", { saturation: 118, vibrance: 130, gamma: 94, brightness: 104 }],
  ["Balanced", "Balanced", "Default reference profile.", {}],
];

const PALETTES = [
  "linear-gradient(135deg,#00D9FF,#6557FF)", "linear-gradient(135deg,#38BDF8,#A855F7)",
  "linear-gradient(135deg,#F59E0B,#7C3AED)", "linear-gradient(135deg,#22C55E,#286BFF)",
  "linear-gradient(135deg,#EF4444,#F59E0B)", "linear-gradient(135deg,#64748B,#F8FAFC)",
];

export const BUILTIN_PRESETS: ColorPreset[] = SEEDS.map(([name, category, description, overrides], index) => ({
  id: `builtin-${index}`,
  name,
  category,
  description,
  settings: { ...DEFAULT_COLOR_SETTINGS, ...overrides },
  thumbnail: PALETTES[index % PALETTES.length] ?? PALETTES[0]!,
  builtIn: true,
}));

export function presetCss(preset: ColorPreset): import("react").CSSProperties {
  const s = preset.settings;
  return {
    filter: `saturate(${s.saturation}%) brightness(${s.brightness}%) contrast(${s.contrast}%) hue-rotate(${s.hue}deg)`,
  };
}

/** Approximate warmth/cool tint for the local preview. The native gamma ramp is authoritative. */
export function temperatureTint(kelvin: number | null): import("react").CSSProperties {
  const k = typeof kelvin === "number" && Number.isFinite(kelvin) ? kelvin : 6500;
  if (k >= 6300 && k <= 6700) return { opacity: 0 };
  const warm = k < 6500;
  const strength = Math.min(0.6, (Math.abs(k - 6500) / 5500) * 0.6);
  return {
    background: warm ? "rgb(255,150,60)" : "rgb(120,160,255)",
    mixBlendMode: "multiply",
    opacity: strength,
  };
}
