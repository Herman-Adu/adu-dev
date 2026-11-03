import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";
import { caseStudies } from "@/features/work/lib";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await caseStudies.slugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const study = await caseStudies.bySlug(slug);
  if (!study) return {};
  return { title: study.title, description: study.summary };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const study = await caseStudies.bySlug(slug);
  if (!study) notFound();

  const all = await caseStudies.list({});
  const index = all.findIndex((s) => s.slug === study.slug);
  const next = all[(index + 1) % all.length];

  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="pt-[clamp(48px,6vw,88px)]">
        <Link
          href="/work"
          className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 hover:text-ink"
        >
          ← All work
        </Link>

        <Eyebrow className="mt-6">{study.disciplines.join(" · ")}</Eyebrow>
        <h1 className="mt-6 max-w-[18ch] text-[clamp(40px,7vw,88px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          {study.title}
        </h1>
        <p className="mt-9 max-w-[56ch] text-[19px] leading-[1.55] text-ink-2">
          {study.summary}
        </p>

        {/* The board also shows Duration. The contract has no such field and
            no real figure exists, so it is left out rather than invented. */}
        <dl className="mt-12 grid gap-x-8 gap-y-7 border-t border-line pt-7 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              Role
            </dt>
            <dd className="mt-2 text-[15px] leading-[1.5]">
              {study.scope.join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              Stack
            </dt>
            <dd className="mt-2 text-[15px] leading-[1.5]">
              {study.stack.join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              {study.liveUrl ? "Live at" : "Year"}
            </dt>
            <dd className="mt-2 text-[15px] leading-[1.5]">
              {study.liveUrl ? (
                <a
                  href={study.liveUrl}
                  className="font-mono text-[13px] text-brand underline-offset-4 hover:underline"
                >
                  {new URL(study.liveUrl).host}
                </a>
              ) : (
                <span className="font-mono text-[13px]">{study.year}</span>
              )}
            </dd>
          </div>
        </dl>
      </Container>

      <Container className="pt-[clamp(64px,8vw,112px)]">
        <section className="border-t border-line pt-9">
          <Eyebrow>01 — Constraint</Eyebrow>
          <h2 className="mt-5 max-w-[30ch] text-[clamp(24px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.025em]">
            {study.constraint}
          </h2>
        </section>

        <section className="mt-[clamp(56px,7vw,96px)] border-t border-line pt-9">
          <Eyebrow>02 — Decision</Eyebrow>
          <p className="mt-5 max-w-[62ch] text-[18px] leading-[1.6] text-ink-2">
            {study.decision.body}
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {study.decision.rejectedOption ? (
              <div className="border-t border-border pt-4.5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand">
                  The option I rejected
                </h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">
                  {study.decision.rejectedOption}
                </p>
              </div>
            ) : null}
            {study.decision.cost ? (
              <div className="border-t border-border pt-4.5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand">
                  What it cost
                </h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">
                  {study.decision.cost}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-[clamp(56px,7vw,96px)] border-t border-line pt-9">
          <Eyebrow>03 — Result</Eyebrow>
          <h2 className="mt-5 text-[clamp(24px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.025em]">
            Measured, or stated as unmeasured.
          </h2>

          {study.result.metrics.length > 0 ? (
            <dl className="mt-10 grid gap-8 sm:grid-cols-3">
              {study.result.metrics.map((metric) => (
                <div key={metric.label} className="border-t border-border pt-4.5">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    {metric.label}
                  </dt>
                  <dd className="mt-3 font-mono text-[32px] leading-none tracking-[-0.02em] text-brand">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {study.result.note ? (
            <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.6] text-ink-2">
              {study.result.note}
            </p>
          ) : null}
        </section>

        {study.whatIWouldChange ? (
          <section className="mt-[clamp(56px,7vw,96px)] border-t border-line pt-9">
            <Eyebrow>04 — What I would change</Eyebrow>
            <p className="mt-5 max-w-[62ch] text-[18px] leading-[1.6] text-ink-2">
              {study.whatIWouldChange}
            </p>
          </section>
        ) : null}
      </Container>

      {next && next.slug !== study.slug ? (
        <section className="mt-[clamp(72px,9vw,120px)] border-t border-hairline bg-band">
          <Container className="py-[clamp(56px,7vw,88px)]">
            <Eyebrow>Next case study</Eyebrow>
            <Link href={`/work/${next.slug}`} className="group mt-5 inline-block">
              <h2 className="max-w-[20ch] text-[clamp(28px,4vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em] group-hover:text-brand">
                {next.title}
              </h2>
            </Link>
          </Container>
        </section>
      ) : null}

      <Container className="py-[clamp(80px,10vw,128px)]">
        <h2 className="max-w-[20ch] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          Want one of these for your product?
        </h2>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/contact">Start a build</ButtonLink>
          <ButtonLink href="/work" variant="ghost">
            All work
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
