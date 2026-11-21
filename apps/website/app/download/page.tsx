import type { Metadata } from "next";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Download",
  description:
    "VYTRIX download gate. Sign in with an active license to see the Windows build; no installer is exposed on this page.",
};

export default function DownloadPage() {
  return (
    <>
      <PageHero
        eyebrow="Download"
        title={
          <>
            Signed builds, <span className="text-gradient">behind the gate.</span>
          </>
        }
        description="This page is the honest front door. It does not expose an installer and it does not pretend to check your license."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard glow className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-cyan">
              <LockKeyhole size={13} aria-hidden="true" />
              Sign in and active license required
            </div>

            <h2 className="mt-6 font-display text-2xl font-bold text-ink">
              Windows installer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              No build is listed here. In the released app, the installer link
              appears only after a signed-in session with an active license.
              This page has no download URL, no hidden gate and no client-side
              license check.
            </p>

            <div className="mt-7 rounded-lg border border-dashed border-[color:var(--line)] bg-secondary/50 p-6 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                Inert state · no file attached
              </p>
              <Button disabled size="lg" className="mt-4" fullWidth>
                <LockKeyhole size={16} aria-hidden="true" />
                Download for Windows (x64)
              </Button>
              <p className="mt-3 text-xs text-subtle">
                This button is disabled until auth and licensing exist.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/login" variant="secondary">
                Sign in
              </Button>
              <Button href="/pricing" variant="ghost">
                See pricing <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="font-display text-base font-semibold text-ink">
                Requirements
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>Windows 10 or Windows 11, 64-bit</li>
                <li>No kernel driver and no administrator service</li>
                <li>.NET runtime bundled with the installer</li>
                <li>Local user account; no cloud sign-in needed to tune displays</li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <ShieldCheck
                size={20}
                strokeWidth={1.8}
                className="text-brand-cyan"
                aria-hidden="true"
              />
              <h2 className="font-display text-base font-semibold text-ink">
                Verify before you run
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Each published release carries its SHA-256 digest. Compare the
                downloaded file against that value before launching the
                installer.
              </p>
              <Button href="/changelog" variant="ghost" size="sm" className="mt-4">
                Release history <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </GlassCard>
          </div>
        </div>
      </Section>
    </>
  );
}
