import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Keyboard, ZoomIn } from "lucide-react";
import { DEFAULT_OVERLAY_CONFIG, normalizeOverlayConfig } from "./config";
import type { CrosshairConfig, OverlayConfig } from "./types";

async function loadOverlayConfig(): Promise<OverlayConfig> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const raw = await invoke<unknown>("overlay_config");
    return normalizeOverlayConfig(raw);
  } catch {
    return { ...DEFAULT_OVERLAY_CONFIG };
  }
}

async function subscribeConfig(onConfig: (config: OverlayConfig) => void): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen<unknown>("vytrix://overlay-config", (event) => {
      onConfig(normalizeOverlayConfig(event.payload));
    });
  } catch {
    return () => {};
  }
}

function CrosshairMark({ config }: { config: CrosshairConfig }) {
  const cx = 120;
  const cy = 120;
  const arm = config.length * config.scale;
  const gap = config.gap * config.scale;
  const stroke = config.thickness;
  const arms = [
    { x1: cx - gap - arm, y1: cy, x2: cx - gap, y2: cy },
    { x1: cx + gap, y1: cy, x2: cx + gap + arm, y2: cy },
    { x1: cx, y1: cy - gap - arm, x2: cx, y2: cy - gap },
    { x1: cx, y1: cy + gap, x2: cx, y2: cy + gap + arm },
  ];
  const showArms = config.style === "cross" || config.style === "dynamic-cross";
  return (
    <svg
      className="crosshair"
      width="240"
      height="240"
      viewBox="0 0 240 240"
      aria-hidden="true"
      focusable="false"
      style={
        {
          "--crosshair-x": `${config.offsetX}px`,
          "--crosshair-y": `${config.offsetY}px`,
        } as CSSProperties
      }
    >
      <g transform={`rotate(${config.rotation} ${cx} ${cy})`} opacity={config.opacity}>
        {showArms && config.outline
          ? arms.map((line, index) => (
              <line
                key={`outline-${index}`}
                {...line}
                stroke="#05070C"
                strokeWidth={stroke + 2}
                strokeLinecap="round"
              />
            ))
          : null}
        {showArms
          ? arms.map((line, index) => (
              <line
                key={`arm-${index}`}
                {...line}
                stroke={config.color}
                strokeWidth={stroke}
                strokeLinecap="round"
              />
            ))
          : null}
        {config.style === "circle" ? (
          <>
            {config.outline ? (
              <circle cx={cx} cy={cy} r={arm} fill="none" stroke="#05070C" strokeWidth={stroke + 2} />
            ) : null}
            <circle cx={cx} cy={cy} r={arm} fill="none" stroke={config.color} strokeWidth={stroke} />
          </>
        ) : null}
        {config.style === "dot" ? (
          <circle cx={cx} cy={cy} r={Math.max(1, arm / 2)} fill={config.color} />
        ) : null}
        {config.style === "dynamic-cross" ? (
          <circle cx={cx} cy={cy} r={Math.max(2, arm * 0.35)} fill="none" stroke={config.color} strokeWidth={Math.max(1, stroke / 2)} />
        ) : null}
        {config.centerDot ? (
          <circle cx={cx} cy={cy} r={Math.max(1, stroke)} fill={config.color} />
        ) : null}
      </g>
    </svg>
  );
}

export default function App() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_OVERLAY_CONFIG);

  useEffect(() => {
    let active = true;
    let dispose = () => {};

    void loadOverlayConfig().then((next) => {
      if (active) setConfig(next);
    });
    void subscribeConfig((next) => {
      if (active) setConfig(next);
    }).then((unlisten) => {
      if (active) dispose = unlisten;
      else unlisten();
    });

    return () => {
      active = false;
      dispose();
    };
  }, []);

  const showCrosshair = config.crosshairEnabled;
  const showZoom = config.zoom.enabled;
  const showHint = config.hotkeyHint !== null;

  return (
    <div className="overlay-root">
      {showCrosshair ? <CrosshairMark config={config.crosshair} /> : null}
      {showZoom ? (
        <div className="zoom-chip">
          <ZoomIn size={14} strokeWidth={2.2} />
          <span>{config.zoom.label ?? `${config.zoom.level.toFixed(1)}×`}</span>
        </div>
      ) : null}
      {showHint ? (
        <div className="hotkey-hint">
          <Keyboard size={13} strokeWidth={2} />
          <span>{config.hotkeyHint}</span>
        </div>
      ) : null}
    </div>
  );
}
