import { useEffect, useState } from "react";
import { Activity, Download, Gauge } from "lucide-react";
import type { MetricSample, DiagnosticReport } from "@vytrix/shared-types";
import { PRODUCT } from "@vytrix/config";
import { useApp } from "@/stores/app";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { PageHead, Panel, EmptyState } from "@/components/ui/Panel";
import { LineChart } from "@/components/charts/LineChart";
import { downloadText } from "@/utils/download";

export default function Performance() {
  const { state } = useApp();
  const [samples, setSamples] = useState<MetricSample[]>([]);
  const [interval, setIntervalMs] = useState(2000);
  const [minimal, setMinimal] = useState(false);
  const native = isTauriRuntime();

  useEffect(() => {
    if (!native) return;
    let active = true;
    const id = window.setInterval(async () => {
      const result = await invokeNative<MetricSample>("sample_metrics");
      if (active && result.ok) setSamples((current) => [...current.slice(-59), result.data]);
    }, interval);
    return () => { active = false; window.clearInterval(id); };
  }, [native, interval]);

  const latest = samples[samples.length - 1];
  const report: DiagnosticReport = {
    generatedAt: Date.now(), appVersion: PRODUCT.version, windowsVersion: "native",
    cpuName: "native", gpuName: "native", ramGb: 0, monitors: [], samples,
  };

  return (
    <div className="page">
      <PageHead title="Performance Monitor" description="Low-footprint sampling. FPS is shown only when the native runtime reports a measured value; estimates are never presented as measurements." />
      {!native ? <div className="notice" style={{ marginBottom: 14 }}>No telemetry source in browser mode. Open the built Windows app to collect live system metrics.</div> : null}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="tabs" style={{ margin: 0 }}>{[1000, 2000, 5000].map((ms) => <button key={ms} className={`tab ${interval === ms ? "active" : ""}`} onClick={() => setIntervalMs(ms)}>{ms} ms</button>)}</div>
        <button className={`tab ${minimal ? "active" : ""}`} onClick={() => setMinimal(!minimal)}>Minimal mode</button>
        <button className="btn" onClick={() => downloadText("vytrix-diagnostics.json", JSON.stringify(report, null, 2))}><Download size={14} /> Export report</button>
      </div>

      {samples.length === 0 ? <Panel title="Live metrics"><EmptyState icon={Activity} title="No samples" detail={native ? "Waiting for the first native sample." : "Native telemetry unavailable."} /></Panel> : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 14 }}>
            <div className="card"><div className="metric">{Math.round(latest?.cpu ?? 0)}%</div><div className="metric-label">CPU</div></div>
            <div className="card"><div className="metric">{latest?.gpu == null ? "n/a" : `${Math.round(latest.gpu)}%`}</div><div className="metric-label">GPU</div></div>
            <div className="card"><div className="metric">{Math.round(latest?.ram ?? 0)}%</div><div className="metric-label">RAM</div></div>
            <div className="card"><div className="metric">{latest?.fps == null ? "n/a" : `${Math.round(latest.fps)}`}</div><div className="metric-label">FPS {latest?.fpsMeasured ? "measured" : "estimated"}</div></div>
          </div>
          <Panel title="Live graph" icon={Gauge}>
            <LineChart series={[samples.map((s) => s.cpu), samples.map((s) => s.gpu ?? 0), samples.map((s) => s.ram)]} labels={["CPU", "GPU", "RAM"]} height={minimal ? 90 : 160} />
          </Panel>
        </>
      )}
      <div className="tiny" style={{ marginTop: 12 }}>Sampling interval {interval} ms · {samples.length} samples retained · foreground game: {state.profiles[0]?.name ?? "none"}</div>
    </div>
  );
}
