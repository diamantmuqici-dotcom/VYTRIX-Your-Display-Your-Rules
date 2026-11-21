import { Check } from "lucide-react";
import type { Tier } from "@/lib/content";
import { Button } from "./button";
import { GlassCard } from "./glass-card";

export function PriceCard({ tier }: { tier: Tier }) {
  return (
    <GlassCard
      glow={tier.highlighted === true}
      className="flex h-full flex-col p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-ink">{tier.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {tier.description}
          </p>
        </div>
        {tier.highlighted ? (
          <span className="shrink-0 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-cyan">
            Popular
          </span>
        ) : null}
      </div>

      <div className="mt-7 flex items-end gap-2">
        <span className="font-display text-4xl font-bold tracking-tight text-ink">
          {tier.price}
        </span>
        <span className="pb-1 text-xs text-subtle">{tier.cadence}</span>
      </div>

      <ul className="mt-7 space-y-3.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-muted">
            <Check
              size={16}
              strokeWidth={2.2}
              className="mt-0.5 shrink-0 text-brand-cyan"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-1">
        <Button href="/account" fullWidth variant={tier.highlighted ? "primary" : "secondary"}>
          {tier.cta}
        </Button>
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
          Auth required
        </p>
      </div>
    </GlassCard>
  );
}
