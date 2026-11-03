import type { Metadata } from "next";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";
import { env } from "@/global/lib/env";

export const metadata: Metadata = {
  title: "Start a build",
  description:
    "Send the hard version of the brief — the actual constraints, the deadline, the thing you suspect will be a problem.",
};

/** What a useful first message contains. Saves a round trip each way. */
const BRIEF = [
  {
    label: "The constraint",
    body: "The deadline you are worried about, the budget ceiling, the legacy system that cannot move.",
  },
  {
    label: "The outcome",
    body: "What has to be true when this is done. Not the feature list — the thing the feature list is for.",
  },
  {
    label: "The suspicion",
    body: "The part you already think is going to be a problem. You are usually right, and it is usually the thing worth talking about first.",
  },
] as const;

export default function ContactPage() {
  const email = env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="pt-[clamp(64px,8vw,112px)]">
        <Eyebrow className="mb-9">Start a build</Eyebrow>
        <h1 className="max-w-[20ch] text-[clamp(40px,7vw,88px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Send me the hard version of the brief.
        </h1>
        <p className="mt-10 max-w-[56ch] text-[19px] leading-[1.55] text-ink-2">
          Not the tidied-up one. You will get a straight answer on whether I
          am the right person, what it costs and how long it takes — including
          when the answer is that someone else is a better fit.
        </p>

        {email ? (
          <div className="mt-11 flex flex-wrap gap-3">
            <ButtonLink href={`mailto:${email}`}>Email me</ButtonLink>
            <ButtonLink href="/work" variant="ghost">
              Browse the work first
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-11 flex flex-wrap gap-3">
            <ButtonLink href="/work">Browse the work</ButtonLink>
            <ButtonLink href="/services" variant="ghost">
              See services
            </ButtonLink>
          </div>
        )}
      </Container>

      <Container className="py-[clamp(72px,9vw,128px)]">
        <h2 className="max-w-[26ch] text-[clamp(24px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.025em]">
          Three things make a first message useful.
        </h2>
        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          {BRIEF.map((item) => (
            <div key={item.label} className="border-t border-border pt-4.5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand">
                {item.label}
              </dt>
              <dd className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </main>
  );
}
