import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, Check, ChevronDown, Download, ExternalLink, Info,
  Layers, RotateCcw, ShieldCheck, Sparkles, Upload, Wrench, Zap,
} from "lucide-react";
import type {
  OptimizationCategory, OptimizationTask, PlatinumView, PowerPlanStatus, TaskOutcome,
} from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import {
  optimizerPlatinumApplyAll, optimizerPlatinumRestoreAll, optimizerPowerPlan,
  optimizerProfile,
} from "@/services/optimizer";
import { isTauriRuntime } from "@/services/tauri";
import { PageHead, Panel } from "@/components/ui/Panel";

const CATEGORIES: OptimizationCategory[] = [
  "performance", "memory", "graphics", "storage", "power", "network",
  "services", "privacy", "appearance", "input",
];

const MECHANISM_LABEL: Record<string, string> = {
  registry: "Registry",
  powerPlan: "Power plan",
  systemCommand: "System command",
  localReview: "Local review",
};

export default function Optimizer() {
  const { state, applyTask, restoreTask, applyAllTasks, refreshTasks, log } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<OptimizationCategory | "all">("all");
  const [plan, setPlan] = useState<PowerPlanStatus | null>(null);
  const [profile, setProfile] = useState<PlatinumView | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState<"apply" | "restore" | "base" | null>(null);
  const [outcomes, setOutcomes] = useState<TaskOutcome[] | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const native = isTauriRuntime();

  const loadProfile = () => {
    void optimizerProfile().then((value) => { if (value) setProfile(value); });
  };

  useEffect(() => {
    let active = true;
    void optimizerPowerPlan().then((status) => { if (active) setPlan(status); });
    void optimizerProfile().then((value) => { if (active && value) setProfile(value); });
    return () => { active = false; };
  }, []);

  const applied = state.tasks.filter((task) => task.applied).length;
  const tasks = state.tasks.filter((task) => filter === "all" || task.category === filter);

  const runPlatinum = async () => {
    setBusy("apply");
    setOutcomes(null);
    const results = await optimizerPlatinumApplyAll();
    if (results) {
      setOutcomes(results);
      const ok = results.filter((item) => item.applied).length;
      log(`Platinum profile: ${ok} of ${results.length} settings applied`);
      for (const item of results.filter((entry) => !entry.applied)) log(`${item.id}: ${item.message}`);
      notify(`Optimizer applied ${ok} of ${results.length}`);
    }
    refreshTasks();
    loadProfile();
    setBusy(null);
  };

  const undoPlatinum = async () => {
    setBusy("restore");
    setOutcomes(null);
    const results = await optimizerPlatinumRestoreAll();
    if (results) {
      setOutcomes(results);
      const ok = results.filter((item) => !item.applied).length;
      log(`Platinum profile restored: ${ok} of ${results.length}`);
      notify(`Optimizer restored ${ok} settings`);
    }
    refreshTasks();
    loadProfile();
    setBusy(null);
  };

  const applyAll = () => {
    setBusy("base");
    applyAllTasks();
    log("Apply all optimizations requested");
    notify("Applying all optimizations");
    window.setTimeout(() => setBusy(null), 600);
  };

  const restoreAll = () => {
    state.tasks.filter((task) => task.applied).forEach((task) => restoreTask(task.id));
    log("Restoring all applied optimizations");
    notify("Restoring previous values");
  };

  const exportBackup = () => {
    download("vytrix-optimizer-backup.json", JSON.stringify({
      version: 3,
      exportedAt: new Date().toISOString(),
      powerPlan: plan,
      platinum: profile,
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
    } catch (error) {
      notify(error instanceof Error ? error.message : "Invalid backup", "error");
    }
  };

  const okCount = outcomes?.filter((item) => item.applied).length ?? 0;
  const failCount = outcomes?.filter((item) => !item.applied).length ?? 0;

  return (
    <div className="page opt-page">
      <PageHead
        title="Windows Optimizer"
        description="Live Windows tuning with a saved value for every change. Defender, firewall and Update availability are never disabled."
      />
      {!native ? (
        <div className="notice" style={{ marginBottom: 14 }}>
          Native runtime required. Live settings load inside the VYTRIX Tauri window.
        </div>
      ) : null}

      <button
        type="button"
        className={`opt-hero ${revealed ? "open" : ""}`}
        onClick={() => setRevealed((value) => !value)}
        aria-expanded={revealed}
      >
        <div className="opt-hero-icon"><Sparkles size={26} /></div>
        <div className="opt-hero-copy">
          <div className="opt-hero-kicker">FEATURE</div>
          <div className="opt-hero-title">Optimizer</div>
          <div className="opt-hero-sub">
            Platinum+ v9.5 profile · {profile?.recommendedCount ?? "—"} tweaks tuned for
            {" "}{profile?.os.family ?? "this Windows build"}
          </div>
        </div>
        <div className="opt-hero-cta">
          <span>{revealed ? "Close" : "Open Optimizer"}</span>
          {revealed ? <ChevronDown size={16} /> : <ArrowRight size={16} />}
        </div>
      </button>

      {revealed ? (
        <section className="opt-platinum">
          <div className="opt-attribution">
            <Info size={16} />
            <span>{profile?.attribution ?? "Ported from Platinum+ Optimizer v9.5 by @STEFANO83223 and @Aledect (SourceForge). Upstream updates are not ours."}</span>
            <a href={profile?.sourceUrl ?? "https://sourceforge.net/projects/platinum-optimizer/"} target="_blank" rel="noreferrer">
              Source <ExternalLink size={12} />
            </a>
          </div>

          <div className="opt-stat-grid">
            <div className="opt-stat">
              <span className="opt-stat-label">Detected system</span>
              <strong>{profile?.os.productName ?? "detecting"}</strong>
              <span className="opt-stat-foot mono">
                {profile ? `${profile.os.displayVersion} · build ${profile.os.currentBuild}.${profile.os.ubr}` : "reading registry"}
              </span>
            </div>
            <div className="opt-stat">
              <span className="opt-stat-label">Profile</span>
              <strong>{profile?.os.family ?? "—"}</strong>
              <span className={`badge ${profile?.os.isWindows11 ? "success" : "warning"}`}>
                {profile?.os.isWindows11 ? "Windows 11 entries on" : "Windows 10 safe subset"}
              </span>
            </div>
            <div className="opt-stat">
              <span className="opt-stat-label">Applicable tweaks</span>
              <strong className="mono">{profile?.recommendedCount ?? "—"} / {profile?.taskCount ?? "—"}</strong>
              <span className="opt-stat-foot">filtered by build + edition</span>
            </div>
          </div>

          <div className="opt-commandbar">
            <button className="btn primary opt-run" disabled={!native || busy !== null} onClick={() => void runPlatinum()}>
              {busy === "apply" ? <Activity size={15} className="spin" /> : <Zap size={15} />}
              {busy === "apply" ? "Running profile…" : "Run full profile"}
            </button>
            <button className="btn opt-run" disabled={!native || busy !== null} onClick={() => void undoPlatinum()}>
              {busy === "restore" ? <Activity size={15} className="spin" /> : <RotateCcw size={15} />}
              {busy === "restore" ? "Restoring…" : "Restore profile"}
            </button>
            <button className="btn" onClick={() => { void optimizerPowerPlan().then(setPlan); loadProfile(); }}>
              <Activity size={14} /> Refresh
            </button>
          </div>

          {outcomes ? (
            <div className="opt-progress">
              <div className="opt-progress-head">
                <span><Check size={14} /> {okCount} applied</span>
                <span className={failCount ? "error-text" : "muted"}>{failCount} skipped</span>
              </div>
              <div className="opt-progress-bar">
                <div style={{ width: `${outcomes.length ? (okCount / outcomes.length) * 100 : 0}%` }} />
              </div>
              <div className="opt-outcomes">
                {outcomes.filter((item) => !item.applied).slice(0, 6).map((item) => (
                  <div className="opt-outcome" key={item.id}>
                    <span className="mono">{item.id}</span><span className="tiny">{item.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="opt-groups">
            {profile?.groups.map((group) => {
              const groupTasks = state.tasks.filter((task) => group.taskIds.includes(task.id));
              const done = groupTasks.filter((task) => task.applied).length;
              const isOpen = openGroup === group.id;
              return (
                <div className={`opt-group ${isOpen ? "open" : ""}`} key={group.id}>
                  <button type="button" className="opt-group-head" onClick={() => setOpenGroup(isOpen ? null : group.id)}>
                    <div className="opt-group-icon"><Layers size={16} /></div>
                    <div className="opt-group-copy">
                      <strong>{group.title}</strong>
                      <span className="tiny muted">{group.detail}</span>
                    </div>
                    <div className="opt-group-count mono">{done}/{groupTasks.length}</div>
                    <ChevronDown size={15} className={`opt-group-chevron ${isOpen ? "up" : ""}`} />
                  </button>
                  {isOpen ? (
                    <div className="opt-group-body">
                      {groupTasks.map((task) => (
                        <div className="opt-task" key={task.id}>
                          <div className="opt-task-main">
                            <strong>{task.name}</strong>
                            <span className="tiny muted">{task.description}</span>
                          </div>
                          <div className="opt-task-state mono">
                            <span className="muted">{task.currentState}</span>
                            <ArrowRight size={12} />
                            <span>{task.recommendedState}</span>
                          </div>
                          <button
                            className={`btn tiny ${task.applied ? "" : "primary"}`}
                            onClick={() => {
                              if (task.applied) { restoreTask(task.id); notify(`${task.name} restored`); }
                              else { applyTask(task.id); notify(`${task.name} applied`); }
                            }}
                          >
                            {task.applied ? <RotateCcw size={12} /> : <Check size={12} />}
                            {task.applied ? "Undo" : "Apply"}
                          </button>
                        </div>
                      ))}
                      {groupTasks.length === 0 ? <div className="empty">No live entries in this group.</div> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid grid-3" style={{ marginBottom: 14 }}>
        <Panel title="Optimization state" icon={Activity}>
          <div className="row"><span>Applied</span><b className="mono">{applied} / {state.tasks.length}</b></div>
          <div className="row"><span>Power plan</span><b className="mono">{plan?.activeName ?? "unavailable"}</b></div>
          <div className="row"><span>VYTRIX plan</span><span className={`badge ${plan?.vytrixGuid ? "success" : "warning"}`}>{plan?.vytrixGuid ? "installed" : "not created"}</span></div>
        </Panel>
        <Panel title="Power plan" icon={Zap}>
          <div className="tiny mono" style={{ marginBottom: 10 }}>{plan?.activeGuid ?? "no active scheme"}</div>
          <button className="btn primary" disabled={!native || !plan?.available} onClick={() => applyTask("power-plan")}>
            <Zap size={14} /> Create and activate VYTRIX plan
          </button>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Creates a dedicated high-performance scheme with powercfg. The previous scheme is saved for restore.
          </div>
        </Panel>
        <Panel title="Bulk actions" icon={Wrench}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" disabled={!native || busy !== null} onClick={applyAll}>
              <Wrench size={14} /> Apply all optimizations
            </button>
            <button className="btn" disabled={!native || applied === 0} onClick={restoreAll}>
              <RotateCcw size={14} /> Restore all
            </button>
          </div>
          <div className="tiny muted" style={{ marginTop: 10 }}>
            Core VYTRIX settings are reversible. Each previous value is written to the local vault before the change.
          </div>
        </Panel>
      </div>

      <div className="opt-toolbar">
        <div className="tabs" style={{ margin: 0 }}>
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          {CATEGORIES.map((category) => (
            <button key={category} className={`tab ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <div className="opt-toolbar-actions">
          <button className="btn" onClick={exportBackup}><Download size={14} /> Export backup</button>
          <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> Import backup</button>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
        </div>
      </div>

      <div className="opt-task-grid">
        {tasks.map((task) => (
          <div className="opt-card" key={task.id}>
            <div className="opt-card-top">
              <span className="opt-card-name">{task.name}</span>
              <span className={`badge ${task.risk === "low" ? "success" : task.risk === "medium" ? "warning" : "error"}`}>{task.risk}</span>
            </div>
            <p className="opt-card-desc">{task.description}</p>
            <div className="opt-card-effect">{task.benefit}</div>
            <div className="opt-card-state mono">
              <span className="muted" title={task.currentState}>{task.currentState}</span>
              <ArrowRight size={12} />
              <span title={task.recommendedState}>{task.recommendedState}</span>
            </div>
            <div className="opt-card-foot">
              <span className="tiny muted">{MECHANISM_LABEL[task.mechanism ?? "registry"]}</span>
              <button
                className={`btn tiny ${task.applied ? "" : "primary"}`}
                onClick={() => {
                  if (task.applied) { restoreTask(task.id); notify(`${task.name} restored`); }
                  else { applyTask(task.id); log(`Applying ${task.name}`); notify(`${task.name} applied`); }
                }}
              >
                {task.applied ? <RotateCcw size={12} /> : <Check size={12} />}
                {task.applied ? "Restore" : "Apply"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {tasks.length === 0 ? <div className="empty">No live settings. Connect the native runtime or refresh.</div> : null}

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <Panel title="Optimization history" icon={ShieldCheck}>
          {state.history.slice(0, 8).map((entry, index) => (
            <div className="row" key={`${entry.time}-${index}`}>
              <span>{entry.text}</span>
              <span className="tiny mono">{new Date(entry.time).toLocaleTimeString()}</span>
            </div>
          ))}
          {state.history.length === 0 ? <div className="empty">No changes recorded yet.</div> : null}
        </Panel>
        <Panel title="Guarantees">
          <div className="row"><span>Previous values saved</span><span className="badge success">yes</span></div>
          <div className="row"><span>Per-setting undo</span><span className="badge success">yes</span></div>
          <div className="row"><span>OS-aware profile</span><span className="badge success">yes</span></div>
          <div className="row"><span>Destructive registry scripts</span><span className="badge success">none</span></div>
          <div className="row"><span>Security services disabled</span><span className="badge success">none</span></div>
        </Panel>
      </div>
    </div>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
