"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollScene, type SceneSetup } from "@/features/scroll/lib";
import { ButtonLink } from "@/global/ui/button";
import { cn } from "@/global/lib/cn";
import { NAV_LINKS, PRIMARY_CTA } from "../lib/nav-links";

/**
 * Scroll distance, in px, before the bar takes its glass surface. Small on
 * purpose: the glass is the signal that the page has moved at all.
 */
const GLASS_AT = 8;

/** 180ms / (.4,0,.2,1) — the UI token from the Foundations board. */
const UI_TRANSITION = "duration-[180ms] ease-[var(--ease-ui)]";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  /**
   * The glass toggle is scroll-linked, so GSAP owns it — but it is a surface
   * change, not motion, so it runs under all three behaviours including
   * reduced. Created inside the scene's matchMedia context, so it dies with
   * the component and cannot leak across an app-router remount.
   */
  const glassOnScroll: SceneSetup = ({ ScrollTrigger }) => {
    ScrollTrigger.create({
      start: GLASS_AT,
      end: "max",
      onToggle: (self) => setScrolled(self.isActive),
      // A reload lands mid-page with the bar already over content.
      onRefresh: (self) => setScrolled(self.isActive),
    });
  };

  const scopeRef = useScrollScene<HTMLElement>({
    full: glassOnScroll,
    compact: glassOnScroll,
    reduced: glassOnScroll,
  });

  return (
    <header
      ref={scopeRef}
      className={cn(
        "sticky top-0 z-20 transition-[background-color,box-shadow]",
        UI_TRANSITION,
        scrolled && "glass-nav",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1280px] flex-wrap items-center",
          "gap-x-8 gap-y-1 px-6 py-2 sm:px-10 lg:px-20",
          "min-h-[76px]",
        )}
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="flex min-h-[44px] grow items-center"
        >
          {/* Intrinsic size of the source file; the height classes set the
              rendered size. Priority because it is above the fold on load. */}
          <Image
            src="/brand/adu-dev-wordmark.png"
            alt="Adu Dev"
            width={988}
            height={333}
            priority
            className="h-[22px] w-auto sm:h-[26px]"
          />
        </Link>

        {/* The bar wraps rather than collapsing into a menu. Below sm the
            links take a row of their own, under the wordmark and the CTA,
            which keeps a sticky bar two rows tall instead of three. */}
        <nav aria-label="Primary" className="max-sm:order-3 max-sm:w-full">
          <ul className="flex flex-wrap items-center gap-x-5 text-[14px] sm:gap-x-7">
            {NAV_LINKS.map((link) => {
              const current =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-[44px] items-center transition-colors",
                      UI_TRANSITION,
                      current ? "text-ink" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ButtonLink
          href={PRIMARY_CTA.href}
          variant="ghost"
          size="sm"
          className="max-sm:order-2"
        >
          {PRIMARY_CTA.label}
        </ButtonLink>
      </div>
    </header>
  );
}
