import { useEffect, useRef, useState } from "react";
import { Eye, Moon, Accessibility, Zap } from "lucide-react";
import type { ColorSettings, ZoomMode, ZoomStatus } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { getZoomStatus, normalizeZoomLevel, releaseZoom, toggleZoom } from "@/services/zoom";
import { isTauriRuntime } from "@/services/tauri";
import { useT } from "@/i18n";

interface Effect { id: string; name: string; detail: string; settings: Partial<ColorSettings> }

const EFFECTS: Effect[] = [
  { id: "green", name: "Green theme", detail: "Green-biased display response.", settings: { green: 118, red: 88, blue: 92 } },
  { id: "blue", name: "Blue theme", detail: "Blue-biased display response.", settings: { blue: 118, red: 90, green: 96 } },
  { id: "night", name: "Night display", detail: "Lower brightness and warmer temperature.", settings: { brightness: 72, temperatureK: 4200 } },
  { id: "contrast", name: "Contrast accessibility", detail: "Raised contrast for legibility.", settings: { contrast: 135, brightness: 105 } },
  { id: "protanopia", name: "Protanopia assist", detail: "Red-channel compensation preset.", settings: { red: 122, green: 94, blue: 100 } },
  { id: "deuteranopia", name: "Deuteranopia assist", detail: "Green-channel compensation preset.", settings: { green: 124, red: 92 } },
  { id: "tritanopia", name: "Tritanopia assist", detail: "Blue-channel compensation preset.", settings: { blue: 126, green: 96 } },
];

export default function Effects() {
  const { state, setColor, setSetting, log } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [held, setHeld] = useState<string | null>(null);
  const previous = useRef<ColorSettings | null>(null);
  const [zoomStatus, setZoomStatus] = useState<ZoomStatus | null>(null);

  const zoomMode = state.settings.zoomMode;
  const zoomLevel = state.settings.zoomLevel;
  const zoomBind = state.hotkeys.find((item) => item.action === "toggle-zoom");

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    void getZoomStatus().then((result) => {
      if (active && result.ok) setZoomStatus(result.data);
    });
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<ZoomStatus>("vytrix://zoom", (event) => {
        if (active) setZoomStatus(event.payload);
      });
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, []);

  const hold = (effect: Effect) => {
    previous.current = { ...state.color };
    setHeld(effect.id);
    setColor({ ...state.color, ...effect.settings });
    log(`Held effect ${effect.name}`);
  };
  const release = () => {
    if (previous.current) setColor(previous.current);
    previous.current = null;
    setHeld(null);
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
    <div className="page">
      <PageHead title="Display Effects" description="Reversible, transparent visual adjustments and accessibility themes. No effect reveals information a game intentionally hides." />
      <div className="grid grid-3">
        {EFFECTS.map((effect) => (
          <Panel key={effect.id} title={effect.name} icon={effect.id === "night" ? Moon : Accessibility}>
            <div className="tiny" style={{ lineHeight: 1.6 }}>{effect.detail}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn primary" onPointerDown={() => hold(effect)} onPointerUp={release} onPointerLeave={release}>Hold to preview</button>
              <button className="btn" onClick={() => { setColor({ ...state.color, ...effect.settings }); log(`Applied ${effect.name}`); }}>Apply</button>
            </div>
            {held === effect.id ? <div className="badge accent" style={{ marginTop: 10 }}>active while held</div> : null}
          </Panel>
        ))}
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
          <div className="row"><span className="muted">{t("effects.zoom.bind")}</span><b className="mono">{zoomBind?.enabled === false ? "disabled" : zoomBind?.keys.join(" + ") || "none"}</b></div>
          <div className="row"><span className="muted">{t("effects.zoom.status")}</span><b className="mono">{zoomStatus?.detail ?? "idle"}</b></div>
          {zoomMode === "hold" ? <div className="tiny" style={{ lineHeight: 1.6 }}>{t("effects.zoom.holdHint")}</div> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn primary" disabled={zoomMode === "hold"} onClick={() => runZoom("toggle")}>{t("effects.zoom.toggleNow")}</button>
            <button className="btn" onClick={() => runZoom("release")}>{t("effects.zoom.release")}</button>
          </div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => { setColor({ ...state.color, gamma: 100, brightness: 100, contrast: 100, saturation: 100 }); notify("Colors reset"); }}><Zap size={14} /> Reset color effects</button>
        </Panel>
      </div>
    </div>
  );
}
