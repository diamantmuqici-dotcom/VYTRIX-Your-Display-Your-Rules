export interface Rgb { r: number; g: number; b: number }
export interface Hsv { h: number; s: number; v: number }

export function hexToRgb(hex: string): Rgb {
  const clean = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!clean) return { r: 0, g: 217, b: 255 };
  const value = parseInt(clean[1]!, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h: Math.round(h), s: max === 0 ? 0 : Math.round((delta / max) * 100), v: Math.round(max * 100) };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const vn = Math.min(100, Math.max(0, v)) / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  const sector = Math.floor(((h % 360) + 360) % 360 / 60);
  const table: Rgb[] = [
    { r: c, g: x, b: 0 }, { r: x, g: c, b: 0 }, { r: 0, g: c, b: x },
    { r: 0, g: x, b: c }, { r: x, g: 0, b: c }, { r: c, g: 0, b: x },
  ];
  const base = table[sector] ?? table[0]!;
  return { r: (base.r + m) * 255, g: (base.g + m) * 255, b: (base.b + m) * 255 };
}

export function hexToHsv(hex: string): Hsv { return rgbToHsv(hexToRgb(hex)); }
export function hsvToHex(hsv: Hsv): string { return rgbToHex(hsvToRgb(hsv)); }

/** Returns a luminance-based ink color so the swatch stays legible. */
export function contrastInk(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#05070C" : "#FFFFFF";
}
