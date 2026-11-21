import Link from "next/link";
import {
  ArrowRight,
  Command,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AnimatedGradient } from "@/components/animated-gradient";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { FAQAccordion } from "@/components/faq-accordion";
import { GlassCard } from "@/components/glass-card";
import { PriceCard } from "@/components/price-card";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { accessFaqs, features, productFaqs, tiers } from "@/lib/content";
import { GameArtwork } from "@/components/game-artwork";
import { gameCatalog, gameCatalogStats } from "@/lib/game-catalog.generated";

const comparisonRows = [
  {
    capability: "Where it acts",
    vytrix: "Windows display layer",
    injector: "Inside the game renderer",
    panel: "OS display settings",
    vibrance: "OS display settings",
  },
  {
    capability: "Game injection",
    vytrix: "No",
    injector: "Yes",
    panel: "No",
    vibrance: "No",
  },
  {
    capability: "Anti-cheat bypass",
    vytrix: "None attempted",
    injector: "Often needed",
    panel: "None",
    vibrance: "None",
  },
  {
    capability: "Per-monitor profiles",
    vytrix: "Yes, one per display",
    injector: "Per game, not per display",
    panel: "Limited",
    vibrance: "Usually global",
  },
  {
    capability: "Crosshair overlay",
    vytrix: "Yes",
    injector: "Sometimes",
    panel: "No",
    vibrance: "No",
  },
  {
    capability: "Reversible snapshots",
    vytrix: "Yes, one-click restore",
    injector: "Varies by tool",
    panel: "Manual",
    vibrance: "Manual",
  },
  {
    capability: "Phone control",
    vytrix: "Yes, on the local network",
    injector: "No",
    panel: "No",
    vibrance: "No",
  },
  {
    capability: "Best at",
    vytrix: "Display-wide color and overlays",
    injector: "Replacing in-game shaders",
    panel: "Basic calibration",
    vibrance: "A quick saturation boost",
  },
] as const;

const promises = [
  {
    icon: Monitor,
    title: "Per-display control",
    copy: "Each monitor keeps its own profile instead of sharing one global look.",
  },
  {
    icon: RotateCcw,
    title: "Reversible by design",
    copy: "Every optimizer change is recorded so it can be put back.",
  },
  {
    icon: Command,
    title: "Hotkeys you bind",
    copy: "Key combinations are registered as shortcuts, never as captured text.",
  },
  {
    icon: Smartphone,
    title: "Local phone control",
    copy: "Pair on your own network. No cloud relay and no phone account.",
  },
] as const;

const vouchChecks = [
  {
    title: "Per-monitor proof",
    copy: "Ask for a shot with two displays running different profiles at the same time. A global slider cannot fake that.",
  },
  {
    title: "Undo proof",
    copy: "Ask what happened after a snapshot restore. The answer should be boring, and boring is the point.",
  },
  {
    title: "No-injection proof",
    copy: "Ask whether anything was loaded into the game process. The answer from a VYTRIX user should be no.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-16 sm:pt-24">
        <AnimatedGradient />
        <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 -z-10" />
        <Container className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-elevated/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <ShieldCheck size={13} className="text-brand-cyan" aria-hidden="true" />
              Windows 10/11 · no game injection
            </div>

            <h1 className="mt-7 font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block text-ink">YOUR DISPLAY.</span>
              <span className="block text-gradient">YOUR RULES.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              VYTRIX gives your monitors the treatment games give their settings.
              Tune color per display, bind a look to each game, and put every
              change back the way it was — from one Windows app.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/pricing" size="lg">
                Get VYTRIX <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <Button href="/features" size="lg" variant="secondary">
                See the features
              </Button>
            </div>

            <p className="mt-6 font-mono text-[11px] leading-relaxed text-subtle">
              Runs alongside your games. No DLL injection, no anti-cheat bypass,
              no kernel driver.
            </p>
          </div>

          <Reveal delay={0.1}>
            <BeforeAfterSlider />
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-[color:var(--line)] bg-secondary/40">
        <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((promise) => {
            const Icon = promise.icon;
            return (
              <div key={promise.title} className="flex gap-3.5">
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-brand-cyan"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    {promise.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {promise.copy}
                  </p>
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      <Section id="features">
        <SectionHeading
          eyebrow="The suite"
          title={
            <>
              Six tools, one{" "}
              <span className="text-gradient">display layer.</span>
            </>
          }
          description="No game files, no memory reads, no driver. Everything below works where your desktop already draws."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.slug} delay={index * 0.05}>
                <GlassCard className="group h-full p-6 transition-transform duration-500 ease-bench hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {feature.summary}
                  </p>
                  <Link
                    href={`/features#${feature.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-cyan transition-opacity hover:opacity-75"
                  >
                    Read the detail <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section id="games" className="border-t border-[color:var(--line)] bg-secondary/25">
        <SectionHeading
          eyebrow="Game catalog"
          title={
            <>
              Recognised by name.{" "}
              <span className="text-gradient">
                {gameCatalogStats.total} configurations.
              </span>
            </>
          }
          description="VYTRIX ships a generated catalog across nine categories. Each profile declares how a title is detected and which display capabilities apply — with the original state restored on exit. Here is a slice of it."
        />

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "counter-strike-2",
            "elden-ring",
            "minecraft-java-edition",
            "doom-eternal",
          ].map((id) => {
            const game = gameCatalog.find((entry) => entry.id === id);
            if (!game) return null;
            return (
              <Reveal key={game.id}>
                <div className="overflow-hidden rounded-xl border border-[color:var(--line)] bg-card/60 transition-transform duration-500 ease-bench hover:-translate-y-1">
                  <div className="aspect-[2/1]">
                    <GameArtwork id={game.id} category={game.category} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-semibold text-ink">
                      {game.name}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-subtle">
                      {game.categoryLabel} · {game.verificationStatus}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/games">
            Search the catalog <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button href="/features" variant="secondary">
            How detection works
          </Button>
        </div>
      </Section>

      <Section id="comparison">
        <SectionHeading
          eyebrow="Honest comparison"
          title="Different tools, different jobs."
          description="VYTRIX is not a shader injector and does not pretend to be. Here is where each category actually works."
        />

        <div className="mt-10 overflow-x-auto rounded-xl border border-[color:var(--line)] glass">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)]">
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Capability
                </th>
                <th className="px-5 py-4 font-display text-sm font-semibold text-brand-cyan">
                  VYTRIX
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Game-shader injector
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  OS display panel
                </th>
                <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                  Simple vibrance tool
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row.capability}
                  className="border-b border-[color:var(--line)] last:border-0"
                >
                  <th scope="row" className="px-5 py-4 font-medium text-ink">
                    {row.capability}
                  </th>
                  <td className="px-5 py-4 text-muted">{row.vytrix}</td>
                  <td className="px-5 py-4 text-subtle">{row.injector}</td>
                  <td className="px-5 py-4 text-subtle">{row.panel}</td>
                  <td className="px-5 py-4 text-subtle">{row.vibrance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-subtle">
          Categories are generic on purpose. An injector can replace in-game
          shaders, which VYTRIX does not do. An OS panel is universal but coarse.
          A vibrance utility is quick and narrow. Pick the tool that matches the
          job.
        </p>
      </Section>

      <Section id="how-it-works">
        <SectionHeading
          eyebrow="How it works"
          title="Three moves, no ceremony."
          description="Install, pick a display, bind a look. The app keeps the before state so you never have to guess what changed."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Choose a display",
              copy: "VYTRIX lists connected monitors by identifier. Work on one without touching the others.",
            },
            {
              step: "02",
              title: "Tune or load",
              copy: "Adjust the sliders yourself or load a profile from the gallery. Save it under a name you will recognise.",
            },
            {
              step: "03",
              title: "Bind and revert",
              copy: "Attach it to a game executable, set a hotkey, and restore the snapshot whenever you want.",
            },
          ].map((item) => (
            <Reveal key={item.step}>
              <GlassCard className="h-full p-6">
                <span className="font-mono text-xs tracking-[0.2em] text-brand-cyan">
                  {item.step}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.copy}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="vouches" className="bg-secondary/25">
        <SectionHeading
          eyebrow="Vouches & reviews"
          title="No invented quotes."
          description="We are not going to print testimonials nobody wrote. Until real, opt-in vouches arrive, here is what a useful one should check."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {vouchChecks.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <GlassCard className="h-full p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-cyan">
                  Check {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.copy}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] text-subtle">
          Verified vouch count: —
        </p>
      </Section>

      <Section id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free. Pay when it earns its place."
          description="Every tier keeps the same no-injection core. Paid tiers add the optimizer, the overlays and phone control."
          align="center"
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <Reveal key={tier.id} delay={index * 0.06}>
              <PriceCard tier={tier} />
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:opacity-75"
          >
            Full pricing breakdown <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <Section id="faq" className="bg-secondary/25">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="FAQ"
              title="Straight answers."
              description="The questions we get most, answered without the marketing gloss."
            />
            <Link
              href="/faq"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:opacity-75"
            >
              Every question <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <FAQAccordion
            items={[...productFaqs.slice(0, 4), ...accessFaqs.slice(0, 2)]}
            idPrefix="home-faq"
          />
        </div>
      </Section>

      <Section className="pb-28 pt-20">
        <div className="rounded-xl bg-[image:var(--brand-gradient)] p-px">
          <div className="rounded-[15px] bg-bg/95 px-6 py-14 text-center sm:px-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
              The bench is ready
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Take control of the pixels you already own.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Windows 10/11. No game injection. No anti-cheat bypass. No driver.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/pricing" size="lg">
                See pricing <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <Button href="/download" size="lg" variant="secondary">
                Download page
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
