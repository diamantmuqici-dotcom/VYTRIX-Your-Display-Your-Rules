import type { Metadata } from "next";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Section, SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Security",
  description:
    "VYTRIX does not inject into games, read game memory, log keystrokes or install drivers. Updates are HTTPS-only and verified with SHA-256.",
};

const claims = [
  {
    title: "No DLL injection",
    statement:
      "VYTRIX does not load a library into a game process and does not hook a game renderer. The app stays in its own process.",
    verification: "Check the module list of a running game: no VYTRIX module appears.",
  },
  {
    title: "No game memory work",
    statement:
      "Game profiles match on executable names. Performance numbers come from standard Windows counters. Nothing is read from or written to a game's address space.",
    verification: "No handle to a game process is opened for reading or writing.",
  },
  {
    title: "No keylogger",
    statement:
      "Hotkeys are registered as key combinations with the OS. VYTRIX does not capture keystroke content or store a typed-character log.",
    verification: "Type in any window with the app running; no text is recorded by VYTRIX.",
  },
  {
    title: "No driver, no service",
    statement:
      "The app is user-mode and runs as a normal Windows application. It does not install a kernel driver or a background system service.",
    verification: "No new driver appears in Device Manager and no new service is registered.",
  },
  {
    title: "SHA-256 verified updates",
    statement:
      "Release binaries are delivered over HTTPS with a published SHA-256 digest. Compare the digest before running an executable.",
    verification: "Compare the local file hash with the digest listed beside the release.",
  },
  {
    title: "HTTPS only",
    statement:
      "Release pages and binaries are delivered over HTTPS. No plaintext HTTP endpoint is used for binary delivery.",
    verification: "Inspect the download URL; release files are served over HTTPS.",
  },
] as const;

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security posture"
        title={
          <>
            A short list, <span className="text-gradient">meant to be checked.</span>
          </>
        }
        description="VYTRIX sits outside the game on purpose. Below is what the app does not do, how it handles updates, and how you can verify each statement yourself."
      >
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-cyan">
          <ShieldCheck size={13} aria-hidden="true" /> User-mode application · Windows 10/11
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {claims.map((claim, index) => (
            <GlassCard key={claim.title} className="p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-brand-cyan">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">
                {claim.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {claim.statement}
              </p>
              <div className="mt-5 border-t border-[color:var(--line)] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  How to check
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {claim.verification}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section className="bg-secondary/25">
        <SectionHeading
          eyebrow="Data handling"
          title="What stays on the machine."
          description="Color profiles, optimizer snapshots and session logs are written locally. Share codes are text you copy yourself. There is no account or license record to upload."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: "Local by default",
              copy: "Profiles and snapshots stay in the app data folder until you move them.",
            },
            {
              title: "Explicit pairing",
              copy: "Phone control is opt-in, LAN-only and expires after 30 days of inactivity.",
            },
            {
              title: "No silent uploads",
              copy: "There is no telemetry stream of keystrokes, game state or screen contents.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[color:var(--line)] bg-elevated/35 p-6"
            >
              <h3 className="font-display text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <SectionHeading
              eyebrow="Find something?"
              title="Report it to the people who ship the build."
              description="Security findings go through the community server. Include the version, the Windows build and the exact step that reproduces what you saw."
            />
          </div>
          <Button href="/discord">
            Go to Discord <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
