import { useEffect, useState } from "react";
import { RotateCcw, Save, Share2, Download, Upload, Monitor } from "lucide-react";
import type { ColorField, ColorPreset } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { createPreset, serializePreset, parseShareCode, shareCode } from "@vytrix/preset-format";
import { presetCss, temperatureTint } from "@/data/presets";
import { downloadText } from "@/utils/download";
import { clampColorSettings } from "@vytrix/validation";
import { applyColorNow } from "@/services/color";
import { useT } from "@/i18n";

type MonitorInfo = { id: string; name: string; backend: string };
const RANGES: Record<ColorField, [number, number, string]> = {
  saturation: [0, 300, "%"], vibrance: [0, 300, "%"], gamma: [50, 250, "%"],
  brightness: [0, 200, "%"], contrast: [0, 200, "%"], hue: [0, 360, "°"],
  red: [0, 200, "%"], green: [0, 200, "%"], blue: [0, 200, "%"], temperatureK: [1000, 12000, "K"],
};

export default function ColorStudio() {
  const { state, setColorField, setColor, setBaseline, applyPreset, upsertPreset, log } = useApp();
  const { notify } = useToast();
  const t = useT();
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
  const baselineTint = temperatureTint(state.baseline.temperatureK);
  const currentTint = temperatureTint(state.color.temperatureK);

  const savePreset = () => {
    if (!presetName.trim()) { notify(t("color.nameFirst"), "error"); return; }
    const preset: ColorPreset = {
      id: `custom-${Date.now()}`, name: presetName.trim(), description: "User created color preset",
      category: "Custom", settings: { ...state.color }, thumbnail: "linear-gradient(135deg,#00D9FF,#A855F7)", builtIn: false,
    };
    upsertPreset(preset);
    setPresetName("");
    log(`Saved color preset ${preset.name}`);
    notify(t("color.presetSaved"));
  };

  const importShare = () => {
    try {
      const file = parseShareCode(shareInput.trim());
      if (file.kind !== "color") { notify(t("color.notColorPreset"), "error"); return; }
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
      notify(error instanceof Error ? error.message : t("color.invalidCode"), "error");
    }
  };

  return (
    <div className="page">
      <PageHead title={t("color.title")} description={t("color.subtitle")} />

      <div className="preview-pair" style={{ marginBottom: 14 }}>
        <div className="preview-pane" style={{ background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }}>
          <div className="preview-overlay" style={{ ...presetCss({ ...state.presets[0]!, settings: state.baseline }), background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }} />
          <div className="preview-overlay" style={baselineTint} />
          <span className="label">{t("color.before")}</span>
        </div>
        <div className="preview-pane" style={{ background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }}>
          <div className="preview-overlay" style={{ ...presetCss({ ...state.presets[0]!, settings: state.color }), background: "linear-gradient(135deg,#0b2a4a,#5a2a7a 55%,#d97706)" }} />
          <div className="preview-overlay" style={currentTint} />
          <span className="label">{t("color.after")}</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel title={t("color.controls")} action={<span className={`badge ${state.colorApplyStatus && !state.colorApplyStatus.ok ? "warning" : "accent"}`}>{state.colorApplyStatus ? (state.colorApplyStatus.ok ? state.colorApplyStatus.backend : state.colorApplyStatus.message) : activeBackend}</span>}>
          <div className="field"><label>{t("color.targetDisplay")}</label><select value={state.settings.monitorId ?? ""} onChange={(e) => log(`Target display ${e.target.value}`)}>
            <option value="">{t("color.defaultDisplay")}</option>
            {monitors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
          <div className="grid grid-2">
            {(Object.keys(RANGES) as ColorField[]).map((field) => {
              const [min, max, suffix] = RANGES[field];
              const raw = state.color[field];
              return <ParamSlider key={field} label={field} value={raw === null ? min : raw} min={min} max={max} suffix={suffix}
                onChange={(v) => setColorField(field, v)}
                onReset={() => setColorField(field, field === "temperatureK" ? 6500 : field === "hue" ? 0 : 100)} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button className="btn primary" onClick={() => { setBaseline({ ...state.color }); notify(t("color.baselineCaptured")); }}><Save size={14} /> {t("color.setBaseline")}</button>
            <button className="btn" onClick={() => { setColor({ ...state.baseline }); notify(t("color.baselineRestored")); }}><RotateCcw size={14} /> {t("color.restoreBaseline")}</button>
            <button className="btn" onClick={() => { void applyColorNow(state.color).then((status) => notify(status?.ok ? t("color.appliedLive") : t("color.applyFailed"), status?.ok ? undefined : "error")); }}><Monitor size={14} /> {t("color.applyNow")}</button>
            <button className="btn" onClick={() => { const file = createPreset({ kind: "color", name: "Current", description: "", author: "VYTRIX", payload: { ...state.color } }); downloadText("vytrix-color.vytrixpreset", serializePreset(file)); }}><Download size={14} /> {t("common.export")}</button>
          </div>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title={t("color.presets")}>
            <div className="field"><label>{t("color.newPresetName")}</label><input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="My look" /></div>
            <button className="btn primary" onClick={savePreset}>{t("color.saveCurrent")}</button>
            <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto" }}>
              {state.presets.filter((p) => p.category !== "Imported").map((preset) => (
                <button key={preset.id} className="nav-item" onClick={() => { applyPreset(preset); notify(`Applied ${preset.name}`); }}>
                  <i style={{ width: 18, height: 18, borderRadius: 5, background: preset.thumbnail, flex: "none" }} />
                  <span className="nav-text">{preset.name}<small className="tiny" style={{ display: "block" }}>{preset.category}</small></span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={t("color.shareCode")}>
            <div className="field"><label>{t("color.importCode")}</label><textarea rows={3} value={shareInput} onChange={(e) => setShareInput(e.target.value)} placeholder="VYTRIX1...." /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={importShare}><Upload size={14} /> {t("color.import")}</button>
              <button className="btn" onClick={() => {
                const file = createPreset({ kind: "color", name: "Shared", description: "", author: "VYTRIX", payload: { ...state.color } });
                const code = shareCode(file); void navigator.clipboard?.writeText(code); notify(t("color.shareCopied"));
              }}><Share2 size={14} /> {t("color.copyShareCode")}</button>
            </div>
            <div className="tiny" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><Monitor size={12} /> {t("color.inertHint")}</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
