import { cn } from "@/lib/utils";

export function AnimatedGradient({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="aurora animate-drift absolute -top-56 left-1/2 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full" />
      <div className="aurora-secondary animate-float absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full" />
      <div className="absolute left-[-10%] top-0 h-[26rem] w-[26rem] rounded-full bg-brand-blue/10 blur-[120px]" />
    </div>
  );
}
