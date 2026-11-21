import { useEffect, useRef, useState } from "react";
import { Monitor, ShieldCheck, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { isTauriRuntime, invokeNative } from "@/services/tauri";
import { TIMING } from "@vytrix/config";
import { PageHead, Panel, EmptyState } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useT } from "@/i18n";

const RESOLUTIONS = ["1920x1080", "2560x1440", "3840x2160", "1440x1080", "1280x960", "1280x1024", "1024x768"];
const REFRESHES = [60, 75, 120, 144, 165, 240];
const WIDTH_BOUNDS = [640, 16384] as const;
const HEIGHT_BOUNDS = [360, 8640] as const;
const HZ_BOUNDS = [24, 360] as const;

export default function Display() {
  const { state, log } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [resolution, setResolution] = useState("1920x1080");
  const [refresh, setRefresh] = useState(144);
  const [scaling, setScaling] = useState(100);
  const [hdr, setHdr] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [customHz, setCustomHz] = useState(144);
  const confirmTimer = useRef<number | null>(null);
  const native = isTauriRuntime();

  const clearConfirmTimer = () => {
    if (confirmTimer.current !== null) {
      window.clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
  };
  useEffect(() => clearConfirmTimer, []);

  const selectPreset = (value: string) => {
    setCustomMode(false);
    setResolution(value);
  };

  const useCustom = () => {
    if (customWidth < WIDTH_BOUNDS[0] || customWidth > WIDTH_BOUNDS[1]
      || customHeight < HEIGHT_BOUNDS[0] || customHeight > HEIGHT_BOUNDS[1]
      || customHz < HZ_BOUNDS[0] || customHz > HZ_BOUNDS[1]) {
      notify(t("display.invalidCustom"), "error");
      return;
    }
    setResolution(`${customWidth}x${customHeight}`);
    setRefresh(customHz);
    setCustomMode(true);
    notify(t("display.customActive"));
  };

  const apply = async () => {
    const width = customMode ? customWidth : Number(resolution.split("x")[0]);
    const height = customMode ? customHeight : Number(resolution.split("x")[1]);
    const hz = customMode ? customHz : refresh;
    if (![width, height, hz].every(Number.isFinite)
      || width < WIDTH_BOUNDS[0] || width > WIDTH_BOUNDS[1]
      || height < HEIGHT_BOUNDS[0] || height > HEIGHT_BOUNDS[1]
      || hz < HZ_BOUNDS[0] || hz > HZ_BOUNDS[1]) {
      notify(t("display.invalidCustom"), "error");
      return;
    }
    const result = await invokeNative("display_apply", { width, height, refreshRate: hz, scaling, hdrEnabled: hdr, deviceId: state.settings.monitorId });
    if (!result.ok) {
      notify(result.error.message || t("display.needsNative"), "error");
      return;
    }
    clearConfirmTimer();
    setConfirming(true);
    log(`Applied ${width}x${height} @ ${hz}Hz, awaiting confirmation`);
    confirmTimer.current = window.setTimeout(() => {
      confirmTimer.current = null;
      setConfirming(false);
      void invokeNative("display_rollback", {});
      notify(t("display.rolledBack"), "error");
      log("Display change timed out and rolled back");
    }, TIMING.displayConfirmMs);
  };

  const confirm = () => {
    clearConfirmTimer();
    setConfirming(false);
    log("Display change confirmed");
    notify(t("display.changeConfirmed"));
  };

  const rollback = () => {
    clearConfirmTimer();
    setConfirming(false);
    void invokeNative("display_rollback", {});
    log("Display rollback requested");
    notify(t("display.rollbackRequested"));
  };

  return (
    <div className="page">
      <PageHead title={t("display.title")} description={t("display.subtitle")} />
      {!native ? <div className="notice" style={{ marginBottom: 14 }}>{t("display.needsNative")}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <div className="grid" style={{ gap: 14 }}>
          <Panel title={t("display.mode")}>
            <div className="field">
              <label>{t("display.resolution")}</label>
              <div className="tabs">
                {RESOLUTIONS.map((value) => <button key={value} className={`tab ${!customMode && resolution === value ? "active" : ""}`} onClick={() => selectPreset(value)}>{value}</button>)}
                <button className={`tab ${customMode ? "active" : ""}`} onClick={() => setCustomMode(true)}><SlidersHorizontal size={13} /> {t("display.custom")}</button>
              </div>
            </div>

            {customMode ? <div className="field">
              <label>{t("display.customMode")}</label>
              <div className="grid grid-3" style={{ gap: 8 }}>
                <div className="field"><label>{t("display.width")}</label><input type="number" min={WIDTH_BOUNDS[0]} max={WIDTH_BOUNDS[1]} value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} /></div>
                <div className="field"><label>{t("display.height")}</label><input type="number" min={HEIGHT_BOUNDS[0]} max={HEIGHT_BOUNDS[1]} value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} /></div>
                <div className="field"><label>{t("display.hz")}</label><input type="number" min={HZ_BOUNDS[0]} max={HZ_BOUNDS[1]} value={customHz} onChange={(e) => setCustomHz(Number(e.target.value))} /></div>
              </div>
              <button className="btn" style={{ marginTop: 8 }} onClick={useCustom}>{t("display.useCustom")}</button>
            </div> : null}

            <div className="field"><label>{t("display.refreshRate")}</label><div className="tabs">{REFRESHES.map((value) => <button key={value} className={`tab ${!customMode && refresh === value ? "active" : ""}`} onClick={() => { setCustomMode(false); setRefresh(value); }}>{value} Hz</button>)}</div></div>
            <div className="field"><label>{t("display.scaling")} · {scaling}%</label><input type="range" min={50} max={200} step={25} value={scaling} onChange={(e) => setScaling(Number(e.target.value))} /></div>
            <ToggleRow label={t("display.hdr")} detail={t("display.hdrDetail")} checked={hdr} onChange={setHdr} badge={native ? t("display.native") : t("display.unavailable")} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn primary" onClick={() => void apply()}>{t("display.applyMode")}</button>
              <button className="btn" onClick={rollback}><RotateCcw size={14} /> {t("display.restorePrevious")}</button>
            </div>
            {confirming ? <div className="notice" style={{ marginTop: 12 }}>{t("display.keepMode")} <button className="btn primary" style={{ marginLeft: 8 }} onClick={confirm}>{t("common.confirm")}</button></div> : null}
          </Panel>
        </div>
        <Panel title={t("display.connectedMonitors")}>
          {native ? <EmptyState icon={Monitor} title={t("display.enumerating")} detail={t("display.enumeratingDetail")} /> :
            <EmptyState icon={Monitor} title={t("display.noMonitor")} detail={t("display.noMonitorDetail")} />}
          <div className="row"><span className="muted">{t("display.presets")}</span><span className="badge success"><ShieldCheck size={11} /> {t("display.validated")}</span></div>
          <div className="tiny" style={{ lineHeight: 1.6, marginTop: 10 }}>{t("display.customHint")}</div>
        </Panel>
      </div>
    </div>
  );
}
