import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { FAQAccordion } from "@/components/faq-accordion";
import { PageHero } from "@/components/page-hero";
import { Section, SectionHeading } from "@/components/section";
import { accessFaqs, productFaqs, securityFaqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about VYTRIX, game injection, anti-cheat, Windows support, licensing, downloads and data handling.",
};

const groups = [
  {
    id: "product",
    eyebrow: "Product",
    title: "How the app behaves",
    description: "The mechanics of profiles, overlays and reversibility.",
    items: productFaqs,
  },
  {
    id: "access",
    eyebrow: "Access",
    title: "Tiers and licensing",
    description: "Free, Monthly, Lifetime, cancellation and downloads.",
    items: accessFaqs,
  },
  {
    id: "security",
    eyebrow: "Security",
    title: "What stays local",
    description: "Typing, game memory, updates and profile data.",
    items: securityFaqs,
  },
] as const;

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            The questions we get <span className="text-gradient">first.</span>
          </>
        }
        description="Grouped by what they are about. If yours is not here, the community server is the fastest route to an answer."
      />

      <Section>
        <div className="space-y-16">
          {groups.map((group) => (
            <div key={group.id} id={group.id} className="scroll-mt-28">
              <SectionHeading
                eyebrow={group.eyebrow}
                title={group.title}
                description={group.description}
              />
              <div className="mt-8">
                <FAQAccordion
                  items={group.items}
                  idPrefix={`faq-${group.id}`}
                  defaultOpen={0}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-[color:var(--line)] bg-secondary/25">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <SectionHeading
              eyebrow="Still stuck"
              title="Ask where the builders are."
              description="The Discord server is linked on every page. Describe your Windows build and monitor setup with the question."
            />
          </div>
          <Button href="/discord">
            Open Discord <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
