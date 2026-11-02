import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { ButtonLink } from "@/global/ui/button";
import { caseStudies } from "@/features/work/lib";

export default async function HomePage() {
  // Server component reading through the contract. Swapping to Strapi is a
  // CONTENT_SOURCE change, not an edit to this file.
  const featured = await caseStudies.list({ featuredOnly: true, limit: 3 });

  return (
    <main>
      <Container className="pt-28 pb-24">
        <Eyebrow>Independent engineering studio · Remote, UK</Eyebrow>

        <h1 className="mt-10 max-w-[16ch] text-[clamp(44px,8vw,112px)] font-extrabold leading-[0.94] tracking-[-0.04em]">
          Thirty years of shipping.
        </h1>
        <p className="mt-1 max-w-[20ch] text-[clamp(44px,8vw,112px)] font-extrabold leading-[0.94] tracking-[-0.04em] text-[#5e5e66]">
          Now with agents.
        </p>

        <p className="mt-14 max-w-[54ch] text-[19px] leading-[1.55] text-ink-2">
          I build the whole thing — cinematic front ends, typed contracts,
          headless back ends, the infrastructure under them.
        </p>

        <div className="mt-11 flex flex-wrap gap-3">
          <ButtonLink href="/work">See the work</ButtonLink>
          <ButtonLink href="/services" variant="ghost">
            What I do
          </ButtonLink>
        </div>
      </Container>

      <Container className="pb-32">
        <Eyebrow>Built and shipped</Eyebrow>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((study) => (
            <li key={study.slug} className="border-t border-line pt-5">
              <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
                {study.title}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-ink-2">
                {study.summary}
              </p>
              {study.liveUrl ? (
                <a
                  href={study.liveUrl}
                  className="mt-4 inline-block font-mono text-[12px] text-brand underline-offset-4 hover:underline"
                >
                  {new URL(study.liveUrl).host}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
