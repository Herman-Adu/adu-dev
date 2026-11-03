"use client";

import { useScrollScene, type SceneSetup } from "@/features/scroll/lib";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { BUILD_LAYERS } from "../lib/stages";

/**
 * Scene 03 — "Stack peel".
 *
 * The build separates into its layers — motion, contract, feature, infra —
 * each gaining a mono label as it lands. Pinned for 240vh and scrubbed.
 *
 * Transform-only, which is what holds 60fps on a mid-range Android: the
 * plates translate and rotate, and the only opacity on the timeline belongs
 * to the mono labels. No paragraph fades against scroll position.
 *
 * The markup is the separated end state, so reduced motion and a failed
 * hydration both render a legible, finished stack. `full` collapses it
 * first and peels it back apart.
 */
const PEEL = {
  /** Scroll length of the pin. From the Scroll spine. */
  pin: "+=240%",
  /** Spine: stagger .06. */
  stagger: 0.06,
  /** Degrees the collapsed plates are tipped back by. */
  tilt: 12,
} as const;

export function StackPeel() {
  const collapse: SceneSetup = ({ scope, gsap, ScrollTrigger }) => {
    const plates = gsap.utils.toArray<HTMLElement>("[data-plate]", scope);
    const labels = gsap.utils.toArray<HTMLElement>("[data-layer-label]", scope);
    const first = plates[0];
    if (!first) return;

    // Collapse each plate onto the first by its own measured offset, so the
    // stack closes exactly however the layout has wrapped at this width.
    const stackUp = () => {
      const base = first.offsetTop;
      gsap.set(plates, {
        y: (_i: number, el: HTMLElement) => base - el.offsetTop,
        rotateX: PEEL.tilt,
        transformOrigin: "50% 0%",
      });
      gsap.set(labels, { opacity: 0 });
    };
    stackUp();

    gsap
      .timeline({
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: PEEL.pin,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: stackUp,
        },
      })
      .to(plates, { y: 0, rotateX: 0, stagger: PEEL.stagger, ease: "none" }, 0)
      .to(labels, { opacity: 1, stagger: PEEL.stagger, ease: "none" }, 0.1);
  };

  const scopeRef = useScrollScene<HTMLElement>({
    full: collapse,
    // Narrow viewports unpin: the stack is already drawn separated, so there
    // is nothing to do but leave it. Same for reduced motion.
  });

  return (
    <section
      ref={scopeRef}
      aria-labelledby="peel-heading"
      className="border-y border-hairline bg-band"
    >
      <Container className="py-[clamp(80px,10vw,140px)]">
        <Eyebrow>03 — The build, end to end</Eyebrow>
        <h2
          id="peel-heading"
          className="mt-7 max-w-[24ch] text-[clamp(30px,4.2vw,52px)] font-semibold leading-[1.1] tracking-[-0.03em]"
        >
          One pass. Design through deploy.
        </h2>

        {/* Rows, not columns: the spine draws this scene as four stacked
            bars, each indented a little further. Columns would share an
            offsetTop and there would be nothing to collapse. */}
        <ol
          className="mt-[clamp(48px,7vw,72px)] flex flex-col gap-3"
          style={{ perspective: "1200px" }}
        >
          {BUILD_LAYERS.map((layer, i) => (
            <li
              key={layer.n}
              data-plate
              style={{ marginLeft: `calc(${i} * clamp(0px, 1.4vw, 22px))` }}
              className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-border bg-ground/40 px-5 py-5 will-change-transform"
            >
              {/* The board draws these numerals at a grey measuring 2.16:1
                  on ground, which misses the large-text floor. ink-mute is
                  the nearest token that passes. */}
              <p className="font-mono text-[28px] leading-none tracking-[-0.02em] text-ink-mute">
                {layer.n}
              </p>
              <span
                data-layer-label
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand"
              >
                {layer.layer}
              </span>
              <h3 className="basis-[16ch] text-[19px] font-semibold tracking-[-0.01em]">
                {layer.title}
              </h3>
              <p className="min-w-0 grow basis-[34ch] text-[14px] leading-[1.6] text-ink-2">
                {layer.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
