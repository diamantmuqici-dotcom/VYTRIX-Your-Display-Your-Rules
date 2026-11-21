import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DISCORD_URL, SITE_TAGLINE, asset, footerGroups } from "@/lib/site";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-secondary/40">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={asset("/branding/vytrix-icon.svg")}
                alt=""
                width={30}
                height={30}
                className="h-8 w-8"
              />
              <img
                src={asset("/branding/vytrix-wordmark.svg")}
                alt="VYTRIX"
                width={126}
                height={26}
                className="h-6 w-auto"
              />
            </div>
            <p className="mt-5 font-display text-sm font-semibold tracking-[0.16em] text-ink">
              {SITE_TAGLINE}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A display and performance suite for Windows 10 and 11. Built to
              sit beside your games, not inside them.
            </p>
            <Link
              href="/discord"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-brand-cyan transition-opacity hover:opacity-80"
            >
              Join the community <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors duration-300 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 VYTRIX. All rights reserved.</p>
          <p>
            Windows 10/11 · No game injection · Discord:{" "}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-ink"
            >
              {DISCORD_URL}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
