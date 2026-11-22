import type { SectionId } from "@vytrix/config";
import type { BindingMode, HotkeyAction } from "@vytrix/shared-types";

export const HOTKEY_ACTIONS: readonly HotkeyAction[] = [
  "toggle-color", "next-preset", "previous-preset", "open-color-studio",
  "toggle-crosshair", "toggle-zoom", "switch-profile", "restore-defaults",
  "next-crosshair", "previous-crosshair", "toggle-overlay", "open-crosshair-studio", "save-crosshair",
] as const;

export const ACTION_LABELS: Record<HotkeyAction, string> = {
  "toggle-color": "Enable / disable color tuning",
  "next-preset": "Switch to next preset",
  "previous-preset": "Switch to previous preset",
  "open-color-studio": "Open Color Studio",
  "toggle-crosshair": "Enable / disable crosshair",
  "toggle-zoom": "Accessibility zoom",
  "switch-profile": "Switch game profile",
  "restore-defaults": "Restore normal colors",
  "next-crosshair": "Next crosshair",
  "previous-crosshair": "Previous crosshair",
  "toggle-overlay": "Enable / disable overlay",
  "open-crosshair-studio": "Open Crosshair Studio",
  "save-crosshair": "Save current crosshair",
};

/** Zoom starts in hold mode; every other feature starts as a toggle. */
export function defaultBindingMode(action: HotkeyAction): BindingMode {
  return action === "toggle-zoom" ? "hold" : "toggle";
}

export function isHotkeyAction(value: string): value is HotkeyAction {
  return (HOTKEY_ACTIONS as readonly string[]).includes(value);
}

/** Features reachable from a section, in the order the context menu lists them. */
export const SECTION_BINDINGS: Partial<Record<SectionId, HotkeyAction[]>> = {
  "overview": ["toggle-color", "restore-defaults"],
  "game-profiles": ["switch-profile"],
  "color-studio": ["toggle-color", "restore-defaults", "next-preset", "previous-preset", "open-color-studio"],
  "preset-library": ["next-preset", "previous-preset"],
  "crosshair": ["toggle-crosshair", "toggle-overlay", "next-crosshair", "previous-crosshair", "open-crosshair-studio", "save-crosshair"],
  "effects": ["toggle-color", "toggle-crosshair", "toggle-zoom"],
  "hotkeys": [...HOTKEY_ACTIONS],
  "misc": ["toggle-zoom", "toggle-overlay"],
};

/** Canonical key names shared by OS registration, hold polling and zoom polling. */
export function hotkeyParts(event: KeyboardEvent): string[] {
  const named: Record<string, string> = {
    ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
    Escape: "Esc", Esc: "Esc", Control: "Ctrl", " ": "Space", Spacebar: "Space",
    PageUp: "PageUp", PageDown: "PageDown",
  };
  const raw = event.key.length === 1
    ? event.key.toUpperCase()
    : named[event.key] ?? event.key.toUpperCase();
  return Array.from(new Set([
    event.ctrlKey ? "Ctrl" : null,
    event.shiftKey ? "Shift" : null,
    event.altKey ? "Alt" : null,
    raw,
  ].filter(Boolean) as string[]));
}

/** True when a captured combination is already assigned to another feature. */
export function findConflict(keys: string[], hotkeys: { action: HotkeyAction; keys: string[] }[], except: HotkeyAction) {
  return hotkeys.find((item) => item.action !== except && item.keys.join("+") === keys.join("+"));
}
