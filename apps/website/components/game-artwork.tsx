import { cn } from "@/lib/utils";

/**
 * Original procedural key art. Every card gets a deterministic, category-themed
 * scene derived from its game id. No screenshots, trademarks or remote images:
 * the artwork is inline SVG so it renders on GitHub Pages with zero network
 * requests and cannot 404 under the project basePath.
 */

type Palette = {
  skyTop: string;
  skyBottom: string;
  glow: string;
  ridge: string;
  ridgeFar: string;
  ground: string;
  accent: string;
};

const PALETTES: Record<string, Palette> = {
  shooters: {
    skyTop: "#0a1230",
    skyBottom: "#243a72",
    glow: "#38d9ff",
    ridge: "#0b1630",
    ridgeFar: "#16264f",
    ground: "#060c1c",
    accent: "#5ce1ff",
  },
  survival: {
    skyTop: "#102318",
    skyBottom: "#3c5a36",
    glow: "#b6e36b",
    ridge: "#12261a",
    ridgeFar: "#1f3a25",
    ground: "#08130c",
    accent: "#a8e063",
  },
  sandbox: {
    skyTop: "#1b1230",
    skyBottom: "#5a3c72",
    glow: "#ff7ad9",
    ridge: "#241636",
    ridgeFar: "#3a2452",
    ground: "#120a1e",
    accent: "#ff8ae2",
  },
  racing: {
    skyTop: "#1a0f22",
    skyBottom: "#74204a",
    glow: "#ff6a8f",
    ridge: "#2a1024",
    ridgeFar: "#4a1632",
    ground: "#0f0710",
    accent: "#ff7a9c",
  },
  rpg: {
    skyTop: "#101a33",
    skyBottom: "#4a3a7a",
    glow: "#c9a6ff",
    ridge: "#151d3a",
    ridgeFar: "#2b2d58",
    ground: "#090d1c",
    accent: "#c9a6ff",
  },
  strategy: {
    skyTop: "#0d1f28",
    skyBottom: "#1c5a63",
    glow: "#5ff0d0",
    ridge: "#0d2a30",
    ridgeFar: "#15424a",
    ground: "#07161a",
    accent: "#5ff0d0",
  },
  horror: {
    skyTop: "#0a0c14",
    skyBottom: "#2a1f38",
    glow: "#e05a6e",
    ridge: "#0d0b16",
    ridgeFar: "#1a1526",
    ground: "#050408",
    accent: "#e0607a",
  },
  additional: {
    skyTop: "#0f1a2e",
    skyBottom: "#2c4a72",
    glow: "#7fb8ff",
    ridge: "#101f38",
    ridgeFar: "#1a3352",
    ground: "#080f1c",
    accent: "#7fb8ff",
  },
  misc: {
    skyTop: "#161a12",
    skyBottom: "#4a4a26",
    glow: "#e8d95f",
    ridge: "#1e2014",
    ridgeFar: "#33351d",
    ground: "#0c0d08",
    accent: "#e8d95f",
  },
};

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ridgePath(seed: number, baseY: number, amplitude: number, width = 400) {
  const points: string[] = [`0,${baseY}`];
  const steps = 9;
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width;
    const n = ((seed >> (i % 16)) & 15) / 15;
    const y = baseY - n * amplitude - (i % 2 === 0 ? amplitude * 0.15 : 0);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  points.push(`${width},200`, `0,200`);
  return `M${points.join(" L")} Z`;
}

export function GameArtwork({
  id,
  category,
  className,
}: {
  id: string;
  category: string;
  className?: string;
}) {
  const p = PALETTES[category] ?? PALETTES.additional;
  const seed = hashId(id);
  const sunX = 60 + (seed % 280);
  const sunY = 42 + ((seed >> 5) % 34);
  const starCount = 14 + (seed % 10);
  const stars = Array.from({ length: starCount }, (_, i) => {
    const x = ((seed >> (i % 20)) * (i + 3)) % 400;
    const y = ((seed >> ((i + 7) % 20)) * (i + 5)) % 110;
    const r = 0.4 + (((seed >> (i % 12)) & 7) / 7) * 1.0;
    return { x, y, r };
  });

  const uid = `art-${id.replace(/[^a-z0-9-]/gi, "")}`;

  return (
    <div className={cn("game-artwork", className)} aria-hidden="true">
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="presentation"
      >
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.95" />
            <stop offset="55%" stopColor={p.glow} stopOpacity="0.25" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="200" fill={`url(#${uid}-sky)`} />

        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity="0.55" />
        ))}

        <circle cx={sunX} cy={sunY} r="46" fill={`url(#${uid}-glow)`} />
        <circle cx={sunX} cy={sunY} r="13" fill={p.glow} opacity="0.85" />

        <path d={ridgePath(seed, 132, 46)} fill={p.ridgeFar} opacity="0.85" />
        <path d={ridgePath(seed ^ 0x9e37, 158, 40)} fill={p.ridge} />

        <rect y="176" width="400" height="24" fill={p.ground} />

        {/* Horizon light band and perspective lines give each scene depth. */}
        <rect y="174" width="400" height="2" fill={p.accent} opacity="0.5" />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1="200"
            y1="176"
            x2={i * 90 - 40}
            y2="200"
            stroke={p.accent}
            strokeWidth="0.6"
            opacity="0.18"
          />
        ))}

        <rect
          x="0"
          y="0"
          width="400"
          height="200"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.06"
        />
      </svg>
    </div>
  );
}
