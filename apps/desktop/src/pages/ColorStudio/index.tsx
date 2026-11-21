import { useEffect, useState } from "react";
import { RotateCcw, Save, Share2, Download, Upload, Monitor } from "lucide-react";
import type { ColorField, ColorPreset } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { createPreset, serializePreset, parseShareCode, shareCode } from "@vytrix/preset-format";
import { presetCss } from "@/data/presets";
import { downloadText } from "@/utils/download";
import { clampColorSettings } from "@vytrix/validation";

type MonitorInfo = { id: string; name: string; backend: string };
const RANGES: Record<ColorField, [number, number, string]> = {
  saturation: [0, 300, "%"], vibrance: [0, 300, "%"], gamma: [50, 250, "%"],
  brightness: [0, 200, "%"], contrast: [0, 200, "%"], hue: [0, 360, "°"],
  red: [0, 200, "%"], green: [0, 200, "%"], blue: [0, 200, "%"], temperatureK: [1000, 12000, "K"],
};

export default function ColorStudio() {
  const { state, setColorField, setColor, setBaseline, applyPreset, upsertPreset, log } = useApp();
  const { notify } = useToast();
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [presetName, setPresetName] = useState("");
  const [shareInput, setShareInput] = useState("");

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    invokeNative<MonitorInfo[]>("list_monitors").then((result) => { if (active && result.ok) setMonitors(result.data); });
    return () => { active = false; };
  }, []);

  const activeBackend = monitors[0]?.backend ?? (isTauriRuntime() ? "detecting" : "local preview");

  const savePreset = () => {
    if (!presetName.trim()) { notify("Name the preset first", "error"); return; }
    const preset: ColorPreset = {
      id: `custom-${Date.now()}`, name: presetName.trim(), description: "User created color preset",
      category: "Custom", settings: { ...state.color }, thumbnail: "linear-gradient(135deg,#00D9FF,#A855F7)", builtIn: false,
    };
    upsertPreset(preset);
    setPresetName("");
    log(`Saved color preset ${preset.name}`);
    notify("Preset saved");
  };

  const importShare = () => {
    try {
      const file = parseShareCode(shareInput.trim());
      if (file.kind !== "color") { notify("Not a color preset", "error"); return; }
      const settings = clampColorSettings(file.payload as Record<string, number | null>);
      const imported: ColorPreset = {
        id: `import-${Date.now()}`, name: file.name, description: file.description, category: "Imported",
        settings, thumbnail: "linear-gradient(135deg,#8B5CF6,#00D9FF)", builtIn: false,
      };
      upsertPreset(imported);
      applyPreset(imported);
      log(`Imported color preset ${file.name}`);
      notify(`Imported ${file.name}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Invalid share code", "error");
    }
  };

  return (
    <div className="page">
      <PageHead title="Color Studio" description="Calibrate saturation, vibrance, gamma, brightness, contrast and individual channels. The active backend is shown honestly — a software filter is never labelled as hardware vibrance." />

      <div className="preview-pair" style={{ marginBottom: 14 }}>
        <div className="preview-pane" style={{ background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }}>
          <div className="preview-overlay" style={{ ...presetCss({ ...state.presets[0]!, settings: state.baseline }), background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }} />
          <span className="label">Before · baseline</span>
        </div>
        <div className="preview-pane" style={{ background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }}>
          <div className="preview-overlay" style={{ ...presetCss({ ...state.presets[0]!, settings: state.color }), background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }} />
          <span className="label">After · live</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel title="Color controls" action={<span className="badge accent">{activeBackend}</span>}>
          <div className="field"><label>Target display</label><select value={state.settings.monitorId ?? ""} onChange={(e) => log(`Target display ${e.target.value}`)}>
            <option value="">Default display</option>
            {monitors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
          <div className="grid grid-2">
            {(Object.keys(RANGES) as ColorField[]).map((field) => {
              const [min, max, suffix] = RANGES[field];
              const raw = state.color[field];
              return <ParamSlider key={field} label={field} value={raw === null ? min : raw} min={min} max={max} suffix={suffix}
                onChange={(v) => setColorField(field, field === "temperatureK" ? v : v)}
                onReset={() => setColorField(field, field === "temperatureK" ? 6500 : field === "hue" ? 0 : 100)} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button className="btn primary" onClick={() => { setBaseline({ ...state.color }); notify("Baseline captured"); }}><Save size={14} /> Set baseline</button>
            <button className="btn" onClick={() => { setColor({ ...state.baseline }); notify("Restored baseline"); }}><RotateCcw size={14} /> Restore baseline</button>
            <button className="btn" onClick={() => { const file = createPreset({ kind: "color", name: "Current", description: "", author: "VYTRIX", payload: { ...state.color } }); downloadText("vytrix-color.vytrixpreset", serializePreset(file)); }}><Download size={14} /> Export</button>
          </div>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Presets">
            <div className="field"><label>New preset name</label><input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="My look" /></div>
            <button className="btn primary" onClick={savePreset}>Save current</button>
            <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto" }}>
              {state.presets.filter((p) => p.category !== "Imported").map((preset) => (
                <button key={preset.id} className="nav-item" onClick={() => { applyPreset(preset); notify(`Applied ${preset.name}`); }}>
                  <i style={{ width: 18, height: 18, borderRadius: 5, background: preset.thumbnail, flex: "none" }} />
                  <span className="nav-text">{preset.name}<small className="tiny" style={{ display: "block" }}>{preset.category}</small></span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Share code">
            <div className="field"><label>Import VYTRIX1 code</label><textarea rows={3} value={shareInput} onChange={(e) => setShareInput(e.target.value)} placeholder="VYTRIX1...." /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={importShare}><Upload size={14} /> Import</button>
              <button className="btn" onClick={() => {
                const file = createPreset({ kind: "color", name: "Shared", description: "", author: "VYTRIX", payload: { ...state.color } });
                const code = shareCode(file); void navigator.clipboard?.writeText(code); notify("Share code copied");
              }}><Share2 size={14} /> Copy share code</button>
            </div>
            <div className="tiny" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><Monitor size={12} /> Preset files are inert JSON; scripts and paths are rejected on import.</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
