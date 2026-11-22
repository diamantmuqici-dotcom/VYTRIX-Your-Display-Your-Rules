import { useEffect, useState } from "react";
import { Keyboard, AlertTriangle } from "lucide-react";
import type { HotkeyAction } from "@vytrix/shared-types";
import { ACTION_LABELS, defaultBindingMode, hotkeyParts } from "@/app/bindings";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";

const ACTIONS: HotkeyAction[] = [
  "toggle-color", "next-preset", "previous-preset", "open-color-studio",
  "toggle-crosshair", "toggle-zoom", "switch-profile", "restore-defaults",
];

export default function Hotkeys() {
  const { state, setHotkey, log } = useApp();
  const { notify } = useToast();
  const [capturing, setCapturing] = useState<HotkeyAction | null>(null);
  const [conflict, setConflict] = useState("");

  useEffect(() => {
    if (!capturing) return;
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      const parts = hotkeyParts(event);
      const duplicate = state.hotkeys.find((h) => h.action !== capturing && h.keys.join("+") === parts.join("+"));
      if (duplicate) { setConflict(`Already used by ${duplicate.action}`); setCapturing(null); return; }
      setConflict("");
      setHotkey(capturing, parts);
      log(`Hotkey ${capturing} set to ${parts.join("+")}`);
      setCapturing(null);
      notify("Shortcut updated");
    };
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, [capturing, state.hotkeys, setHotkey, log, notify]);

  return (
    <div className="page">
      <PageHead title="Hotkeys & Automation" description="Shortcuts are registered explicitly with the OS, never inferred from continuously recorded keyboard input. Conflicts are rejected before assignment." />
      {conflict ? <div className="notice" style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}><AlertTriangle size={15} /> {conflict}</div> : null}
      <Panel title="Shortcuts" icon={Keyboard}>
        <table className="table">
          <thead><tr><th>Action</th><th>Combination</th><th>Mode</th><th>State</th><th /></tr></thead>
          <tbody>
            {ACTIONS.map((action) => {
              const binding = state.hotkeys.find((h) => h.action === action);
              return (
                <tr key={action} data-bind-actions={action} title="Right-click for hold / toggle and key bind">
                  <td>{ACTION_LABELS[action]}</td>
                  <td className="mono">{binding?.keys.join(" + ") ?? "unbound"}</td>
                  <td className="mono">{binding?.mode ?? defaultBindingMode(action)}</td>
                  <td><span className={`badge ${binding?.enabled ? "success" : ""}`}>{binding?.enabled ? "enabled" : "disabled"}</span></td>
                  <td><button className={`btn ${capturing === action ? "primary" : ""}`} onClick={() => setCapturing(action)}>{capturing === action ? "Press keys…" : "Change"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <Panel title="Global behavior" className="elevated" >
        <ToggleRow label="Automatic game profile switching" checked={state.settings.autoGameSwitch} onChange={(v) => log(`Auto switching ${v ? "enabled" : "disabled"}`)} detail="Applies a profile when a supported game is detected and restores the desktop configuration on exit." />
      </Panel>
    </div>
  );
}
