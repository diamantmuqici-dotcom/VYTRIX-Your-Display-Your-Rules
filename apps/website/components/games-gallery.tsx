"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameArtwork } from "@/components/game-artwork";
import { cn } from "@/lib/utils";
import {
  gameCatalog,
  gameCatalogStats,
  type GameCatalogEntry,
} from "@/lib/game-catalog.generated";

const CATEGORY_ORDER = [
  "shooters",
  "survival",
  "sandbox",
  "racing",
  "rpg",
  "strategy",
  "horror",
  "additional",
  "misc",
] as const;

const LABELS: Record<string, string> = {
  shooters: "Shooters",
  survival: "Survival",
  sandbox: "Sandbox & indie",
  racing: "Racing",
  rpg: "RPG & open world",
  strategy: "Strategy & MOBA",
  horror: "Horror & action",
  additional: "More titles",
  misc: "Utilities",
};

const badgeClass = (status: string) =>
  status === "verified"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : status === "community"
      ? "border-sky-400/25 bg-sky-400/10 text-sky-300"
      : "border-amber-400/25 bg-amber-400/10 text-amber-300";

function GameCard({ game }: { game: GameCatalogEntry }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--line)] bg-card/60 transition-all duration-500 ease-bench hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-glow">
      <div className="relative aspect-[2/1] overflow-hidden">
        <GameArtwork id={game.id} category={game.category} />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8">
          <span className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/80 backdrop-blur">
            {LABELS[game.category] ?? game.category}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider backdrop-blur",
              badgeClass(game.verificationStatus),
            )}
          >
            {game.verificationStatus}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold leading-tight text-ink">
          {game.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">
          {game.blurb}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {game.capabilities.colorProfiles ? (
            <span className="rounded bg-brand-cyan/10 px-1.5 py-0.5 font-mono text-[9px] text-brand-cyan">
              color
            </span>
          ) : null}
          {game.capabilities.performanceMonitoring ? (
            <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 font-mono text-[9px] text-brand-purple">
              monitoring
            </span>
          ) : null}
          {game.capabilities.restoration ? (
            <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
              reversible
            </span>
          ) : null}
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[9px]",
              game.detectionConfidence === "verified"
                ? "bg-emerald-400/10 text-emerald-300"
                : game.detectionConfidence === "partial"
                  ? "bg-sky-400/10 text-sky-300"
                  : "bg-amber-400/10 text-amber-300",
            )}
          >
            detect: {game.detectionConfidence}
          </span>
        </div>

        <div className="mt-3 border-t border-[color:var(--line)] pt-3 font-mono text-[10px] text-subtle">
          {game.launchers.length ? game.launchers.join(" · ") : "manual"}
          {game.executableNames.length ? ` · ${game.executableNames[0]}` : ""}
        </div>
      </div>
    </article>
  );
}

export function GamesGallery() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gameCatalog.filter((game) => {
      const inCategory = category === "all" || game.category === category;
      const matchesQuery =
        q.length === 0 ||
        game.name.toLowerCase().includes(q) ||
        game.executableNames.some((name) => name.toLowerCase().includes(q));
      return inCategory && matchesQuery;
    });
  }, [category, query]);

  const categories = useMemo(() => {
    const withCounts = CATEGORY_ORDER.filter((c) =>
      gameCatalogStats.byCategory[c as keyof typeof gameCatalogStats.byCategory]
        ? true
        : false,
    ).map((c) => ({
      id: c,
      label: LABELS[c],
      count:
        gameCatalogStats.byCategory[
          c as keyof typeof gameCatalogStats.byCategory
        ] ?? 0,
    }));
    return withCounts;
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <label className="relative block max-w-md">
          <span className="sr-only">Search games</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by game or executable…"
            className="field pl-9"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-[11px] transition-colors",
              category === "all"
                ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
                : "border-[color:var(--line)] text-muted hover:text-ink",
            )}
          >
            All <span className="opacity-60">{gameCatalogStats.total}</span>
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-[11px] transition-colors",
                category === item.id
                  ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
                  : "border-[color:var(--line)] text-muted hover:text-ink",
              )}
            >
              {item.label} <span className="opacity-60">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 font-mono text-[11px] text-subtle" aria-live="polite">
        Showing {filtered.length} of {gameCatalogStats.total} catalogued configurations
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-xl border border-[color:var(--line)] bg-card/40 p-8 text-center text-sm text-muted">
          No configuration matches that search. Try a game name or an executable
          such as cs2.exe.
        </p>
      ) : null}
    </div>
  );
}
