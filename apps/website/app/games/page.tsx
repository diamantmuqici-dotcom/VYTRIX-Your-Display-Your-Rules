import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, SearchCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GamesGallery } from "@/components/games-gallery";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { gameCatalogStats } from "@/lib/game-catalog.generated";

export const metadata: Metadata = {
  title: "Game catalog",
  description:
    "Browse 162 game configurations across nine categories. See how VYTRIX recognises each title, which display capabilities it declares, and what stays outside the game.",
};

const howItWorks = [
  {
    icon: SearchCheck,
    title: "Detection is declared, not guessed at runtime",
    copy: "Each entry lists its executable names, process names and launcher signals. Confidence is written down as verified, partial or manual so you know how the match is made.",
  },
  {
    icon: Database,
    title: "A profile describes capabilities, not cheats",
    copy: "Color profiles, display profiles, monitoring and restoration are bounded declarations. Crosshair and overlay support is marked supported, restricted or unknown per title.",
  },
  {
    icon: ShieldCheck,
    title: "The boundary is the display layer",
    copy: "VYTRIX changes Windows display state in your own session. It does not modify game files, read game memory, inject code or bypass anti-cheat. Those are listed as unsupported on every entry.",
  },
] as const;

export default function GamesPage() {
  return (
    <>
      <PageHero
        eyebrow="Game catalog"
        title={
          <>
            {gameCatalogStats.total} games.{" "}
            <span className="text-gradient">One honest catalog.</span>
          </>
        }
        description="VYTRIX ships a generated configuration catalog, not a list of marketing claims. Search it, filter by category, and see exactly how each title is recognised and which display capabilities apply."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/download" size="lg">
            Get the app <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button href="/docs" size="lg" variant="secondary">
            Read the docs
          </Button>
        </div>
      </PageHero>

      <section className="border-b border-[color:var(--line)] bg-secondary/25">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-px px-4 py-8 sm:grid-cols-4">
          {[
            { value: gameCatalogStats.total, label: "Configurations" },
            { value: gameCatalogStats.categories, label: "Categories" },
            { value: gameCatalogStats.verified, label: "Verified matches" },
            {
              value: gameCatalogStats.executableHints,
              label: "Executable hints",
            },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-3 text-center">
              <p className="font-display text-3xl font-bold text-gradient">
                {stat.value}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-subtle">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Section id="catalog">
        <SectionHeading
          eyebrow="The catalog"
          title="Search every configuration."
          description="Each card shows the generated artwork for its category, the verification status, the detection confidence and the declared capabilities. All 162 entries come from the same generated database the desktop app uses."
        />
        <div className="mt-10">
          <GamesGallery />
        </div>
      </Section>

      <Section id="how-it-works" className="border-t border-[color:var(--line)] bg-secondary/25">
        <SectionHeading
          eyebrow="How it works"
          title="A catalog you can audit."
          description="The website, the desktop app and the generator read the same source data. Nothing here is a hand-maintained marketing list."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {howItWorks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.06}>
                <GlassCard className="h-full p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {item.copy}
                  </p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:opacity-75"
          >
            See the features <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:opacity-75"
          >
            Security posture <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </>
  );
}
