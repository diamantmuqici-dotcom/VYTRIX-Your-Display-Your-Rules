import { useRef, useState } from "react";
import { Settings as SettingsIcon, Download, Upload, Trash2 } from "lucide-react";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { downloadText } from "@/utils/download";

const TABS = ["General", "Display", "Performance", "Privacy", "Account", "Advanced"];

export default function Settings() {
  const { state, setSetting, reset, log } = useApp();
  const { notify } = useToast();
  const [tab, setTab] = useState("General");
  const fileInput = useRef<HTMLInputElement>(null);

  const importConfig = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (!data["settings"]) throw new Error("no settings in file");
      window.localStorage.setItem("vytrix.state.v1", JSON.stringify(data));
      log("Configuration imported; reload to apply");
      notify("Configuration imported — reload to apply");
    } catch (error) { notify(error instanceof Error ? error.message : "Invalid config", "error"); }
  };

  return (
    <div className="page">
      <PageHead title="Settings" description="Local-first configuration. Account and cloud features are additive; the app remains fully usable without them." />
      <div className="tabs">{TABS.map((t) => <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "General" ? <Panel title="General" icon={SettingsIcon}>
        <ToggleRow label="Start with Windows" checked={state.settings.startWithWindows} onChange={(v) => setSetting("startWithWindows", v)} detail="Requires a registered startup entry; no service is installed." />
        <ToggleRow label="Minimize to tray" checked={state.settings.minimizeToTray} onChange={(v) => setSetting("minimizeToTray", v)} />
        <ToggleRow label="Notifications" checked={state.settings.notifications} onChange={(v) => setSetting("notifications", v)} />
        <div className="field" style={{ marginTop: 12 }}><label>Language</label><select value={state.settings.language} onChange={(e) => setSetting("language", e.target.value)}><option value="en">English</option><option value="fr">Français</option><option value="de">Deutsch</option></select></div>
      </Panel> : null}

      {tab === "Display" ? <Panel title="Display defaults">
        <div className="field"><label>Default profile</label><input type="text" value={state.profiles[0]?.name ?? "None"} readOnly /></div>
        <ToggleRow label="Automatic restoration" checked detail="Restores the desktop configuration when a tracked game closes." onChange={() => notify("Managed by the profile engine")} />
        <ToggleRow label="Automatic game switching" checked={state.settings.autoGameSwitch} onChange={(v) => setSetting("autoGameSwitch", v)} />
      </Panel> : null}

      {tab === "Performance" ? <Panel title="Performance">
        <ToggleRow label="Background monitoring" checked={state.settings.notifications} onChange={(v) => setSetting("notifications", v)} detail="Sampling interval is configurable in Performance Monitor." />
        <div className="field"><label>Animation intensity</label><b className="mono">{state.settings.animationIntensity}%</b></div>
      </Panel> : null}

      {tab === "Privacy" ? <Panel title="Privacy">
        <ToggleRow label="Telemetry opt-in" checked={state.settings.telemetryOptIn} onChange={(v) => { setSetting("telemetryOptIn", v); log(`Telemetry ${v ? "enabled" : "disabled"}`); }} detail="Off by default. No diagnostic data leaves the device unless enabled." />
        <div className="row"><span>Local data</span><b className="mono">app data directory</b></div>
        <div className="row"><span>Account</span><span className="badge">not signed in</span></div>
      </Panel> : null}

      {tab === "Account" ? <Panel title="Account">
        <div className="empty"><strong style={{ color: "var(--vy-text)" }}>Offline mode</strong><span>Sign-in, licenses, devices and billing activate when the cloud API is configured. Local features need no account.</span></div>
      </Panel> : null}

      {tab === "Advanced" ? <div className="grid" style={{ gap: 14 }}>
        <Panel title="Configuration">
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => downloadText("vytrix-config.json", JSON.stringify(state, null, 2))}><Download size={14} /> Export</button>
            <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> Import</button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => void importConfig(e.target.files?.[0])} />
            <button className="btn danger" onClick={() => { if (window.confirm("Reset all local VYTRIX settings and data?")) { reset(); notify("Local data reset"); } }}><Trash2 size={14} /> Reset</button>
          </div>
        </Panel>
        <Panel title="Application log">
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {state.history.map((entry, index) => <div className="row" key={`${entry.time}-${index}`}><span className="tiny">{entry.text}</span><span className="tiny mono">{new Date(entry.time).toLocaleString()}</span></div>)}
            {state.history.length === 0 ? <div className="empty">No log entries.</div> : null}
          </div>
        </Panel>
      </div> : null}
    </div>
  );
}
