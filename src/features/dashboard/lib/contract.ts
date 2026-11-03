import { z } from "zod";

/**
 * The operator dashboard's agreement.
 *
 * The front end owns this shape. Whatever ends up producing the data —
 * a run log, the GitHub API, Postgres, a cron that scrapes all three —
 * implements it. Figures are nullable throughout on purpose: a dashboard
 * that cannot distinguish "zero" from "not measured" will quietly invent
 * the difference, and that is the one thing this project will not do.
 */

export const RunStatus = z.enum([
  "needs-you",
  "running",
  "succeeded",
  "failed",
]);
export type RunStatus = z.infer<typeof RunStatus>;

export const AgentRun = z.object({
  id: z.string().min(1),
  /** What the run was doing, in the operator's language. */
  workflow: z.string().min(1),
  startedAt: z.string().datetime(),
  status: RunStatus,
  /** Null where the run is still going or the provider reported nothing. */
  costPence: z.number().int().nonnegative().nullable(),
  /** Null where the workflow has no eval suite yet. */
  evalPassed: z.boolean().nullable(),
  summary: z.string().nullable(),
});
export type AgentRun = z.infer<typeof AgentRun>;

export const BuildHealth = z.enum(["clean", "live", "blocked"]);
export type BuildHealth = z.infer<typeof BuildHealth>;

export const PipelineEntry = z.object({
  id: z.string().min(1),
  project: z.string().min(1),
  stage: z.string().min(1),
  nextMilestone: z.string().nullable(),
  health: BuildHealth,
  /** Core Web Vitals verdict. Null until something has actually measured it. */
  cwv: z.enum(["pass", "fail"]).nullable(),
});
export type PipelineEntry = z.infer<typeof PipelineEntry>;

export const BrainNote = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Where it lives — obsidian, a repo, a doc. */
  source: z.string().min(1),
  /** How many agent runs have cited it. The compounding signal. */
  citedInRuns: z.number().int().nonnegative(),
});
export type BrainNote = z.infer<typeof BrainNote>;

/**
 * Derived, never stored. Every field is computed from the collections
 * above, so a summary can never drift from the data it describes, and a
 * figure nothing supports comes back null rather than zero.
 */
export const DashboardSummary = z.object({
  needsYou: z.number().int().nonnegative(),
  runsToday: z.number().int().nonnegative(),
  activeBuilds: z.number().int().nonnegative(),
  health: z.object({
    clean: z.number().int().nonnegative(),
    live: z.number().int().nonnegative(),
    blocked: z.number().int().nonnegative(),
  }),
  /** Null when no run carried a cost, not 0. */
  spendPence: z.number().int().nonnegative().nullable(),
  /** Null when no run has an eval suite, not 0%. */
  evalPassRate: z.number().min(0).max(1).nullable(),
});
export type DashboardSummary = z.infer<typeof DashboardSummary>;

export const RunQuery = z.object({
  needsYouOnly: z.boolean().default(false),
  limit: z.number().int().positive().max(200).default(50),
});
export type RunQuery = z.infer<typeof RunQuery>;

/**
 * The seam. A live run log, Postgres or a flat file each mean one more
 * implementation of this — the shell never learns which it got.
 */
export interface DashboardSource {
  runs(query?: Partial<RunQuery>): Promise<AgentRun[]>;
  pipeline(): Promise<PipelineEntry[]>;
  notes(limit?: number): Promise<BrainNote[]>;
  summary(): Promise<DashboardSummary>;
}
