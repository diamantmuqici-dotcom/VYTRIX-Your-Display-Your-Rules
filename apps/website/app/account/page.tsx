import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/button";
import { GlassCard } from "@/components/glass-card";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Account",
  description:
    "VYTRIX account surface. No session is checked on this page and no license state is reported.",
};

const fields = [
  { label: "Email", value: "—" },
  { label: "Plan", value: "—" },
  { label: "License status", value: "—" },
  { label: "Authorized devices", value: "—" },
  { label: "Renewal", value: "—" },
] as const;

export default function AccountPage() {
  return (
    <>
      <PageHero
        eyebrow="Account"
        title={
          <>
            Nothing signed in <span className="text-gradient">on this device.</span>
          </>
        }
        description="This surface shows the signed-out state. No session is read, no license is verified and no checkout is started here."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <GlassCard glow className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-elevated/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <LockKeyhole size={13} aria-hidden="true" /> Signed out
            </div>

            <h2 className="mt-6 font-display text-2xl font-bold text-ink">
              Sign in to see your license.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Sign-in, checkout and the gated installer all live behind an auth
              backend. Until one is connected, this page stays in this state.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/login">
                Sign in <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <Button href="/signup" variant="secondary">
                Create account
              </Button>
              <Button href="/forgot-password" variant="ghost">
                Reset password
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8">
            <h2 className="font-display text-base font-semibold text-ink">
              Account details
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-subtle">
              Empty state. A dash means no value is available without a session.
            </p>
            <dl className="mt-6 divide-y divide-[color:var(--line)]">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <dt className="text-sm text-muted">{field.label}</dt>
                  <dd className="font-mono text-sm text-ink">{field.value}</dd>
                </div>
              ))}
            </dl>
          </GlassCard>
        </div>
      </Section>
    </>
  );
}
