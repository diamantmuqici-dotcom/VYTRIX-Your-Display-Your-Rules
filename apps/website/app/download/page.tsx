import type { Metadata } from "next";
import { ArrowRight, Download, Github, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { RELEASE_URL } from "@/lib/site";

const DIRECT_EXE =
  "https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules/releases/latest/download/VYTRIX-x64-portable.exe";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download the VYTRIX portable Windows x64 build from the public GitHub release. Open source, no sign-in required.",
};

export default function DownloadPage() {
  return (
    <>
      <PageHero
        eyebrow="Download"
        title={
          <>
            Portable build, <span className="text-gradient">no gate.</span>
          </>
        }
        description="VYTRIX is fully open source. Grab the signed-off Windows x64 portable executable directly from the public GitHub release — no account, no installer service, no hidden payload."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard glow className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-cyan">
              <Download size={13} aria-hidden="true" />
              Windows x64 · portable
            </div>

            <h2 className="mt-6 font-display text-2xl font-bold text-ink">
              VYTRIX-x64-portable.exe
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A single self-contained executable. Unzip nothing, install nothing,
              leave no service behind. Extract the archive, run the executable,
              tune your displays. Every color change stays in your graphics
              driver until you close the app or hit reset.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href={DIRECT_EXE} external size="lg">
                <Download size={16} aria-hidden="true" />
                Download portable exe
              </Button>
              <Button href={RELEASE_URL} external variant="secondary" size="lg">
                <Github size={16} aria-hidden="true" />
                All release files
              </Button>
            </div>

            <div className="mt-7 rounded-lg border border-[color:var(--line)] bg-secondary/50 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                Verify the download
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Each release publishes a <code className="text-brand-cyan">.sha256</code>{" "}
                sidecar next to the executable. Run{" "}
                <code className="text-brand-cyan">
                  certutil -hashfile VYTRIX-x64-portable.exe SHA256
                </code>{" "}
                and compare the output against it before launching.
              </p>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="font-display text-base font-semibold text-ink">
                Requirements
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>Windows 10 or Windows 11, 64-bit</li>
                <li>WebView2 runtime (preinstalled on Windows 11)</li>
                <li>No kernel driver and no background service</li>
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
                Built from source, in the open
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Every line is in the public repository under the MIT license.
                CI rebuilds and tests the workspace on every push, and each
                release is assembled by the same workflow.
              </p>
              <Button
                href="https://github.com/diamantmuqici-dotcom/VYTRIX-Your-Display-Your-Rules"
                external
                variant="ghost"
                size="sm"
                className="mt-4"
              >
                Read the source <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </GlassCard>
          </div>
        </div>
      </Section>
    </>
  );
}
