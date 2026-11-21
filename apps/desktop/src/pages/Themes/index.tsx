import { themes } from "@vytrix/design-system";
import type { ThemeName } from "@vytrix/shared-types";
import { Palette, Sparkles } from "lucide-react";
import { useApp } from "@/stores/app";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { ToggleRow } from "@/components/ui/ToggleRow";

const ACCENTS = ["#00D9FF", "#286BFF", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

export default function Themes() {
  const { state, setSetting, log } = useApp();
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
        </div>
      </div>
    </div>
  );
}
