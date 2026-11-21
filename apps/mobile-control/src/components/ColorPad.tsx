import type { CSSProperties } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { COLOR_RANGES, TEMPERATURE_RANGE } from "../client";
import type { NumericColorField } from "../client";
import type { ColorSettings } from "../types";

interface ColorPadProps {
  value: ColorSettings;
  dirty: boolean;
  busy: boolean;
  onChange: (patch: Partial<ColorSettings>) => void;
  onApply: () => void;
}

const FIELDS: Array<{ field: NumericColorField; label: string }> = [
  { field: "saturation", label: "Saturation" },
  { field: "vibrance", label: "Vibrance" },
  { field: "gamma", label: "Gamma" },
  { field: "brightness", label: "Brightness" },
  { field: "contrast", label: "Contrast" },
  { field: "hue", label: "Hue" },
];

export default function ColorPad({ value, dirty, busy, onChange, onApply }: ColorPadProps) {
  const filter = `saturate(${value.saturation}%) brightness(${value.brightness}%) contrast(${value.contrast}%) hue-rotate(${value.hue}deg)`;

  const slider = (field: NumericColorField, label: string, min: number, max: number, suffix: string) => {
    const current = value[field];
    const percent = ((current - min) / (max - min)) * 100;
    return (
      <div className="slider-row" key={field}>
        <div className="slider-meta">
          <label htmlFor={`slider-${field}`}>{label}</label>
          <span className="mono">{Math.round(current)}{suffix}</span>
        </div>
        <input
          id={`slider-${field}`}
          className="range-input"
          type="range"
          min={min}
          max={max}
          step={1}
          value={current}
          disabled={busy}
          style={{ "--fill": `${percent}%` } as CSSProperties}
          onChange={(event) => onChange({ [field]: Number(event.target.value) })}
        />
        <div className="range-scale"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-head">
        <span className="icon-tile"><SlidersHorizontal size={19} /></span>
        <div>
          <h2>Color pad</h2>
          <p>Values apply to the active display when you commit.</p>
        </div>
      </div>

      <div className="color-preview" style={{ filter }}>
        <span>VYTRIX</span>
        <div className="preview-bars"><i /><i /><i /></div>
      </div>

      {FIELDS.map(({ field, label }) =>
        slider(field, label, COLOR_RANGES[field][0], COLOR_RANGES[field][1], field === "hue" ? "°" : "%"),
      )}

      <div className="temp-row">
        <span>Color temperature</span>
        <span className="mono">{value.temperatureK === null ? "native" : `${value.temperatureK}K`}</span>
        <button
          className="ghost-btn"
          type="button"
          disabled={busy}
          onClick={() => onChange({ temperatureK: value.temperatureK === null ? 6500 : null })}
        >
          {value.temperatureK === null ? "Enable" : "Reset to native"}
        </button>
      </div>

      <button className="primary-btn" type="button" onClick={onApply} disabled={busy || !dirty}>
        <Check size={17} />
        {busy ? "Applying…" : dirty ? "Apply color" : "Applied"}
      </button>
      <p className="hint">Temperature range {TEMPERATURE_RANGE[0]}–{TEMPERATURE_RANGE[1]}K when enabled.</p>
    </section>
  );
}
