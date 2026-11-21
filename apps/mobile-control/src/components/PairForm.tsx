import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, Link2, Wifi } from "lucide-react";
import PinInput from "./PinInput";
import { normalizeBaseUrl } from "../client";

interface PairFormProps {
  host: string;
  code: string;
  busy: boolean;
  error: string | null;
  onHostChange: (host: string) => void;
  onCodeChange: (code: string) => void;
  onConnect: () => void;
}

export default function PairForm({
  host,
  code,
  busy,
  error,
  onHostChange,
  onCodeChange,
  onConnect,
}: PairFormProps) {
  const [qr, setQr] = useState("");
  const baseUrl = useMemo(() => {
    try {
      return normalizeBaseUrl(host);
    } catch {
      return null;
    }
  }, [host]);
  const codeValid = /^\d{6}$/.test(code);

  useEffect(() => {
    if (!baseUrl || !codeValid) {
      setQr("");
      return;
    }
    let active = true;
    const uri = `vytrix://pair?host=${encodeURIComponent(baseUrl)}&code=${code}`;
    void QRCode.toDataURL(uri, {
      width: 200,
      margin: 1,
      color: { dark: "#080B12", light: "#F8FAFC" },
    })
      .then((dataUrl) => {
        if (active) setQr(dataUrl);
      })
      .catch(() => {
        if (active) setQr("");
      });
    return () => {
      active = false;
    };
  }, [baseUrl, codeValid, code]);

  return (
    <section className="card pair-card">
      <div className="card-head">
        <span className="icon-tile"><Wifi size={19} /></span>
        <div>
          <h2>Pair with your PC</h2>
          <p>Same Wi-Fi network. Phone Control window open on the desktop.</p>
        </div>
      </div>

      <label className="field-label" htmlFor="host">PC agent address</label>
      <input
        id="host"
        className="text-input"
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="http://192.168.1.20:8753"
        value={host}
        onChange={(event) => onHostChange(event.target.value)}
        disabled={busy}
      />
      {host.trim().length > 0 && !baseUrl ? (
        <p className="hint error-text">Use the full agent root address, e.g. http://192.168.1.20:8753</p>
      ) : null}

      <label className="field-label" htmlFor="pair-code">Six-digit pairing code</label>
      <PinInput value={code} onChange={onCodeChange} disabled={busy} />

      {error ? (
        <div className="alert" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <button
        className="primary-btn"
        type="button"
        onClick={onConnect}
        disabled={busy || !baseUrl || !codeValid}
      >
        <Link2 size={17} />
        {busy ? "Pairing…" : "Connect"}
      </button>

      {qr ? (
        <div className="qr-block">
          <img src={qr} width={160} height={160} alt="Pairing URI QR code" />
          <p>Hand-off QR for another device on the same LAN.</p>
        </div>
      ) : null}

      <p className="hint">The pairing token lives in memory only and expires after 5 minutes.</p>
    </section>
  );
}
