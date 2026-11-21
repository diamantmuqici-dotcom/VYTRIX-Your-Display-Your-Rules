import { useEffect, useState } from "react";
import { Activity, Gamepad2, Palette, Crosshair, Library, Wrench, RotateCcw } from "lucide-react";
import type { SectionId } from "@vytrix/config";
import { PRODUCT } from "@vytrix/config";
import type { SystemSummary } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { useToast } from "@/hooks/useToast";
import { Panel, Metric } from "@/components/ui/Panel";

export default function Overview() {
  const { state, setSection, setColor, setBaseline, log } = useApp();
  const { notify } = useToast();
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const native = isTauriRuntime();

  useEffect(() => {
    let active = true;
    invokeNative<SystemSummary>("system_summary").then((result) => {
      if (active && result.ok) setSummary(result.data);
    });
    return () => { active = false; };
  }, []);

  const quick: { label: string; icon: typeof Palette; section: SectionId }[] = [
    { label: "Color Studio", icon: Palette, section: "color-studio" },
    { label: "Game Profiles", icon: Gamepad2, section: "game-profiles" },
    { label: "Crosshair", icon: Crosshair, section: "crosshair" },
    { label: "Preset Library", icon: Library, section: "preset-library" },
    { label: "Optimize", icon: Wrench, section: "optimizer" },
    { label: "Performance", icon: Activity, section: "performance" },
  ];

  const restore = () => {
    setColor(state.baseline);
    setBaseline(state.baseline);
    log("Restored desktop color baseline");
    notify("Baseline restored");
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Welcome to <span className="gradient-text">VYTRIX</span></h1>
        <p>Your display control center. State below is read from the native runtime when connected; nothing is simulated.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <Metric label="Application" value={PRODUCT.version} />
        <Metric label="Logical processors" value={String(navigator.hardwareConcurrency || "n/a")} />
        <Metric label="Active color preset" value={summary?.activeColorPreset ?? "Local session"} />
        <Metric label="Optimization" value={summary?.optimizationStatus ?? "unknown"} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <Panel title="System information">
          <div className="row"><span className="muted">Windows</span><b className="mono">{summary?.windowsVersion ?? (native ? "detecting" : "native runtime required")}</b></div>
          <div className="row"><span className="muted">CPU</span><b className="mono">{summary?.cpuName ?? "native runtime required"}</b></div>
          <div className="row"><span className="muted">GPU</span><b className="mono">{summary?.gpuName ?? "native runtime required"}</b></div>
          <div className="row"><span className="muted">Memory</span><b className="mono">{summary ? `${summary.ramGb} GB` : "native runtime required"}</b></div>
          <div className="row"><span className="muted">Monitor</span><b className="mono">{summary?.activeMonitor ?? "native runtime required"}</b></div>
          <div className="row"><span className="muted">Foreground game</span><b className="mono">{summary?.activeGame ?? "none detected"}</b></div>
          <div className="row"><span className="muted">Active game profile</span><b className="mono">{summary?.activeProfile ?? state.profiles[0]?.name ?? "none"}</b></div>
        </Panel>
        <Panel title="Quick actions" action={<span className={`dot ${native ? "" : "warn"}`} />}>
          <div className="grid grid-2">
            {quick.map(({ label, icon: Icon, section }) => (
              <button key={label} className="btn" onClick={() => setSection(section)}>
                <Icon size={15} /> {label}
              </button>
            ))}
            <button className="btn ghost" onClick={restore}><RotateCcw size={15} /> Restore defaults</button>
          </div>
          {!native ? <div className="notice" style={{ marginTop: 14 }}>Native display and GPU controls activate when this UI runs inside the VYTRIX Tauri window. In-browser mode keeps settings, presets and profiles fully usable.</div> : null}
        </Panel>
      </div>
    </div>
  );
}
