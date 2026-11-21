import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useTranslateText } from "@/i18n";

export function Panel({ title, icon: Icon, action, children, className = "" }: {
  title: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string;
}) {
  const tr = useTranslateText();
  return (
    <section className={`card ${className}`}>
      <div className="card-title">
        <h3>{tr(title)}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {action}
          {Icon ? <Icon size={15} className="icon" /> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  const tr = useTranslateText();
  return (
    <div className="card">
      <div className="metric">{value}</div>
      <div className="metric-label">{tr(label)}</div>
    </div>
  );
}

export function PageHead({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const tr = useTranslateText();
  return (
    <div className="page-head" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <div>
        <h1>{tr(title)}</h1>
        <p>{tr(description)}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  const tr = useTranslateText();
  return (
    <div className="empty">
      <Icon size={26} />
      <strong style={{ color: "var(--vy-text)" }}>{tr(title)}</strong>
      <span>{tr(detail)}</span>
    </div>
  );
}
