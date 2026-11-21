import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Crosshair,
  Link2,
  RefreshCw,
  SlidersHorizontal,
  Unplug,
} from "lucide-react";
import ColorPad from "./components/ColorPad";
import PairForm from "./components/PairForm";
import PresetGrid from "./components/PresetGrid";
import StatusBar from "./components/StatusBar";
import { VytrixClient, clampColorSettings, DEFAULT_COLOR_SETTINGS } from "./client";
import type { ColorSettings, DeviceState, PairSession } from "./types";

type View = "pair" | "controls" | "status";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [host, setHost] = useState("");
  const [code, setCode] = useState("");
  const [client, setClient] = useState<VytrixClient | null>(null);
  const [session, setSession] = useState<PairSession | null>(null);
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [color, setColor] = useState<ColorSettings>({ ...DEFAULT_COLOR_SETTINGS });
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<View>("pair");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!client || !session || now < session.expiresAt) return;
    client.disconnect();
    setClient(null);
    setSession(null);
    setDevice(null);
    setView("pair");
    setError("Session expired. Open Phone Control on the PC and pair again.");
  }, [client, session, now]);

  const refresh = useCallback(async (agent: VytrixClient): Promise<DeviceState> => {
    const next = await agent.getState();
    setDevice(next);
    setColor(clampColorSettings(next.color));
    setDirty(false);
    return next;
  }, []);

  const connect = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const agent = new VytrixClient(host);
      const paired = await agent.pair(code);
      await refresh(agent);
      setClient(agent);
      setSession(paired);
      setView("controls");
      setNotice("Paired with the VYTRIX agent");
    } catch (failure) {
      setError(messageOf(failure));
      setClient(null);
      setSession(null);
      setDevice(null);
    } finally {
      setBusy(false);
    }
  };

  const runCommand = async (label: string, action: (agent: VytrixClient) => Promise<void>) => {
    if (!client || !session || Date.now() >= session.expiresAt) {
      setError("No active session. Pair with the PC first.");
      setView("pair");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action(client);
      await refresh(client);
      setNotice(`${label} applied`);
    } catch (failure) {
      setError(`${label} failed: ${messageOf(failure)}`);
    } finally {
      setBusy(false);
    }
  };

  const applyColor = () => {
    void runCommand("Color", async (agent) => {
      await agent.setColor(color);
    });
  };

  const applyPreset = (id: string) => {
    void runCommand("Preset", async (agent) => {
      await agent.applyPreset(id);
    });
  };

  const toggleCrosshair = () => {
    const next = !(device?.crosshairEnabled ?? false);
    void runCommand("Crosshair", async (agent) => {
      await agent.setCrosshair(next);
    });
  };

  const refreshNow = () => {
    if (!client) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    void refresh(client)
      .then(() => setNotice("State refreshed"))
      .catch((failure: unknown) => setError(`Refresh failed: ${messageOf(failure)}`))
      .finally(() => setBusy(false));
  };

  const disconnect = () => {
    client?.disconnect();
    setClient(null);
    setSession(null);
    setDevice(null);
    setColor({ ...DEFAULT_COLOR_SETTINGS });
    setDirty(false);
    setView("pair");
    setError(null);
    setNotice(null);
  };

  const paired = client !== null && session !== null && now < session.expiresAt;

  return (
    <div className="app-shell">
      <StatusBar
        host={client ? host.trim() : ""}
        paired={paired}
        expiresAt={session?.expiresAt ?? null}
        now={now}
        error={error}
        busy={busy}
      />

      <div className="app-header">
        <div className="brand-mark">VX</div>
        <div>
          <h1>VYTRIX</h1>
          <p>YOUR DISPLAY. YOUR RULES.</p>
        </div>
      </div>

      <nav className="tabs" aria-label="Views">
        <button type="button" className={view === "pair" ? "active" : ""} onClick={() => setView("pair")}>
          <Link2 size={16} /> Pair
        </button>
        <button
          type="button"
          className={view === "controls" ? "active" : ""}
          onClick={() => setView("controls")}
          disabled={!paired}
        >
          <SlidersHorizontal size={16} /> Controls
        </button>
        <button
          type="button"
          className={view === "status" ? "active" : ""}
          onClick={() => setView("status")}
          disabled={!paired}
        >
          <Activity size={16} /> Status
        </button>
      </nav>

      <main className="app-main">
        {error ? <div className="alert" role="alert">{error}</div> : null}
        {notice && !error ? <div className="notice" role="status">{notice}</div> : null}

        {view === "pair" ? (
          <PairForm
            host={host}
            code={code}
            busy={busy}
            error={null}
            onHostChange={setHost}
            onCodeChange={setCode}
            onConnect={() => void connect()}
          />
        ) : null}

        {view === "controls" && paired ? (
          <>
            <section className="card crosshair-card">
              <div className="card-head">
                <span className="icon-tile"><Crosshair size={19} /></span>
                <div>
                  <h2>Crosshair overlay</h2>
                  <p>Toggle the overlay attached to this display session.</p>
                </div>
              </div>
              <button
                type="button"
                className={`toggle-btn${device?.crosshairEnabled ? " on" : ""}`}
                onClick={toggleCrosshair}
                disabled={busy}
                aria-pressed={device?.crosshairEnabled ?? false}
              >
                <span className="toggle-knob" />
                <span>{device?.crosshairEnabled ? "Overlay on" : "Overlay off"}</span>
              </button>
            </section>

            <ColorPad
              value={color}
              dirty={dirty}
              busy={busy}
              onChange={(patch) => {
                setColor((current) => clampColorSettings({ ...current, ...patch }));
                setDirty(true);
              }}
              onApply={applyColor}
            />

            <PresetGrid
              presets={device?.presets ?? []}
              activePresetId={device?.activePresetId ?? null}
              busy={busy}
              onApply={applyPreset}
            />
          </>
        ) : null}

        {view === "status" && paired ? (
          <section className="card">
            <div className="card-head">
              <span className="icon-tile"><Activity size={19} /></span>
              <div>
                <h2>Agent status</h2>
                <p>Live state read from the desktop agent.</p>
              </div>
            </div>
            <dl className="status-list">
              <div><dt>Device</dt><dd>{device?.deviceName ?? "—"}</dd></div>
              <div><dt>Agent version</dt><dd className="mono">{device?.agentVersion ?? "—"}</dd></div>
              <div><dt>Address</dt><dd className="mono">{host.trim()}</dd></div>
              <div><dt>Pairing expires</dt><dd className="mono">{session ? new Date(session.expiresAt).toLocaleTimeString() : "—"}</dd></div>
              <div><dt>Active preset</dt><dd>{device?.activePresetId ?? "None reported"}</dd></div>
              <div><dt>Crosshair</dt><dd>{device?.crosshairEnabled ? "On" : "Off"}</dd></div>
              <div><dt>Presets available</dt><dd className="mono">{device?.presets.length ?? 0}</dd></div>
            </dl>
            <div className="button-row">
              <button type="button" className="secondary-btn" onClick={refreshNow} disabled={busy}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button type="button" className="secondary-btn danger" onClick={disconnect}>
                <Unplug size={16} /> Disconnect
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
