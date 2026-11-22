import type { ColorPreset, ColorSettings } from "@vytrix/shared-types";
import { clamp, DEFAULT_COLOR_SETTINGS } from "@vytrix/validation";

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
  ["Vivid 300", "Competitive", "Maximum documented ramp chroma: saturation, vibrance and gamut all pushed to their strong, bounded ceiling.", { saturation: 300, vibrance: 300, gamut: 250, contrast: 108 }],
  ["Balanced", "Balanced", "Default reference profile.", {}],
  ["Ruby", "Vivid", "Deep red push with controlled highlights.", { red: 124, green: 92, blue: 92, saturation: 150, vibrance: 145, whitePoint: 96 }],
  ["Sapphire", "Vivid", "Cool cobalt bias with clean midtones.", { blue: 126, red: 88, green: 96, saturation: 152, temperatureK: 9200 }],
  ["Amber", "Cinematic", "Golden-hour warmth with soft rolloff.", { temperatureK: 4200, red: 116, blue: 84, saturation: 132, highlight: -8 }],
  ["Mint", "Balanced", "Fresh green-cyan lift, low contrast.", { green: 114, blue: 108, saturation: 122, contrast: 96 }],
  ["Ultraviolet", "Competitive", "Violet separation for dark scenes.", { red: 108, blue: 124, saturation: 168, vibrance: 160, gamma: 92 }],
  ["Infrared", "Competitive", "Warm aggressive push for visibility.", { red: 130, green: 90, blue: 80, saturation: 180, vibrance: 170, temperatureK: 4800 }],
  ["Steel", "Balanced", "Desaturated blue-grey reference.", { saturation: 70, temperatureK: 7400, contrast: 108, brightness: 98 }],
  ["Snow", "Balanced", "Bright neutral with lifted shadows.", { brightness: 112, shadow: 12, saturation: 88, gamma: 96 }],
  ["Charcoal", "Cinematic", "Crushed blacks, restrained highlights.", { blackPoint: 12, whitePoint: 92, contrast: 130, brightness: 94 }],
  ["Sky", "Balanced", "Light cyan lift with gentle warmth.", { blue: 112, green: 106, temperatureK: 7600, brightness: 106 }],
  ["Lagoon", "Vivid", "Teal-green boost with extra vibrance.", { green: 120, blue: 118, red: 88, saturation: 160, vibrance: 150 }],
  ["Magenta", "Vivid", "Pink-magenta channel separation.", { red: 122, blue: 118, green: 86, saturation: 170, hue: 12, hueStrength: 40 }],
  ["Sunrise", "Cinematic", "Orange-pink dawn with low contrast.", { temperatureK: 4000, saturation: 138, contrast: 92, brightness: 104 }],
  ["Twilight", "Cinematic", "Deep blue dusk with heavy contrast.", { temperatureK: 9400, contrast: 132, brightness: 90, shadow: -6 }],
  ["Emerald City", "Vivid", "Saturated green with lifted gamut.", { green: 132, blue: 104, saturation: 172, gamut: 140 }],
  ["Crimson", "Vivid", "High-saturation red with sharp midtones.", { red: 134, green: 84, blue: 84, saturation: 180, midtone: 8 }],
  ["Ice Blue", "Competitive", "Cold blue-white for crisp target reads.", { blue: 122, red: 92, temperatureK: 10400, brightness: 108, contrast: 110 }],
  ["Sepia", "Cinematic", "Warm brown film response.", { temperatureK: 4400, saturation: 96, red: 110, green: 100, blue: 78 }],
  ["Neon Green", "Competitive", "Acid green channel emphasis.", { green: 136, red: 84, blue: 88, saturation: 190, vibrance: 180 }],
  ["Violet Haze", "Cinematic", "Soft purple with reduced contrast.", { red: 108, blue: 124, saturation: 120, contrast: 88, brightness: 106 }],
  ["High Noon", "Balanced", "Bright neutral daylight reference.", { brightness: 114, temperatureK: 6600, contrast: 104, gamut: 112 }],
  ["Moonlight", "Cinematic", "Dim cool blue for night scenes.", { brightness: 86, temperatureK: 11000, blue: 116, red: 84, shadow: 10 }],
  ["Copper", "Cinematic", "Metallic warm tint with deep contrast.", { temperatureK: 4600, red: 118, green: 96, blue: 80, contrast: 126 }],
  ["Sage", "Balanced", "Muted green-grey, easy on the eyes.", { green: 108, saturation: 82, brightness: 102, contrast: 94 }],
  ["Cyberpunk", "Vivid", "Extreme cyan-magenta split at the ramp ceiling.", { green: 126, blue: 128, red: 118, saturation: 220, vibrance: 200, gamut: 180 }],
  ["Desert Sand", "Cinematic", "Dry beige warmth with soft shadows.", { temperatureK: 5200, red: 108, green: 102, blue: 88, shadow: 8 }],
  ["Deep Space", "Cinematic", "Near-monochrome dark blue with crushed blacks.", { saturation: 46, blue: 112, blackPoint: 10, contrast: 128, brightness: 92 }],
];

const PALETTES = [
  "linear-gradient(135deg,#00D9FF,#6557FF)", "linear-gradient(135deg,#38BDF8,#A855F7)",
  "linear-gradient(135deg,#F59E0B,#7C3AED)", "linear-gradient(135deg,#22C55E,#286BFF)",
  "linear-gradient(135deg,#EF4444,#F59E0B)", "linear-gradient(135deg,#64748B,#F8FAFC)",
  "linear-gradient(135deg,#E11D48,#7F1D1D)", "linear-gradient(135deg,#2563EB,#0EA5E9)",
  "linear-gradient(135deg,#F59E0B,#B45309)", "linear-gradient(135deg,#34D399,#0F766E)",
  "linear-gradient(135deg,#A855F7,#DB2777)", "linear-gradient(135deg,#DC2626,#F97316)",
  "linear-gradient(135deg,#475569,#94A3B8)", "linear-gradient(135deg,#F8FAFC,#CBD5E1)",
  "linear-gradient(135deg,#0EA5E9,#1E3A8A)", "linear-gradient(135deg,#14B8A6,#0D9488)",
  "linear-gradient(135deg,#D946EF,#8B5CF6)", "linear-gradient(135deg,#FB7185,#FDBA74)",
  "linear-gradient(135deg,#1E40AF,#312E81)", "linear-gradient(135deg,#16A34A,#065F46)",
  "linear-gradient(135deg,#B91C1C,#7F1D1D)", "linear-gradient(135deg,#BAE6FD,#E0F2FE)",
  "linear-gradient(135deg,#A16207,#FDE68A)", "linear-gradient(135deg,#6B21A8,#F0ABFC)",
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

/** Preview mirrors the native ramp direction without pretending to be a color-managed transform. */
export function presetCss(preset: ColorPreset): import("react").CSSProperties {
  const s = preset.settings;
  const chroma = clamp(
    1 + (s.saturation - 100) / 200 + (s.vibrance - 100) / 300 + (s.gamut - 100) / 200,
    0,
    4,
  );
  const hueDegrees = s.hue * (s.hueStrength / 100);
  return {
    filter: `saturate(${Math.round(chroma * 100)}%) brightness(${s.brightness}%) contrast(${s.contrast}%) hue-rotate(${hueDegrees}deg)`,
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
