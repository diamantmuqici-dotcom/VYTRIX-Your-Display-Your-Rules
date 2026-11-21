import { Check, Sparkles } from "lucide-react";
import type { PresetSummary } from "../types";

interface PresetGridProps {
  presets: PresetSummary[];
  activePresetId: string | null;
  busy: boolean;
  onApply: (id: string) => void;
}

function safeGradient(thumbnail: string | null): string {
  if (thumbnail && /^(linear|radial)-gradient\([\x20-\x7E]{0,180}\)$/.test(thumbnail)) return thumbnail;
  return "linear-gradient(135deg, #00D9FF, #8B5CF6)";
}

export default function PresetGrid({ presets, activePresetId, busy, onApply }: PresetGridProps) {
  return (
    <section className="card">
      <div className="card-head">
        <span className="icon-tile"><Sparkles size={19} /></span>
        <div>
          <h2>Presets</h2>
          <p>Tap a profile to apply it to the display.</p>
        </div>
      </div>

      {presets.length === 0 ? (
        <p className="hint">No presets were reported by the desktop agent.</p>
      ) : (
        <div className="preset-grid">
          {presets.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-card${active ? " active" : ""}`}
                disabled={busy}
                onClick={() => onApply(preset.id)}
              >
                <span className="preset-swatch" style={{ background: safeGradient(preset.thumbnail) }}>
                  {active ? <Check size={16} /> : null}
                </span>
                <span className="preset-name">{preset.name}</span>
                <span className="preset-cat">{preset.category}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
