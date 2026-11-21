export function ToggleRow({ label, detail, checked, onChange, badge }: {
  label: string; detail?: string; checked: boolean; onChange: (checked: boolean) => void; badge?: string;
}) {
  return (
    <div className="row">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{label}</span>
          {badge ? <span className="badge">{badge}</span> : null}
        </div>
        {detail ? <div className="tiny" style={{ marginTop: 4 }}>{detail}</div> : null}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <span />
      </label>
    </div>
  );
}
