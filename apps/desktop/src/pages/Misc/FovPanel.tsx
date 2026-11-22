import { useEffect, useState } from "react";
import { Scan } from "lucide-react";
import type { FovStatus, ZoomStatus } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { Panel } from "@/components/ui/Panel";
import { FOV_MAX, FOV_MIN, getFovStatus, normalizeFovDegrees } from "@/services/zoom";
import { isTauriRuntime } from "@/services/tauri";
import { useT } from "@/i18n";

/** Screen-space apparent-FOV lens. No game files, no injection, no camera hooks. */
export default function FovPanel() {
  const { state, setSetting } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [status, setStatus] = useState<FovStatus | null>(null);

  const degrees = state.settings.fovDegrees;

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    let dispose = () => {};
    const refresh = () => {
      void getFovStatus().then((result) => {
        if (!active || !result.ok) return;
        setStatus(result.data);
      });
    };
    refresh();
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const unlisten = await listen<ZoomStatus>("vytrix://zoom", () => refresh());
      if (active) dispose = unlisten;
      else unlisten();
    })();
    return () => { active = false; dispose(); };
  }, []);

  const applyFov = (value: number) => {
    const next = normalizeFovDegrees(value);
    setSetting("fovDegrees", next);
    if (!isTauriRuntime()) notify(t("misc.fov.browser"), "info");
  };

  return (
    <div className="grid grid-2">
      <Panel title={t("misc.fov.title")} icon={Scan} className="elevated">
        <div className="tiny" style={{ lineHeight: 1.6 }}>{t("misc.fov.detail")}</div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>{t("misc.fov.degrees")}: {degrees.toFixed(0)}°</label>
          <input
            type="range"
            min={FOV_MIN}
            max={FOV_MAX}
            step={1}
            value={degrees}
            onChange={(event) => applyFov(Number(event.target.value))}
          />
          <div className="tiny muted" style={{ marginTop: 6 }}>{t("misc.fov.hint")}</div>
        </div>
        <div className="row"><span className="muted">{t("misc.fov.status")}</span><b className="mono">{status?.detail ?? "idle"}</b></div>
        <div className="row"><span className="muted">{t("misc.fov.scale")}</span><b className="mono">{status?.scale.toFixed(2) ?? "1.00"}x</b></div>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => applyFov(FOV_MAX)}>{t("misc.fov.release")}</button>
      </Panel>
      <Panel title={t("misc.fov.about.title")} icon={Scan}>
        <div className="tiny" style={{ lineHeight: 1.7 }}>{t("misc.fov.about.body")}</div>
        <div className="badge accent" style={{ marginTop: 12 }}>{t("misc.fov.about.badge")}</div>
      </Panel>
    </div>
  );
}
