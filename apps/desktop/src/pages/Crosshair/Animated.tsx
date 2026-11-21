import { Sparkles, Play, Pause, RotateCcw } from "lucide-react";
import type { CrosshairAnimationKind } from "@vytrix/shared-types";
import { Panel, PageHead } from "@/components/ui/Panel";
import { ParamSlider } from "@/components/sliders/ParamSlider";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { CrosshairRenderer } from "@/crosshair/renderer";
import { defaultAnimation } from "@/crosshair/model";
import type { StudioProps } from "./shared";

const KINDS: CrosshairAnimationKind[] = ["fade", "pulse", "color", "scale", "rotate", "appear"];

export default function Animated({ design, patchAdvanced, commit }: StudioProps) {
  const animation = design.advanced.animation;
  const update = (patch: Partial<typeof animation>) => patchAdvanced({ animation: { ...animation, ...patch } });

  return (
    <div>
      <PageHead title="Animated crosshairs" description="Optional, subtle motion. Animation loops are inert while the crosshair is hidden and respect the operating system reduced-motion setting." />
      <div className="grid" style={{ gridTemplateColumns: "minmax(320px,1fr) minmax(300px,420px)", gap: 14 }}>
        <Panel title="Animation preview" icon={Sparkles} action={
          <span className={`badge ${animation.enabled ? "success" : ""}`}>{animation.enabled ? "running" : "paused"}</span>
        }>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CrosshairRenderer design={design} size={360} background="dark" animate={animation.enabled} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => update({ enabled: true })}><Play size={14} /> Preview animation</button>
            <button className="btn" onClick={() => update({ enabled: false })}><Pause size={14} /> Pause</button>
            <button className="btn" onClick={() => update(defaultAnimation())}><RotateCcw size={14} /> Reset animation</button>
            <button className="btn" onClick={() => commit(design)}>Save design</button>
          </div>
        </Panel>

        <Panel title="Animation controls">
          <ToggleRow label="Enable animation" checked={animation.enabled} onChange={(value) => update({ enabled: value })} />
          <div className="field"><label>Transition</label>
            <select value={animation.kind} onChange={(e) => update({ kind: e.target.value as CrosshairAnimationKind })}>
              {KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </div>
          <ParamSlider label="Duration" value={animation.durationMs} min={100} max={10000} suffix="ms" onChange={(value) => update({ durationMs: value })} onReset={() => update({ durationMs: 1200 })} />
          <ParamSlider label="Speed" value={Math.round(animation.speed * 100)} min={10} max={400} onChange={(value) => update({ speed: value / 100 })} onReset={() => update({ speed: 1 })} />
          <ParamSlider label="Intensity" value={animation.intensity} min={0} max={100} onChange={(value) => update({ intensity: value })} onReset={() => update({ intensity: 25 })} />
          <div className="field"><label>Easing</label>
            <select value={animation.easing} onChange={(e) => update({ easing: e.target.value as "linear" | "ease" | "ease-in-out" })}>
              <option value="linear">Linear</option><option value="ease">Ease</option><option value="ease-in-out">Ease in-out</option>
            </select>
          </div>
          <div className="field"><label>Transition color</label><input type="color" value={animation.colorTo} onChange={(e) => update({ colorTo: e.target.value })} style={{ width: "100%", height: 34 }} /></div>
          <div className="notice" style={{ marginTop: 12 }}>
            Motion runs only in the renderer while the preview is mounted. The desktop overlay honors the same reduced-motion setting.
          </div>
        </Panel>
      </div>
    </div>
  );
}
