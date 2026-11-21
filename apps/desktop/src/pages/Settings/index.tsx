import { useRef, useState } from "react";
import { Settings as SettingsIcon, Download, Upload, Trash2 } from "lucide-react";
import type { Language } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { downloadText } from "@/utils/download";
import { LANGUAGE_OPTIONS, useT } from "@/i18n";

const TABS = ["General", "Display", "Performance", "Privacy", "Account", "Advanced"] as const;

export default function Settings() {
  const { state, setSetting, reset, log, setSmartSwitchEnabled, loadSmartSwitchHistory } = useApp();
  const { notify } = useToast();
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const fileInput = useRef<HTMLInputElement>(null);

  const importConfig = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (!data["settings"]) throw new Error("no settings in file");
      window.localStorage.setItem("vytrix.state.v1", JSON.stringify(data));
      log("Configuration imported; reload to apply");
      notify(t("settings.configImported"));
    } catch (error) { notify(error instanceof Error ? error.message : "Invalid config", "error"); }
  };

  return (
    <div className="page">
      <PageHead title={t("settings.title")} description={t("settings.subtitle")} />
      <div className="tabs">{TABS.map((value) => <button key={value} className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>{t(`common.${value.toLowerCase()}` as Parameters<typeof t>[0])}</button>)}</div>

      {tab === "General" ? <Panel title={t("common.general")} icon={SettingsIcon}>
        <ToggleRow label={t("settings.startWithWindows")} checked={state.settings.startWithWindows} onChange={(v) => setSetting("startWithWindows", v)} detail={t("settings.startWithWindowsDetail")} />
        <ToggleRow label={t("settings.minimizeToTray")} checked={state.settings.minimizeToTray} onChange={(v) => setSetting("minimizeToTray", v)} />
        <ToggleRow label={t("settings.notifications")} checked={state.settings.notifications} onChange={(v) => setSetting("notifications", v)} />
        <div className="field" style={{ marginTop: 12 }}>
          <label>{t("common.language")}</label>
          <select value={state.settings.language} onChange={(e) => setSetting("language", e.target.value as Language)}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </Panel> : null}

      {tab === "Display" ? <Panel title={t("common.display")}>
        <div className="field"><label>{t("settings.defaultProfile")}</label><input type="text" value={state.profiles[0]?.name ?? "None"} readOnly /></div>
        <ToggleRow label={t("settings.autoRestoration")} checked detail={t("settings.autoRestorationDetail")} onChange={() => notify(t("settings.autoRestoration"))} />
        <ToggleRow
          label={t("settings.smartSwitch")}
          detail={t("settings.smartSwitchDetail")}
          checked={state.smartSwitchEnabled}
          onChange={setSmartSwitchEnabled}
          badge={state.smartSwitchStatus?.currentProfile ?? undefined}
        />
      </Panel> : null}

      {tab === "Performance" ? <Panel title={t("common.performance")}>
        <ToggleRow label={t("settings.backgroundMonitoring")} checked={state.settings.notifications} onChange={(v) => setSetting("notifications", v)} detail="Sampling interval is configurable in Performance Monitor." />
        <div className="field"><label>{t("settings.animationIntensity")}</label><b className="mono">{state.settings.animationIntensity}%</b></div>
      </Panel> : null}

      {tab === "Privacy" ? <Panel title={t("common.privacy")}>
        <ToggleRow label={t("settings.telemetry")} checked={state.settings.telemetryOptIn} onChange={(v) => { setSetting("telemetryOptIn", v); log(`Telemetry ${v ? "enabled" : "disabled"}`); }} detail={t("settings.telemetryDetail")} />
        <div className="row"><span>{t("settings.localData")}</span><b className="mono">app data directory</b></div>
        <div className="row"><span>{t("common.account")}</span><span className="badge">{t("settings.account")}</span></div>
      </Panel> : null}

      {tab === "Account" ? <Panel title={t("common.account")}>
        <div className="empty"><strong style={{ color: "var(--vy-text)" }}>{t("settings.offlineMode")}</strong><span>{t("settings.offlineText")}</span></div>
      </Panel> : null}

      {tab === "Advanced" ? <div className="grid" style={{ gap: 14 }}>
        <Panel title={t("settings.configuration")}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => downloadText("vytrix-config.json", JSON.stringify(state, null, 2))}><Download size={14} /> {t("common.export")}</button>
            <button className="btn" onClick={() => fileInput.current?.click()}><Upload size={14} /> {t("common.import")}</button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => void importConfig(e.target.files?.[0])} />
            <button className="btn danger" onClick={() => { if (window.confirm(t("settings.resetConfirm"))) { reset(); notify(t("common.reset")); } }}><Trash2 size={14} /> {t("common.reset")}</button>
          </div>
        </Panel>
        <Panel
          title={t("settings.switchHistory")}
          action={<button className="btn" onClick={() => loadSmartSwitchHistory(50)}>{t("settings.refreshHistory")}</button>}
        >
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {state.smartSwitchHistory.map((record, index) => (
              <div className="row" key={`${record.time}-${index}`}>
                <span className="tiny mono">{new Date(record.time).toLocaleTimeString()}</span>
                <span className="tiny">{record.game}</span>
                <span className="badge">{record.action}</span>
                <span className="tiny">{record.detail}</span>
              </div>
            ))}
            {state.smartSwitchHistory.length === 0 ? <div className="empty">{t("settings.switchHistoryEmpty")}</div> : null}
          </div>
        </Panel>
        <Panel title={t("settings.applicationLog")}>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {state.history.map((entry, index) => <div className="row" key={`${entry.time}-${index}`}><span className="tiny">{entry.text}</span><span className="tiny mono">{new Date(entry.time).toLocaleString()}</span></div>)}
            {state.history.length === 0 ? <div className="empty">{t("settings.noLog")}</div> : null}
          </div>
        </Panel>
      </div> : null}
    </div>
  );
}
