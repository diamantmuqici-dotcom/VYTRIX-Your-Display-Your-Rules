import type { Metadata } from "next";
import { ArrowRight, BookOpen, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Section, SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "VYTRIX documentation hub: quick start, feature reference, preset format, security posture and release history.",
};

const resources = [
  {
    icon: BookOpen,
    title: "Feature reference",
    description: "What every control does, and where its boundary sits.",
    href: "/features",
  },
  {
    icon: FileText,
    title: "Preset gallery",
    description: "Illustrative share codes and the categories behind them.",
    href: "/presets",
  },
  {
    icon: ShieldCheck,
    title: "Security posture",
    description: "No injection, no game memory, no keylogger, no driver.",
    href: "/security",
  },
] as const;

const quickStart = [
  {
    step: "1",
    title: "Install on Windows 10 or 11",
    copy: "The installer is gated behind sign-in and an active license. Verify the published SHA-256 digest before running it.",
  },
  {
    step: "2",
    title: "Pick a display",
    copy: "Choose one monitor from the device list. Each connected display stores its own profile.",
  },
  {
    step: "3",
    title: "Load or tune a profile",
    copy: "Start from a neutral baseline, adjust the controls, then save with a name you will recognise.",
  },
  {
    step: "4",
    title: "Bind it and keep the snapshot",
    copy: "Attach the profile to a game executable, set a hotkey, and keep the before snapshot for a clean revert.",
  },
] as const;

export default function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title={
          <>
            The short manual, <span className="text-gradient">right here.</span>
          </>
        }
        description="A compact reference for getting a display set up and understanding what the app touches. The full offline manual ships with the desktop build."
      />

      <Section>
        <SectionHeading
          eyebrow="Quick start"
          title="From install to first profile."
          description="Four steps, no driver install and no game configuration required."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickStart.map((item) => (
            <GlassCard key={item.step} className="p-6">
              <span className="font-mono text-xs tracking-[0.2em] text-brand-cyan">
                {item.step}
              </span>
              <h3 className="mt-5 font-display text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.copy}
              </p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section className="bg-secondary/25">
        <SectionHeading
          eyebrow="Reference"
          title="Where to read next."
          description="Each of these pages is maintained alongside the app, so the wording matches what the build actually does."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <GlassCard key={resource.href} className="p-6">
                <Icon size={20} strokeWidth={1.8} className="text-brand-cyan" aria-hidden="true" />
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                  {resource.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {resource.description}
                </p>
                <Button href={resource.href} variant="ghost" size="sm" className="mt-5">
                  Open <ArrowRight size={15} aria-hidden="true" />
                </Button>
              </GlassCard>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold text-ink">
              Need a specific question answered?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The FAQ covers the common ones. The community server reaches the
              people who write the code.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/faq" variant="secondary">FAQ</Button>
            <Button href="/discord">Discord</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
