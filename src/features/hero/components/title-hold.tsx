"use client";

import { useScrollScene, type SceneSetup } from "@/features/scroll/lib";
import { ButtonLink } from "@/global/ui/button";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";

/**
 * Scene 01 — "Title hold".
 *
 * Not pinned, not scrubbed. Two display lines rise out of a clip-path mask,
 * 80ms apart, once. Nothing else on the first viewport moves: the eyebrow,
 * the standfirst and the two buttons are painted in their end state and stay
 * there. Body text never scrubs, and it never fades in either.
 *
 * Tuning knobs:
 *   duration / ease — the entrance token from the Foundations board
 *   stagger / rise  — scene 01's own numbers from the Scroll spine board
 */
export const TITLE_HOLD = {
  /** 420ms. */
  duration: 0.42,
  /** GSAP's expo.out is cubic-bezier(.16, 1, .3, 1), the entrance curve. */
  ease: "expo.out",
  /** Scroll spine: the two lines are 80ms apart. */
  stagger: 0.08,
  /** Scroll spine: y 24 -> 0. */
  rise: 24,
} as const;

/**
 * Inter's descenders fall ~0.10em below the content box at leading 0.94, so
 * the mask gets that much extra bottom padding or the mask crops the 'y' and
 * 'g'. Every use of it is cancelled again so the padding never moves layout.
 */
const DESCENDER_PAD = "pb-[0.12em]";

export function TitleHold() {
  const reveal: SceneSetup = ({ scope, gsap }) => {
    const masks = scope.querySelectorAll<HTMLElement>("[data-line-mask]");
    const lines = scope.querySelectorAll<HTMLElement>("[data-line-text]");
    if (masks.length === 0) return;

    // The markup is already the end state, so the from-state is set here and
    // only here: no JS, no GSAP or reduced motion all paint a finished title.
    // useGSAP runs in a layout effect, so this lands before first paint.
    gsap.set(masks, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(lines, { y: TITLE_HOLD.rise });

    gsap
      .timeline({
        defaults: { duration: TITLE_HOLD.duration, ease: TITLE_HOLD.ease },
      })
      .to(masks, { clipPath: "inset(0% 0% 0% 0%)", stagger: TITLE_HOLD.stagger }, 0)
      .to(lines, { y: 0, stagger: TITLE_HOLD.stagger }, 0);
  };

  const scopeRef = useScrollScene<HTMLElement>({
    full: reveal,
    compact: reveal,
    // reduced: nothing. The title is already where it belongs.
  });

  return (
    <section ref={scopeRef} aria-labelledby="hero-heading">
      <Container className="pt-[clamp(72px,10vw,144px)] pb-16">
        <Eyebrow tone="secondary" className="mb-10">
          Independent engineering studio · Est. [YEAR] · Remote, UK
        </Eyebrow>

        {/* One heading, two lines. Split visually, read as one sentence. */}
        <h1
          id="hero-heading"
          className="-mb-[0.12em] text-[clamp(44px,8vw,112px)] font-extrabold leading-[0.94] tracking-[-0.04em]"
        >
          <span data-line-mask className={`block max-w-[16ch] ${DESCENDER_PAD}`}>
            <span data-line-text className="block">
              Thirty years of shipping.
            </span>
          </span>
          <span
            data-line-mask
            className={`mt-[calc(4px_-_0.12em)] block max-w-[20ch] text-ink-mute ${DESCENDER_PAD}`}
          >
            <span data-line-text className="block">
              Now with agents.
            </span>
          </span>
        </h1>

        <div className="mt-16 flex flex-wrap items-end gap-x-12 gap-y-8">
          <p className="min-w-0 max-w-[54ch] grow-[999] basis-[420px] text-[19px] leading-[1.55] text-ink-2">
            I build the whole thing — cinematic front ends, typed contracts,
            headless back ends, the infrastructure under them. Thirty years of
            frontend and full-stack work, now accelerated by an agent fleet I
            designed and run myself.
          </p>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/work">See the work</ButtonLink>
            <ButtonLink href="/services" variant="ghost">
              What I do
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
