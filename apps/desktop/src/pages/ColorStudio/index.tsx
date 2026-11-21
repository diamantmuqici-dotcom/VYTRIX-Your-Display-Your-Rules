import { useEffect, useState } from "react";
import {
  RotateCcw, Save, Share2, Download, Upload, Monitor, SlidersHorizontal, Palette, Sun, Waves,
} from "lucide-react";
import type { ColorField, ColorPreset } from "@vytrix/shared-types";
import type { TranslationKey } from "@/i18n";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { createPreset, serializePreset, parseShareCode, shareCode } from "@vytrix/preset-format";
import { presetCss, temperatureTint } from "@/data/presets";
import { downloadText } from "@/utils/download";
import { clampColorSettings, DEFAULT_COLOR_SETTINGS } from "@vytrix/validation";
import { applyColorNow, resetColor, resetColorLinear } from "@/services/color";
import { useT } from "@/i18n";

type MonitorInfo = { id: string; name: string; backend: string };

const RANGES: Record<ColorField, [number, number, string]> = {
  brightness: [0, 200, "%"], contrast: [0, 200, "%"], gamma: [50, 250, "%"],
  saturation: [0, 300, "%"], vibrance: [0, 300, "%"], gamut: [0, 300, "%"],
  temperatureK: [1000, 12000, "K"],
  red: [0, 200, "%"], green: [0, 200, "%"], blue: [0, 200, "%"],
  hue: [0, 360, "°"], hueStrength: [0, 100, "%"],
  redLift: [-50, 50, ""], greenLift: [-50, 50, ""], blueLift: [-50, 50, ""],
  redGamma: [50, 250, "%"], greenGamma: [50, 250, "%"], blueGamma: [50, 250, "%"],
  shadow: [-50, 50, ""], midtone: [-50, 50, ""], highlight: [-50, 50, ""],
  blackPoint: [0, 100, ""], whitePoint: [100, 200, "%"],
};

const GROUPS: { title: TranslationKey; icon: typeof Sun; fields: ColorField[] }[] = [
  { title: "color.group.tone", icon: Sun, fields: ["brightness", "contrast", "gamma", "saturation", "vibrance", "gamut"] },
  { title: "color.group.temperature", icon: Palette, fields: ["temperatureK"] },
  { title: "color.group.channels", icon: Waves, fields: ["red", "green", "blue", "hue", "hueStrength"] },
  { title: "color.group.channelFine", icon: SlidersHorizontal, fields: ["redLift", "greenLift", "blueLift", "redGamma", "greenGamma", "blueGamma"] },
  { title: "color.group.toneBands", icon: SlidersHorizontal, fields: ["shadow", "midtone", "highlight", "blackPoint", "whitePoint"] },
];

export default function ColorStudio() {
  const {
    state, setColorField, setColor, setSetting, setBaseline, applyPreset, upsertPreset, log,
  } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [presetName, setPresetName] = useState("");
  const [shareInput, setShareInput] = useState("");
  const monitorId = state.settings.monitorId;

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    invokeNative<MonitorInfo[]>("list_monitors").then((result) => {
      if (active && result.ok) setMonitors(result.data);
    });
    return () => { active = false; };
  }, []);

  const targetMonitor = monitors.find((monitor) => monitor.id === monitorId) ?? null;
  const activeBackend = targetMonitor?.backend ?? monitors[0]?.backend
    ?? (isTauriRuntime() ? t("color.detecting") : t("color.localPreview"));
  const baselineTint = temperatureTint(state.baseline.temperatureK);
  const currentTint = temperatureTint(state.color.temperatureK);

  const chooseMonitor = (id: string) => {
    const nextId = id || null;
    const name = monitors.find((monitor) => monitor.id === nextId)?.name ?? t("color.defaultDisplay");
    setSetting("monitorId", nextId);
    void applyColorNow(state.color, undefined, nextId);
    log(`Target display ${name}`);
    notify(`${t("color.targetDisplay")}: ${name}`);
  };

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

  const resetAll = () => {
    setColor({ ...DEFAULT_COLOR_SETTINGS });
    void resetColor(monitorId).then((status) => {
      notify(status?.ok ? t("color.restoredNative") : t("color.resetUnavailable"), status?.ok ? undefined : "error");
    });
    log("Restored native color defaults");
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
        <Panel
          title={t("color.controls")}
          action={<span className={`badge ${state.colorApplyStatus && !state.colorApplyStatus.ok ? "warning" : "accent"}`}>
            {state.colorApplyStatus ? (state.colorApplyStatus.ok ? `${state.colorApplyStatus.backend}${state.colorApplyStatus.device ? ` · ${state.colorApplyStatus.device}` : ""}` : state.colorApplyStatus.message) : activeBackend}
          </span>}
        >
          <div className="field">
            <label>{t("color.targetDisplay")}</label>
            <select value={monitorId ?? ""} onChange={(event) => chooseMonitor(event.target.value)}>
              <option value="">{t("color.defaultDisplay")}</option>
              {monitors.map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name}</option>)}
            </select>
            <small className="tiny" style={{ display: "block", marginTop: 4 }}>
              {targetMonitor ? `${targetMonitor.name} · ${targetMonitor.id}` : t("color.defaultDisplay")}
            </small>
          </div>

          <div className="grid grid-2">
            {GROUPS.map((group) => (
              <div key={group.title} className="color-group">
                <div className="color-group-title"><group.icon size={13} /> {t(group.title)}</div>
                {group.fields.map((field) => {
                  const [min, max, suffix] = RANGES[field];
                  const raw = state.color[field];
                  return (
                    <ParamSlider
                      key={field}
                      label={t(`color.field.${field}` as TranslationKey)}
                      value={raw === null ? 6500 : raw}
                      min={min}
                      max={max}
                      suffix={suffix}
                      onChange={(value) => setColorField(field, value)}
                      onReset={() => setColorField(field, DEFAULT_COLOR_SETTINGS[field] ?? 0)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button className="btn primary" onClick={() => { setBaseline({ ...state.color }); notify(t("color.baselineCaptured")); }}><Save size={14} /> {t("color.setBaseline")}</button>
            <button className="btn" onClick={() => { setColor({ ...state.baseline }); notify(t("color.baselineRestored")); }}><RotateCcw size={14} /> {t("color.restoreBaseline")}</button>
            <button className="btn" onClick={() => { void applyColorNow(state.color, undefined, monitorId).then((status) => notify(status?.ok ? t("color.appliedLive") : t("color.applyFailed"), status?.ok ? undefined : "error")); }}><Monitor size={14} /> {t("color.applyNow")}</button>
            <button className="btn" onClick={resetAll}><RotateCcw size={14} /> {t("color.resetNative")}</button>
            <button className="btn" onClick={() => {
              void resetColorLinear(monitorId).then((status) => {
                notify(status?.ok ? t("color.linearRestored") : t("color.applyFailed"), status?.ok ? undefined : "error");
              });
              log("Wrote linear gamma ramp");
            }}><Monitor size={14} /> {t("color.resetLinear")}</button>
            <button className="btn" onClick={() => { const file = createPreset({ kind: "color", name: "Current", description: "", author: "VYTRIX", payload: { ...state.color } }); downloadText("vytrix-color.vytrixpreset", serializePreset(file)); }}><Download size={14} /> {t("common.export")}</button>
          </div>
          <div className="tiny" style={{ marginTop: 10 }}>{t("color.rampHint")}</div>
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title={t("color.presets")}>
            <div className="field"><label>{t("color.newPresetName")}</label><input type="text" value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="My look" /></div>
            <button className="btn primary" onClick={savePreset}>{t("color.saveCurrent")}</button>
            <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto" }}>
              {state.presets.filter((preset) => preset.category !== "Imported").map((preset) => (
                <button key={preset.id} className="nav-item" onClick={() => { applyPreset(preset); notify(`Applied ${preset.name}`); }}>
                  <i style={{ width: 18, height: 18, borderRadius: 5, background: preset.thumbnail, flex: "none" }} />
                  <span className="nav-text">{preset.name}<small className="tiny" style={{ display: "block" }}>{preset.category}</small></span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={t("color.shareCode")}>
            <div className="field"><label>{t("color.importCode")}</label><textarea rows={3} value={shareInput} onChange={(event) => setShareInput(event.target.value)} placeholder="VYTRIX1...." /></div>
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
