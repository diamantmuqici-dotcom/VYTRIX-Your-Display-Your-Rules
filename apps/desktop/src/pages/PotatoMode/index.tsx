import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommandResult } from "@vytrix/shared-types";
import {
  Activity, AlertTriangle, Bot, Check, ChevronDown, ChevronRight, CircleCheck, Copy,
  Cpu, Download, Eye, FileJson, FolderOpen, Gauge, Gamepad2, HardDrive, History, Info, Layers,
  Monitor, Network, Play, RefreshCw, RotateCcw, Search, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Square, Timer, Upload, Wifi, Zap,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { useTranslateText } from "@/i18n";
import { PageHead, Panel } from "@/components/ui/Panel";
import * as pm from "@/services/potato";
import "./potato.css";

function unwrap<T>(result: CommandResult<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const EXPLANATION_FIELDS: {
  field: "overview" | "textures" | "environment" | "effects" | "driver" |
         "performance" | "tradeoffs" | "compatibility" | "restoration" | "gameplay";
  label: string;
}[] = [
  { field: "overview", label: "Overview" },
  { field: "textures", label: "Textures" },
  { field: "environment", label: "Environment" },
  { field: "effects", label: "Effects" },
  { field: "driver", label: "Driver profile" },
  { field: "performance", label: "Performance" },
  { field: "tradeoffs", label: "Visual trade-offs" },
  { field: "compatibility", label: "Compatibility" },
  { field: "restoration", label: "Restoration" },
  { field: "gameplay", label: "Gameplay visibility" },
];

const CATEGORIES: pm.SettingCategory[] = ["texture", "environment", "effects", "distance", "driver"];

const MANUAL_PATH_PLACEHOLDER = "C:\\\\Users\\\\you\\\\AppData\\\\Local\\\\Game\\\\Saved\\\\Config\\\\Windows\\\\GameUserSettings.ini";

function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function LevelPreview({ level }: { level: number }) {
  const detail = [100, 78, 52, 24][level] ?? 100;
  return (
    <div
      className={`pm-preview pm-preview-${level}`}
      style={{ "--pm-detail": `${detail}%` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="pm-sky" />
      <div className="pm-ridge pm-ridge-far" />
      <div className="pm-ridge pm-ridge-near" />
      <div className="pm-ground" />
      <div className="pm-detail" />
    </div>
  );
}

function Accordion({ label, text, open, onToggle }: {
  label: string; text: string; open: boolean; onToggle: () => void;
}) {
  const tr = useTranslateText();
  return (
    <div className={`pm-accordion ${open ? "open" : ""}`}>
      <button className="pm-accordion-head" onClick={onToggle} aria-expanded={open}>
        <span>{tr(label)}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open ? <div className="pm-accordion-body">{text}</div> : null}
    </div>
  );
}

export default function PotatoMode() {
  const tr = useTranslateText();
  const { notify } = useToast();
  const { state: appState, log } = useApp();
  const reducedMotion = appState.settings.reducedMotion;

  const [levels, setLevels] = useState<pm.LevelInfo[]>([]);
  const [hardware, setHardware] = useState<pm.HardwareInfo | null>(null);
  const [games, setGames] = useState<pm.GameInfo[]>([]);
  const [compat, setCompat] = useState<pm.CompatibilityRow[]>([]);
  const [recommendation, setRecommendation] = useState<pm.Recommendation | null>(null);

  const [gameId, setGameId] = useState("rob-run");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [settings, setSettings] = useState<pm.GraphicsSetting[]>([]);
  const [plan, setPlan] = useState<pm.ApplyPlan | null>(null);
  const [backup, setBackup] = useState<pm.BackupInfo | null>(null);
  const [applyResult, setApplyResult] = useState<pm.ApplyResult | null>(null);
  const [applying, setApplying] = useState(false);

  const [view, setView] = useState<"beginner" | "advanced">("beginner");
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({ overview: true });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | pm.SettingCategory>("all");
  const [showUnsupported, setShowUnsupported] = useState(false);

  const [benchmark, setBenchmark] = useState<pm.BenchmarkResult | null>(null);
  const [benchHistory, setBenchHistory] = useState<pm.BenchmarkResult[]>([]);
  const [benchmarking, setBenchmarking] = useState(false);
  const [bottleneck, setBottleneck] = useState<pm.BottleneckReport | null>(null);
  const [windowSeconds, setWindowSeconds] = useState(10);
  const [netHost, setNetHost] = useState("");
  const [netPort, setNetPort] = useState(443);
  const [probe, setProbe] = useState<pm.NetProbeResult | null>(null);

  const [history, setHistory] = useState<pm.HistoryEntry[]>([]);
  const [manualPath, setManualPath] = useState("");
  const [autoPermission, setAutoPermission] = useState(false);
  const [diagnostics, setDiagnostics] = useState("");
  const [entries, setEntries] = useState<string[]>([]);

  const addLog = useCallback((text: string) => {
    const line = `${new Date().toLocaleTimeString()}  ${text}`;
    setEntries((current) => [line, ...current].slice(0, 200));
    log(text);
  }, [log]);

  const report = useCallback((error: unknown) => {
    const text = message(error);
    notify(text, "error");
    addLog(`ERROR ${text}`);
  }, [notify, addLog]);

  const loadCore = useCallback(async () => {
    try {
      setLevels(unwrap(await pm.getLevels()));
      setHardware(unwrap(await pm.getHardware()));
      const detected = unwrap(await pm.getGames());
      setGames(detected);
      setCompat(unwrap(await pm.getCompatibility()));
      const rec = unwrap(await pm.getRecommendation());
      setRecommendation(rec);
      const stored = detected.find((game) => game.id === "rob-run")?.level;
      // FULL is never preselected automatically; the operator makes that call.
      setSelectedLevel(Math.min(stored ?? rec.level, rec.level, 2));
      addLog(`Hardware snapshot cached: ${detected.length} game profiles`);
    } catch (error) {
      report(error);
    }
  }, [addLog, report]);

  useEffect(() => { void loadCore(); }, [loadCore]);

  useEffect(() => {
    void (async () => {
      try {
        setSettings(unwrap(await pm.getSettings(gameId)));
        setPlan(unwrap(await pm.getPlan(gameId, selectedLevel)));
      } catch (error) { report(error); }
    })();
  }, [gameId, selectedLevel, report]);

  useEffect(() => {
    void (async () => {
      try {
        setBackup(unwrap(await pm.getBackupInfo(gameId)));
        setHistory(unwrap(await pm.getHistory(50)));
        setBenchHistory(unwrap(await pm.getBenchmarkHistory(20)));
        setDiagnostics(unwrap(await pm.getDiagnostics(gameId)));
      } catch (error) { report(error); }
    })();
  }, [gameId, report]);

  useEffect(() => {
    if (!benchmarking) return;
    const timer = window.setInterval(() => {
      void pm.tickBenchmark().then((result) => {
        if (result.ok) setBenchmark(result.data);
        else report(new Error(`${result.error.code}: ${result.error.message}`));
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [benchmarking, report]);

  const selectedGame = useMemo(() => games.find((game) => game.id === gameId) ?? null, [games, gameId]);
  const levelInfo = useMemo(() => levels.find((item) => item.level === selectedLevel) ?? null, [levels, selectedLevel]);

  const filteredSettings = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return settings.filter((setting) => {
      if (!showUnsupported && !setting.supported) return false;
      if (category !== "all" && setting.category !== category) return false;
      if (!needle) return true;
      return `${setting.name} ${setting.id} ${setting.category} ${setting.vendor}`.toLowerCase().includes(needle);
    });
  }, [settings, search, category, showUnsupported]);

  const planValue = useCallback((id: string): string | null => {
    return plan?.changes.find((change) => change.id === id)?.to ?? null;
  }, [plan]);

  const doApply = async () => {
    if (selectedGame?.running) {
      notify(tr("The game is running. Close it before applying; no process is terminated automatically."), "error");
      return;
    }
    setApplying(true);
    setApplyResult(null);
    try {
      const result = unwrap(await pm.applyLevel(gameId, selectedLevel));
      setApplyResult(result);
      addLog(`Applied ${pm.levelName(selectedLevel)} to ${gameId}: ${result.changes.length} changes, ${result.failures.length} failures, ${result.backupId.slice(0, 12)}`);
      setGames(unwrap(await pm.getGames()));
      setBackup(unwrap(await pm.getBackupInfo(gameId)));
      setSettings(unwrap(await pm.getSettings(gameId)));
      setHistory(unwrap(await pm.getHistory(50)));
      notify(result.failures.length
        ? tr(`Applied with ${result.failures.length} reported failure(s). Review the workflow.`)
        : tr("Applied and verified. Restart the game for configuration changes to take effect."));
    } catch (error) {
      report(error);
    } finally {
      setApplying(false);
    }
  };

  const doRestore = async () => {
    setApplying(true);
    try {
      const result = unwrap(await pm.restoreGame(gameId));
      setApplyResult(result);
      setGames(unwrap(await pm.getGames()));
      setBackup(unwrap(await pm.getBackupInfo(gameId)));
      setSettings(unwrap(await pm.getSettings(gameId)));
      setHistory(unwrap(await pm.getHistory(50)));
      setSelectedLevel(0);
      addLog(`Restored baseline for ${gameId}: ${result.changes.length} values, ${result.failures.length} failures`);
      notify(result.failures.length ? tr("Restore completed with reported failures.") : tr("Baseline restored and verified."));
    } catch (error) {
      report(error);
    } finally {
      setApplying(false);
    }
  };

  const saveManualPath = async () => {
    const path = manualPath.trim();
    if (!path) { notify(tr("Enter a configuration file path."), "error"); return; }
    try {
      unwrap(await pm.setManualPath(gameId, path));
      addLog(`Manual configuration path registered for ${gameId}`);
      setGames(unwrap(await pm.getGames()));
      setSettings(unwrap(await pm.getSettings(gameId)));
      setBackup(unwrap(await pm.getBackupInfo(gameId)));
      notify(tr("Configuration path validated and registered."));
    } catch (error) { report(error); }
  };

  const pickConfig = async () => {
    try {
      const picked = await open({
        multiple: false,
        title: tr("Select a game configuration file"),
        filters: [{ name: tr("Game configuration"), extensions: ["ini", "cfg", "txt"] }],
      });
      if (typeof picked !== "string" || !picked) return;
      setManualPath(picked);
      unwrap(await pm.setManualPath(gameId, picked));
      setGames(unwrap(await pm.getGames()));
      setSettings(unwrap(await pm.getSettings(gameId)));
      setBackup(unwrap(await pm.getBackupInfo(gameId)));
      notify(tr("Configuration path validated and registered."));
      addLog(`Manual configuration path registered for ${gameId}: ${picked}`);
    } catch (error) { report(error); }
  };

  const startBenchmark = async () => {
    try {
      const result = unwrap(await pm.startBenchmark(gameId, selectedLevel));
      setBenchmark(result);
      setBenchmarking(true);
      addLog(`Benchmark started for ${gameId} at ${pm.levelShort(selectedLevel)}`);
      notify(tr("Benchmark running. Telemetry samples are recorded once per second."));
    } catch (error) { report(error); }
  };

  const stopBenchmark = async () => {
    setBenchmarking(false);
    try {
      const result = unwrap(await pm.stopBenchmark());
      setBenchmark(result);
      setBenchHistory(unwrap(await pm.getBenchmarkHistory(20)));
      addLog(`Benchmark stopped: ${result.sampleCount} samples, ${result.measuredSamples} with frame timing`);
      notify(tr("Benchmark stopped. Results come from measured telemetry only."));
    } catch (error) { report(error); }
  };

  const runBottleneck = async () => {
    try {
      const result = unwrap(await pm.runBottleneckWindow(windowSeconds, 1000));
      setBottleneck(result);
      addLog(`Bottleneck window finished: ${result.classification} (${result.sampleCount} samples)`);
    } catch (error) { report(error); }
  };

  const runProbe = async () => {
    const host = netHost.trim();
    if (!host) { notify(tr("Enter a host name or IP address."), "error"); return; }
    try {
      const result = unwrap(await pm.probeNetwork(host, netPort, 4));
      setProbe(result);
      addLog(`TCP probe ${host}:${netPort}: ${result.samples}/4 connected`);
    } catch (error) { report(error); }
  };

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics);
      notify(tr("Diagnostics copied to clipboard."));
    } catch {
      notify(tr("Clipboard access was refused by the browser."), "error");
    }
  };

  const exportBundle = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      gameId,
      selectedLevel,
      hardware,
      settings,
      plan,
      backup,
      history,
      benchmarks: benchHistory,
      diagnostics,
      log: entries,
    };
    download(`vytrix-potato-${gameId}-${Date.now()}.json`, JSON.stringify(payload, null, 2));
    addLog(`Exported graphics center bundle for ${gameId}`);
  };

  const importBundle = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { gameId?: string; version?: number; settings?: unknown[] };
      if (parsed.version !== 1 || !Array.isArray(parsed.settings)) throw new Error("unsupported bundle format");
      addLog(`Imported bundle for ${parsed.gameId ?? "unknown"}: ${parsed.settings.length} setting records`);
      notify(tr("Bundle parsed. Review the log; no settings were changed by import."));
    } catch (error) { report(error); }
  };

  const workflow = applyResult?.steps ?? [];

  return (
    <div className={`page pm-root ${reducedMotion ? "pm-reduced" : ""}`}>
      <PageHead
        title="COMPLETE POTATO MODE 2.0"
        description="A reversible graphics optimization center. Every written value is backed up, re-read from disk, and reported per setting. Nothing is simulated and no frame-rate gain is promised."
      />

      <div className="pm-toolbar">
        <div className="tabs" style={{ margin: 0 }}>
          <button className={`tab ${view === "beginner" ? "active" : ""}`} onClick={() => setView("beginner")}>
            <Sparkles size={12} /> {tr("Beginner")}
          </button>
          <button className={`tab ${view === "advanced" ? "active" : ""}`} onClick={() => setView("advanced")}>
            <Settings2 size={12} /> {tr("Advanced")}
          </button>
        </div>
        <span className="chip"><ShieldCheck size={11} /> {tr("Read-only until you apply")}</span>
      </div>

      <Panel title="Game and target" icon={Gamepad2}>
        <div className="pm-form-row">
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>{tr("Detected game")}</label>
            <select value={gameId} onChange={(event) => setGameId(event.target.value)}>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}{game.detected ? "" : " — not detected"}
                </option>
              ))}
            </select>
          </div>
          <div className="pm-status-column">
            <span className={`badge ${selectedGame?.detected ? "success" : "warning"}`}>
              {selectedGame?.detected ? tr("Install located") : tr("Manual path needed")}
            </span>
            <span className={`badge ${selectedGame?.configFound ? "success" : "warning"}`}>
              {selectedGame?.configFound ? tr("Config located") : tr("No config")}
            </span>
            <span className={`badge ${selectedGame?.running ? "error" : "success"}`}>
              {selectedGame?.running ? tr("Running") : tr("Not running")}
            </span>
          </div>
        </div>
        <div className="tiny" style={{ marginTop: 10 }}>{selectedGame?.configStatus ?? tr("No game profile loaded.")}</div>
        {selectedGame?.installDir ? (
          <div className="tiny mono" style={{ marginTop: 4 }}>{selectedGame.installDir}</div>
        ) : null}
        <div className="pm-form-row" style={{ marginTop: 12 }}>
          <input
            type="text"
            value={manualPath}
            onChange={(event) => setManualPath(event.target.value)}
            placeholder={MANUAL_PATH_PLACEHOLDER}
            aria-label="Manual configuration path"
          />
          <button className="btn" onClick={() => void pickConfig()}>
            <FolderOpen size={14} /> {tr("Browse")}
          </button>
          <button className="btn" onClick={() => void saveManualPath()}>
            <FileJson size={14} /> {tr("Register path")}
          </button>
        </div>
        <div className="tiny" style={{ marginTop: 6 }}>
          {tr("Browse for the file, or paste a full path. Quoted paths and %LOCALAPPDATA% are accepted.")}
        </div>
      </Panel>

      <Panel title="Optimization level" icon={SlidersHorizontal} className="pm-section">
        <div className="pm-slider-block">
          <div className="pm-level-head">
            <div>
              <div className="pm-level-name">{tr(levelInfo?.name ?? pm.levelName(selectedLevel))}</div>
              <div className="tiny">{tr(levelInfo?.tagline ?? "")}</div>
            </div>
            <span className={`badge ${selectedLevel === 0 ? "success" : "accent"}`}>
              {tr(pm.levelShort(selectedLevel))}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={selectedLevel}
            onChange={(event) => setSelectedLevel(Number(event.target.value))}
            style={{ "--fill": `${(selectedLevel / 3) * 100}%` } as React.CSSProperties}
            aria-label="Optimization level"
          />
          <div className="pm-slider-labels">
            {[0, 1, 2, 3].map((value) => (
              <button key={value} className={selectedLevel === value ? "active" : ""} onClick={() => setSelectedLevel(value)}>
                {tr(pm.levelShort(value))}
              </button>
            ))}
          </div>
        </div>

        <div className="pm-compare-grid">
          {levels.map((item) => (
            <button
              key={item.level}
              className={`pm-compare-card ${selectedLevel === item.level ? "selected" : ""}`}
              onClick={() => setSelectedLevel(item.level)}
            >
              <LevelPreview level={item.level} />
              <div className="pm-compare-label">{tr(item.name)}</div>
              <div className="tiny">{tr(item.tagline)}</div>
            </button>
          ))}
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          {tr("Illustrative previews only — stylized graphics, not screenshots from the game.")}
        </div>

        <div className="pm-explain-grid">
          {EXPLANATION_FIELDS.map(({ field, label }) => {
            const text = levelInfo ? String(levelInfo[field]) : "";
            return (
              <Accordion
                key={field}
                label={label}
                text={text}
                open={Boolean(openFields[field])}
                onToggle={() => setOpenFields((current) => ({ ...current, [field]: !current[field] }))}
              />
            );
          })}
          <div className="pm-accordion">
            <div className="pm-accordion-head static">
              <span>{tr("Restart required")}</span>
              <span className={`badge ${levelInfo?.restartRequired ? "warning" : "success"}`}>
                {levelInfo?.restartRequired ? tr("Yes") : tr("No")}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {recommendation ? (
        <Panel title="Recommendation" icon={Zap} className="pm-section">
          <div className="pm-recommend">
            <div className="pm-recommend-level">
              <span className="metric">{tr(pm.levelName(recommendation.level))}</span>
              <span className="metric-label">{tr("Suggested starting point")}</span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{recommendation.reason}</p>
            <div className="pm-recommend-actions">
              <button className="btn" onClick={() => setSelectedLevel(Math.min(recommendation.level, 2))}>
                <Check size={14} /> {tr("Use suggestion")}
              </button>
              <button className="btn primary" onClick={() => void doApply()} disabled={applying || selectedGame?.running}>
                <Zap size={14} /> {applying ? tr("Working…") : tr("Apply selected level")}
              </button>
              <button className="btn" onClick={() => void doRestore()} disabled={applying}>
                <RotateCcw size={14} /> {tr("Restore baseline")}
              </button>
            </div>
          </div>
          {selectedGame?.running ? (
            <div className="pm-notice error">
              <AlertTriangle size={14} />
              {tr("The game is running. Applying is blocked until it is closed; nothing is force-terminated.")}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {applyResult ? (
        <Panel title="Apply workflow — verification" icon={ShieldCheck} className="pm-section">
          <div className="tiny" style={{ marginBottom: 10 }}>
            {tr(`Game: ${applyResult.gameId} · Level: ${pm.levelName(applyResult.level)} · Backup: ${applyResult.backupId.slice(0, 16)}`)}
          </div>
          <ol className="pm-steps">
            {workflow.map((step) => (
              <li key={step.index} className={`pm-step ${step.status}`}>
                <span className="pm-step-index">{String(step.index).padStart(2, "0")}</span>
                <span className="pm-step-body">
                  <strong>{tr(step.label)}</strong>
                  <span className="tiny">{step.detail}</span>
                </span>
                <span className={`badge ${step.status === "ok" ? "success" : step.status === "partial" ? "warning" : "error"}`}>
                  {tr(step.status)}
                </span>
              </li>
            ))}
          </ol>
          {applyResult.changes.length ? (
            <table className="table" style={{ marginTop: 12 }}>
              <thead><tr><th>{tr("Setting")}</th><th>{tr("From")}</th><th>{tr("To")}</th><th>{tr("Result")}</th></tr></thead>
              <tbody>
                {applyResult.changes.map((change, index) => (
                  <tr key={`${change.id}-${index}`}>
                    <td>{change.name}<div className="tiny mono">{change.id}</div></td>
                    <td className="mono tiny">{change.from ?? "—"}</td>
                    <td className="mono tiny">{change.to ?? "—"}</td>
                    <td><span className={`badge ${change.status === "ok" ? "success" : "warning"}`}>{tr(change.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {applyResult.failures.length ? (
            <div className="pm-notice error">
              <AlertTriangle size={14} />
              <ul>{applyResult.failures.map((failure) => <li key={failure}>{failure}</li>)}</ul>
            </div>
          ) : null}
          {applyResult.restartRequired ? (
            <div className="pm-notice">
              <Info size={14} /> {tr("Restart the game to load the new configuration.")}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {backup ? (
        <Panel title="Backup and restoration" icon={RotateCcw} className="pm-section">
          <div className="grid grid-3">
            <div className="row"><span>{tr("Integrity")}</span><span className={`badge ${backup.integrity === "verified" ? "success" : "error"}`}>{tr(backup.integrity)}</span></div>
            <div className="row"><span>{tr("Stored values")}</span><span className="mono">{backup.valueCount}</span></div>
            <div className="row"><span>{tr("Verified values")}</span><span className="mono">{backup.verifiedCount}</span></div>
            <div className="row"><span>{tr("Created")}</span><span className="mono tiny">{new Date(backup.createdAt).toLocaleString()}</span></div>
            <div className="row"><span>{tr("App version")}</span><span className="mono">v{backup.appVersion}</span></div>
            <div className="row"><span>{tr("Recoverable")}</span><span className={`badge ${backup.recoverable ? "success" : "error"}`}>{backup.recoverable ? tr("yes") : tr("no")}</span></div>
          </div>
          <div className="tiny mono" style={{ marginTop: 8 }}>{backup.configPath}</div>
        </Panel>
      ) : null}

      {view === "advanced" ? (
        <>
          <Panel title="Hardware detection" icon={Cpu} className="pm-section">
            {hardware ? (
              <>
                <div className="grid grid-4">
                  <div className="card"><div className="metric">{hardware.cpuCores}/{hardware.cpuThreads}</div><div className="metric-label">{tr("CPU cores / threads")}</div></div>
                  <div className="card"><div className="metric">{hardware.vramMb ? `${hardware.vramMb} MB` : "unknown"}</div><div className="metric-label">{tr("Video memory")}</div></div>
                  <div className="card"><div className="metric">{hardware.ramTotalGb} GB</div><div className="metric-label">{tr("System memory")}</div></div>
                  <div className="card"><div className="metric">{hardware.resolution}</div><div className="metric-label">{tr("Resolution")}</div></div>
                </div>
                <div className="grid grid-2" style={{ marginTop: 12 }}>
                  <div>
                    <div className="row"><span>{tr("Processor")}</span><span className="tiny">{hardware.cpuName}</span></div>
                    <div className="row"><span>{tr("Graphics")}</span><span className="tiny">{hardware.gpuName}</span></div>
                    <div className="row"><span>{tr("GPU vendor")}</span><span className="badge accent">{hardware.gpuVendor}</span></div>
                    <div className="row"><span>{tr("Driver")}</span><span className="tiny mono">{hardware.driverVersion}</span></div>
                  </div>
                  <div>
                    <div className="row"><span>{tr("Monitor")}</span><span className="tiny">{hardware.monitorName}</span></div>
                    <div className="row"><span>{tr("Current refresh")}</span><span className="mono">{hardware.refreshHz ? `${hardware.refreshHz} Hz` : "unknown"}</span></div>
                    <div className="row"><span>{tr("Maximum refresh")}</span><span className="mono">{hardware.maxRefreshHz ? `${hardware.maxRefreshHz} Hz` : "unknown"}</span></div>
                    <div className="row"><span>{tr("Install drive")}</span><span className="mono">{hardware.installDrive} {hardware.freeSpaceGb !== null ? `(${hardware.freeSpaceGb} GB free)` : ""}</span></div>
                  </div>
                </div>
                <div className="pm-notice">
                  <Monitor size={14} /> {tr("Refresh rate is reported only. This page never changes display modes without a separate explicit action.")}
                </div>
              </>
            ) : <div className="empty">{tr("Reading hardware snapshot…")}</div>}
          </Panel>

          <Panel title="GPU vendor compatibility" icon={Layers} className="pm-section">
            <table className="table">
              <thead><tr><th>{tr("Vendor")}</th><th>{tr("Detected")}</th><th>{tr("Driver profile")}</th><th>{tr("Game config")}</th><th>{tr("Note")}</th></tr></thead>
              <tbody>
                {compat.map((row) => (
                  <tr key={row.vendor}>
                    <td><strong>{row.label}</strong></td>
                    <td><span className={`badge ${row.detected ? "success" : ""}`}>{row.detected ? tr("yes") : tr("no")}</span></td>
                    <td className="tiny">{row.driverProfile}</td>
                    <td className="tiny">{row.gameConfig}</td>
                    <td className="tiny">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tiny" style={{ marginTop: 8 }}>
              {tr("NVIDIA-only profile values are never written to AMD or Intel hardware. Vendor APIs are not linked in this build.")}
            </div>
          </Panel>

          <Panel
            title="Advanced settings"
            icon={Settings2}
            className="pm-section"
            action={<span className="badge">{settings.length} {tr("settings")}</span>}
          >
            <div className="pm-form-row">
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: 10, opacity: 0.6 }} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tr("Search settings")}
                  style={{ paddingLeft: 30 }}
                />
              </div>
              <select value={category} onChange={(event) => setCategory(event.target.value as "all" | pm.SettingCategory)} style={{ width: 170 }}>
                <option value="all">{tr("All categories")}</option>
                {CATEGORIES.map((item) => <option key={item} value={item}>{tr(item)}</option>)}
              </select>
              <label className="pm-check">
                <input type="checkbox" checked={showUnsupported} onChange={(event) => setShowUnsupported(event.target.checked)} />
                {tr("Show unsupported")}
              </label>
            </div>
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>{tr("Setting")}</th><th>{tr("Category")}</th><th>{tr("Mechanism")}</th>
                  <th>{tr("Current")}</th><th>{tr("Planned")}</th><th>{tr("Availability")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td>
                      <strong>{setting.name}</strong>
                      <div className="tiny">{setting.explanation}</div>
                      <div className="tiny mono">{setting.id}</div>
                    </td>
                    <td className="tiny">{tr(setting.category)}</td>
                    <td className="tiny">{tr(setting.mechanism)}</td>
                    <td className="mono tiny">{setting.currentValue ?? "—"}</td>
                    <td className="mono tiny">{planValue(setting.id) ?? setting.recommendedValue ?? "—"}</td>
                    <td>
                      <span className={`badge ${setting.supported ? "success" : "warning"}`}>
                        {setting.supported ? tr("supported") : tr("unsupported")}
                      </span>
                      <div className="tiny" style={{ marginTop: 4 }}>{setting.supportReason}</div>
                      <div className="tiny">{tr(setting.performanceRelevance)} {tr(setting.visualImpact)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSettings.length === 0 ? <div className="empty">{tr("No settings match this filter.")}</div> : null}
          </Panel>

          <Panel title="Benchmark" icon={Timer} className="pm-section">
            <div className="pm-form-row">
              <button className="btn primary" onClick={() => void startBenchmark()} disabled={benchmarking}>
                <Play size={14} /> {tr("Start")}
              </button>
              <button className="btn" onClick={() => void stopBenchmark()} disabled={!benchmarking}>
                <Square size={14} /> {tr("Stop")}
              </button>
              <span className="chip"><Activity size={11} /> {benchmark?.sampleCount ?? 0} {tr("samples")}</span>
              <span className="chip"><Gauge size={11} /> {benchmark?.durationMs ?? 0} ms</span>
            </div>
            <div className="grid grid-4" style={{ marginTop: 12 }}>
              <div className="card"><div className="metric">{benchmark?.avgFps !== null && benchmark?.avgFps !== undefined ? benchmark.avgFps.toFixed(1) : "—"}</div><div className="metric-label">{tr("Average FPS")}</div></div>
              <div className="card"><div className="metric">{benchmark?.low1Fps !== null && benchmark?.low1Fps !== undefined ? benchmark.low1Fps.toFixed(1) : "—"}</div><div className="metric-label">{tr("1% low FPS")}</div></div>
              <div className="card"><div className="metric">{benchmark?.avgFrameMs !== null && benchmark?.avgFrameMs !== undefined ? benchmark.avgFrameMs.toFixed(2) : "—"}</div><div className="metric-label">{tr("Frame time ms")}</div></div>
              <div className="card"><div className="metric">{benchmark?.measuredSamples ?? 0}</div><div className="metric-label">{tr("Measured samples")}</div></div>
            </div>
            <div className="tiny" style={{ marginTop: 10 }}>{benchmark?.note ?? tr("No benchmark run recorded yet.")}</div>
            <div className="tiny">{benchmark ? `${benchmark.resolution} · ${benchmark.gpuName} · ${benchmark.cpuName}` : ""}</div>
            {benchHistory.length ? (
              <table className="table" style={{ marginTop: 12 }}>
                <thead><tr><th>{tr("Time")}</th><th>{tr("Level")}</th><th>{tr("Avg FPS")}</th><th>{tr("1% low")}</th><th>{tr("Samples")}</th></tr></thead>
                <tbody>
                  {benchHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="mono tiny">{new Date(item.startedAt).toLocaleString()}</td>
                      <td>{tr(pm.levelShort(item.level))}</td>
                      <td className="mono">{item.avgFps?.toFixed(1) ?? "—"}</td>
                      <td className="mono">{item.low1Fps?.toFixed(1) ?? "—"}</td>
                      <td className="mono">{item.measuredSamples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <button
              className="btn"
              style={{ marginTop: 12 }}
              onClick={() => download(`vytrix-benchmarks-${Date.now()}.json`, JSON.stringify(benchHistory, null, 2))}
            >
              <Download size={14} /> {tr("Export benchmark CSV/JSON")}
            </button>
          </Panel>

          <div className="grid grid-2 pm-section">
            <Panel title="Bottleneck detection" icon={Gauge}>
              <div className="pm-form-row">
                <select value={windowSeconds} onChange={(event) => setWindowSeconds(Number(event.target.value))} style={{ width: 130 }}>
                  {[5, 10, 15, 30].map((value) => <option key={value} value={value}>{value} s</option>)}
                </select>
                <button className="btn" onClick={() => void runBottleneck()}>
                  <RefreshCw size={14} /> {tr("Sample window")}
                </button>
              </div>
              {bottleneck ? (
                <div style={{ marginTop: 12 }}>
                  <div className="row"><span>{tr("Classification")}</span><span className="badge accent">{tr(bottleneck.classification)}</span></div>
                  <div className="row"><span>{tr("Confidence")}</span><span className="mono">{tr(bottleneck.confidence)}</span></div>
                  <div className="row"><span>{tr("Samples")}</span><span className="mono">{bottleneck.sampleCount}</span></div>
                  <div className="row"><span>{tr("GPU / CPU")}</span><span className="mono">{bottleneck.avgGpu?.toFixed(0) ?? "—"}% / {bottleneck.avgCpu?.toFixed(0) ?? "—"}%</span></div>
                  <p className="tiny" style={{ lineHeight: 1.6 }}>{bottleneck.explanation}</p>
                  <p className="tiny" style={{ lineHeight: 1.6 }}>{bottleneck.advice}</p>
                </div>
              ) : <div className="empty">{tr("No sampling window yet.")}</div>}
            </Panel>

            <Panel title="Network latency probe" icon={Network}>
              <div className="pm-form-row">
                <input type="text" value={netHost} onChange={(event) => setNetHost(event.target.value)} placeholder="server.example.com" aria-label="Probe host" />
                <input type="number" value={netPort} min={1} max={65535} onChange={(event) => setNetPort(Number(event.target.value))} style={{ width: 96 }} aria-label="Probe port" />
                <button className="btn" onClick={() => void runProbe()}><Wifi size={14} /> {tr("Probe")}</button>
              </div>
              {probe ? (
                <div style={{ marginTop: 12 }}>
                  <div className="row"><span>{tr("Target")}</span><span className="mono tiny">{probe.host}:{probe.port}</span></div>
                  <div className="row"><span>{tr("Min / Avg / Max")}</span><span className="mono tiny">{probe.minMs?.toFixed(1) ?? "—"} / {probe.avgMs?.toFixed(1) ?? "—"} / {probe.maxMs?.toFixed(1) ?? "—"} ms</span></div>
                  <div className="row"><span>{tr("Loss")}</span><span className="mono">{probe.lossPercent.toFixed(0)}%</span></div>
                  <p className="tiny" style={{ lineHeight: 1.6 }}>{probe.note}</p>
                </div>
              ) : <div className="empty">{tr("No probe run yet.")}</div>}
            </Panel>
          </div>

          <Panel title="Automatic mode" icon={Bot} className="pm-section">
            <div className="row">
              <span>{tr("Explicit permission to use one-shot automatic optimization")}</span>
              <label className="switch">
                <input type="checkbox" checked={autoPermission} onChange={(event) => setAutoPermission(event.target.checked)} />
                <span />
              </label>
            </div>
            <p className="tiny" style={{ lineHeight: 1.6 }}>
              {tr("Automatic mode runs only when you press the button below. It performs no background polling, never starts or closes a game, and refuses to change files while the game is running.")}
            </p>
            <button
              className="btn"
              disabled={!autoPermission || selectedGame?.running || applying}
              onClick={() => {
                setSelectedLevel(Math.min(recommendation?.level ?? 1, 2));
                addLog(`Automatic mode: suggestion applied to selection for ${gameId}`);
                notify(tr("Suggestion loaded into the selector. Review and press Apply."));
              }}
            >
              <Bot size={14} /> {tr("Load suggested level")}
            </button>
          </Panel>

          <div className="grid grid-2 pm-section">
            <Panel title="History" icon={History}>
              {history.length ? history.slice(0, 20).map((entry) => (
                <div className="row" key={entry.id}>
                  <span className="tiny">{tr(entry.event)} · {pm.levelShort(entry.fromLevel)} → {pm.levelShort(entry.toLevel)}</span>
                  <span className="tiny mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              )) : <div className="empty">{tr("No operations recorded.")}</div>}
            </Panel>
            <Panel title="Diagnostics and log" icon={FileJson}>
              <div className="pm-form-row">
                <button className="btn" onClick={() => void copyDiagnostics()}><Copy size={14} /> {tr("Copy diagnostics")}</button>
                <button className="btn" onClick={exportBundle}><Download size={14} /> {tr("Export bundle")}</button>
                <label className="btn">
                  <Upload size={14} /> {tr("Import")}
                  <input type="file" accept="application/json" hidden onChange={(event) => void importBundle(event.target.files?.[0])} />
                </label>
              </div>
              <pre className="pm-log">{diagnostics}</pre>
              <div className="pm-log pm-log-entries">
                {entries.length ? entries.map((entry, index) => <div key={`${index}-${entry}`}>{entry}</div>) : tr("No log entries.")}
              </div>
            </Panel>
          </div>
        </>
      ) : null}

      <div className="pm-foot tiny">
        <span><CircleCheck size={12} /> {tr("Backups verified with SHA-256")}</span>
        <span><Eye size={12} /> {tr("Unsupported settings are labelled, never invented")}</span>
        <span><HardDrive size={12} /> {tr("No asset files or anti-cheat components are modified")}</span>
      </div>
    </div>
  );
}
