import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { CopyCodeButton } from "@/components/copy-code-button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { presets } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Presets",
  description:
    "Illustrative VYTRIX preset share codes for neutral, competitive, comfort and media displays.",
};

const accentStyles = {
  cyan: "text-brand-cyan border-brand-cyan/25 bg-brand-cyan/10",
  blue: "text-brand-blue border-brand-blue/25 bg-brand-blue/10",
  purple: "text-brand-purple border-brand-purple/25 bg-brand-purple/10",
} as const;

export default function PresetsPage() {
  return (
    <>
      <PageHero
        eyebrow="Preset gallery"
        title={
          <>
            A starting point, <span className="text-gradient">not a verdict.</span>
          </>
        }
        description="Every code below is illustrative. The desktop app handles real import and validation; this gallery copies text and does nothing else."
      />

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset, index) => (
            <Reveal key={preset.code} delay={index * 0.05}>
              <GlassCard className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                      accentStyles[preset.accent],
                    )}
                  >
                    {preset.kind}
                  </span>
                  <CopyCodeButton code={preset.code} />
                </div>

                <h2 className="mt-6 font-display text-xl font-bold text-ink">
                  {preset.name}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {preset.description}
                </p>

                <div className="mt-6 rounded-sm border border-[color:var(--line)] bg-secondary/70 px-3 py-2.5">
                  <code className="break-all font-mono text-xs text-ink">
                    {preset.code}
                  </code>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {preset.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] text-subtle">
                      #{tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-subtle">
          Share codes travel as plain text. Exporting one uploads nothing, and
          importing one on this page is not possible by design.
        </p>
      </Section>

      <Section className="border-t border-[color:var(--line)] bg-secondary/25">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold text-ink">
              Want to build your own?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              VYTRIX includes saved profiles and the full set of per-display
              controls in every release.
            </p>
          </div>
          <Button href="/features">
            See the controls <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
