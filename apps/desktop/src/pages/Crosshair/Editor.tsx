import { useState } from "react";
import {
  Crosshair as CrosshairIcon, ZoomIn, ZoomOut, RotateCcw, Maximize2, Grid3X3,
  Target, Eye, Shuffle, Save, Lock, Unlock, Palette, Sparkles,
} from "lucide-react";
import type { CrosshairAdvanced, CrosshairArm, CrosshairArmId } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { CrosshairRenderer, type PreviewBackground } from "@/crosshair/renderer";
import { ARM_IDS, COLOR_PRESETS, SHAPES, SHAPE_DETAIL } from "@/crosshair/model";
import { shapePreset } from "@/crosshair/validate";
import { hexToRgb, rgbToHex, hexToHsv, hsvToHex, contrastInk } from "@/crosshair/color";
import { randomizeDesign, type RandomScope } from "@/crosshair/random";
import type { StudioProps } from "./shared";

const BACKGROUNDS: PreviewBackground[] = ["dark", "light", "grid", "target", "transparent"];

export default function Editor({ design, setDesign, patchAdvanced, commit, zoom, setZoom }: StudioProps) {
  const app = useApp();
  const [locked, setLocked] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [scope, setScope] = useState<RandomScope>("all");
  const advanced = design.advanced;
  const rgb = hexToRgb(design.color);
  const hsv = hexToHsv(design.color);
  const changeZoom = (delta: number) => setZoom(Math.min(3, Math.max(0.5, Math.round((zoom + delta) * 100) / 100)));

  const setArm = (id: CrosshairArmId, patch: Partial<CrosshairArm>) => {
    const arms = advanced.arms.map((arm) => {
      if (!locked || arm.id === id) return { ...arm, ...patch };
      return { ...arm, ...patch, color: patch.color ?? arm.color };
    });
    patchAdvanced({ arms, shape: "custom" });
  };
  const setEveryArm = (patch: Partial<CrosshairArm>) => {
    patchAdvanced({ arms: advanced.arms.map((arm) => ({ ...arm, ...patch })) });
  };
  const setColor = (color: string) => {
    setDesign({ ...design, color, advanced: {
      ...advanced,
      arms: advanced.arms.map((arm) => ({ ...arm, color })),
      dot: { ...advanced.dot, color },
      glowColor: color,
    } });
  };
  const applyShape = (shape: CrosshairAdvanced["shape"]) => {
    const next = shapePreset(shape, design.color, design.thickness, design.length, design.gap);
    patchAdvanced(next);
  };

  const preview = (
    <CrosshairRenderer
      design={design}
      size={fullscreen ? Math.min(window.innerWidth, window.innerHeight) - 80 : 340}
      zoom={zoom}
      background={app.state.crosshairStudio.previewBackground as PreviewBackground}
      showGrid={showGrid}
      showTarget={showTarget}
      animate
    />
  );

  return (
    <div>
      <PageHead title="Crosshair editor" description="Every control updates the vector preview instantly. Zoom is preview-only; it never changes the saved design." />
      {fullscreen ? (
        <div className="card" style={{ position: "fixed", inset: 24, zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {preview}
          <button className="btn" onClick={() => setFullscreen(false)}>Close fullscreen preview</button>
        </div>
      ) : null}
      <div className="grid" style={{ gridTemplateColumns: "minmax(260px,300px) minmax(320px,1fr) minmax(280px,320px)", alignItems: "start", gap: 14 }}>
        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Shape" icon={CrosshairIcon}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
              {SHAPES.map((shape) => (
                <button
                  key={shape}
                  className={`btn ${advanced.shape === shape ? "primary" : "ghost"}`}
                  onClick={() => applyShape(shape)}
                  title={SHAPE_DETAIL[shape]}
                >{shape}</button>
              ))}
            </div>
            <div className="tiny" style={{ marginTop: 10, lineHeight: 1.5 }}>{SHAPE_DETAIL[advanced.shape]}</div>
          </Panel>

          <Panel title="Arms" action={
            <button className="btn ghost icon" onClick={() => setLocked((value) => !value)} title={locked ? "Unlock arms" : "Lock arms"}>
              {locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          }>
            <ToggleRow label="Show all arms" checked={advanced.arms.every((arm) => arm.visible)}
              onChange={(value) => setEveryArm({ visible: value })} />
            {ARM_IDS.map((id) => {
              const arm = advanced.arms.find((item) => item.id === id)!;
              return (
                <div key={id} className="card" style={{ padding: 10, marginTop: 8 }}>
                  <div className="row" style={{ padding: 0, border: 0 }}>
                    <strong style={{ textTransform: "capitalize" }}>{id}</strong>
                    <label className="switch"><input type="checkbox" checked={arm.visible} onChange={(e) => setArm(id, { visible: e.target.checked })} aria-label={`${id} visible`} /><span /></label>
                  </div>
                  <ParamSlider label="Length" value={arm.length} min={0} max={60} suffix="px" onChange={(value) => setArm(id, { length: value })} />
                  <ParamSlider label="Thickness" value={arm.thickness} min={1} max={12} suffix="px" onChange={(value) => setArm(id, { thickness: value })} />
                  <ParamSlider label="Inner gap" value={arm.innerGap} min={0} max={40} suffix="px" onChange={(value) => setArm(id, { innerGap: value })} />
                  <ParamSlider label="Outer gap" value={arm.outerGap} min={0} max={60} suffix="px" onChange={(value) => setArm(id, { outerGap: value })} />
                  <ParamSlider label="Offset" value={arm.offset} min={-40} max={40} suffix="px" onChange={(value) => setArm(id, { offset: value })} />
                  <ParamSlider label="Rotation" value={arm.rotation} min={-180} max={180} suffix="°" onChange={(value) => setArm(id, { rotation: value })} />
                  <div className="field"><label>Arm color</label><input type="color" value={arm.color} onChange={(e) => setArm(id, { color: e.target.value })} style={{ width: "100%", height: 32 }} /></div>
                </div>
              );
            })}
          </Panel>
        </div>

        <Panel title="Live preview" icon={Eye}>
          <div style={{ display: "flex", justifyContent: "center" }}>{preview}</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginTop: 12 }}>
            <div className="field"><label>Background</label>
              <select value={app.state.crosshairStudio.previewBackground} onChange={(e) => app.setCrosshairStudioSetting("previewBackground", e.target.value as PreviewBackground)}>
                {BACKGROUNDS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="field"><label>Zoom {zoom.toFixed(1)}×</label>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn ghost icon" onClick={() => changeZoom(-0.25)} aria-label="Zoom out"><ZoomOut size={14} /></button>
                <button className="btn ghost icon" onClick={() => setZoom(1)} aria-label="Reset zoom"><RotateCcw size={14} /></button>
                <button className="btn ghost icon" onClick={() => changeZoom(0.25)} aria-label="Zoom in"><ZoomIn size={14} /></button>
              </div>
            </div>
            <div className="field"><label>Display</label>
              <div style={{ display: "flex", gap: 4 }}>
                <button className={`btn ghost icon ${showGrid ? "active" : ""}`} onClick={() => setShowGrid((value) => !value)} aria-label="Grid"><Grid3X3 size={14} /></button>
                <button className={`btn ghost icon ${showTarget ? "active" : ""}`} onClick={() => setShowTarget((value) => !value)} aria-label="Target"><Target size={14} /></button>
                <button className="btn ghost icon" onClick={() => setFullscreen(true)} aria-label="Fullscreen"><Maximize2 size={14} /></button>
              </div>
            </div>
          </div>
          <ParamSlider label="Overall scale" value={Math.round(design.scale * 100)} min={50} max={300} onChange={(value) => setDesign({ ...design, scale: value / 100 })} onReset={() => setDesign({ ...design, scale: 1 })} />
          <ParamSlider label="Rotation" value={design.rotation} min={0} max={360} suffix="°" onChange={(value) => setDesign({ ...design, rotation: value })} onReset={() => setDesign({ ...design, rotation: 0 })} />
          <ParamSlider label="Transparency" value={Math.round(design.opacity * 100)} min={5} max={100} onChange={(value) => setDesign({ ...design, opacity: value / 100 })} onReset={() => setDesign({ ...design, opacity: 1 })} />
          <ParamSlider label="Center gap" value={advanced.centerGap} min={0} max={40} suffix="px" onChange={(value) => patchAdvanced({ centerGap: value })} onReset={() => patchAdvanced({ centerGap: design.gap })} />
          <ParamSlider label="Line spacing" value={advanced.lineSpacing} min={0} max={40} suffix="px" onChange={(value) => patchAdvanced({ lineSpacing: value })} />
          <ToggleRow label="Crosshair visible" checked={app.state.crosshairEnabled} onChange={(value) => {
            app.setCrosshairEnabled(value);
            void import("@/services/overlay").then((module) => void module.setOverlayEnabled(value));
          }} />
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Color" icon={Palette}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: design.color, border: "var(--vy-border)" }} />
              <input type="color" value={design.color} onChange={(e) => { setColor(e.target.value); app.addCustomCrosshairColor(e.target.value); }} style={{ flex: 1, height: 40 }} />
            </div>
            <div className="field"><label>HEX</label><input type="text" value={design.color} onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value.toUpperCase()); }} /></div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
              {(["r", "g", "b"] as const).map((channel) => (
                <div className="field" key={channel}>
                  <label>{channel.toUpperCase()}</label>
                  <input type="number" min={0} max={255} value={rgb[channel]} onChange={(e) => setColor(rgbToHex({ ...rgb, [channel]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
              {(["h", "s", "v"] as const).map((channel) => (
                <div className="field" key={channel}>
                  <label>{channel.toUpperCase()}</label>
                  <input type="number" min={0} max={channel === "h" ? 360 : 100} value={hsv[channel]} onChange={(e) => setColor(hsvToHex({ ...hsv, [channel]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
              {COLOR_PRESETS.map((preset) => (
                <button key={preset.value} title={preset.name} onClick={() => setColor(preset.value)}
                  style={{ background: preset.value, color: contrastInk(preset.value), height: 26, borderRadius: 6, border: "var(--vy-border)", fontSize: 9 }}>{preset.name.slice(0, 3)}</button>
              ))}
            </div>
            {app.state.customCrosshairColors.length > 0 ? (
              <div className="grid" style={{ gridTemplateColumns: "repeat(8,1fr)", gap: 4, marginTop: 8 }}>
                {app.state.customCrosshairColors.map((item) => (
                  <button key={item} title={item} onClick={() => setColor(item)} style={{ background: item, height: 20, borderRadius: 4, border: "var(--vy-border)" }} />
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Center dot" icon={CrosshairIcon}>
            <ToggleRow label="Enable dot" checked={advanced.dot.enabled} onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, enabled: value } })} />
            <ParamSlider label="Dot size" value={advanced.dot.size} min={1} max={24} suffix="px" onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, size: value } })} />
            <div className="field"><label>Dot shape</label>
              <select value={advanced.dot.shape} onChange={(e) => patchAdvanced({ dot: { ...advanced.dot, shape: e.target.value as CrosshairAdvanced["dot"]["shape"] } })}>
                <option value="circle">Circle</option><option value="square">Square</option><option value="diamond">Diamond</option>
              </select>
            </div>
            <div className="field"><label>Dot color</label><input type="color" value={advanced.dot.color} onChange={(e) => patchAdvanced({ dot: { ...advanced.dot, color: e.target.value } })} style={{ width: "100%", height: 32 }} /></div>
            <ParamSlider label="Dot opacity" value={Math.round(advanced.dot.opacity * 100)} min={5} max={100} onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, opacity: value / 100 } })} />
            <ToggleRow label="Dot outline" checked={advanced.dot.outline} onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, outline: value } })} />
            <ParamSlider label="Border thickness" value={advanced.dot.outlineThickness} min={0} max={6} onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, outlineThickness: value } })} />
            <ToggleRow label="Dot glow" checked={advanced.dot.glow} onChange={(value) => patchAdvanced({ dot: { ...advanced.dot, glow: value } })} />
          </Panel>

          <Panel title="Outline & effects" icon={Sparkles}>
            <ToggleRow label="Outline" checked={advanced.outline.enabled} onChange={(value) => patchAdvanced({ outline: { ...advanced.outline, enabled: value } })} />
            <ParamSlider label="Outline thickness" value={advanced.outline.thickness} min={0} max={8} onChange={(value) => patchAdvanced({ outline: { ...advanced.outline, thickness: value } })} />
            <div className="field"><label>Outline color</label><input type="color" value={advanced.outline.color} onChange={(e) => patchAdvanced({ outline: { ...advanced.outline, color: e.target.value } })} style={{ width: "100%", height: 32 }} /></div>
            <ParamSlider label="Outline opacity" value={Math.round(advanced.outline.opacity * 100)} min={5} max={100} onChange={(value) => patchAdvanced({ outline: { ...advanced.outline, opacity: value / 100 } })} />
            <div className="field"><label>Outline style</label>
              <select value={advanced.outline.style} onChange={(e) => patchAdvanced({ outline: { ...advanced.outline, style: e.target.value as "solid" | "dashed" } })}>
                <option value="solid">Solid</option><option value="dashed">Dashed</option>
              </select>
            </div>
            <ToggleRow label="Ring guide" checked={advanced.ring} onChange={(value) => patchAdvanced({ ring: value })} />
            <ToggleRow label="Shadow" checked={advanced.shadow} onChange={(value) => patchAdvanced({ shadow: value })} />
            <ToggleRow label="Glow" checked={advanced.glow} onChange={(value) => patchAdvanced({ glow: value })} />
            <div className="field"><label>Glow color</label><input type="color" value={advanced.glowColor} onChange={(e) => patchAdvanced({ glowColor: e.target.value })} style={{ width: "100%", height: 32 }} /></div>
            <div className="field"><label>Render quality</label>
              <select value={advanced.renderQuality} onChange={(e) => patchAdvanced({ renderQuality: e.target.value as CrosshairAdvanced["renderQuality"] })}>
                <option value="crisp">Crisp</option><option value="balanced">Balanced</option><option value="smooth">Smooth</option>
              </select>
            </div>
          </Panel>

          <Panel title="Save" icon={Save}>
            <div className="field"><label>Name</label><input type="text" value={design.name} onChange={(e) => setDesign({ ...design, name: e.target.value })} /></div>
            <div className="field"><label>Randomize</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as RandomScope)}>
                <option value="all">Entire crosshair</option><option value="shape">Shape only</option>
                <option value="color">Colors only</option><option value="size">Size only</option>
                <option value="elements">Individual elements</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={() => commit(design)}><Save size={14} /> Save design</button>
              <button className="btn" onClick={() => setDesign(randomizeDesign(design, scope))}><Shuffle size={14} /> Randomize</button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
