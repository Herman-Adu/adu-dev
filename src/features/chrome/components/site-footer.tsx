import { Container } from "@/global/ui/container";
import Image from "next/image";
import Link from "next/link";

/**
 * Site chrome, every page. The board also carries a company number and a
 * year; both are placeholders on the canvas and neither is known, so they
 * are omitted rather than rendered as brackets.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <Container className="flex flex-wrap items-baseline gap-x-8 gap-y-6 py-12">
        <p className="grow-[999] basis-[240px]">
          <Image
            src="/brand/adu-dev-wordmark.png"
            alt="Adu Dev"
            width={988}
            height={333}
            className="h-[22px] w-auto"
          />
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          <li>
            <Link href="/work" className="text-ink-2 hover:text-ink">
              Work
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-ink-2 hover:text-ink">
              Services
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-ink-2 hover:text-ink">
              Contact
            </Link>
          </li>
        </ul>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
          Herman Adu
        </p>
      </Container>
    </footer>
  );
}
