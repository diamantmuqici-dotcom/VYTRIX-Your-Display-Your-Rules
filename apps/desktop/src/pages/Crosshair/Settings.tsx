import { useEffect, useState } from "react";
import { Settings2, Monitor, Layers3, Keyboard, ShieldCheck, Save } from "lucide-react";
import type { OverlayLayout } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { CrosshairRenderer, type PreviewBackground } from "@/crosshair/renderer";
import { DEFAULT_STUDIO_SETTINGS } from "@/crosshair/model";
import { normalizeDesign } from "@/crosshair/validate";
import {
  getOverlayConfig, setOverlayGameRules, setOverlayHotkeyHint, setOverlayLayout,
} from "@/services/overlay";
import type { StudioProps } from "./shared";

const LAYOUTS: OverlayLayout[] = ["center", "top-left", "top-right", "bottom-left", "bottom-right"];
const BACKGROUNDS: PreviewBackground[] = ["dark", "light", "grid", "target", "transparent"];

function splitList(value: string): string[] {
  return value.split(/[,\n]/).map((item) => item.trim().slice(0, 120)).filter(Boolean).slice(0, 50);
}

export default function StudioSettings({ design }: StudioProps) {
  const app = useApp();
  const studio = app.state.crosshairStudio;
  const [layout, setLayout] = useState<OverlayLayout>("center");
  const [hidden, setHidden] = useState("");
  const [only, setOnly] = useState("");
  const [hint, setHint] = useState("");
  const [nativeStatus, setNativeStatus] = useState("overlay settings are stored by the native runtime when connected");

  useEffect(() => {
    let active = true;
    void getOverlayConfig().then((result) => {
      if (!active || !result.ok) return;
      setLayout(result.data.layout);
      setHidden(result.data.gameVisibility.hiddenForGames.join(", "));
      setOnly(result.data.gameVisibility.onlyForGames.join(", "));
      setHint(result.data.hotkeyHint ?? "");
    });
    return () => { active = false; };
  }, []);

  const applyOverlay = async () => {
    const [layoutResult, rulesResult, hintResult] = await Promise.all([
      setOverlayLayout(layout),
      setOverlayGameRules({ hiddenForGames: splitList(hidden), onlyForGames: splitList(only) }),
      setOverlayHotkeyHint(hint),
    ]);
    const ok = layoutResult.ok && rulesResult.ok && hintResult.ok;
    setNativeStatus(ok ? "overlay configuration applied by the native runtime" : "native runtime unavailable; settings remain local");
    app.log(ok ? "Crosshair overlay settings applied" : "Crosshair overlay settings saved locally");
  };

  const defaultDesign = app.state.crosshairs.find((item) => item.id === studio.defaultDesignId) ?? design;

  return (
    <div>
      <PageHead
        title="Crosshair studio settings"
        description="Defaults, preview behavior and overlay rules. The overlay is a transparent click-through window drawn by VYTRIX; it never injects into a process or alters game files."
      />
      <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(320px,1fr))", gap: 14, alignItems: "start" }}>
        <Panel title="Defaults" icon={Settings2}>
          <div className="field"><label>Default design</label>
            <select value={studio.defaultDesignId} onChange={(event) => app.setCrosshairStudioSetting("defaultDesignId", event.target.value)}>
              {app.state.crosshairs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              {!app.state.crosshairs.some((item) => item.id === studio.defaultDesignId)
                ? <option value={studio.defaultDesignId}>{defaultDesign.name}</option> : null}
            </select>
          </div>
          <div className="field"><label>Preview background</label>
            <select value={studio.previewBackground} onChange={(event) => app.setCrosshairStudioSetting("previewBackground", event.target.value as PreviewBackground)}>
              {BACKGROUNDS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field"><label>Render quality</label>
            <select value={studio.renderQuality} onChange={(event) => app.setCrosshairStudioSetting("renderQuality", event.target.value as typeof studio.renderQuality)}>
              <option value="crisp">Crisp</option><option value="balanced">Balanced</option><option value="smooth">Smooth</option>
            </select>
          </div>
          <ToggleRow label="Start with overlay enabled" checked={studio.overlayStartEnabled} onChange={(value) => app.setCrosshairStudioSetting("overlayStartEnabled", value)} />
          <ToggleRow label="Enable animation by default" checked={studio.animationEnabled} onChange={(value) => app.setCrosshairStudioSetting("animationEnabled", value)} />
          <ToggleRow label="Switch crosshair with detected games" checked={studio.autoGameSwitch} onChange={(value) => app.setCrosshairStudioSetting("autoGameSwitch", value)} />
          <ToggleRow label="Show hotkey hint in overlay" checked={studio.showHotkeyHint} onChange={(value) => {
            app.setCrosshairStudioSetting("showHotkeyHint", value);
            if (!value) void setOverlayHotkeyHint(null);
          }} />
          <button
            className="btn"
            onClick={() => {
              for (const [key, value] of Object.entries(DEFAULT_STUDIO_SETTINGS)) {
                app.setCrosshairStudioSetting(key as keyof typeof studio, value as never);
              }
              app.log("Crosshair studio settings reset");
            }}
          >
            Reset studio settings
          </button>
        </Panel>

        <Panel title="Overlay layout" icon={Monitor}>
          <div className="field"><label>Anchor</label>
            <select value={layout} onChange={(event) => setLayout(event.target.value as OverlayLayout)}>
              {LAYOUTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
            <CrosshairRenderer design={normalizeDesign(design)} size={200} background="grid" animate={false} />
          </div>
          <div className="field"><label>Hidden for games (comma separated)</label><textarea rows={3} value={hidden} onChange={(event) => setHidden(event.target.value)} placeholder="Valorant, Apex Legends" /></div>
          <div className="field"><label>Only for games (comma separated)</label><textarea rows={3} value={only} onChange={(event) => setOnly(event.target.value)} placeholder="Rob Run, CS2" /></div>
          <div className="field"><label>Hotkey hint</label><input value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Ctrl+Alt+X" /></div>
          <button className="btn primary" onClick={() => void applyOverlay()}><Save size={14} /> Apply overlay settings</button>
          <div className="tiny" style={{ marginTop: 8 }}>{nativeStatus}</div>
        </Panel>

        <Panel title="Overlay rules" icon={Layers3}>
          <div className="row"><ShieldCheck size={14} /><span>Hidden rules win over allow rules.</span></div>
          <div className="row"><ShieldCheck size={14} /><span>An empty allow list means every detected title is eligible.</span></div>
          <div className="row"><ShieldCheck size={14} /><span>Game names are matched against the detected foreground title only.</span></div>
          <div className="row"><ShieldCheck size={14} /><span>The overlay hides itself when no crosshair, zoom indicator or hint is active.</span></div>
        </Panel>

        <Panel title="Hotkeys" icon={Keyboard}>
          {app.state.hotkeys.filter((item) => item.action.includes("crosshair") || item.action.includes("overlay")).map((binding) => (
            <div className="row" key={binding.action}>
              <span>{binding.action}</span>
              <span className="badge">{binding.keys.join("+")}</span>
            </div>
          ))}
          <div className="notice" style={{ marginTop: 10 }}>
            Global hotkeys are registered explicitly with Windows. No keyboard hook or input interception is installed.
          </div>
        </Panel>
      </div>
    </div>
  );
}
