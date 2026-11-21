import { useRef, useState } from "react";
import { Wrench, Download, Upload, RotateCcw, ShieldCheck } from "lucide-react";
import type { OptimizationTask } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";

const CATEGORIES: OptimizationTask["category"][] = ["performance", "input", "privacy", "appearance"];

export default function Optimizer() {
  const { state, applyTask, restoreTask, log } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<OptimizationTask["category"] | "all">("all");
  const fileInput = useRef<HTMLInputElement>(null);
  const tasks = state.tasks.filter((t) => filter === "all" || t.category === filter);

  const applyAll = () => {
    state.tasks.filter((t) => !t.applied && t.risk === "low").forEach((t) => applyTask(t.id));
    log("Applied all low-risk recommendations");
    notify("Low-risk recommendations applied");
  };

  const exportBackup = () => {
    download(`vytrix-optimizer-backup.json`, JSON.stringify({ version: 1, tasks: state.tasks }, null, 2));
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
      <PageHead title="Windows Optimizer" description="Every change records its previous value and can be restored. Defender, firewall, Update and essential services are never disabled." />
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          {CATEGORIES.map((c) => <button key={c} className={`tab ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
        <button className="btn primary" onClick={applyAll}><Wrench size={14} /> Optimize low-risk</button>
        <button className="btn" onClick={exportBackup}><Download size={14} /> Export backup</button>
        <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> Import backup</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => void importBackup(e.target.files?.[0])} />
      </div>

      <Panel title={`${tasks.length} settings`}>
        <table className="table">
          <thead><tr><th>Setting</th><th>Effect</th><th>Risk</th><th>Current</th><th>Recommended</th><th /></tr></thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td><strong>{task.name}</strong><div className="tiny" style={{ marginTop: 4 }}>{task.description}</div></td>
                <td className="muted">{task.benefit}</td>
                <td><span className={`badge ${task.risk === "low" ? "success" : task.risk === "medium" ? "warning" : "error"}`}>{task.risk}</span></td>
                <td className="mono tiny">{task.currentState}</td>
                <td className="mono tiny">{task.recommendedState}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {task.applied ? (
                    <button className="btn" onClick={() => { restoreTask(task.id); notify(`${task.name} restored`); }}><RotateCcw size={13} /> Restore</button>
                  ) : (
                    <button className="btn primary" onClick={() => { applyTask(task.id); log(`Applied ${task.name}`); notify(`${task.name} applied`); }}>Apply</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
