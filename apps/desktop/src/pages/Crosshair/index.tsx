import { useState } from "react";
import { Crosshair as CrosshairIcon, Save, Trash2, Download, Upload, Eye } from "lucide-react";
import type { CrosshairConfig, CrosshairStyle } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { setOverlayCrosshair, setOverlayEnabled } from "@/services/overlay";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { createPreset, serializePreset, parseShareCode } from "@vytrix/preset-format";
import { downloadText } from "@/utils/download";

const STYLES: CrosshairStyle[] = ["dot", "circle", "cross", "dynamic-cross"];
const DEFAULT_CONFIG: CrosshairConfig = {
  id: "", name: "New design", style: "cross", color: "#00D9FF", thickness: 2, gap: 6,
  length: 10, opacity: 0.95, outline: true, centerDot: true, rotation: 0, scale: 1,
  monitorId: null, offsetX: 0, offsetY: 0,
};

function CrosshairPreview({ config }: { config: CrosshairConfig }) {
  const cx = 200 + config.offsetX;
  const cy = 140 + config.offsetY;
  const arm = config.length * config.scale;
  const gap = config.gap * config.scale;
  const stroke = config.thickness;
  const outline = config.outline ? "#080B12" : "none";
  return (
    <div className="canvas-wrap">
      <svg width="400" height="280" viewBox="0 0 400 280" aria-label="crosshair preview">
        <rect width="400" height="280" fill="transparent" />
        <g stroke={config.color} strokeWidth={stroke} opacity={config.opacity} transform={`rotate(${config.rotation} ${cx} ${cy})`}>
          {config.style === "dot" ? <circle cx={cx} cy={cy} r={Math.max(1, arm / 2)} fill={config.color} /> : null}
          {config.style === "circle" ? <circle cx={cx} cy={cy} r={arm} fill="none" /> : null}
          {config.style === "cross" || config.style === "dynamic-cross" ? (
            <>
              <line x1={cx - gap - arm} y1={cy} x2={cx - gap} y2={cy} stroke={outline === "none" ? config.color : outline} strokeWidth={stroke + 2} />
              <line x1={cx + gap} y1={cy} x2={cx + gap + arm} y2={cy} stroke={outline === "none" ? config.color : outline} strokeWidth={stroke + 2} />
              <line x1={cx} y1={cy - gap - arm} x2={cx} y2={cy - gap} stroke={outline === "none" ? config.color : outline} strokeWidth={stroke + 2} />
              <line x1={cx} y1={cy + gap} x2={cx} y2={cy + gap + arm} stroke={outline === "none" ? config.color : outline} strokeWidth={stroke + 2} />
              <line x1={cx - gap - arm} y1={cy} x2={cx - gap} y2={cy} />
              <line x1={cx + gap} y1={cy} x2={cx + gap + arm} y2={cy} />
              <line x1={cx} y1={cy - gap - arm} x2={cx} y2={cy - gap} />
              <line x1={cx} y1={cy + gap} x2={cx} y2={cy + gap + arm} />
            </>
          ) : null}
        </g>
        {config.centerDot ? <circle cx={cx} cy={cy} r={Math.max(1, stroke)} fill={config.color} opacity={config.opacity} /> : null}
      </svg>
    </div>
  );
}

export default function Crosshair() {
  const { state, upsertCrosshair, removeCrosshair, setCrosshairEnabled, log } = useApp();
  const { notify } = useToast();
  const [config, setConfig] = useState<CrosshairConfig>({ ...DEFAULT_CONFIG });
  const [visible, setVisible] = useState(state.crosshairEnabled);
  const [shareInput, setShareInput] = useState("");
  const patch = (p: Partial<CrosshairConfig>) => setConfig((c) => ({ ...c, ...p }));
  const hotkey = state.hotkeys.find((h) => h.action === "toggle-crosshair")?.keys.join("+") ?? "unbound";

  const save = () => {
    const design = { ...config, id: config.id || `design-${Date.now()}` };
    upsertCrosshair(design);
    setConfig(design);
    void setOverlayCrosshair(design);
    log(`Saved crosshair ${design.name}`);
    notify("Crosshair design saved");
  };

  const toggleOverlay = (next: boolean) => {
    setVisible(next);
    setCrosshairEnabled(next);
    void setOverlayEnabled(next);
    void setOverlayCrosshair(config);
    log(`Crosshair overlay ${next ? "enabled" : "disabled"}`);
  };

  const exportDesign = () => {
    const file = createPreset({ kind: "crosshair", name: config.name, description: "VYTRIX crosshair", author: "VYTRIX", payload: { ...config } as unknown as Record<string, unknown> });
    downloadText(`${config.name.replace(/\s+/g, "-")}.vytrixpreset`, serializePreset(file));
  };

  const importDesign = () => {
    try {
      const file = parseShareCode(shareInput.trim());
      if (file.kind !== "crosshair") { notify("Not a crosshair design", "error"); return; }
      setConfig({ ...DEFAULT_CONFIG, ...(file.payload as Partial<CrosshairConfig>) });
      notify("Design imported");
    } catch (error) { notify(error instanceof Error ? error.message : "Invalid code", "error"); }
  };

  return (
    <div className="page">
      <PageHead title="Crosshair Studio" description="A transparent, always-on-top overlay drawn by VYTRIX itself. It never injects into a game, reads game memory, or alters input." />
      <div className="notice" style={{ marginBottom: 14 }}>Individual games may restrict external overlays. If a game prohibits overlays, VYTRIX shows that limitation and disables the overlay for that title — no bypass is attempted.</div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel title="Live preview" action={<span className={`dot ${visible ? "" : "off"}`} />}>
          <CrosshairPreview config={config} />
          <ToggleRow label="Overlay visible" detail={`Global shortcut: ${hotkey}`} checked={visible} onChange={toggleOverlay} />
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Design">
            <div className="field"><label>Name</label><input type="text" value={config.name} onChange={(e) => patch({ name: e.target.value })} /></div>
            <div className="field"><label>Style</label><select value={config.style} onChange={(e) => patch({ style: e.target.value as CrosshairStyle })}>{STYLES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="field"><label>Color</label><input type="color" value={config.color} onChange={(e) => patch({ color: e.target.value })} style={{ width: "100%", height: 36, padding: 2, background: "var(--vy-bg-secondary)", border: "var(--vy-border)", borderRadius: 8 }} /></div>
            <ParamSlider label="Thickness" value={config.thickness} min={1} max={10} suffix="px" onChange={(v) => patch({ thickness: v })} />
            <ParamSlider label="Gap" value={config.gap} min={0} max={40} suffix="px" onChange={(v) => patch({ gap: v })} />
            <ParamSlider label="Length" value={config.length} min={1} max={60} suffix="px" onChange={(v) => patch({ length: v })} />
            <ParamSlider label="Opacity" value={Math.round(config.opacity * 100)} min={10} max={100} onChange={(v) => patch({ opacity: v / 100 })} />
            <ParamSlider label="Scale" value={config.scale * 100} min={50} max={200} onChange={(v) => patch({ scale: v / 100 })} />
            <ParamSlider label="Rotation" value={config.rotation} min={0} max={360} suffix="°" onChange={(v) => patch({ rotation: v })} />
            <ToggleRow label="Outline" checked={config.outline} onChange={(v) => patch({ outline: v })} />
            <ToggleRow label="Center dot" checked={config.centerDot} onChange={(v) => patch({ centerDot: v })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button className="btn primary" onClick={save}><Save size={14} /> Save</button>
              <button className="btn" onClick={exportDesign}><Download size={14} /> Export</button>
            </div>
          </Panel>

          <Panel title="Saved designs">
            {state.crosshairs.map((design) => (
              <div className="row" key={design.id}>
                <button className="btn ghost" onClick={() => { setConfig({ ...design }); void setOverlayCrosshair(design); }}><Eye size={13} /> {design.name}</button>
                <button className="btn danger icon" onClick={() => removeCrosshair(design.id)}><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="field" style={{ marginTop: 12 }}><label>Share code</label><textarea rows={2} value={shareInput} onChange={(e) => setShareInput(e.target.value)} /></div>
            <button className="btn" onClick={importDesign}><Upload size={14} /> Import code</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
