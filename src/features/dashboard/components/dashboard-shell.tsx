import { cn } from "@/global/lib/cn";
import type {
  AgentRun,
  BrainNote,
  DashboardSummary,
  PipelineEntry,
} from "../lib/contract";

/**
 * The operator dashboard, rendered against the contract.
 *
 * A server component with no client JS: every panel is a read. The command
 * bar is presentational for now — it is the one piece that needs state, and
 * it gets it when there is something to search.
 *
 * Figures are nullable all the way through, so "not measured" renders as an
 * em dash rather than a zero. A dashboard that shows 0% eval pass when no
 * eval has ever run is worse than one that admits it does not know.
 */

/** A figure that may not exist yet. Null renders as an em dash, never 0. */
function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="border-t border-line pt-3.5">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-[22px] leading-none tracking-[-0.02em]",
          value === null ? "text-ink-mute" : "text-ink",
        )}
      >
        {value === null ? "—" : value}
      </p>
    </div>
  );
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  /** Shown instead of children when there is nothing to list. */
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-line p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
        {title}
      </h2>
      {children ?? (
        <p className="mt-4 text-[13px] leading-[1.6] text-ink-mute">{empty}</p>
      )}
    </section>
  );
}

const HEALTH_LABEL: Record<PipelineEntry["health"], string> = {
  clean: "Clean",
  live: "Live",
  blocked: "Blocked",
};

export function DashboardShell({
  summary,
  runs,
  pipeline,
  notes,
}: {
  summary: DashboardSummary;
  runs: readonly AgentRun[];
  pipeline: readonly PipelineEntry[];
  notes: readonly BrainNote[];
}) {
  const needsYou = runs.filter((r) => r.status === "needs-you");
  const money =
    summary.spendPence === null
      ? null
      : `£${(summary.spendPence / 100).toFixed(2)}`;
  const evals =
    summary.evalPassRate === null
      ? null
      : `${Math.round(summary.evalPassRate * 100)}%`;

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-band">
      <div className="flex flex-col lg:flex-row">
        <nav
          aria-label="Dashboard sections"
          className="shrink-0 border-b border-line p-6 lg:w-[220px] lg:border-r lg:border-b-0"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
            Today
          </p>
          <ul className="mt-5 flex flex-col gap-4">
            {[
              ["Needs you", summary.needsYou],
              ["Agent runs", summary.runsToday],
              ["Pipeline", summary.activeBuilds],
              ["Second brain", notes.length],
            ].map(([label, count]) => (
              <li key={String(label)} className="flex items-baseline gap-3">
                <span className="grow text-[14px] text-ink-2">{label}</span>
                <span className="font-mono text-[12px] text-ink-3">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 grow p-6 lg:p-8">
          <h1 className="text-[clamp(22px,2.6vw,30px)] font-semibold tracking-[-0.02em]">
            {summary.needsYou === 0
              ? "Nothing needs you right now."
              : `${summary.needsYou} ${summary.needsYou === 1 ? "thing needs" : "things need"} you today.`}
          </h1>

          <div className="mt-7 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Runs today" value={summary.runsToday} />
            <Stat label="Eval pass rate" value={evals} />
            <Stat label="Model spend" value={money} />
            <Stat label="Active builds" value={summary.activeBuilds} />
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <Panel
              title="Agent runs"
              empty="No runs recorded. Point the adapter at a run log and they appear here."
            >
              {needsYou.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {needsYou.slice(0, 4).map((run) => (
                    <li key={run.id}>
                      <p className="truncate text-[13px] text-ink">
                        {run.workflow}
                      </p>
                      {run.summary ? (
                        <p className="mt-1 truncate font-mono text-[11px] text-ink-3">
                          {run.summary}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : undefined}
            </Panel>

            <Panel
              title="Second brain"
              empty="No notes indexed yet. Nothing for a run to cite."
            >
              {notes.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {notes.slice(0, 4).map((note) => (
                    <li key={note.id}>
                      <p className="truncate text-[13px] text-ink">
                        {note.title}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-ink-3">
                        cited in {note.citedInRuns}{" "}
                        {note.citedInRuns === 1 ? "run" : "runs"} ·{" "}
                        {note.source}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : undefined}
            </Panel>

            <Panel
              title="Build health"
              empty="No projects tracked. Add one and stage, milestone and CWV land here."
            >
              {pipeline.length > 0 ? (
                <>
                  <p className="mt-4 font-mono text-[11px] text-ink-3">
                    {summary.health.clean} clean · {summary.health.live} live ·{" "}
                    {summary.health.blocked} blocked
                  </p>
                  <ul className="mt-3 flex flex-col gap-3">
                    {pipeline.slice(0, 4).map((entry) => (
                      <li key={entry.id}>
                        <p className="truncate text-[13px] text-ink">
                          {entry.project}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-ink-3">
                          {entry.stage} · {HEALTH_LABEL[entry.health]}
                          {entry.cwv ? ` · CWV ${entry.cwv}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : undefined}
            </Panel>
          </div>

          {/* Sanctioned glass use #3: the dashboard command bar. One layer,
              over a solid panel, with the @supports fallback in globals. */}
          <div className="glass mt-7 flex items-center gap-3 rounded-[var(--radius-glass)] px-4 py-3">
            <span className="font-mono text-[12px] text-brand">⌘K</span>
            <span className="text-[13px] text-ink-3">
              Run, search, or ask the brain
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
