import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/button";
import { DiscordRedirect } from "@/components/discord-redirect";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { DISCORD_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Discord",
  description: "Join the VYTRIX community server.",
};

export default function DiscordPage() {
  return (
    <>
      <DiscordRedirect />
      <PageHero
        eyebrow="Community"
        title={
          <>
            One link, <span className="text-gradient">no detour.</span>
          </>
        }
        description="You are being sent to the VYTRIX Discord server. If the redirect is blocked, the button below goes to the same place."
      />

      <Section>
        <div className="mx-auto max-w-xl text-center">
          <Button href={DISCORD_URL} external size="lg">
            Join the Discord <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
          <p className="mt-6 break-all font-mono text-xs text-subtle">
            {DISCORD_URL}
          </p>
        </div>
      </Section>
    </>
  );
}
