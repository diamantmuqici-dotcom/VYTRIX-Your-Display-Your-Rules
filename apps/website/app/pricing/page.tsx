import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { FAQAccordion } from "@/components/faq-accordion";
import { PageHero } from "@/components/page-hero";
import { PriceCard } from "@/components/price-card";
import { Section, SectionHeading } from "@/components/section";
import { accessFaqs, tiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free, Monthly and Lifetime tiers for VYTRIX. Checkout begins after sign-in; no payment is taken on this site.",
};

const matrix = [
  { label: "Per-monitor color controls", free: true, monthly: true, lifetime: true },
  { label: "Saved profiles", free: "3", monthly: "Unlimited", lifetime: "Unlimited" },
  { label: "Community presets", free: true, monthly: true, lifetime: true },
  { label: "Reversible optimizer", free: false, monthly: true, lifetime: true },
  { label: "Crosshair overlay", free: false, monthly: true, lifetime: true },
  { label: "Performance overlay", free: false, monthly: true, lifetime: true },
  { label: "Phone control", free: false, monthly: true, lifetime: true },
  { label: "Devices included", free: "1", monthly: "1", lifetime: "3" },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <span className="font-mono text-xs text-brand-cyan">Included</span>;
  }
  if (value === false) {
    return <span className="font-mono text-xs text-subtle">—</span>;
  }
  return <span className="text-xs text-muted">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Pay for the suite, <span className="text-gradient">not for access to your monitor.</span>
          </>
        }
        description="Free is usable and stays free. Monthly and Lifetime add the tools that change system settings and overlay your games. Prices shown here are the planned launch prices."
      />

      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <PriceCard key={tier.id} tier={tier} />
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--line)] bg-elevated/35 p-6">
            <h2 className="font-display text-base font-semibold text-ink">
              Checkout
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Every button on this page goes to the account surface and requires
              sign-in. Stripe handles card payment after a session exists. No
              payment field or charge is present on this site.
            </p>
          </div>
          <div className="rounded-lg border border-[color:var(--line)] bg-elevated/35 p-6">
            <h2 className="font-display text-base font-semibold text-ink">
              Crypto
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Cryptocurrency is not accepted at launch. No wallet connection is
              requested anywhere in the app or on this site.
            </p>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary/25">
        <SectionHeading
          eyebrow="Side by side"
          title="What each tier actually includes."
        />
        <div className="mt-10 overflow-x-auto rounded-xl border border-[color:var(--line)] glass">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)]">
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Capability
                </th>
                <th className="px-5 py-4 font-display text-sm font-semibold text-ink">Free</th>
                <th className="px-5 py-4 font-display text-sm font-semibold text-brand-cyan">Monthly</th>
                <th className="px-5 py-4 font-display text-sm font-semibold text-ink">Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[color:var(--line)] last:border-0"
                >
                  <th scope="row" className="px-5 py-4 font-medium text-ink">
                    {row.label}
                  </th>
                  <td className="px-5 py-4"><Cell value={row.free} /></td>
                  <td className="px-5 py-4"><Cell value={row.monthly} /></td>
                  <td className="px-5 py-4"><Cell value={row.lifetime} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Pricing FAQ"
              title="Before you decide."
              description="Cancellation, licensing and download access, in plain words."
            />
            <Button href="/faq" variant="secondary" className="mt-6">
              All questions <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
          <FAQAccordion items={accessFaqs} idPrefix="pricing-faq" />
        </div>
      </Section>
    </>
  );
}
