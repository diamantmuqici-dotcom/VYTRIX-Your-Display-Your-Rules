import { useRef } from "react";
import { themes } from "@vytrix/design-system";
import type { ThemeName } from "@vytrix/shared-types";
import { Palette, Sparkles, Download, Upload } from "lucide-react";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { downloadText } from "@/utils/download";

const ACCENTS = ["#00D9FF", "#286BFF", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

interface ThemeFile {
  theme: ThemeName;
  accent: string;
  cornerRadius: number;
  uiScale: number;
  animationIntensity: number;
  reducedMotion: boolean;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

/** Imported theme files are inert data; every field is validated before apply. */
function parseThemeFile(raw: unknown): ThemeFile | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.theme !== "string" || !(value.theme in themes)) return null;
  if (typeof value.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value.accent)) return null;
  return {
    theme: value.theme as ThemeName,
    accent: value.accent,
    cornerRadius: clampNumber(value.cornerRadius, 0, 20, 12),
    uiScale: clampNumber(value.uiScale, 80, 130, 100),
    animationIntensity: clampNumber(value.animationIntensity, 0, 100, 100),
    reducedMotion: typeof value.reducedMotion === "boolean" ? value.reducedMotion : false,
  };
}

export default function Themes() {
  const { state, setSetting, log } = useApp();
  const { notify } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const exportTheme = () => {
    const file: ThemeFile = {
      theme: state.settings.theme,
      accent: state.settings.accent,
      cornerRadius: state.settings.cornerRadius,
      uiScale: state.settings.uiScale,
      animationIntensity: state.settings.animationIntensity,
      reducedMotion: state.settings.reducedMotion,
    };
    downloadText("vytrix-theme.json", JSON.stringify(file, null, 2));
    log("Theme exported");
  };

  const importTheme = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseThemeFile(JSON.parse(await file.text()) as unknown);
      if (!parsed) throw new Error("Invalid theme file");
      (Object.keys(parsed) as (keyof ThemeFile)[]).forEach((key) => {
        setSetting(key, parsed[key]);
      });
      document.documentElement.dataset["reduceMotion"] = String(parsed.reducedMotion);
      log("Theme imported");
      notify("Theme imported");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Invalid theme file", "error");
    }
  };

  return (
    <div className="page">
      <PageHead title="Themes & Personalization" description="One design system across desktop, overlay and website. Reduced motion is respected at the token level." />
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel title="Appearance" icon={Palette}>
          <div className="grid grid-3">
            {(Object.keys(themes) as ThemeName[]).map((name) => (
              <button key={name} className={`card ${state.settings.theme === name ? "elevated" : ""}`} onClick={() => { setSetting("theme", name); log(`Theme set to ${name}`); }}>
                <div style={{ height: 64, borderRadius: 8, background: themes[name].accent, marginBottom: 10 }} />
                <strong>{themes[name].label}</strong>
              </button>
            ))}
          </div>
        </Panel>
        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Accent">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ACCENTS.map((accent) => (
                <button key={accent} aria-label={`Accent ${accent}`} onClick={() => setSetting("accent", accent)}
                  style={{ width: 30, height: 30, borderRadius: 8, background: accent, border: state.settings.accent === accent ? "2px solid #fff" : "none" }} />
              ))}
            </div>
          </Panel>
          <Panel title="Layout" icon={Sparkles}>
            <ParamSlider label="Corner radius" value={state.settings.cornerRadius} min={0} max={20} suffix="px" onChange={(v) => setSetting("cornerRadius", v)} />
            <ParamSlider label="UI scale" value={state.settings.uiScale} min={80} max={130} onChange={(v) => setSetting("uiScale", v)} />
            <ParamSlider label="Animation intensity" value={state.settings.animationIntensity} min={0} max={100} onChange={(v) => setSetting("animationIntensity", v)} />
            <ToggleRow label="Reduced motion" checked={state.settings.reducedMotion} onChange={(v) => { setSetting("reducedMotion", v); document.documentElement.dataset["reduceMotion"] = String(v); }} />
          </Panel>
          <Panel title="Theme files">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={exportTheme}><Download size={14} /> Export</button>
              <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> Import</button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => void importTheme(event.target.files?.[0])}
              />
            </div>
            <div className="tiny" style={{ marginTop: 10, lineHeight: 1.5 }}>
              Theme files contain appearance values only. Every field is bounded before it is applied.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
