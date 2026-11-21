"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { FaqItem } from "@/lib/content";
import { cn } from "@/lib/utils";

export function FAQAccordion({
  items,
  defaultOpen = 0,
  idPrefix = "faq",
  className,
}: {
  items: FaqItem[];
  defaultOpen?: number | null;
  idPrefix?: string;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("border-t border-[color:var(--line)]", className)}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${idPrefix}-panel-${index}`;

        return (
          <div key={item.question} className="border-b border-[color:var(--line)]">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span
                className={cn(
                  "font-display text-base font-semibold transition-colors duration-300 sm:text-lg",
                  open ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.question}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] text-muted transition-all duration-300 ease-bench",
                  open && "rotate-45 border-brand-cyan/40 text-brand-cyan",
                )}
              >
                <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pr-10 text-sm leading-relaxed text-muted sm:text-base">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
