import { useEffect, useRef, useState } from "react";
import { Wrench, Download, Upload, RotateCcw, ShieldCheck, Zap, Activity } from "lucide-react";
import type { OptimizationTask, PowerPlanStatus } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { optimizerPowerPlan } from "@/services/optimizer";
import { isTauriRuntime } from "@/services/tauri";
import { PageHead, Panel } from "@/components/ui/Panel";

const CATEGORIES: OptimizationTask["category"][] = ["performance", "input", "privacy", "appearance"];
const LABELS: Record<TaskMechanismLabel, string> = {
  registry: "Registry",
  powerPlan: "Power plan",
  localReview: "Local review",
};
type TaskMechanismLabel = "registry" | "powerPlan" | "localReview";

export default function Optimizer() {
  const { state, applyTask, restoreTask, applyAllTasks, log } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<OptimizationTask["category"] | "all">("all");
  const [plan, setPlan] = useState<PowerPlanStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const native = isTauriRuntime();
  const tasks = state.tasks.filter((t) => filter === "all" || t.category === filter);
  const applied = state.tasks.filter((t) => t.applied).length;

  useEffect(() => {
    let active = true;
    void optimizerPowerPlan().then((status) => { if (active) setPlan(status); });
    return () => { active = false; };
  }, []);

  const applyAll = () => {
    setBusy(true);
    applyAllTasks();
    window.setTimeout(() => setBusy(false), 600);
    log("Apply all optimizations requested");
    notify("Applying all optimizations");
  };

  const restoreAll = () => {
    state.tasks.filter((t) => t.applied).forEach((task) => restoreTask(task.id));
    log("Restoring all applied optimizations");
    notify("Restoring previous values");
  };

  const exportBackup = () => {
    download(`vytrix-optimizer-backup.json`, JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      powerPlan: plan,
      tasks: state.tasks,
    }, null, 2));
    log("Optimizer backup exported");
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as { tasks?: OptimizationTask[] };
      if (!Array.isArray(data.tasks)) throw new Error("invalid backup");
      log(`Loaded backup with ${data.tasks.length} entries`);
      notify("Backup parsed; review entries before applying");
    } catch (error) { notify(error instanceof Error ? error.message : "Invalid backup", "error"); }
  };

  return (
    <div className="page">
      <PageHead title="Windows Optimizer" description="Every change records its previous value and can be restored. Security services, Defender, firewall and Update are never disabled." />
      {!native ? <div className="notice" style={{ marginBottom: 14 }}>Native runtime required. Live settings load inside the VYTRIX Tauri window.</div> : null}

      <div className="grid grid-3" style={{ marginBottom: 14 }}>
        <Panel title="Optimization state" icon={Activity}>
          <div className="row"><span>Applied</span><b className="mono">{applied} / {state.tasks.length}</b></div>
          <div className="row"><span>Power plan</span><b className="mono">{plan?.activeName ?? "unavailable"}</b></div>
          <div className="row"><span>VYTRIX plan</span><span className={`badge ${plan?.vytrixGuid ? "success" : "warning"}`}>{plan?.vytrixGuid ? "installed" : "not created"}</span></div>
        </Panel>
        <Panel title="Power plan" icon={Zap}>
          <div className="tiny mono" style={{ marginBottom: 10 }}>{plan?.activeGuid ?? "no active scheme"}</div>
          <button
            className="btn primary"
            disabled={!native || !plan?.available}
            onClick={() => applyTask("power-plan")}
          >
            <Zap size={14} /> Create and activate VYTRIX plan
          </button>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Creates a dedicated high-performance scheme with powercfg. The previous scheme is saved for restore.
          </div>
        </Panel>
        <Panel title="Bulk actions" icon={Wrench}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" disabled={!native || busy} onClick={applyAll}>
              <Wrench size={14} /> Apply all optimizations
            </button>
            <button className="btn" disabled={!native || applied === 0} onClick={restoreAll}>
              <RotateCcw size={14} /> Restore all
            </button>
          </div>
          <div className="tiny muted" style={{ marginTop: 10 }}>
            All 23 settings are reversible. Each previous value is written to the local vault before the change.
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          {CATEGORIES.map((c) => <button key={c} className={`tab ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
        <button className="btn" onClick={() => { void optimizerPowerPlan().then(setPlan); }}><Activity size={14} /> Refresh</button>
        <button className="btn" onClick={exportBackup}><Download size={14} /> Export backup</button>
        <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> Import backup</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => void importBackup(e.target.files?.[0])} />
      </div>

      <Panel title={`${tasks.length} settings`}>
        <table className="table">
          <thead><tr><th>Setting</th><th>Effect</th><th>Risk</th><th>Mechanism</th><th>Current</th><th>Recommended</th><th /></tr></thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td><strong>{task.name}</strong><div className="tiny" style={{ marginTop: 4 }}>{task.description}</div></td>
                <td className="muted">{task.benefit}</td>
                <td><span className={`badge ${task.risk === "low" ? "success" : task.risk === "medium" ? "warning" : "error"}`}>{task.risk}</span></td>
                <td className="tiny mono">{LABELS[task.mechanism ?? "registry"]}</td>
                <td className="mono tiny">{task.currentState}</td>
                <td className="mono tiny">{task.recommendedState}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {task.applied ? (
                    <button className="btn" onClick={() => { restoreTask(task.id); notify(`${task.name} restore requested`); }}><RotateCcw size={13} /> Restore</button>
                  ) : (
                    <button className="btn primary" onClick={() => { applyTask(task.id); log(`Applying ${task.name}`); notify(`${task.name} apply requested`); }}>Apply</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 ? <div className="empty">No live settings. Connect the native runtime or refresh.</div> : null}
      </Panel>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <Panel title="Optimization history" icon={ShieldCheck}>
          {state.history.slice(0, 8).map((entry, index) => (
            <div className="row" key={`${entry.time}-${index}`}><span>{entry.text}</span><span className="tiny mono">{new Date(entry.time).toLocaleTimeString()}</span></div>
          ))}
          {state.history.length === 0 ? <div className="empty">No changes recorded yet.</div> : null}
        </Panel>
        <Panel title="Guarantees">
          <div className="row"><span>Previous values saved</span><span className="badge success">yes</span></div>
          <div className="row"><span>Per-setting undo</span><span className="badge success">yes</span></div>
          <div className="row"><span>Destructive registry scripts</span><span className="badge success">none</span></div>
          <div className="row"><span>Security services disabled</span><span className="badge success">none</span></div>
          <div className="row"><span>Measured FPS promises</span><span className="badge success">none</span></div>
        </Panel>
      </div>
    </div>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
