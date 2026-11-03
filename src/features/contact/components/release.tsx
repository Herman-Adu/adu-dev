import { ButtonLink } from "@/global/ui/button";
import { Container } from "@/global/ui/container";

/**
 * Scene 06 — "Release".
 *
 * Zero ScrollTriggers, by design. After three pinned scenes the contrast of
 * complete stillness is what makes the close land, so there is nothing here
 * to animate and nothing to tear down. A server component.
 */
export function Release() {
  return (
    <section id="contact" aria-labelledby="release-heading">
      <Container className="py-[clamp(96px,12vw,176px)]">
        <h2
          id="release-heading"
          className="max-w-[18ch] text-[clamp(36px,6.5vw,88px)] font-extrabold leading-[1] tracking-[-0.04em]"
        >
          If you can scope it, we can ship it.
        </h2>

        <p className="mt-8 max-w-[52ch] text-[19px] leading-[1.55] text-ink-2">
          Tell me what it has to do. You will get a straight answer on whether
          I am the right person, what it costs and how long it takes.
        </p>

        <div className="mt-11 flex flex-wrap gap-3">
          {/* [CONTACT EMAIL] is still a placeholder on the canvas. Until a
              real address exists the CTA points at the contact route rather
              than shipping a broken mailto. */}
          <ButtonLink href="/contact">Start a build</ButtonLink>
          <ButtonLink href="/work" variant="ghost">
            Browse the work first
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
