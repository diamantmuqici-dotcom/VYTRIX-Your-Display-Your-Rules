"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { mainNav, utilityNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Container } from "./container";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const panelMotion = reduceMotion
    ? {}
    : {
        initial: { height: 0, opacity: 0 },
        exit: { height: 0, opacity: 0 },
      };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-bg/80 backdrop-blur-xl">
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="VYTRIX home"
        >
          <img
            src="/branding/vytrix-icon.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <img
            src="/branding/vytrix-wordmark.svg"
            alt="VYTRIX"
            width={118}
            height={24}
            className="h-6 w-auto"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors duration-300 ease-bench",
                isActive(item.href)
                  ? "text-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button href="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button href="/pricing" size="sm">
            Get VYTRIX
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated/70 hover:text-ink"
          >
            {menuOpen ? (
              <X size={20} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            {...panelMotion}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[color:var(--line)] lg:hidden"
          >
            <Container className="flex flex-col gap-1 py-5">
              {[...mainNav, ...utilityNav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm",
                    isActive(item.href)
                      ? "bg-elevated/70 text-ink"
                      : "text-muted hover:bg-elevated/50 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button href="/login" variant="secondary">
                  Log in
                </Button>
                <Button href="/pricing">Get VYTRIX</Button>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
