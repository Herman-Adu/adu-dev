import { caseStudies } from "@/features/work/lib";
import { ProofWall } from "@/features/work/lib";
import { HeroForge, TitleHold } from "@/features/hero/lib";
import { StackPeel } from "@/features/process/lib";
import { FleetAssembly } from "@/features/fleet/lib";
import { Release } from "@/features/contact/lib";

export default async function HomePage() {
  // Server component reading through the contract. Swapping to Strapi is a
  // CONTENT_SOURCE change, not an edit to this file.
  const featured = await caseStudies.list({ featuredOnly: true, limit: 3 });

  return (
    // scroll-mt clears the sticky header: without it the skip link parks
    // the first 76px of content (108px once the bar wraps) behind the bar.
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      {/* The scroll spine, in order. 01 and 06 are deliberately still. */}
      <TitleHold />
      <HeroForge />
      <StackPeel />
      <FleetAssembly />
      <ProofWall studies={featured} />
      <Release />
    </main>
  );
}
