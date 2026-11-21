import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AppSettings, ColorField, ColorPreset, ColorSettings, CrosshairConfig,
  GameEntry, GameProfile, HotkeyBinding, OptimizationTask, PhonePermissions,
} from "@vytrix/shared-types";
import type { SectionId } from "@vytrix/config";
import { DEFAULT_COLOR_SETTINGS, clampColorSettings } from "@vytrix/validation";
import { BUILTIN_PRESETS } from "@/data/presets";
import { GAME_CATALOG } from "@/data/games";
import { OPTIMIZER_TASKS } from "@/data/optimizer";
import { applyColor, resetColor, type ColorApplyStatus } from "@/services/color";

const STORAGE_KEY = "vytrix.state.v1";

interface AppState {
  section: SectionId;
  settings: AppSettings;
  color: ColorSettings;
  baseline: ColorSettings;
  presets: ColorPreset[];
  games: GameEntry[];
  profiles: GameProfile[];
  crosshairs: CrosshairConfig[];
  tasks: OptimizationTask[];
  hotkeys: HotkeyBinding[];
  crosshairEnabled: boolean;
  phonePermissions: PhonePermissions;
  favorites: string[];
  history: { time: number; text: string }[];
  colorApplyStatus: ColorApplyStatus | null;
}

interface AppApi {
  state: AppState;
  setSection: (section: SectionId) => void;
  setColorField: (field: ColorField, value: number | null) => void;
  setColor: (color: ColorSettings) => void;
  setBaseline: (color: ColorSettings) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  applyPreset: (preset: ColorPreset) => void;
  upsertPreset: (preset: ColorPreset) => void;
  removePreset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addGame: (game: GameEntry) => void;
  removeGame: (id: string) => void;
  upsertProfile: (profile: GameProfile) => void;
  removeProfile: (id: string) => void;
  upsertCrosshair: (design: CrosshairConfig) => void;
  removeCrosshair: (id: string) => void;
  applyTask: (id: string) => void;
  restoreTask: (id: string) => void;
  setHotkey: (action: HotkeyBinding["action"], keys: string[]) => void;
  setCrosshairEnabled: (enabled: boolean) => void;
  setPhonePermission: (key: keyof PhonePermissions, enabled: boolean) => void;
  log: (text: string) => void;
  reset: () => void;
}

function defaultState(): AppState {
  return {
    section: "overview",
    settings: {
      theme: "dark", accent: "#00D9FF", cornerRadius: 12, uiScale: 100,
      animationIntensity: 100, reducedMotion: false, startWithWindows: false,
      minimizeToTray: true, notifications: true, language: "en",
      autoGameSwitch: true, telemetryOptIn: false, monitorId: null,
    },
    color: { ...DEFAULT_COLOR_SETTINGS },
    baseline: { ...DEFAULT_COLOR_SETTINGS },
    presets: BUILTIN_PRESETS,
    games: GAME_CATALOG,
    profiles: [],
    crosshairs: [{
      id: "default-dot", name: "Precision Dot", style: "dot", color: "#00D9FF",
      thickness: 2, gap: 0, length: 4, opacity: 0.9, outline: true, centerDot: true,
      rotation: 0, scale: 1, monitorId: null, offsetX: 0, offsetY: 0,
    }],
    tasks: OPTIMIZER_TASKS,
    hotkeys: [
      { action: "toggle-color", keys: ["Ctrl", "Shift", "C"], mouseButton: null, enabled: true },
      { action: "toggle-crosshair", keys: ["Ctrl", "Shift", "X"], mouseButton: null, enabled: true },
      { action: "open-color-studio", keys: ["Ctrl", "Shift", "V"], mouseButton: null, enabled: true },
      { action: "restore-defaults", keys: ["Ctrl", "Shift", "R"], mouseButton: null, enabled: true },
    ],
    crosshairEnabled: false,
    phonePermissions: {
      saturation: true, vibrance: true, gamma: true,
      brightness: true, presets: true, crosshair: false, effects: false,
    },
    favorites: [],
    history: [],
    colorApplyStatus: null,
  };
}

function validLanguage(value: unknown): "en" | "fr" | "de" | "ru" {
  return value === "fr" || value === "de" || value === "ru" ? value : "en";
}

function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      color: clampColorSettings(parsed.color ?? base.color),
      baseline: clampColorSettings(parsed.baseline ?? base.baseline),
      settings: { ...base.settings, ...parsed.settings, language: validLanguage(parsed.settings?.language) },
    };
  } catch {
    return defaultState();
  }
}

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset["theme"] = state.settings.theme;
    document.documentElement.style.setProperty("--vy-accent", state.settings.accent);
    document.documentElement.style.setProperty("--vy-radius-lg", `${state.settings.cornerRadius}px`);
    document.documentElement.style.zoom = String(state.settings.uiScale / 100);
  }, [state.settings.theme, state.settings.accent, state.settings.cornerRadius, state.settings.uiScale]);

  const log = useCallback((text: string) => {
    setState((s) => ({ ...s, history: [{ time: Date.now(), text }, ...s.history].slice(0, 200) }));
  }, []);

  const reportColor = useCallback((status: ColorApplyStatus) => {
    setState((s) => ({ ...s, colorApplyStatus: status }));
  }, []);

  const pushColor = useCallback((color: ColorSettings) => {
    applyColor(color, reportColor);
  }, [reportColor]);

  const api = useMemo<AppApi>(() => ({
    state,
    setSection: (section) => setState((s) => ({ ...s, section })),
    setColorField: (field, value) => setState((s) => {
      const color = clampColorSettings({ ...s.color, [field]: value });
      pushColor(color);
      return { ...s, color };
    }),
    setColor: (color) => setState((s) => {
      const next = clampColorSettings(color);
      pushColor(next);
      return { ...s, color: next };
    }),
    setBaseline: (baseline) => setState((s) => ({ ...s, baseline: clampColorSettings(baseline) })),
    setSetting: (key, value) => setState((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),
    applyPreset: (preset) => setState((s) => {
      const color = clampColorSettings(preset.settings);
      pushColor(color);
      return { ...s, color };
    }),
    upsertPreset: (preset) => setState((s) => ({
      ...s, presets: [...s.presets.filter((p) => p.id !== preset.id), preset],
    })),
    removePreset: (id) => setState((s) => ({ ...s, presets: s.presets.filter((p) => p.id !== id || p.builtIn) })),
    toggleFavorite: (id) => setState((s) => ({
      ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
    })),
    addGame: (game) => setState((s) => ({ ...s, games: [game, ...s.games.filter((g) => g.id !== game.id)] })),
    removeGame: (id) => setState((s) => ({ ...s, games: s.games.filter((g) => g.id !== id) })),
    upsertProfile: (profile) => setState((s) => ({
      ...s, profiles: [...s.profiles.filter((p) => p.id !== profile.id), profile],
    })),
    removeProfile: (id) => setState((s) => ({ ...s, profiles: s.profiles.filter((p) => p.id !== id) })),
    upsertCrosshair: (design) => setState((s) => ({
      ...s, crosshairs: [...s.crosshairs.filter((c) => c.id !== design.id), design].slice(0, 100),
    })),
    removeCrosshair: (id) => setState((s) => ({ ...s, crosshairs: s.crosshairs.filter((c) => c.id !== id) })),
    applyTask: (id) => setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => t.id === id ? { ...t, applied: true, previousValue: t.previousValue ?? t.currentState, currentState: t.recommendedState } : t),
    })),
    restoreTask: (id) => setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => t.id === id ? {
        ...t, applied: false, currentState: t.previousValue ?? t.currentState, previousValue: null,
      } : t),
    })),
    setHotkey: (action, keys) => setState((s) => ({
      ...s, hotkeys: s.hotkeys.map((h) => h.action === action ? { ...h, keys } : { ...h, keys: h.keys }),
    })),
    setCrosshairEnabled: (crosshairEnabled) => setState((s) => ({ ...s, crosshairEnabled })),
    setPhonePermission: (key, enabled) => setState((s) => ({
      ...s, phonePermissions: { ...s.phonePermissions, [key]: enabled },
    })),
    log,
    reset: () => {
      setState(defaultState());
      void resetColor(reportColor);
    },
  }), [state, log, pushColor, reportColor]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
