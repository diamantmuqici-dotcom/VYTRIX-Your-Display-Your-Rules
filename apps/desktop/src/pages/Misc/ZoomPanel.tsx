import { useEffect, useState } from "react";
import { Eye, Zap } from "lucide-react";
import type { ZoomMode, ZoomStatus } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { Panel } from "@/components/ui/Panel";
import { getZoomStatus, normalizeZoomLevel, releaseZoom, setZoomFocus, toggleZoom } from "@/services/zoom";
import { isTauriRuntime } from "@/services/tauri";
import { useT } from "@/i18n";

/** Full-screen magnifier control moved from Display Effects into Misc. */
export default function ZoomPanel() {
  const { state, setSetting, log } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [zoomStatus, setZoomStatus] = useState<ZoomStatus | null>(null);
  const [focusX, setFocusX] = useState(50);
  const [focusY, setFocusY] = useState(50);

  const zoomMode = state.settings.zoomMode;
  const zoomLevel = state.settings.zoomLevel;
  const zoomBind = state.hotkeys.find((item) => item.action === "toggle-zoom");

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void getZoomStatus().then((result) => {
      if (!active || !result.ok) return;
      setZoomStatus(result.data);
      setFocusX(result.data.focusX);
      setFocusY(result.data.focusY);
    });
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<ZoomStatus>("vytrix://zoom", (event) => {
        if (!active) return;
        setZoomStatus(event.payload);
        setFocusX(event.payload.focusX);
        setFocusY(event.payload.focusY);
      });
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, []);

  const applyFocus = (x: number, y: number) => {
    setFocusX(x);
    setFocusY(y);
    void setZoomFocus(x, y).then((result) => {
      if (result.ok) setZoomStatus(result.data);
      else notify(result.error.message, "error");
    });
  };

  const runZoom = (command: "toggle" | "release") => {
    const task = command === "toggle" ? toggleZoom() : releaseZoom();
    void task.then((result) => {
      if (result.ok) {
        setZoomStatus(result.data);
        log(`Zoom ${result.data.detail}`);
      } else {
        notify(result.error.message, "error");
      }
    });
  };

  return (
    <div className="grid grid-2">
      <Panel title={t("effects.zoom.title")} icon={Eye} className="elevated">
        <div className="tiny" style={{ lineHeight: 1.6 }}>{t("effects.zoom.detail")}</div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>{t("effects.zoom.mode")}</label>
          <select value={zoomMode} onChange={(event) => setSetting("zoomMode", event.target.value as ZoomMode)}>
            <option value="toggle">{t("effects.zoom.toggle")}</option>
            <option value="hold">{t("effects.zoom.hold")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("effects.zoom.level")}: {zoomLevel.toFixed(2).replace(/\.00$/, "").replace(/0$/, "")}x</label>
          <input
            type="range"
            min={1}
            max={8}
            step={0.25}
            value={zoomLevel}
            onChange={(event) => setSetting("zoomLevel", normalizeZoomLevel(Number(event.target.value)))}
          />
        </div>
        <div className="field" style={{ marginTop: 6 }}>
          <label>{t("effects.zoom.focus")}</label>
          <div className="tiny muted" style={{ marginBottom: 6 }}>{t("effects.zoom.focusHint")}</div>
        </div>
        <div className="field">
          <label>{t("effects.zoom.focusX")}: {focusX.toFixed(0)}%</label>
          <input type="range" min={0} max={100} step={1} value={focusX}
            onChange={(event) => applyFocus(Number(event.target.value), focusY)} />
        </div>
        <div className="field">
          <label>{t("effects.zoom.focusY")}: {focusY.toFixed(0)}%</label>
          <input type="range" min={0} max={100} step={1} value={focusY}
            onChange={(event) => applyFocus(focusX, Number(event.target.value))} />
        </div>
        <button className="btn" style={{ marginBottom: 10 }} onClick={() => applyFocus(50, 50)}>{t("effects.zoom.recenter")}</button>
        <div className="row" data-bind-actions="toggle-zoom" title="Right-click to set hold / toggle and the zoom bind"><span className="muted">{t("effects.zoom.bind")}</span><b className="mono">{zoomBind?.enabled === false ? "disabled" : zoomBind?.keys.join(" + ") || "none"}</b></div>
        <div className="row"><span className="muted">{t("effects.zoom.status")}</span><b className="mono">{zoomStatus?.detail ?? "idle"}</b></div>
        <div className="row"><span className="muted">{t("effects.zoom.focus")}</span><b className="mono">{focusX.toFixed(0)}% / {focusY.toFixed(0)}%</b></div>
        {zoomMode === "hold" ? <div className="tiny" style={{ lineHeight: 1.6 }}>{t("effects.zoom.holdHint")}</div> : null}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn primary" disabled={zoomMode === "hold"} onClick={() => runZoom("toggle")}>{t("effects.zoom.toggleNow")}</button>
          <button className="btn" onClick={() => runZoom("release")}>{t("effects.zoom.release")}</button>
        </div>
      </Panel>
      <Panel title={t("misc.zoom.about.title")} icon={Zap}>
        <div className="tiny" style={{ lineHeight: 1.7 }}>
          {t("misc.zoom.about.body")}
        </div>
        <div className="badge accent" style={{ marginTop: 12 }}>{t("misc.zoom.about.badge")}</div>
      </Panel>
    </div>
  );
}
