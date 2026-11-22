import {
  Activity, Cpu, ExternalLink, Layers, MonitorCheck, Network, RotateCcw,
  ShieldCheck, Sparkles, Zap,
} from "lucide-react";
import { Button } from "@/components/button";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";

const ATTRIBUTION =
  "Not mine. Ported from Platinum+ Optimizer v9.5 by @STEFANO83223 and @Aledect (SourceForge). Upstream updates are not ours.";

const stack = [
  {
    icon: MonitorCheck,
    tag: "01 · DETECT",
    title: "Reads the machine",
    detail: "ProductName, DisplayVersion, CurrentBuild and UBR from the Windows registry. Build 22000 and up is treated as Windows 11; anything older gets the Windows 10-safe subset.",
    accent: "cyan" as const,
  },
  {
    icon: Layers,
    tag: "02 · FILTER",
    title: "Picks the profile",
    detail: "Over a hundred fixed registry writes, netsh TCP tuning, bcdedit boot flags and a dedicated powercfg scheme. Windows-only entries are skipped before a single value is touched.",
    accent: "blue" as const,
  },
  {
    icon: RotateCcw,
    tag: "03 · REVERSE",
    title: "Saves the before",
    detail: "Every change records its previous value in the local vault. Run the whole profile or undo it group by group, including the original power plan.",
    accent: "purple" as const,
  },
];

const groups = [
  { label: "Network", icon: Network },
  { label: "Memory", icon: Cpu },
  { label: "Graphics", icon: Activity },
  { label: "Power", icon: Zap },
  { label: "Services", icon: ShieldCheck },
  { label: "Privacy", icon: Sparkles },
];

export function OptimizerShowcase() {
  return (
    <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-cyan">
          Feature · Optimizer
        </p>
        <h2 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-ink sm:text-4xl">
          A full Windows tune-up,{" "}
          <span className="text-gradient">with the receipt attached.</span>
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Touch the Optimizer card in the app and a panel opens with the whole
          Platinum+ v9.5 profile: attribution first, your detected Windows build,
          the groups it will touch, and one button to run or restore everything.
        </p>

        <div className="opt-attrib mt-6 max-w-xl rounded-lg border border-brand-purple/25 bg-brand-purple/[0.06] px-4 py-3 text-xs leading-relaxed text-muted">
          <span className="font-medium text-ink">Attribution.</span> {ATTRIBUTION}{" "}
          <a
            href="https://sourceforge.net/projects/platinum-optimizer/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-cyan hover:opacity-75"
          >
            Source <ExternalLink size={11} aria-hidden="true" />
          </a>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            "Windows 10 and Windows 11 detection from the registry, not a guess.",
            "One full-profile run, plus per-group and per-setting apply or undo.",
            "Defender, firewall and Update availability are never targets.",
          ].map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-cyan" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/features#optimizer">
            See the optimizer <Layers size={16} aria-hidden="true" />
          </Button>
          <Button href="/download" variant="secondary">
            Download VYTRIX
          </Button>
        </div>
      </div>

      <div className="opt-stack" aria-label="Optimizer pipeline preview">
        {stack.map((item, index) => {
          const Icon = item.icon;
          return (
            <Reveal key={item.tag} delay={index * 0.08}>
              <TiltCard max={10} className={`opt-layer opt-layer-${item.accent}`}>
                <div className="glass flex gap-4 rounded-xl p-5 sm:p-6">
                  <div className="opt-layer-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-cyan">
                      {item.tag}
                    </p>
                    <h3 className="mt-1.5 font-display text-base font-semibold text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          );
        })}

        <div className="opt-chip-row">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <span
                key={group.label}
                className="opt-chip inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-elevated/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted"
              >
                <Icon size={11} className="text-brand-cyan" aria-hidden="true" />
                {group.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
