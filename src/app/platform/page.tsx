import type { Metadata } from "next";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The operator dashboard — agent runs, pipeline, project health and a second brain in one surface. The system I sell is the system I use.",
};

/**
 * The three surfaces the dashboard puts on one screen.
 *
 * Every number on the Dashboard board is a bracketed placeholder — spend,
 * run counts, eval rates, note totals, all of them. None is rendered here:
 * the preview below carries the structure and the labels, and the figures
 * arrive when the dashboard is wired to real data.
 */
const SURFACES = [
  {
    n: "01",
    title: "Agent runs",
    body: "Every run, what it touched and what it cost, with the ones that need a human decision pulled to the top. An audit trail you can hand to someone else.",
    rows: ["Needs you", "Runs today", "Eval pass rate", "Model spend"],
  },
  {
    n: "02",
    title: "Second brain",
    body: "Notes, decisions and sources that compound, each one citable by an agent. The point is not storage — it is that a run can show you where its answer came from.",
    rows: [
      "Contract-first CMS migration pattern",
      "Scroll scene perf budget — findings",
      "Pricing ladder — what clients said no to",
    ],
  },
  {
    n: "03",
    title: "Build health",
    body: "Pipeline stage, next milestone and Core Web Vitals per project, in one list rather than four dashboards. Green, live or blocked.",
    rows: ["Stage", "Next milestone", "CWV", "Active builds"],
  },
] as const;

export default function PlatformPage() {
  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="pt-[clamp(64px,8vw,112px)]">
        <Eyebrow className="mb-9">Platform · Internal, available as a build</Eyebrow>
        <h1 className="max-w-[18ch] text-[clamp(40px,7vw,88px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          The system I sell is the system I use.
        </h1>
        <p className="mt-10 max-w-[56ch] text-[19px] leading-[1.55] text-ink-2">
          My own studio operating system — agent runs, pipeline, project
          health and a second brain in one surface. It runs the business this
          site belongs to, which is the only reason I am willing to sell it.
        </p>
      </Container>

      {/* Interface preview. Structure and labels only — no figures, because
          every number on the board is a placeholder. Decorative as a whole:
          the surfaces below carry the meaning in text. */}
      <Container className="pt-[clamp(48px,6vw,80px)]">
        <div
          className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-band"
          aria-hidden="true"
        >
          <div className="flex min-h-[320px] flex-col sm:flex-row">
            <div className="shrink-0 border-b border-line p-6 sm:w-[200px] sm:border-r sm:border-b-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                Today
              </p>
              <ul className="mt-5 flex flex-col gap-3.5">
                {["Needs you", "Agent runs", "Pipeline", "Second brain", "Build health"].map(
                  (item, i) => (
                    <li
                      key={item}
                      className={
                        i === 0
                          ? "text-[14px] text-ink"
                          : "text-[14px] text-ink-3"
                      }
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="min-w-0 grow p-7">
              <p className="text-[22px] font-semibold tracking-[-0.02em]">
                Three things need you today.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {SURFACES.map((s) => (
                  <div
                    key={s.n}
                    className="rounded-[var(--radius-control)] border border-line p-4"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                      {s.title}
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {s.rows.slice(0, 3).map((row) => (
                        <li
                          key={row}
                          className="truncate text-[12px] text-ink-2"
                        >
                          {row}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Sanctioned glass use #3: the dashboard command bar. */}
              <div className="glass mt-7 flex items-center gap-3 rounded-[var(--radius-glass)] px-4 py-3">
                <span className="font-mono text-[12px] text-brand">⌘K</span>
                <span className="text-[13px] text-ink-3">
                  Run, search, or ask the brain
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container className="py-[clamp(72px,9vw,128px)]">
        <h2 className="max-w-[26ch] text-[clamp(24px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.025em]">
          Three surfaces, one screen.
        </h2>

        <div className="mt-12 flex flex-col gap-[clamp(40px,5vw,64px)]">
          {SURFACES.map((surface) => (
            <section
              key={surface.n}
              className="flex flex-wrap gap-x-14 gap-y-5 border-t border-line pt-8"
            >
              <p className="w-full max-w-[180px] shrink-0 font-mono text-[32px] leading-none tracking-[-0.03em] text-ink-mute">
                {surface.n}
              </p>
              <div className="min-w-0 grow-[999] basis-[520px]">
                <h3 className="text-[clamp(22px,2.6vw,30px)] font-semibold tracking-[-0.02em]">
                  {surface.title}
                </h3>
                <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.6] text-ink-2">
                  {surface.body}
                </p>
              </div>
            </section>
          ))}
        </div>
      </Container>

      <section className="border-t border-hairline bg-band">
        <Container className="py-[clamp(72px,9vw,120px)]">
          <h2 className="max-w-[22ch] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            Want this pointed at your business?
          </h2>
          <p className="mt-7 max-w-[52ch] text-[18px] leading-[1.6] text-ink-2">
            It is internal software, not a SaaS signup. I build a version
            scoped to how your team actually works, and you own it.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/contact">Start a build</ButtonLink>
            <ButtonLink href="/services" variant="ghost">
              See services
            </ButtonLink>
          </div>
        </Container>
      </section>
    </main>
  );
}
