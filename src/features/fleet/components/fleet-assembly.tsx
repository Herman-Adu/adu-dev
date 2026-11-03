"use client";

import { useScrollScene, type SceneSetup } from "@/features/scroll/lib";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { FLEET_CAPABILITIES } from "../lib/capabilities";

/**
 * Scene 04 — "Fleet assembly".
 *
 * Pinned for 280vh. The capability track travels sideways against vertical
 * scroll while agent nodes converge onto a spine.
 *
 * The spine board specified a second Blender plate here. That is superseded
 * by the "No Blender" decision in docs/STATE.md, and by the one-Canvas-per-
 * page rule — the forge already owns the page's only R3F context. The nodes
 * are inline SVG instead: a stroke drawing costs nothing, converges just as
 * legibly, and keeps the GPU budget for scene 02.
 */
const FLEET = {
  /** Scroll length of the pin. From the Scroll spine. */
  pin: "+=280%",
  stagger: 0.06,
} as const;

export function FleetAssembly() {
  const assemble: SceneSetup = ({ scope, gsap, ScrollTrigger }) => {
    const track = scope.querySelector<HTMLElement>("[data-track]");
    const viewport = scope.querySelector<HTMLElement>("[data-track-viewport]");
    const nodes = gsap.utils.toArray<SVGElement>("[data-node]", scope);
    if (!track || !viewport) return;

    // Measure the track against its VIEWPORT, not against itself: the track
    // is `w-max`, so its own scrollWidth always equals its clientWidth and
    // the distance would be a constant zero. Recomputed on refresh so a
    // resize cannot strand it mid-track.
    const distance = () =>
      Math.max(0, track.scrollWidth - viewport.clientWidth);

    gsap.set(nodes, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: FLEET.pin,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      .to(nodes, { opacity: 1, scale: 1, stagger: FLEET.stagger, ease: "none" }, 0)
      .to(track, { x: () => -distance(), ease: "none" }, 0);
  };

  const scopeRef = useScrollScene<HTMLElement>({
    full: assemble,
    // Narrow viewports and reduced motion both read the track as an ordinary
    // horizontally scrollable list. The markup is already that.
  });

  return (
    <section ref={scopeRef} aria-labelledby="fleet-heading">
      <Container className="py-[clamp(96px,12vw,140px)]">
        <Eyebrow tone="brand">04 — Agent engineering</Eyebrow>
        <h2
          id="fleet-heading"
          className="mt-7 max-w-[22ch] text-[clamp(30px,4.2vw,56px)] font-semibold leading-[1.08] tracking-[-0.03em]"
        >
          A fleet, not a chatbot.
        </h2>
        <p className="mt-8 max-w-[54ch] text-[18px] leading-[1.6] text-ink-2">
          I run my own business on agents — scoping, scaffolding, migrations,
          content, campaign copy, QA. Then I build the same thing for clients:
          scoped tools, real permissions, an audit trail, and a human holding
          the stop button.
        </p>

        {/* Nodes converging on a spine. Decorative: the capabilities below
            carry the meaning, so it is hidden from assistive tech. */}
        <svg
          viewBox="0 0 240 80"
          className="mt-12 h-20 w-full max-w-[420px]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 68 H220"
            stroke="var(--color-border)"
            strokeWidth="1.25"
          />
          {[40, 90, 150, 200].map((x, i) => (
            <g key={x} data-node>
              <circle
                cx={x}
                cy={i % 2 === 0 ? 18 : 34}
                r="5"
                stroke="var(--color-ink-3)"
                strokeWidth="1.25"
              />
              <path
                d={`M${x} ${i % 2 === 0 ? 23 : 39} V68`}
                stroke="var(--color-border)"
                strokeWidth="1.25"
              />
            </g>
          ))}
        </svg>
      </Container>

      {/* The track overflows on purpose; the scrub carries it sideways. It
          stays keyboard- and touch-scrollable when nothing is driving it. */}
      {/* Focusable and named: when nothing is driving the scrub, scrolling
          this region is the only way to reach the later cards, and Safari
          will not focus an overflow container on its own. */}
      <div
        data-track-viewport
        tabIndex={0}
        role="group"
        aria-label="Agent fleet capabilities, scrollable"
        className="overflow-x-auto overflow-y-hidden pb-4"
      >
        <ul
          data-track
          className="flex w-max gap-4 px-6 will-change-transform sm:px-10 lg:px-20"
        >
          {FLEET_CAPABILITIES.map((cap) => (
            <li
              key={cap.label}
              className="w-[min(80vw,420px)] shrink-0 border-t border-border pt-5"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                {cap.label}
              </p>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink">
                {cap.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
