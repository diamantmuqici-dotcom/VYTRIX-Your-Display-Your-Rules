"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Static-export safe reveal. Content is rendered fully visible in the HTML so
 * GitHub Pages shows every section with JavaScript disabled. The CSS class
 * only adds a progressive one-shot entrance animation after hydration; it
 * never hides content unless the browser opts into motion and supports it.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const style = {
    "--reveal-delay": `${delay}s`,
    "--reveal-y": `${y}px`,
  } as CSSProperties;

  return (
    <div className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}
