import type { CSSProperties } from "react";
import type { CrosshairAdvanced, CrosshairArm, CrosshairDesign } from "@vytrix/shared-types";

export type PreviewBackground = "dark" | "light" | "grid" | "target" | "transparent";

const BACKGROUNDS: Record<PreviewBackground, string> = {
  dark: "radial-gradient(circle at center,#0d1220,#05070c)",
  light: "linear-gradient(135deg,#e8edf5,#b9c4d6)",
  grid: "linear-gradient(rgba(0,217,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,255,.08) 1px,transparent 1px),#080d16",
  target: "radial-gradient(circle at center,#142033 0 18%,transparent 18% 22%,#101a2b 22% 36%,transparent 36% 40%,#0b1422 40%)",
  transparent: "transparent",
};

function armGeometry(arm: CrosshairArm, center: number, spacing: number, scale: number) {
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

function Dot({ advanced, center, scale }: { advanced: CrosshairAdvanced; center: number; scale: number }) {
  const dot = advanced.dot;
  if (!dot.enabled) return null;
  const radius = Math.max(1, dot.size * scale * 0.5);
  const common = { fill: dot.color, fillOpacity: dot.opacity };
  const outline = dot.outline
    ? { stroke: advanced.outline.color, strokeWidth: dot.outlineThickness, strokeOpacity: advanced.outline.opacity }
    : {};
  return (
    <g style={dot.glow ? { filter: `drop-shadow(0 0 3px ${dot.color})` } : undefined}>
      {dot.shape === "square" ? (
        <rect x={center - radius} y={center - radius} width={radius * 2} height={radius * 2} {...common} {...outline} />
      ) : dot.shape === "diamond" ? (
        <polygon points={`${center},${center - radius} ${center + radius},${center} ${center},${center + radius} ${center - radius},${center}`} {...common} {...outline} />
      ) : (
        <circle cx={center} cy={center} r={radius} {...common} {...outline} />
      )}
    </g>
  );
}

export interface CrosshairRendererProps {
  design: CrosshairDesign;
  size?: number;
  zoom?: number;
  background?: PreviewBackground;
  showGrid?: boolean;
  showTarget?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Vector renderer. The viewBox is fixed so strokes stay crisp at any CSS size;
 * no bitmap scaling, no canvas readback, no per-frame React state.
 */
export function CrosshairRenderer({
  design, size = 260, zoom = 1, background = "dark", showGrid, showTarget, className, animate = true,
}: CrosshairRendererProps) {
  const advanced = design.advanced;
  const center = 120;
  const scale = design.scale * zoom;
  const useGrid = showGrid ?? background === "grid";
  const useTarget = showTarget ?? background === "target";
  const animation = advanced.animation;
  const running = animate && animation.enabled;
  const animationStyle: CSSProperties | undefined = running ? {
    ["--vy-cross-duration" as string]: `${Math.max(100, animation.durationMs / Math.max(0.1, animation.speed))}ms`,
    ["--vy-cross-intensity" as string]: String(animation.intensity / 100),
    ["--vy-cross-color-to" as string]: animation.colorTo,
    animationName: `vy-cross-${animation.kind}`,
    animationDuration: `${Math.max(100, animation.durationMs / Math.max(0.1, animation.speed))}ms`,
    animationIterationCount: "infinite",
    animationTimingFunction: animation.easing,
    transformOrigin: "120px 120px",
  } : undefined;

  const ringRadius = advanced.arms.find((arm) => arm.visible)?.length
    ? Math.max(...advanced.arms.filter((arm) => arm.visible).map((arm) => arm.length)) * scale
    : 12 * scale;

  return (
    <div
      className={`cross-render ${className ?? ""}`}
      style={{ width: size, height: size, background: BACKGROUNDS[background], ["--vy-cross-grid" as string]: useGrid ? "1" : "0" }}
    >
      {useGrid ? <div className="cross-grid" /> : null}
      {useTarget ? <div className="cross-target" /> : null}
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        aria-label="crosshair preview"
        style={{ position: "relative", filter: advanced.shadow ? "drop-shadow(1px 2px 1px rgba(0,0,0,.8))" : undefined }}
      >
        <g
          style={animationStyle}
          transform={`rotate(${design.rotation} ${center} ${center})`}
          opacity={design.opacity}
        >
          {advanced.outline.enabled ? (
            <g opacity={advanced.outline.opacity} style={advanced.outline.style === "dashed" ? { strokeDasharray: "3 2" } : undefined}>
              {advanced.arms.filter((arm) => arm.visible).map((arm) => {
                const geo = armGeometry(arm, center, advanced.lineSpacing, scale);
                return (
                  <line
                    key={`outline-${arm.id}`}
                    x1={geo.x1} y1={geo.y1} x2={geo.x2} y2={geo.y2}
                    stroke={advanced.outline.color}
                    strokeWidth={geo.thickness + advanced.outline.thickness * 2}
                    strokeLinecap="butt"
                    transform={arm.rotation ? `rotate(${arm.rotation} ${geo.x1} ${geo.y1})` : undefined}
                  />
                );
              })}
            </g>
          ) : null}
          <g style={advanced.glow ? { filter: `drop-shadow(0 0 3px ${advanced.glowColor})` } : undefined}>
            {advanced.arms.filter((arm) => arm.visible).map((arm) => {
              const geo = armGeometry(arm, center, advanced.lineSpacing, scale);
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
          </g>
          {advanced.ring ? (
            <g style={advanced.glow ? { filter: `drop-shadow(0 0 3px ${advanced.glowColor})` } : undefined}>
              {advanced.outline.enabled ? (
                <circle cx={center} cy={center} r={ringRadius} fill="none" stroke={advanced.outline.color} strokeOpacity={advanced.outline.opacity} strokeWidth={design.thickness + advanced.outline.thickness * 2} />
              ) : null}
              <circle cx={center} cy={center} r={ringRadius} fill="none" stroke={advanced.arms[0]?.color ?? design.color} strokeWidth={design.thickness} />
            </g>
          ) : null}
          <Dot advanced={advanced} center={center} scale={scale} />
        </g>
      </svg>
    </div>
  );
}

export default CrosshairRenderer;
