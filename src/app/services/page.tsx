import type { Metadata } from "next";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";
import { SERVICES, ENGAGEMENTS } from "@/features/services/lib";
import { cn } from "@/global/lib/cn";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Cinematic front ends, full-stack product, agent systems and growth engineering — four things, done to a standard.",
};

export default function ServicesPage() {
  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="pt-[clamp(64px,8vw,112px)]">
        <Eyebrow className="mb-9">Services</Eyebrow>
        <h1 className="max-w-[20ch] text-[clamp(40px,7vw,92px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Four things, done to a standard.
        </h1>
        <p className="mt-10 max-w-[58ch] text-[19px] leading-[1.55] text-ink-2">
          I would rather be excellent at four things than adequate at twelve.
          If what you need is outside this list I will say so and point you
          somewhere better — that costs me a project and saves us both six
          weeks.
        </p>
      </Container>

      {SERVICES.map((service) => (
        <Container
          key={service.n}
          className="pt-[clamp(56px,7vw,96px)] first-of-type:pt-[clamp(72px,9vw,128px)]"
        >
          <div
            className={cn(
              "flex flex-wrap gap-x-14 gap-y-8 border-t pt-10",
              service.accent ? "border-brand" : "border-line",
            )}
          >
            <div className="w-full max-w-[180px] shrink-0">
              <p
                className={cn(
                  "font-mono text-[40px] leading-none tracking-[-0.03em]",
                  service.accent ? "text-brand" : "text-ink-mute",
                )}
              >
                {service.n}
              </p>
            </div>

            <div className="min-w-0 grow-[999] basis-[520px]">
              <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
                {service.title}
              </h2>
              <p className="mt-5 max-w-[54ch] text-[18px] leading-[1.6] text-ink-2">
                {service.body}
              </p>

              <div className="mt-10 grid gap-7 sm:grid-cols-3">
                {service.panels.map((panel) => (
                  <div key={panel.heading}>
                    <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink">
                      {panel.heading}
                    </h3>
                    {panel.items ? (
                      <ul className="mt-3 flex flex-col gap-2">
                        {panel.items.map((item) => (
                          <li
                            key={item}
                            className="text-[14px] leading-[1.5] text-ink-2"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-[14px] leading-[1.55] text-ink-2">
                        {panel.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      ))}

      <section className="mt-[clamp(72px,9vw,128px)] border-t border-hairline bg-band">
        <Container className="py-[clamp(72px,9vw,120px)]">
          <Eyebrow>How we work together</Eyebrow>
          <h2 className="mt-6 max-w-[24ch] text-[clamp(28px,4vw,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Three shapes. Pick the one that fits.
          </h2>

          <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-hairline sm:grid-cols-3">
            {ENGAGEMENTS.map((shape) => (
              <li
                key={shape.title}
                className={cn(
                  "flex flex-col gap-3.5 bg-ground p-9",
                  shape.accent && "border-l border-brand",
                )}
              >
                <p
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-[0.1em]",
                    shape.accent ? "text-brand" : "text-ink-3",
                  )}
                >
                  {shape.kind}
                </p>
                <h3 className="text-[24px] font-semibold tracking-[-0.02em]">
                  {shape.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-ink-2">
                  {shape.body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-[clamp(80px,10vw,144px)]">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-8">
          <div className="min-w-0 grow-[999] basis-[480px]">
            <h2 className="max-w-[20ch] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
              Send me the hard version of the brief.
            </h2>
            <p className="mt-7 max-w-[52ch] text-[18px] leading-[1.6] text-ink-2">
              Not the tidied-up one. The actual constraints, the deadline you
              are worried about, the thing you suspect is going to be a
              problem.
            </p>
          </div>
          <ButtonLink href="/contact">Start a build</ButtonLink>
        </div>
      </Container>
    </main>
  );
}
