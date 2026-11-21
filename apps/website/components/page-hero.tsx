import type { ReactNode } from "react";
import { AnimatedGradient } from "./animated-gradient";
import { Container } from "./container";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--line)] pb-14 pt-16 sm:pb-20 sm:pt-20">
      <AnimatedGradient />
      <Container className="relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-cyan">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
        {children}
      </Container>
    </section>
  );
}
