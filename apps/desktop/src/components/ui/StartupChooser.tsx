import { useCallback, useEffect, useState } from "react";
import { useT } from "@/i18n";
import { useToast } from "@/hooks/useToast";
import {
  startupConfigure,
  startupStatus,
  type StartupMode,
  type StartupTarget,
  type StartupView,
} from "@/services/startup";

const MODES: StartupMode[] = ["off", "registry", "folder"];

interface Props {
  target: StartupTarget;
  label: string;
}

/** Per-user logon chooser for one app. Reads live status, writes on selection. */
export function StartupChooser({ target, label }: Props) {
  const t = useT();
  const { notify } = useToast();
  const [view, setView] = useState<StartupView | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void startupStatus(target).then(setView);
  }, [target]);

  useEffect(refresh, [refresh]);

  const choose = (mode: StartupMode) => {
    if (busy || view?.mode === mode) return;
    setBusy(true);
    void startupConfigure(target, mode).then((next) => {
      setBusy(false);
      if (!next) {
        notify(t("startup.failed"), "error");
        refresh();
        return;
      }
      setView(next);
      notify(t("startup.saved"));
    });
  };

  const active = view?.mode ?? "off";

  return (
    <div className="stack">
      <div className="row">
        <strong>{label}</strong>
        <span className="badge">{view?.present ? t("startup.current") : t("startup.none")}</span>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {MODES.map((mode) => (
          <button
            key={mode}
            className={`btn ${active === mode ? "primary" : ""}`}
            disabled={busy}
            onClick={() => choose(mode)}
          >
            {t(`startup.mode.${mode}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>
      {view?.executable ? (
        <div className="row tiny mono muted" style={{ overflowWrap: "anywhere" }}>
          {t("startup.executable")}: {view.executable}
        </div>
      ) : null}
    </div>
  );
}
