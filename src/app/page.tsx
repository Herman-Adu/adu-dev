import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { caseStudies } from "@/features/work/lib";
import { HeroForge, TitleHold } from "@/features/hero/lib";
import { StackPeel } from "@/features/process/lib";

export default async function HomePage() {
  // Server component reading through the contract. Swapping to Strapi is a
  // CONTENT_SOURCE change, not an edit to this file.
  const featured = await caseStudies.list({ featuredOnly: true, limit: 3 });

  return (
    // scroll-mt clears the sticky header: without it the skip link parks
    // the first 76px of content (108px once the bar wraps) behind the bar.
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      {/* 01 — title hold */}
      <TitleHold />

      <HeroForge />

      {/* 03 — stack peel */}
      <StackPeel />

      <Container className="py-32">
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
