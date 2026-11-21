interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
  onReset?: () => void;
}

export function ParamSlider({ label, value, min, max, suffix = "%", onChange, onReset }: Props) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <b>{value}{suffix}</b>
          {onReset ? <button className="btn ghost icon" title={`Reset ${label}`} onClick={onReset}>↺</button> : null}
        </span>
      </label>
      <input
        type="range" min={min} max={max} value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  );
}
