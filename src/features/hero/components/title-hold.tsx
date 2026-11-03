import { ButtonLink } from "@/global/ui/button";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";

/**
 * Scene 01 — "Title hold".
 *
 * Not pinned, not scrubbed. Two display lines rise out of a clip-path mask,
 * one stagger apart, once. Nothing else on the first viewport moves: the
 * eyebrow, the standfirst and the two buttons are painted in their end state
 * and stay there. Body text never scrubs, and it never fades in either.
 *
 * A server component on purpose. The reveal is CSS (see `globals.css`), so
 * the first viewport ships no JavaScript at all and the from-state is in the
 * server-rendered HTML — a JS-only from-state would paint the finished title
 * and then snap it away on hydration. The knobs live beside the keyframes.
 */

/**
 * Inter's descenders fall ~0.10em below the content box at leading 0.94, so
 * the mask gets that much extra bottom padding or it crops the 'y' and 'g'.
 * Every use is cancelled again so the padding never moves layout.
 */
const DESCENDER_PAD = "pb-[0.12em]";

export function TitleHold() {
  return (
    <section aria-labelledby="hero-heading">
      <Container className="pt-[clamp(72px,10vw,144px)] pb-16">
        <Eyebrow tone="secondary" className="mb-10">
          Independent engineering studio · Remote, UK
        </Eyebrow>

        {/* One heading, two lines. Split visually, read as one sentence. */}
        <h1
          id="hero-heading"
          className="-mb-[0.12em] text-[clamp(44px,8vw,112px)] font-extrabold leading-[0.94] tracking-[-0.04em]"
        >
          <span
            data-line="1"
            className={`title-hold-mask block max-w-[16ch] ${DESCENDER_PAD}`}
          >
            <span className="title-hold-text block">
              Thirty years of shipping.
            </span>
          </span>
          <span
            data-line="2"
            className={`title-hold-mask mt-[calc(4px_-_0.12em)] block max-w-[20ch] text-ink-mute ${DESCENDER_PAD}`}
          >
            <span className="title-hold-text block">Now with agents.</span>
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
