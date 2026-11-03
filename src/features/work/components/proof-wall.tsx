"use client";

import { useScrollScene, type SceneSetup } from "@/features/scroll/lib";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import type { CaseStudySummary } from "../lib/contract";

/**
 * Scene 05 — "Proof wall".
 *
 * The pin releases here. After three pinned scenes the page breathes out:
 * case-study cards arrive on differing parallax rates, nothing is pinned
 * and nothing is scrubbed to a timeline.
 *
 * The frames move; the text does not fade. Parallax is transform-only, so a
 * card travelling has no effect on the legibility of what is written on it.
 */
const WALL = {
  /** Spine: yPercent -8 → 8. Alternate sign so cards drift apart. */
  travel: 8,
} as const;

export function ProofWall({ studies }: { studies: readonly CaseStudySummary[] }) {
  const drift: SceneSetup = ({ scope, gsap, ScrollTrigger }) => {
    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", scope);

    cards.forEach((card, i) => {
      // Every other card runs the opposite way, which is what reads as
      // differing rates rather than one block sliding.
      const from = i % 2 === 0 ? -WALL.travel : WALL.travel;
      gsap.fromTo(
        card,
        { yPercent: from },
        {
          yPercent: -from,
          ease: "none",
          scrollTrigger: {
            trigger: scope,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    });
  };

  const scopeRef = useScrollScene<HTMLElement>({
    full: drift,
    // compact and reduced leave the grid exactly as drawn. Parallax is
    // decoration; the wall reads the same without it.
  });

  return (
    <section ref={scopeRef} aria-labelledby="proof-heading">
      <Container className="py-[clamp(96px,12vw,180px)]">
        <Eyebrow>05 — Built and shipped</Eyebrow>
        <h2
          id="proof-heading"
          className="mt-7 max-w-[20ch] text-[clamp(30px,4.2vw,52px)] font-semibold leading-[1.1] tracking-[-0.03em]"
        >
          Work you can open in a browser.
        </h2>

        <ul className="mt-[clamp(48px,7vw,80px)] grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <li key={study.slug} data-card className="will-change-transform">
              <article className="border-t border-border pt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[22px] font-semibold tracking-[-0.01em]">
                    {study.title}
                  </h3>
                  <p className="font-mono text-[12px] text-ink-3">
                    {study.year}
                  </p>
                </div>

                <p className="mt-3 text-[14px] leading-[1.55] text-ink-2">
                  {study.summary}
                </p>

                <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
                  {study.scope.map((item) => (
                    <li
                      key={item}
                      className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                {study.liveUrl ? (
                  <a
                    href={study.liveUrl}
                    className="mt-5 inline-block font-mono text-[12px] text-brand underline-offset-4 hover:underline"
                  >
                    {new URL(study.liveUrl).host}
                  </a>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
