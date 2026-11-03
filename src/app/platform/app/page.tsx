import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/global/ui/container";
import { Eyebrow } from "@/global/ui/eyebrow";
import { dashboard, DashboardShell } from "@/features/dashboard/lib";

export const metadata: Metadata = {
  title: "Operator dashboard",
  description: "The operator dashboard shell, running against its contract.",
  // Internal software with no auth in front of it yet. It carries no data,
  // but it has no business in an index either.
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const [summary, runs, pipeline, notes] = await Promise.all([
    dashboard.summary(),
    dashboard.runs({ limit: 20 }),
    dashboard.pipeline(),
    dashboard.notes(5),
  ]);

  return (
    <main id="main" className="scroll-mt-[116px] sm:scroll-mt-[84px]">
      <Container className="py-[clamp(48px,6vw,80px)]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Eyebrow>Operator dashboard</Eyebrow>
          <Link
            href="/platform"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 hover:text-ink"
          >
            ← About the platform
          </Link>
        </div>

        <div className="mt-8">
          <DashboardShell
            summary={summary}
            runs={runs}
            pipeline={pipeline}
            notes={notes}
          />
        </div>

        <p className="mt-8 max-w-[62ch] text-[14px] leading-[1.6] text-ink-3">
          The shell reads through{" "}
          <span className="font-mono text-ink-2">
            features/dashboard/lib/contract.ts
          </span>
          . The local adapter ships empty, so every panel is showing its real
          empty state rather than sample data — a live source is one more
          implementation of <span className="font-mono text-ink-2">DashboardSource</span>,
          selected in that feature&rsquo;s{" "}
          <span className="font-mono text-ink-2">lib/index.ts</span>. Needs auth
          before it carries anything.
        </p>
      </Container>
    </main>
  );
}
