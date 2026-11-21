import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
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

      <Section id="quick-reference">
        <SectionHeading
          eyebrow="README"
          title="The whole suite at a glance."
          description="Read this table first. Every feature below runs as a regular user-mode Windows 10/11 process on the display layer or in its own window. Nothing loads into a game."
        />

        <div className="mt-9 overflow-x-auto rounded-xl border border-[color:var(--line)] glass">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)]">
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Feature
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Acts on
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Reversible
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Default control
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Per-monitor color", "Windows display layer", "Yes", "Sliders + hotkey"],
                ["Game profiles", "Executable name match", "Yes", "Auto on launch"],
                ["Crosshair overlay", "Own transparent window", "Close the window", "Auto-show rule"],
                ["Reversible optimizer", "Named Windows settings", "Snapshot restore", "Apply per setting"],
                ["Performance monitor", "System counters", "Overlay toggle", "Compact overlay"],
                ["Phone control", "Local network page", "Unpair", "Explicit pairing"],
                ["Utility zoom", "Magnification API", "Release / toggle", "Alt + Z"],
                ["SnapTap", "Bundled standalone tool", "Close the tray tool", "Tray profile"],
              ].map((row) => (
                <tr
                  key={row[0]}
                  className="border-b border-[color:var(--line)] last:border-0"
                >
                  <th scope="row" className="px-5 py-3.5 font-medium text-ink">
                    {row[0]}
                  </th>
                  <td className="px-5 py-3.5 text-muted">{row[1]}</td>
                  <td className="px-5 py-3.5 text-muted">{row[2]}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-brand-cyan">
                    {row[3]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassCard className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-cyan">
              Install
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-subtle">
              <li>Download the portable x64 executable from the release page.</li>
              <li>Run it on Windows 10 or 11. No installer and no driver.</li>
              <li>Pick a display, load a preset or tune the sliders yourself.</li>
            </ol>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-cyan">
              What it never does
            </p>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
              <li>No DLL injection into a game process.</li>
              <li>No game memory reads and no game file changes.</li>
              <li>No anti-cheat bypass, kernel driver or hidden service.</li>
              <li>No keystroke logging — hotkeys are registered with the OS.</li>
            </ul>
          </GlassCard>
        </div>
      </Section>

      <Section className="border-t border-[color:var(--line)] bg-secondary/25">
        <SectionHeading
          eyebrow="Reference"
          title="Feature by feature."
          description="What each tool does, the exact boundary it works inside, and how to get back to where you started."
        />
        <div className="mt-10 space-y-6">
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
          <Button href="/games" variant="secondary">
            <FileText size={16} aria-hidden="true" /> Browse the game catalog
          </Button>
          <Button href="/presets">
            Browse presets <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Want the per-title detail? The{" "}
          <Link href="/games" className="text-brand-cyan hover:opacity-75">
            game catalog
          </Link>{" "}
          lists all 162 configurations with detection confidence and declared
          capabilities.
        </p>
      </Section>
    </>
  );
}
