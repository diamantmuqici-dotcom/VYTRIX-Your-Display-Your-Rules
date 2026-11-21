import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, Link2, Wifi, ShieldCheck, Unplug, RefreshCw, Power } from "lucide-react";
import type { PhonePermissions, PhoneSession } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { invokeNative, isTauriRuntime } from "@/services/tauri";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";

const CONTROLS: { key: keyof PhonePermissions; label: string }[] = [
  { key: "saturation", label: "Saturation" },
  { key: "vibrance", label: "Vibrance" },
  { key: "gamma", label: "Gamma" },
  { key: "brightness", label: "Brightness" },
  { key: "presets", label: "Presets" },
  { key: "crosshair", label: "Crosshair" },
  { key: "effects", label: "Effects / color channels" },
];

function formatRemaining(expiresAt: number): string {
  const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PhoneControl() {
  const { state, setPhonePermission, log } = useApp();
  const { notify } = useToast();
  const native = isTauriRuntime();
  const [session, setSession] = useState<PhoneSession | null>(null);
  const [port, setPort] = useState(8753);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [qr, setQr] = useState("");

  const refresh = useCallback(async () => {
    const result = await invokeNative<PhoneSession>("phone_status");
    if (result.ok) setSession(result.data);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!session?.enabled) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [session?.enabled, refresh]);

  useEffect(() => {
    if (!session?.enabled || !session.code) { setQr(""); return; }
    const uri = `vytrix://pair?host=${encodeURIComponent(`http://${session.host}:${session.port}`)}&code=${session.code}`;
    let live = true;
    void QRCode.toDataURL(uri, {
      width: 220,
      margin: 1,
      color: { dark: "#080B12", light: "#F8FAFC" },
    }).then((data) => { if (live) setQr(data); });
    return () => { live = false; };
  }, [session?.enabled, session?.code, session?.host, session?.port]);

  const act = async (command: string, args?: Record<string, unknown>) => {
    setBusy(true);
    const result = await invokeNative<PhoneSession>(command, args);
    setBusy(false);
    if (!result.ok) {
      notify(result.error.message, "error");
      log(`Phone command failed: ${result.error.code}`);
      return;
    }
    setSession(result.data);
  };

  const togglePermission = (key: keyof PhonePermissions, enabled: boolean) => {
    const permissions = { ...state.phonePermissions, [key]: enabled };
    setPhonePermission(key, enabled);
    void invokeNative<void>("phone_permissions", { permissions });
    log(`Phone control ${key} ${enabled ? "enabled" : "disabled"}`);
  };

  const endpoint = useMemo(
    () => session?.enabled ? `http://${session.host}:${session.port}` : "—",
    [session?.enabled, session?.host, session?.port],
  );

  return (
    <div className="page">
      <PageHead
        title="Phone Control"
        description="Optional LAN-only companion. Pairing is explicit, the bearer token expires after five minutes, and no firewall rule is opened automatically."
      />
      <div className="grid grid-2">
        <Panel title="Pair a device" icon={Smartphone}>
          {session?.enabled ? (
            <>
              <div className="row"><span className="muted">Endpoint</span><b className="mono">{endpoint}</b></div>
              <div className="row"><span className="muted">Pairing code</span><b className="mono" style={{ fontSize: 20, letterSpacing: ".28em" }}>{session.code || "—"}</b></div>
              <div className="row"><span className="muted">Session</span><span className={`badge ${session.paired ? "success" : ""}`}>{session.paired ? "paired" : "awaiting pairing"}</span></div>
              <div className="row"><span className="muted">Session expires</span><b className="mono">{session.paired ? formatRemaining(session.expiresAt) : "—"}</b></div>
              <div className="row"><span className="muted">Pairing window</span><b className="mono">{session.code ? formatRemaining(session.pairingExpiresAt) : "closed"}</b></div>
              {qr ? <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 12, display: "inline-block", marginTop: 12 }}><img src={qr} alt="Pairing QR code" width={220} height={220} /></div> : null}
              <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn" disabled={busy || !native} onClick={() => void act("phone_rotate_code")}><RefreshCw size={14} /> New code</button>
                <button className="btn" disabled={busy || !native} onClick={() => void act("phone_unpair")}><Unplug size={14} /> Disconnect</button>
                <button className="btn danger" disabled={busy || !native} onClick={() => void act("phone_stop")}><Power size={14} /> Stop agent</button>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>LAN port</label>
                <input className="input" type="number" min={1024} max={65535} value={port}
                  onChange={(event) => setPort(Math.min(65535, Math.max(1024, Number(event.target.value) || 8753)))} />
              </div>
              <p className="muted tiny">The agent binds to all interfaces on this port only while it is running. Pairing requires the six-digit code below; no firewall rule is created.</p>
              <button className="btn primary" disabled={busy || !native} onClick={() => void act("phone_start", { port })}>
                <Link2 size={14} /> Start pairing
              </button>
              {!native ? <p className="muted tiny">Native runtime required to start the LAN agent.</p> : null}
            </>
          )}
        </Panel>

        <div className="grid" style={{ gap: 14 }}>
          <Panel title="Allowed controls" icon={ShieldCheck}>
            {CONTROLS.map(({ key, label }) => (
              <ToggleRow key={key} label={label} checked={state.phonePermissions[key]} onChange={(value) => togglePermission(key, value)} />
            ))}
          </Panel>
          <Panel title="Network posture" icon={Wifi}>
            <div className="row"><span>Binds to</span><b className="mono">{session?.enabled ? `${session.host}:${session.port}` : "nothing"}</b></div>
            <div className="row"><span>Transport</span><b className="mono">HTTP on LAN · bearer token</b></div>
            <div className="row"><span>Public exposure</span><span className="badge success">off by default</span></div>
            <div className="row"><span>Firewall rule</span><span className="badge success">not created</span></div>
            <div className="row"><span>Token lifetime</span><b className="mono">300s from pairing</b></div>
            <div className="row"><span>Agent state</span><b className="mono">{session?.enabled ? "running" : "stopped"}</b></div>
            <p className="muted tiny" style={{ marginTop: 8 }}>Updated {new Date(now).toLocaleTimeString()}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
