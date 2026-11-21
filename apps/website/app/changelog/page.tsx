import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { releases } from "@/lib/content";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "VYTRIX version history: display controls, profiles, overlays, optimizer and security-related changes.",
};

function ChangeList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-cyan" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title={
          <>
            Every change, <span className="text-gradient">in the open.</span>
          </>
        }
        description="Pre-release history for the Windows app. Each installer ships with its SHA-256 digest alongside the release."
      />

      <Section>
        <div className="space-y-6">
          {releases.map((release, index) => (
            <Reveal key={release.version} delay={index * 0.04}>
              <GlassCard className="p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tracking-[0.16em] text-brand-cyan">
                      v{release.version}
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink">
                      {release.title}
                    </h2>
                  </div>
                  <time
                    dateTime={release.date}
                    className="font-mono text-[11px] text-subtle"
                  >
                    {release.date}
                  </time>
                </div>

                <div className="mt-7 grid gap-7 md:grid-cols-3">
                  <ChangeList title="Added" items={release.added} />
                  <ChangeList title="Changed" items={release.changed} />
                  <ChangeList title="Fixed" items={release.fixed} />
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-[color:var(--line)] bg-secondary/25">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold text-ink">
              Looking for the installer?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The download page shows the gated state and explains exactly what
              is required before a build is available.
            </p>
          </div>
          <Button href="/download" variant="secondary">
            Download page <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
