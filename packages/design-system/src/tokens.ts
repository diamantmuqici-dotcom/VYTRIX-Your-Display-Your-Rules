export const colors = {
  background: {
    main: "#080B12",
    secondary: "#0D1220",
    sidebar: "#0A0E18",
    card: "#111827",
    elevated: "#172033",
  },
  brand: {
    cyan: "#00D9FF",
    blue: "#286BFF",
    purple: "#8B5CF6",
    gradient: "linear-gradient(135deg, #00D9FF 0%, #6557FF 52%, #A855F7 100%)",
  },
  text: { primary: "#F8FAFC", secondary: "#A1AEC0", muted: "#68758A" },
  status: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444" },
} as const;

export const radii = { sm: 8, md: 10, lg: 12, xl: 16 } as const;

export const typography = {
  ui: "'Inter', system-ui, -apple-system, sans-serif",
  display: "'Space Grotesk', 'Inter', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 } as const,
} as const;

export const motion = {
  fast: 120,
  base: 180,
  slow: 280,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export type ThemeName = "dark" | "light" | "midnight" | "cyan" | "purple" | "red";

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  accent: string;
  accentSecondary: string;
  background: string;
  surface: string;
  text: string;
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  dark: {
    name: "dark",
    label: "VYTRIX Dark",
    accent: colors.brand.cyan,
    accentSecondary: colors.brand.purple,
    background: colors.background.main,
    surface: colors.background.card,
    text: colors.text.primary,
  },
  light: {
    name: "light",
    label: "Light",
    accent: "#0891B2",
    accentSecondary: "#7C3AED",
    background: "#F4F7FB",
    surface: "#FFFFFF",
    text: "#0F172A",
  },
  midnight: {
    name: "midnight",
    label: "Midnight",
    accent: "#38BDF8",
    accentSecondary: "#6366F1",
    background: "#05060C",
    surface: "#0E1120",
    text: "#E6EDF7",
  },
  cyan: {
    name: "cyan",
    label: "Cyan",
    accent: "#00D9FF",
    accentSecondary: "#22D3EE",
    background: "#061016",
    surface: "#0C1A24",
    text: "#ECFEFF",
  },
  purple: {
    name: "purple",
    label: "Purple",
    accent: "#A855F7",
    accentSecondary: "#6366F1",
    background: "#0B0714",
    surface: "#160E28",
    text: "#F5F3FF",
  },
  red: {
    name: "red",
    label: "Red",
    accent: "#F43F5E",
    accentSecondary: "#F97316",
    background: "#120608",
    surface: "#1E0D11",
    text: "#FFF1F2",
  },
};
