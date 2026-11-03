import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";
import { caseStudies } from "@/features/work/lib";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Shipped, live, and still standing. Every build here is a URL you can open right now.",
};

/** The four questions every case study on this site answers. */
const PROOF_STANDARD = [
  {
    label: "Constraint",
    body: "What made this hard. Budget, deadline, legacy data, a stakeholder who changed their mind.",
  },
  {
    label: "Decision",
    body: "The call I made and the option I rejected. A case study without a rejected option is a brochure.",
  },
  {
    label: "Result",
    body: "A measured number where one exists, and an honest “not measured” where it does not.",
  },
  {
    label: "What I would change",
    body: "Every build has one. Saying it out loud is the strongest signal of seniority on the whole site.",
  },
] as const;

export default async function WorkPage() {
  const studies = await caseStudies.list({});

  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="pt-[clamp(64px,8vw,112px)]">
        <Eyebrow className="mb-9">
          Work · {studies.length} selected {studies.length === 1 ? "build" : "builds"}
        </Eyebrow>
        <h1 className="max-w-[18ch] text-[clamp(40px,7vw,92px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Shipped, live, and still standing.
        </h1>
        <p className="mt-10 max-w-[56ch] text-[19px] leading-[1.55] text-ink-2">
          Every one of these is a URL you can open right now. No concepts, no
          &ldquo;unreleased client work&rdquo;, no renders of things that were
          never built.
        </p>
      </Container>

      {/* The board draws a discipline filter row. Held back until there are
          enough case studies for filtering to do anything. */}
      <Container className="pt-12">
        <ol>
          {studies.map((study, i) => (
            <li key={study.slug} className="border-t border-line last:border-b">
              <Link
                href={`/work/${study.slug}`}
                className="group flex flex-wrap items-start gap-x-8 gap-y-5 py-9"
              >
                <p className="shrink-0 basis-12 pt-2.5 font-mono text-[12px] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </p>

                <div className="min-w-0 grow basis-[360px]">
                  <h2 className="text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.05] tracking-[-0.03em] group-hover:text-brand">
                    {study.title}
                  </h2>
                  <p className="mt-3.5 max-w-[44ch] text-[16px] leading-[1.6] text-ink-2">
                    {study.summary}
                  </p>
                  {study.liveUrl ? (
                    <p className="mt-5 font-mono text-[12px] text-brand">
                      {new URL(study.liveUrl).host}
                    </p>
                  ) : null}
                </div>

                <dl className="shrink-0 basis-[200px]">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    Scope
                  </dt>
                  <dd className="mt-2 text-[14px] leading-[1.5] text-ink">
                    {study.scope.join(" · ")}
                  </dd>
                  <dt className="mt-[18px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    Year
                  </dt>
                  <dd className="mt-1.5 font-mono text-[13px] text-ink">
                    {study.year}
                  </dd>
                </dl>
              </Link>
            </li>
          ))}
        </ol>
      </Container>

      <section className="mt-[clamp(72px,9vw,112px)] border-t border-hairline bg-band">
        <Container className="py-[clamp(64px,8vw,104px)]">
          <div className="flex flex-wrap gap-x-16 gap-y-8">
            <Eyebrow className="basis-[180px] grow">What counts as proof</Eyebrow>
            <div className="min-w-0 grow-[999] basis-[560px]">
              <h2 className="max-w-[28ch] text-[clamp(24px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.025em]">
                Every case study answers the same four questions.
              </h2>
              <dl className="mt-10 grid gap-8 sm:grid-cols-2">
                {PROOF_STANDARD.map((q) => (
                  <div key={q.label} className="border-t border-border pt-4.5">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand">
                      {q.label}
                    </dt>
                    <dd className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">
                      {q.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-[clamp(80px,10vw,128px)]">
        <h2 className="max-w-[18ch] text-[clamp(32px,5.5vw,72px)] font-extrabold leading-[1] tracking-[-0.04em]">
          Your build could be next.
        </h2>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/contact">Start a build</ButtonLink>
          <ButtonLink href="/services" variant="ghost">
            See services
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
