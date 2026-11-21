import type { ReactNode } from "react";
import { Container } from "./container";
import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  contained = true,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  contained?: boolean;
}) {
  return (
    <section id={id} className={cn("relative py-20 sm:py-28", className)}>
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-cyan">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
