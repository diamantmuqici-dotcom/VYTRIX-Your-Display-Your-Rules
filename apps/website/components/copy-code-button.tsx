"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCodeButton({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy preset code ${code}`}
        className="inline-flex items-center gap-1.5 rounded-sm border border-[color:var(--line)] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
      >
        {state === "copied" ? (
          <Check size={13} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Copy size={13} strokeWidth={1.8} aria-hidden="true" />
        )}
        {state === "copied" ? "Copied" : "Copy code"}
      </button>
      {state === "failed" ? (
        <span className="font-mono text-[9px] text-subtle">
          Select the code manually
        </span>
      ) : null}
    </div>
  );
}
