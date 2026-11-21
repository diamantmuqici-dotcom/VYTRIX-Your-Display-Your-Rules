export function LineChart({ series, labels, height = 140 }: {
  series: number[][]; labels: string[]; height?: number;
}) {
  const width = 520;
  const all = series.flat();
  const max = Math.max(100, ...all);
  const colors = ["#00D9FF", "#8B5CF6", "#22C55E", "#F59E0B"];
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="metric graph">
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line key={fraction} x1="0" x2={width} y1={height * fraction} y2={height * fraction}
            stroke="rgba(161,174,192,.12)" strokeWidth="1" />
        ))}
        {series.map((values, index) => {
          if (values.length === 0) return null;
          const step = values.length > 1 ? width / (values.length - 1) : width;
          const points = values.map((v, i) => `${i * step},${height - (v / max) * height}`).join(" ");
          return <polyline key={index} points={points} fill="none" stroke={colors[index % colors.length]} strokeWidth="2" />;
        })}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {labels.map((label, index) => (
          <span key={label} className="tiny" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: colors[index % colors.length] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
