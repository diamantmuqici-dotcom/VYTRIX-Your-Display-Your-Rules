"use client";

import { ChevronsLeftRight } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { clamp } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface Filters {
  saturation: number;
  contrast: number;
  brightness: number;
}

function PreviewScene() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, #16265f 0%, #3c4f9e 34%, #b8698d 56%, #f0a06b 68%, #101c35 68.4%, #071022 100%)",
      }}
    >
      <div
        className="absolute left-[62%] top-[15%] h-[9%] w-[9%] rounded-full bg-[#ffe0a8]"
        style={{ boxShadow: "0 0 70px 26px rgba(255,183,110,0.42)" }}
      />
      <div
        className="absolute inset-x-0 top-[50%] h-[20%] bg-[#0d1830]"
        style={{
          clipPath:
            "polygon(0 100%, 0 60%, 10% 24%, 20% 66%, 34% 10%, 47% 58%, 60% 22%, 74% 68%, 86% 28%, 100% 62%, 100% 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-[61%] h-[8%] bg-[#081226]"
        style={{
          clipPath:
            "polygon(0 100%, 0 58%, 14% 30%, 28% 70%, 44% 18%, 58% 62%, 72% 26%, 88% 66%, 100% 40%, 100% 100%)",
          opacity: 0.92,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 top-[68.4%]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,186,126,0.22) 0px, rgba(255,186,126,0.22) 2px, transparent 2px, transparent 15px)",
          opacity: 0.55,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "8.33% 16.66%",
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-4 border border-white/10" />
      <span className="absolute left-[7%] top-[78%] font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
        VYTRIX / color preview
      </span>
      <span className="absolute right-[7%] top-[78%] font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">
        local signal
      </span>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-mono text-ink">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function BeforeAfterSlider() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(52);
  const [dragging, setDragging] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    saturation: 122,
    contrast: 112,
    brightness: 104,
  });

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100, 2, 98));
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging) updateFromClientX(event.clientX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((value) => clamp(value - step, 2, 98));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((value) => clamp(value + step, 2, 98));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(2);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(98);
    }
  };

  const tunedFilter = `saturate(${filters.saturation}%) contrast(${filters.contrast}%) brightness(${filters.brightness}%)`;

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--line)] px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-xs font-medium text-ink">
          <span className="h-2 w-2 rounded-full bg-brand-cyan shadow-[0_0_12px_2px_rgba(0,217,255,0.7)]" />
          Interactive color preview
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
          Drag the divider
        </p>
      </div>

      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative aspect-[16/9] w-full touch-none select-none overflow-hidden"
        style={{ cursor: dragging ? "ew-resize" : "col-resize" }}
      >
        <div className="absolute inset-0" style={{ filter: tunedFilter }}>
          <PreviewScene />
        </div>
        <div
          className="absolute inset-0"
          style={{
            filter: "saturate(45%) contrast(82%) brightness(88%)",
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        >
          <PreviewScene />
        </div>

        <span className="absolute left-3 top-3 rounded-sm bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          Before
        </span>
        <span className="absolute right-3 top-3 rounded-sm bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          Tuned
        </span>

        <div
          className="absolute inset-y-0 z-10"
          style={{ left: `${position}%` }}
        >
          <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.5)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Reveal tuned preview"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            onKeyDown={handleKeyDown}
            className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-bg/75 text-ink shadow-glow backdrop-blur-md"
          >
            <ChevronsLeftRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t border-[color:var(--line)] px-4 py-5 sm:grid-cols-3 sm:px-5">
        <RangeControl
          label="Saturation"
          value={filters.saturation}
          min={50}
          max={200}
          unit="%"
          onChange={(value) =>
            setFilters((current) => ({ ...current, saturation: value }))
          }
        />
        <RangeControl
          label="Contrast"
          value={filters.contrast}
          min={60}
          max={180}
          unit="%"
          onChange={(value) =>
            setFilters((current) => ({ ...current, contrast: value }))
          }
        />
        <RangeControl
          label="Brightness"
          value={filters.brightness}
          min={70}
          max={140}
          unit="%"
          onChange={(value) =>
            setFilters((current) => ({ ...current, brightness: value }))
          }
        />
      </div>

      <p className="border-t border-[color:var(--line)] px-4 py-4 text-xs leading-relaxed text-subtle sm:px-5">
        Browser-only preview: CSS filters applied to a mock scene. VYTRIX
        adjusts color at the Windows display layer in the desktop app. This
        page cannot change your monitor.
      </p>
    </GlassCard>
  );
}
