import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AppSettings, ColorField, ColorPreset, ColorSettings, CrosshairCollection,
  CrosshairDesign, CrosshairGameProfile,
  CrosshairStudioSettings, GameEntry, GameProfile, HotkeyBinding, OptimizationTask,
  PhonePermissions, RecentCrosshair, SwitchProfile, SwitchRecord, SwitchStatus, ZoomMode, BindingMode,
} from "@vytrix/shared-types";
import { SECTIONS, type SectionId } from "@vytrix/config";
import { defaultBindingMode, isHotkeyAction } from "@/app/bindings";
import { DEFAULT_COLOR_SETTINGS, clampColorSettings } from "@vytrix/validation";
import { BUILTIN_PRESETS } from "@/data/presets";
import { GAME_CATALOG } from "@/data/games";
import { OPTIMIZER_TASKS } from "@/data/optimizer";
import { applyColor, resetColor, type ColorApplyStatus } from "@/services/color";
import {
  optimizerApply, optimizerApplyAll, optimizerRestore, optimizerTasks,
  setActiveColorPreset,
} from "@/services/optimizer";
import { BUILTIN_CROSSHAIR_PRESETS, DEFAULT_DESIGN, DEFAULT_STUDIO_SETTINGS, PRESET_COLLECTIONS, type CrosshairPreset } from "@/crosshair/model";
import { normalizeDesign } from "@/crosshair/validate";
import {
  setSmartSwitchEnabled,
  smartSwitchHistory,
  syncSmartSwitchProfiles,
} from "@/services/smartSwitch";

const STORAGE_KEY = "vytrix.state.v1";

interface AppState {
  section: SectionId;
  settings: AppSettings;
  color: ColorSettings;
  baseline: ColorSettings;
  presets: ColorPreset[];
  games: GameEntry[];
  profiles: GameProfile[];
  crosshairs: CrosshairDesign[];
  crosshairPresets: CrosshairPreset[];
  crosshairCollections: CrosshairCollection[];
  crosshairGameProfiles: CrosshairGameProfile[];
  crosshairRecent: RecentCrosshair[];
  customCrosshairColors: string[];
  crosshairStudio: CrosshairStudioSettings;
  crosshairTab: string;
  tasks: OptimizationTask[];
  hotkeys: HotkeyBinding[];
  crosshairEnabled: boolean;
  phonePermissions: PhonePermissions;
  favorites: string[];
  history: { time: number; text: string }[];
  colorApplyStatus: ColorApplyStatus | null;
  smartSwitchEnabled: boolean;
  smartSwitchStatus: SwitchStatus | null;
  smartSwitchHistory: SwitchRecord[];
}

interface AppApi {
  state: AppState;
  setSection: (section: SectionId) => void;
  setColorField: (field: ColorField, value: number | null) => void;
  setColor: (color: ColorSettings) => void;
  setBaseline: (color: ColorSettings) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setZoomMode: (mode: ZoomMode) => void;
  applyPreset: (preset: ColorPreset) => void;
  upsertPreset: (preset: ColorPreset) => void;
  removePreset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addGame: (game: GameEntry) => void;
  removeGame: (id: string) => void;
  upsertProfile: (profile: GameProfile) => void;
  removeProfile: (id: string) => void;
  upsertCrosshair: (design: CrosshairDesign) => void;
  removeCrosshair: (id: string) => void;
  setCrosshairDesign: (design: CrosshairDesign) => void;
  setCrosshairTab: (tab: string) => void;
  upsertCrosshairPreset: (preset: CrosshairPreset) => void;
  removeCrosshairPreset: (id: string) => void;
  toggleCrosshairFavorite: (id: string) => void;
  upsertCrosshairCollection: (collection: CrosshairCollection) => void;
  removeCrosshairCollection: (id: string) => void;
  upsertCrosshairGameProfile: (profile: CrosshairGameProfile) => void;
  removeCrosshairGameProfile: (id: string) => void;
  setCrosshairStudioSetting: <K extends keyof CrosshairStudioSettings>(key: K, value: CrosshairStudioSettings[K]) => void;
  addCustomCrosshairColor: (color: string) => void;
  markCrosshairUsed: (id: string) => void;
  applyTask: (id: string) => void;
  restoreTask: (id: string) => void;
  applyAllTasks: () => void;
  refreshTasks: () => void;
  setHotkey: (action: HotkeyBinding["action"], keys: string[]) => void;
  setHotkeyMode: (action: HotkeyBinding["action"], mode: BindingMode) => void;
  setCrosshairEnabled: (enabled: boolean) => void;
  setPhonePermission: (key: keyof PhonePermissions, enabled: boolean) => void;
  log: (text: string) => void;
  setSmartSwitchEnabled: (enabled: boolean) => void;
  setSmartSwitchStatus: (status: SwitchStatus) => void;
  loadSmartSwitchHistory: (limit?: number) => void;
  syncSmartSwitchProfiles: (profiles: SwitchProfile[]) => void;
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
      zoomMode: "hold", zoomLevel: 2, fovDegrees: 90,
    },
    color: { ...DEFAULT_COLOR_SETTINGS },
    baseline: { ...DEFAULT_COLOR_SETTINGS },
    presets: BUILTIN_PRESETS,
    games: GAME_CATALOG,
    profiles: [],
    crosshairs: [DEFAULT_DESIGN],
    crosshairPresets: BUILTIN_CROSSHAIR_PRESETS,
    crosshairCollections: PRESET_COLLECTIONS.map((item) => ({ ...item, designIds: [...item.designIds] })),
    crosshairGameProfiles: [],
    crosshairRecent: [],
    customCrosshairColors: [],
    crosshairStudio: { ...DEFAULT_STUDIO_SETTINGS },
    crosshairTab: "overview",
    tasks: OPTIMIZER_TASKS,
    hotkeys: ([
      { action: "toggle-color", keys: ["Ctrl", "Shift", "C"], mouseButton: null, enabled: true },
      { action: "toggle-crosshair", keys: ["Ctrl", "Shift", "X"], mouseButton: null, enabled: true },
      { action: "open-color-studio", keys: ["Ctrl", "Shift", "V"], mouseButton: null, enabled: true },
      { action: "restore-defaults", keys: ["Ctrl", "Shift", "R"], mouseButton: null, enabled: true },
      { action: "next-crosshair", keys: ["Ctrl", "Alt", "Right"], mouseButton: null, enabled: true },
      { action: "previous-crosshair", keys: ["Ctrl", "Alt", "Left"], mouseButton: null, enabled: true },
      { action: "toggle-overlay", keys: ["Ctrl", "Alt", "O"], mouseButton: null, enabled: true },
      { action: "toggle-zoom", keys: ["Alt", "Z"], mouseButton: null, enabled: true },
      { action: "open-crosshair-studio", keys: ["Ctrl", "Alt", "X"], mouseButton: null, enabled: true },
      { action: "save-crosshair", keys: ["Ctrl", "Alt", "S"], mouseButton: null, enabled: true },
    ] as HotkeyBinding[]).map((binding) => ({ ...binding, mode: defaultBindingMode(binding.action) })),
    crosshairEnabled: false,
    phonePermissions: {
      saturation: true, vibrance: true, gamma: true,
      brightness: true, presets: true, crosshair: false, effects: false,
    },
    favorites: [],
    history: [],
    colorApplyStatus: null,
    smartSwitchEnabled: true,
    smartSwitchStatus: null,
    smartSwitchHistory: [],
  };
}

function validLanguage(value: unknown): "en" | "fr" | "de" | "ru" {
  return value === "fr" || value === "de" || value === "ru" ? value : "en";
}

function validZoomMode(value: unknown): ZoomMode {
  return value === "toggle" ? "toggle" : "hold";
}

function validSection(value: unknown): SectionId {
  // v0.1.2: the standalone snaptap section moved under misc.
  if (value === "snaptap") return "misc";
  return SECTIONS.find((section) => section === value) ?? "overview";
}

function validZoomLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 2;
  return Math.min(8, Math.max(1, Math.round(value * 4) / 4));
}

function validFovDegrees(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 90;
  return Math.min(90, Math.max(30, Math.round(value)));
}

/** Older saved states have no per-binding mode; zoom inherits the legacy setting. */
function validHotkeys(value: unknown, fallback: HotkeyBinding[], legacyZoomMode: unknown): HotkeyBinding[] {
  if (!Array.isArray(value)) return fallback;
  const out: HotkeyBinding[] = [];
  for (const raw of value.slice(0, 40)) {
    const item = raw as Partial<HotkeyBinding>;
    const action = item?.action;
    if (!action || !isHotkeyAction(action)) continue;
    const keys = Array.isArray(item.keys)
      ? item.keys.map((key) => String(key).slice(0, 24)).filter(Boolean).slice(0, 4)
      : [];
    const mode: BindingMode = item.mode === "hold" || item.mode === "toggle"
      ? item.mode
      : action === "toggle-zoom"
        ? validZoomMode(legacyZoomMode)
        : "toggle";
    // Toggle zoom keeps manual control with no key; every other empty bind is
    // a corrupt save and must fall back to the default.
    if (keys.length === 0 && !(action === "toggle-zoom" && mode === "toggle")) continue;
    out.push({
      action,
      keys,
      mouseButton: typeof item.mouseButton === "number" ? item.mouseButton : null,
      enabled: item.enabled !== false,
      mode,
    });
  }
  // Saved states from older builds can omit a binding. Merge by action over
  // the defaults so toggle-zoom always exists after load.
  const byAction = new Map(fallback.map((binding) => [binding.action, binding]));
  for (const binding of out) byAction.set(binding.action, binding);
  return [...byAction.values()];
}

function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();
    const savedCrosshairs = Array.isArray(parsed.crosshairs) ? parsed.crosshairs : base.crosshairs;
    const hotkeys = validHotkeys(parsed.hotkeys, base.hotkeys, parsed.settings?.zoomMode);
    const zoomMode = hotkeys.find((item) => item.action === "toggle-zoom")?.mode
      ?? validZoomMode(parsed.settings?.zoomMode);
    return {
      ...base,
      ...parsed,
      section: validSection(parsed.section),
      color: clampColorSettings(parsed.color ?? base.color),
      baseline: clampColorSettings(parsed.baseline ?? base.baseline),
      settings: {
        ...base.settings,
        ...parsed.settings,
        language: validLanguage(parsed.settings?.language),
        zoomMode,
        zoomLevel: validZoomLevel(parsed.settings?.zoomLevel),
        fovDegrees: validFovDegrees(parsed.settings?.fovDegrees),
      },
      hotkeys,
      crosshairs: savedCrosshairs.slice(0, 100).map((design) => normalizeDesign(design)),
      crosshairPresets: Array.isArray(parsed.crosshairPresets)
        ? parsed.crosshairPresets.slice(0, 200).map((preset) => {
          const source = preset as CrosshairPreset;
          return { ...source, ...normalizeDesign(source), builtIn: false };
        })
        : base.crosshairPresets,
      crosshairCollections: Array.isArray(parsed.crosshairCollections)
        ? parsed.crosshairCollections.slice(0, 100).map((collection) => ({
          id: String(collection.id ?? "").replace(/[^\w-]/g, "").slice(0, 120),
          name: String(collection.name ?? "Collection").slice(0, 80),
          designIds: (Array.isArray(collection.designIds) ? collection.designIds : []).slice(0, 200).map(String),
          createdAt: Number.isFinite(collection.createdAt) ? Number(collection.createdAt) : 0,
        })).filter((collection) => collection.id)
        : base.crosshairCollections,
      crosshairGameProfiles: Array.isArray(parsed.crosshairGameProfiles)
        ? parsed.crosshairGameProfiles.slice(0, 200).map((profile) => ({
          id: String(profile.id ?? "").replace(/[^\w-]/g, "").slice(0, 120),
          gameId: String(profile.gameId ?? "").replace(/[^\w-]/g, "").slice(0, 120),
          gameName: String(profile.gameName ?? "").slice(0, 120),
          designId: String(profile.designId ?? "").replace(/[^\w-]/g, "").slice(0, 120),
          presetId: typeof profile.presetId === "string" ? profile.presetId.slice(0, 120) : null,
          autoSwitch: profile.autoSwitch === true,
          lastUsed: Number.isFinite(profile.lastUsed) ? Number(profile.lastUsed) : 0,
        })).filter((profile) => profile.id && profile.gameId)
        : base.crosshairGameProfiles,
      crosshairRecent: Array.isArray(parsed.crosshairRecent)
        ? parsed.crosshairRecent.slice(0, 12).map((item) => ({
          id: String(item.id ?? "").slice(0, 120),
          usedAt: Number.isFinite(item.usedAt) ? Number(item.usedAt) : 0,
        }))
        : base.crosshairRecent,
      customCrosshairColors: Array.isArray(parsed.customCrosshairColors)
        ? parsed.customCrosshairColors.filter((item) => typeof item === "string" && /^#[0-9A-F]{6}$/i.test(item)).slice(0, 32)
        : base.customCrosshairColors,
      crosshairStudio: { ...base.crosshairStudio, ...parsed.crosshairStudio },
      crosshairTab: typeof parsed.crosshairTab === "string" ? parsed.crosshairTab.slice(0, 40) : base.crosshairTab,
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

  const pushColor = useCallback((color: ColorSettings, monitorId: string | null = null) => {
    applyColor(color, reportColor, monitorId);
  }, [reportColor]);

  // The Overview metric must name the exact preset the user selected.
  const recordPreset = useCallback((name: string) => {
    void setActiveColorPreset(name);
  }, []);

  const refreshTasks = useCallback(() => {
    void optimizerTasks().then((tasks) => {
      if (!tasks) return;
      setState((s) => ({
        ...s,
        tasks: tasks.map((task) => {
          const prior = s.tasks.find((item) => item.id === task.id);
          return { ...task, previousValue: prior?.previousValue ?? null };
        }),
      }));
    });
  }, []);

  useEffect(() => { refreshTasks(); }, [refreshTasks]);

  const api = useMemo<AppApi>(() => ({
    state,
    setSection: (section) => setState((s) => ({ ...s, section })),
    setColorField: (field, value) => setState((s) => {
      const color = clampColorSettings({ ...s.color, [field]: value });
      pushColor(color, s.settings.monitorId);
      recordPreset("Custom");
      return { ...s, color };
    }),
    setColor: (color) => setState((s) => {
      const next = clampColorSettings(color);
      pushColor(next, s.settings.monitorId);
      recordPreset("Custom");
      return { ...s, color: next };
    }),
    setBaseline: (baseline) => setState((s) => ({ ...s, baseline: clampColorSettings(baseline) })),
    setSetting: (key, value) => setState((s) => {
    if (key === "zoomMode") {
      const mode = value as AppSettings["zoomMode"];
      return {
        ...s,
        settings: { ...s.settings, zoomMode: mode },
        // The OS registration and the native controller both read the binding
        // mode. Leaving it on hold after a dropdown change killed the toggle.
        hotkeys: s.hotkeys.map((h) => h.action === "toggle-zoom" ? { ...h, mode } : h),
      };
    }
    return { ...s, settings: { ...s.settings, [key]: value } };
  }),
  setZoomMode: (mode) => setState((s) => ({
    ...s,
    settings: { ...s.settings, zoomMode: mode },
    hotkeys: s.hotkeys.map((h) => h.action === "toggle-zoom" ? { ...h, mode } : h),
  })),
    applyPreset: (preset) => setState((s) => {
      const color = clampColorSettings(preset.settings);
      pushColor(color, s.settings.monitorId);
      recordPreset(preset.name);
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
    setCrosshairDesign: (design) => setState((s) => ({
      ...s,
      crosshairs: [...s.crosshairs.filter((item) => item.id !== design.id), design].slice(0, 100),
    })),
    setCrosshairTab: (crosshairTab) => setState((s) => ({ ...s, crosshairTab })),
    upsertCrosshairPreset: (preset) => setState((s) => ({
      ...s,
      crosshairPresets: [...s.crosshairPresets.filter((item) => item.id !== preset.id || item.builtIn), preset].slice(0, 200),
    })),
    removeCrosshairPreset: (id) => setState((s) => ({
      ...s,
      crosshairPresets: s.crosshairPresets.filter((item) => item.id !== id || item.builtIn),
    })),
    toggleCrosshairFavorite: (id) => setState((s) => ({
      ...s,
      crosshairPresets: s.crosshairPresets.map((preset) =>
        preset.id === id ? { ...preset, favorite: !preset.favorite } : preset),
    })),
    upsertCrosshairCollection: (collection) => setState((s) => ({
      ...s,
      crosshairCollections: [...s.crosshairCollections.filter((item) => item.id !== collection.id), collection].slice(0, 100),
    })),
    removeCrosshairCollection: (id) => setState((s) => ({
      ...s, crosshairCollections: s.crosshairCollections.filter((item) => item.id !== id),
    })),
    upsertCrosshairGameProfile: (profile) => setState((s) => ({
      ...s,
      crosshairGameProfiles: [...s.crosshairGameProfiles.filter((item) => item.id !== profile.id), profile].slice(0, 200),
    })),
    removeCrosshairGameProfile: (id) => setState((s) => ({
      ...s, crosshairGameProfiles: s.crosshairGameProfiles.filter((item) => item.id !== id),
    })),
    setCrosshairStudioSetting: (key, value) => setState((s) => ({
      ...s, crosshairStudio: { ...s.crosshairStudio, [key]: value },
    })),
    addCustomCrosshairColor: (value) => setState((s) => ({
      ...s,
      customCrosshairColors: /^#[0-9A-F]{6}$/i.test(value)
        ? [value.toUpperCase(), ...s.customCrosshairColors.filter((item) => item !== value.toUpperCase())].slice(0, 32)
        : s.customCrosshairColors,
    })),
    markCrosshairUsed: (id) => setState((s) => ({
      ...s,
      crosshairRecent: [{ id, usedAt: Date.now() }, ...s.crosshairRecent.filter((item) => item.id !== id)].slice(0, 12),
    })),
    applyTask: (id) => {
      const task = state.tasks.find((item) => item.id === id);
      void optimizerApply(id).then((outcome) => {
        if (!outcome) return;
        log(`${task?.name ?? id}: ${outcome.message}${outcome.previous ? ` (was ${outcome.previous})` : ""}`);
        refreshTasks();
      });
    },
    restoreTask: (id) => {
      const task = state.tasks.find((item) => item.id === id);
      void optimizerRestore(id).then((outcome) => {
        if (!outcome) return;
        log(`${task?.name ?? id}: ${outcome.message}`);
        refreshTasks();
      });
    },
    applyAllTasks: () => {
      void optimizerApplyAll().then((outcomes) => {
        if (!outcomes) return;
        const ok = outcomes.filter((item) => item.applied).length;
        const failed = outcomes.filter((item) => !item.applied);
        log(`Applied ${ok} of ${outcomes.length} optimizations`);
        for (const item of failed) log(`${item.id}: ${item.message}`);
        refreshTasks();
      });
    },
    refreshTasks,
    setHotkey: (action, keys) => setState((s) => ({
      ...s,
      hotkeys: s.hotkeys.map((h) => h.action === action ? { ...h, keys } : h),
    })),
    setHotkeyMode: (action, mode) => setState((s) => ({
      ...s,
      hotkeys: s.hotkeys.map((h) => h.action === action ? { ...h, mode } : h),
      settings: action === "toggle-zoom" ? { ...s.settings, zoomMode: mode } : s.settings,
    })),
    setCrosshairEnabled: (crosshairEnabled) => setState((s) => ({ ...s, crosshairEnabled })),
    setPhonePermission: (key, enabled) => setState((s) => ({
      ...s, phonePermissions: { ...s.phonePermissions, [key]: enabled },
    })),
    setSmartSwitchEnabled: (enabled) => {
      setState((s) => ({
        ...s,
        smartSwitchEnabled: enabled,
        settings: { ...s.settings, autoGameSwitch: enabled },
      }));
      void setSmartSwitchEnabled(enabled, state.color).then((status) => {
        if (status) setState((s) => ({ ...s, smartSwitchStatus: status }));
      });
    },
    setSmartSwitchStatus: (status) => setState((s) => ({ ...s, smartSwitchStatus: status })),
    loadSmartSwitchHistory: (limit) => {
      void smartSwitchHistory(limit).then((records) => {
        setState((s) => ({ ...s, smartSwitchHistory: records }));
      });
    },
    syncSmartSwitchProfiles: (profiles) => {
      void syncSmartSwitchProfiles(profiles).then((status) => {
        if (status) setState((s) => ({ ...s, smartSwitchStatus: status }));
      });
    },
    log,
    reset: () => {
      setState(defaultState());
      void resetColor(null, reportColor);
      recordPreset("Custom");
    },
  }), [state, log, pushColor, reportColor, recordPreset, refreshTasks]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
