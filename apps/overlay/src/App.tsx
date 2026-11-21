import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Keyboard, ZoomIn } from "lucide-react";
import { DEFAULT_OVERLAY_CONFIG, normalizeOverlayConfig } from "./config";
import type { CrosshairAdvancedView, CrosshairArmView, CrosshairConfig, OverlayConfig } from "./types";

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

function armGeometry(arm: CrosshairArmView, center: number, spacing: number, scale: number) {
  const gap = (arm.innerGap + spacing) * scale;
  const length = arm.length * scale;
  const thickness = arm.thickness;
  const shift = arm.offset * scale;
  const horizontal = arm.id === "left" || arm.id === "right";
  const sign = arm.id === "left" || arm.id === "top" ? -1 : 1;
  const along = center + sign * (gap + length / 2) + shift;
  if (horizontal) {
    return { x1: along - length / 2, y1: center, x2: along + length / 2, y2: center, thickness };
  }
  return { x1: center, y1: along - length / 2, x2: center, y2: along + length / 2, thickness };
}

function CrosshairMark({ config }: { config: CrosshairConfig }) {
  const advanced: CrosshairAdvancedView = config.advanced;
  const cx = 120;
  const cy = 120;
  const scale = config.scale;
  const visibleArms = advanced.arms.filter((arm) => arm.visible);
  const ringRadius = visibleArms.length > 0
    ? Math.max(...visibleArms.map((arm) => arm.length)) * scale
    : 12 * scale;
  const showRing = advanced.ring || advanced.shape === "circle" || advanced.shape === "circle-dot";
  const showDot = advanced.dot.enabled || advanced.shape === "dot" || advanced.shape === "cross-dot";
  const animation = advanced.animation;
  const duration = Math.max(100, animation.durationMs / Math.max(0.1, animation.speed));
  const animationStyle: CSSProperties | undefined = animation.enabled ? {
    ["--vy-cross-duration" as string]: `${duration}ms`,
    ["--vy-cross-intensity" as string]: String(animation.intensity / 100),
    ["--vy-cross-color-to" as string]: animation.colorTo,
    ["--vy-cross-dot-color" as string]: advanced.dot.color,
    animationName: `vy-cross-${animation.kind}`,
    animationDuration: `${duration}ms`,
    animationIterationCount: "infinite",
    animationTimingFunction: animation.easing,
    transformOrigin: "120px 120px",
  } : undefined;

  const outline = advanced.outline.enabled
    ? { stroke: advanced.outline.color, strokeOpacity: advanced.outline.opacity }
    : null;
  const glowStyle = advanced.glow
    ? { filter: `drop-shadow(0 0 3px ${advanced.glowColor})` }
    : undefined;
  const overlayStyle = advanced.shadow
    ? { filter: "drop-shadow(1px 2px 1px rgba(0,0,0,.8))" }
    : undefined;

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
          ...overlayStyle,
        } as CSSProperties
      }
    >
      <g
        transform={`rotate(${config.rotation} ${cx} ${cy})`}
        opacity={config.opacity}
        style={animationStyle}
      >
        <g style={glowStyle}>
          {outline ? (
            <g
              opacity={advanced.outline.opacity}
              style={advanced.outline.style === "dashed" ? { strokeDasharray: "3 2" } : undefined}
            >
              {visibleArms.map((arm) => {
                const geo = armGeometry(arm, cx, advanced.lineSpacing, scale);
                return (
                  <line
                    key={`outline-${arm.id}`}
                    x1={geo.x1} y1={geo.y1} x2={geo.x2} y2={geo.y2}
                    stroke={outline.stroke}
                    strokeWidth={geo.thickness + advanced.outline.thickness * 2}
                    strokeLinecap="butt"
                    transform={arm.rotation ? `rotate(${arm.rotation} ${geo.x1} ${geo.y1})` : undefined}
                  />
                );
              })}
            </g>
          ) : null}
          {visibleArms.map((arm) => {
            const geo = armGeometry(arm, cx, advanced.lineSpacing, scale);
            return (
              <line
                key={arm.id}
                x1={geo.x1} y1={geo.y1} x2={geo.x2} y2={geo.y2}
                stroke={arm.color}
                strokeWidth={geo.thickness}
                strokeLinecap="butt"
                transform={arm.rotation ? `rotate(${arm.rotation} ${geo.x1} ${geo.y1})` : undefined}
              />
            );
          })}
          {showRing ? (
            <g>
              {outline ? (
                <circle
                  cx={cx} cy={cy} r={ringRadius} fill="none"
                  stroke={outline.stroke}
                  strokeOpacity={outline.strokeOpacity}
                  strokeWidth={config.thickness + advanced.outline.thickness * 2}
                />
              ) : null}
              <circle
                cx={cx} cy={cy} r={ringRadius} fill="none"
                stroke={visibleArms[0]?.color ?? config.color}
                strokeWidth={config.thickness}
              />
            </g>
          ) : null}
          {showDot ? (
            <g
              opacity={advanced.dot.opacity}
              style={advanced.dot.glow ? { filter: `drop-shadow(0 0 3px ${advanced.dot.color})` } : undefined}
            >
              {advanced.dot.shape === "square" ? (
                <rect
                  x={cx - advanced.dot.size / 2} y={cy - advanced.dot.size / 2}
                  width={advanced.dot.size} height={advanced.dot.size}
                  fill={advanced.dot.color}
                  stroke={advanced.dot.outline ? advanced.outline.color : "none"}
                  strokeWidth={advanced.dot.outlineThickness}
                />
              ) : advanced.dot.shape === "diamond" ? (
                <polygon
                  points={`${cx},${cy - advanced.dot.size / 2} ${cx + advanced.dot.size / 2},${cy} ${cx},${cy + advanced.dot.size / 2} ${cx - advanced.dot.size / 2},${cy}`}
                  fill={advanced.dot.color}
                  stroke={advanced.dot.outline ? advanced.outline.color : "none"}
                  strokeWidth={advanced.dot.outlineThickness}
                />
              ) : (
                <circle
                  cx={cx} cy={cy} r={Math.max(1, advanced.dot.size / 2)}
                  fill={advanced.dot.color}
                  stroke={advanced.dot.outline ? advanced.outline.color : "none"}
                  strokeWidth={advanced.dot.outlineThickness}
                />
              )}
            </g>
          ) : null}
        </g>
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

  const anchors: Record<typeof config.layout, { x: string; y: string }> = {
    center: { x: "50%", y: "50%" },
    "top-left": { x: "12%", y: "12%" },
    "top-right": { x: "88%", y: "12%" },
    "bottom-left": { x: "12%", y: "88%" },
    "bottom-right": { x: "88%", y: "88%" },
  };
  const anchor = anchors[config.layout] ?? anchors.center;
  const gate = config.visibleForGame;
  const showCrosshair = gate && config.crosshairEnabled;
  const showZoom = gate && config.zoom.enabled;
  const showHint = gate && config.hotkeyHint !== null;

  return (
    <div
      className="overlay-root"
      data-layout={config.layout}
      style={
        {
          "--anchor-x": anchor.x,
          "--anchor-y": anchor.y,
        } as CSSProperties
      }
    >
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
