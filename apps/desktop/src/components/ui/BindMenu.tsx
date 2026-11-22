import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import type { HotkeyAction } from "@vytrix/shared-types";
import {
  ACTION_LABELS, defaultBindingMode, findConflict, hotkeyParts, isHotkeyAction,
} from "@/app/bindings";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";

interface MenuState {
  x: number;
  y: number;
  actions: HotkeyAction[];
}

/** Right-click any feature surface to set its activation mode and key bind. */
export function BindMenuProvider() {
  const { state, setHotkey, setHotkeyMode, log } = useApp();
  const { notify } = useToast();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [capturing, setCapturing] = useState<HotkeyAction | null>(null);

  useEffect(() => {
    const onContext = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const host = target?.closest<HTMLElement>("[data-bind-actions]");
      if (!host) return;
      event.preventDefault();
      const actions = (host.dataset.bindActions ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(isHotkeyAction);
      if (actions.length === 0) return;
      setCapturing(null);
      setMenu({
        x: Math.max(8, Math.min(event.clientX, window.innerWidth - 330)),
        y: Math.max(8, Math.min(event.clientY, window.innerHeight - 240)),
        actions,
      });
    };
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest(".bind-menu")) return;
      setMenu(null);
      setCapturing(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
        setCapturing(null);
      }
    };
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!capturing) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      const parts = hotkeyParts(event);
      const conflict = findConflict(parts, state.hotkeys, capturing);
      if (conflict) {
        notify(`Already used by ${conflict.action}`, "error");
        setCapturing(null);
        return;
      }
      setHotkey(capturing, parts);
      log(`${capturing} bound to ${parts.join("+")}`);
      notify(`${ACTION_LABELS[capturing]} → ${parts.join(" + ")}`);
      setCapturing(null);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [capturing, state.hotkeys, setHotkey, log, notify]);

  if (!menu) return null;

  return (
    <div
      className="bind-menu"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="bind-menu-head">
        <Keyboard size={13} />
        <span>Choose binding</span>
        <button className="bind-menu-close" onClick={() => { setMenu(null); setCapturing(null); }} aria-label="Close">
          <X size={13} />
        </button>
      </div>
      <div className="bind-menu-list">
        {menu.actions.map((action) => {
          const binding = state.hotkeys.find((item) => item.action === action);
          const mode = binding?.mode ?? defaultBindingMode(action);
          return (
            <div className="bind-menu-item" key={action}>
              <div className="bind-menu-label">{ACTION_LABELS[action]}</div>
              <div className="bind-menu-modes">
                <button
                  className={`bind-mode ${mode === "hold" ? "active" : ""}`}
                  onClick={() => setHotkeyMode(action, "hold")}
                >Hold</button>
                <button
                  className={`bind-mode ${mode === "toggle" ? "active" : ""}`}
                  onClick={() => setHotkeyMode(action, "toggle")}
                >Toggle</button>
              </div>
              <button
                className={`bind-key ${capturing === action ? "capturing" : ""}`}
                onClick={() => setCapturing(action)}
              >
                {capturing === action
                  ? "Press any key…"
                  : `Click to choose a key — ${binding?.keys.join(" + ") || "none"}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
