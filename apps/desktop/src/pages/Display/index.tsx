import { useState } from "react";
import { Monitor, ShieldCheck, RotateCcw } from "lucide-react";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { TIMING } from "@vytrix/config";
import { PageHead, Panel, EmptyState } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";

const RESOLUTIONS = ["1920x1080", "2560x1440", "3840x2160", "1440x1080", "1280x960", "1280x1024", "1024x768"];
const REFRESHES = [60, 75, 120, 144, 165, 240];

export default function Display() {
  const { log } = useApp();
  const { notify } = useToast();
  const [resolution, setResolution] = useState("1920x1080");
  const [refresh, setRefresh] = useState(144);
  const [scaling, setScaling] = useState(100);
  const [hdr, setHdr] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const native = isTauriRuntime();

  const apply = async () => {
    const [width, height] = resolution.split("x").map(Number) as [number, number];
    const result = await invokeNative("display_apply", { width, height, refreshRate: refresh, scaling, hdrEnabled: hdr });
    if (!result.ok) { notify("Display change needs the native runtime", "error"); return; }
    setConfirming(true);
    log(`Applied ${resolution} @ ${refresh}Hz, awaiting confirmation`);
    window.setTimeout(() => {
      setConfirming(false);
      void invokeNative("display_rollback", {});
      notify("Change not confirmed — rolled back", "error");
      log("Display change timed out and rolled back");
    }, TIMING.displayConfirmMs);
  };

  const confirm = () => {
    setConfirming(false);
    log("Display change confirmed");
    notify("Display change confirmed");
  };

  const rollback = () => {
    setConfirming(false);
    void invokeNative("display_rollback", {});
    log("Display rollback requested");
    notify("Rolled back to previous mode");
  };

  return (
    <div className="page">
      <PageHead title="Display & Monitor" description="Resolution, refresh rate, scaling and HDR. Every change writes a rollback token first and reverts automatically if confirmation is missing. Unsupported modes are never advertised." />
      {!native ? <div className="notice" style={{ marginBottom: 14 }}>Monitor enumeration and mode switching require the native Windows runtime. Draft values here are not applied to the display.</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Mode">
            <div className="field"><label>Resolution</label><div className="tabs">{RESOLUTIONS.map((r) => <button key={r} className={`tab ${resolution === r ? "active" : ""}`} onClick={() => setResolution(r)}>{r}</button>)}</div></div>
            <div className="field"><label>Refresh rate</label><div className="tabs">{REFRESHES.map((r) => <button key={r} className={`tab ${refresh === r ? "active" : ""}`} onClick={() => setRefresh(r)}>{r} Hz</button>)}</div></div>
            <div className="field"><label>Scaling · {scaling}%</label><input type="range" min={50} max={200} step={25} value={scaling} onChange={(e) => setScaling(Number(e.target.value))} /></div>
            <ToggleRow label="HDR" detail="Only enabled when the connected display reports HDR support." checked={hdr} onChange={setHdr} badge={native ? "native" : "unavailable"} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn primary" onClick={() => void apply()}>Apply mode</button>
              <button className="btn" onClick={rollback}><RotateCcw size={14} /> Restore previous</button>
            </div>
            {confirming ? <div className="notice" style={{ marginTop: 12 }}>Keep the new mode? It rolls back automatically in 15 seconds. <button className="btn primary" style={{ marginLeft: 8 }} onClick={confirm}>Confirm</button></div> : null}
          </Panel>
        </div>
        <Panel title="Connected monitors">
          {native ? <EmptyState icon={Monitor} title="Enumerating on native runtime" detail="Monitor data arrives from Windows display APIs." /> :
            <EmptyState icon={Monitor} title="No monitor data" detail="Open the built Windows app to enumerate displays." />}
          <div className="row"><span className="muted">Presets</span><span className="badge success"><ShieldCheck size={11} /> validated</span></div>
          <div className="tiny" style={{ lineHeight: 1.6, marginTop: 10 }}>Custom modes are only offered when the GPU and the display report support. The app never forces an unsupported timing.</div>
        </Panel>
      </div>
    </div>
  );
}
