import type { Metadata } from "next";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { features } from "@/lib/content";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Per-monitor color, game profiles, a crosshair overlay, utility zoom, SnapTap, a reversible optimizer, performance monitoring and phone control — without game injection.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={
          <>
            Everything below the game,{" "}
            <span className="text-gradient">nothing inside it.</span>
          </>
        }
        description="Each feature works on the Windows display layer or in our own window. That is the whole design constraint, and it is what keeps profiles portable and reversibility honest."
      />

      <Section>
        <div className="space-y-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.slug}>
                <GlassCard
                  id={feature.slug}
                  className="scroll-mt-28 p-6 sm:p-8"
                >
                  <div className="grid gap-7 lg:grid-cols-[0.34fr_0.66fr] lg:gap-12">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                        </div>
                        <span className="font-mono text-[11px] tracking-[0.18em] text-subtle">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
                        {feature.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {feature.summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-cyan">
                        What it does
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {feature.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex gap-3 text-sm leading-relaxed text-muted"
                          >
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-cyan" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-7 border-t border-[color:var(--line)] pt-5">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
                          Boundary
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {feature.limit}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section className="border-t border-[color:var(--line)] bg-secondary/25">
        <SectionHeading
          eyebrow="The constraint"
          title="Why no injection is a feature."
          description="A tool that lives outside the game does not need to keep up with anti-cheat updates, does not break when a renderer changes, and can be removed without leaving anything behind."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/security" variant="secondary">
            <ShieldCheck size={16} aria-hidden="true" /> Security posture
          </Button>
          <Button href="/presets">
            Browse presets <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
