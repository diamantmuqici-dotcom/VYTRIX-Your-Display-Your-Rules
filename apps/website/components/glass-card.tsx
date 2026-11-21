import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  glow = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn("glass rounded-xl", glow && "glow-ring", className)}
    >
      {children}
    </div>
  );
}
