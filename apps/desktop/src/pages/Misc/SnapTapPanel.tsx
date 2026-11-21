import { ArrowDownToLine, FolderOpen, Keyboard, ShieldCheck, Terminal } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StartupChooser } from "@/components/ui/StartupChooser";
import { useT } from "@/i18n";

const BUNDLED_FILES = [
  "tools/snaptap/bin/SnapKey_v1.7.0.exe",
  "tools/snaptap/SnapKey-ud-v1.7.0.cpp",
  "tools/snaptap/config.cfg",
  "tools/snaptap/profiles/*.cfg",
  "tools/snaptap/icon.ico, icon_off.ico",
  "tools/snaptap/LICENSE",
  "tools/snaptap/README.md",
  "tools/snaptap/README.upstream.md",
];

const CONFIG_KEYS = [
  ["universal", "Default 1: transform active in every window, global jitter, no title gating."],
  ["startupMode", "off / registry / folder — logon entry method (Run key or shell:startup)."],
  ["jitterMinMs / jitterMaxMs", "Global snap delay range used in universal mode."],
  ["Primary", "Primary movement key."],
  ["Secondary", "Opposing movement key released when Primary is pressed."],
  ["Toggle", "Enables or disables the snap behavior from the tray."],
  ["Profiles", "Saved key pairs selectable at runtime."],
];

const PROFILES = ["WASD Keys", "ESDF Keys", "ARROW Keys", "AZERTY Layout", "CUSTOM Profile"];

/** SnapTap reference panel moved under the Misc section. */
export default function SnapTapPanel() {
  const t = useT();
  return (
    <div className="grid grid-2">
      <Panel title={t("settings.startup")} icon={Keyboard}>
        <div className="tiny muted" style={{ marginBottom: 12 }}>{t("settings.startupDetail")}</div>
        <StartupChooser target="snaptap" label={t("startup.target.snaptap")} />
      </Panel>
      <Panel title="Bundled files" icon={FolderOpen}>
        <div className="stack">
          {BUNDLED_FILES.map((file) => (
            <div key={file} className="row mono tiny">
              <span>{file}</span>
            </div>
          ))}
        </div>
        <div className="tiny" style={{ marginTop: 12, lineHeight: 1.6 }}>
          {t("snaptap.subtitle")} Universal mode is on by default and runs the transform in every window; set universal=0 for the legacy detection mode.
        </div>
      </Panel>
      <Panel title="Run and build" icon={Terminal}>
        <div className="tiny" style={{ lineHeight: 1.7 }}>
          <div><b>Run:</b> <span className="mono">tools\snaptap\bin\SnapKey_v1.7.0.exe</span></div>
          <div><b>Build:</b> <span className="mono">g++ -std=c++17 -O2 -mwindows -static SnapKey-ud-v1.7.0.cpp -o SnapKey_v1.7.0.exe -lwinmm -lshell32 -lpsapi</span></div>
          <div><b>Source:</b> <span className="mono">tools\snaptap\SnapKey-ud-v1.7.0.cpp</span></div>
        </div>
        <div className="badge accent" style={{ marginTop: 12 }}><ArrowDownToLine size={14} /> prebuilt binary included</div>
      </Panel>
      <Panel title="Config" icon={Keyboard}>
        <div className="stack">
          {CONFIG_KEYS.map(([key, detail]) => (
            <div key={key} className="row tiny">
              <span className="mono">{key}</span>
              <span className="muted">{detail}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Profiles" icon={ShieldCheck}>
        <div className="stack">
          {PROFILES.map((profile) => (
            <div key={profile} className="row tiny mono">
              <span>{profile}</span>
            </div>
          ))}
        </div>
        <div className="tiny" style={{ marginTop: 12, lineHeight: 1.6 }}>
          VYTRIX does not read keyboard input, inject code, read game memory, or modify game files. Detection is report-only and labeled partial/community in the catalog.
        </div>
      </Panel>
    </div>
  );
}
