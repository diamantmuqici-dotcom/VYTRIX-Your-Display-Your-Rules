import { useRef, useState } from "react";
import { Eye, Moon, Accessibility, Zap } from "lucide-react";
import type { ColorSettings } from "@vytrix/shared-types";
import { useApp } from "@/stores/app";
import { useToast } from "@/hooks/useToast";
import { PageHead, Panel } from "@/components/ui/Panel";
import { ToggleRow } from "@/components/ui/ToggleRow";

interface Effect { id: string; name: string; detail: string; settings: Partial<ColorSettings> }

const EFFECTS: Effect[] = [
  { id: "green", name: "Green theme", detail: "Green-biased display response.", settings: { green: 118, red: 88, blue: 92 } },
  { id: "blue", name: "Blue theme", detail: "Blue-biased display response.", settings: { blue: 118, red: 90, green: 96 } },
  { id: "night", name: "Night display", detail: "Lower brightness and warmer temperature.", settings: { brightness: 72, temperatureK: 4200 } },
  { id: "contrast", name: "Contrast accessibility", detail: "Raised contrast for legibility.", settings: { contrast: 135, brightness: 105 } },
  { id: "protanopia", name: "Protanopia assist", detail: "Red-channel compensation preset.", settings: { red: 122, green: 94, blue: 100 } },
  { id: "deuteranopia", name: "Deuteranopia assist", detail: "Green-channel compensation preset.", settings: { green: 124, red: 92 } },
  { id: "tritanopia", name: "Tritanopia assist", detail: "Blue-channel compensation preset.", settings: { blue: 126, green: 96 } },
];

export default function Effects() {
  const { state, setColor, log } = useApp();
  const { notify } = useToast();
  const [held, setHeld] = useState<string | null>(null);
  const previous = useRef<ColorSettings | null>(null);
  const [zoom, setZoom] = useState(false);

  const hold = (effect: Effect) => {
    previous.current = { ...state.color };
    setHeld(effect.id);
    setColor({ ...state.color, ...effect.settings });
    log(`Held effect ${effect.name}`);
  };
  const release = () => {
    if (previous.current) setColor(previous.current);
    previous.current = null;
    setHeld(null);
  };

  return (
    <div className="page">
      <PageHead title="Display Effects" description="Reversible, transparent visual adjustments and accessibility themes. No effect reveals information a game intentionally hides." />
      <div className="grid grid-3">
        {EFFECTS.map((effect) => (
          <Panel key={effect.id} title={effect.name} icon={effect.id === "night" ? Moon : Accessibility}>
            <div className="tiny" style={{ lineHeight: 1.6 }}>{effect.detail}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn primary" onPointerDown={() => hold(effect)} onPointerUp={release} onPointerLeave={release}>Hold to preview</button>
              <button className="btn" onClick={() => { setColor({ ...state.color, ...effect.settings }); log(`Applied ${effect.name}`); }}>Apply</button>
            </div>
            {held === effect.id ? <div className="badge accent" style={{ marginTop: 10 }}>active while held</div> : null}
          </Panel>
        ))}
        <Panel title="Accessibility zoom" icon={Eye}>
          <ToggleRow label="Zoom active" detail="Applies to the desktop, not to game content." checked={zoom} onChange={(v) => { setZoom(v); log(`Zoom ${v ? "on" : "off"}`); }} />
          <button className="btn" style={{ marginTop: 10 }} onClick={() => { setColor({ ...state.color, gamma: 100, brightness: 100, contrast: 100, saturation: 100 }); notify("Colors reset"); }}><Zap size={14} /> Reset color effects</button>
        </Panel>
      </div>
    </div>
  );
}
