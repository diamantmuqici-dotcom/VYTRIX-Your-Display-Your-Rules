import { Wifi, WifiOff } from "lucide-react";

interface StatusBarProps {
  host: string;
  paired: boolean;
  expiresAt: number | null;
  now: number;
  error: string | null;
  busy: boolean;
}

export default function StatusBar({ host, paired, expiresAt, now, error, busy }: StatusBarProps) {
  const remaining = expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  const connected = paired && remaining > 0 && !error;
  const label = busy ? "Working" : error ? "Unreachable" : !paired ? "Not paired" : remaining === 0 ? "Expired" : "Connected";

  return (
    <header className={`status-bar${connected ? " connected" : ""}`} aria-live="polite">
      <span className="status-icon">
        {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
      </span>
      <span className="status-label">{label}</span>
      <span className="status-host mono">{host || "no host"}</span>
      <span className="status-ttl mono">{expiresAt === null ? "--:--" : `${minutes}:${seconds}`}</span>
    </header>
  );
}
