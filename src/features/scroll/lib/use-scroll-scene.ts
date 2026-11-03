"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Three behaviours, one teardown.
 *
 * Every scroll scene registers inside a single gsap.matchMedia() scoped to
 * its own root element, and dies with it. App-router remounts leak
 * ScrollTriggers otherwise, and the second visit to a page janks.
 *
 *   full    — the pinned, scrubbed scene (desktop, motion allowed)
 *   compact — unpinned fallback (narrow viewports, motion allowed)
 *   reduced — static end state, zero scrub (prefers-reduced-motion)
 *
 * `reduced` is not optional in spirit: if you do not supply it, the scene
 * simply renders its markup untouched, which must already be the correct
 * end state. Never animate a scene *into* legibility.
 */
export type SceneSetup = (ctx: {
  scope: HTMLElement;
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
}) => void;

export interface ScrollSceneHandlers {
  full?: SceneSetup;
  compact?: SceneSetup;
  reduced?: SceneSetup;
}

export const BREAKPOINTS = {
  /**
   * Height matters as much as width. A pinned scene taller than the viewport
   * pushes its own lower content out of reach for the length of the pin, and
   * a 1280x540 window is wide enough to pass a width-only check. A viewport
   * matching neither `full` nor `compact` runs no handler at all, which
   * leaves the markup untouched — and every scene's markup is already its
   * static end state, so that is the correct fallback rather than a gap.
   */
  full:
    "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
  compact: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

export function useScrollScene<T extends HTMLElement = HTMLDivElement>(
  handlers: ScrollSceneHandlers,
  deps: unknown[] = [],
) {
  const scopeRef = useRef<T>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const mm = gsap.matchMedia();

      mm.add(BREAKPOINTS.full, () => {
        handlers.full?.({ scope, gsap, ScrollTrigger });
      });

      mm.add(BREAKPOINTS.compact, () => {
        handlers.compact?.({ scope, gsap, ScrollTrigger });
      });

      mm.add(BREAKPOINTS.reduced, () => {
        handlers.reduced?.({ scope, gsap, ScrollTrigger });
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: deps },
  );

  return scopeRef;
}
