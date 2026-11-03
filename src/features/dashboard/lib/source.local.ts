import "server-only";

import {
  AgentRun,
  BrainNote,
  DashboardSummary,
  PipelineEntry,
  RunQuery,
  type DashboardSource,
} from "./contract";
import raw from "../data/dashboard.json";

/**
 * Local adapter. The seed file ships empty on purpose: the shell's real
 * job right now is to render honest empty states, and sample runs with
 * invented costs would read as real operating data on a public URL.
 *
 * Validating at the boundary is what makes this useful — point it at a
 * real run log and a mapping mistake fails here, loudly, instead of
 * rendering something plausible and wrong.
 */
const runsAll = (): AgentRun[] => AgentRun.array().parse(raw.runs);
const pipelineAll = (): PipelineEntry[] =>
  PipelineEntry.array().parse(raw.pipeline);
const notesAll = (): BrainNote[] => BrainNote.array().parse(raw.notes);

const isToday = (iso: string): boolean => {
  const then = new Date(iso);
  const now = new Date();
  return (
    then.getUTCFullYear() === now.getUTCFullYear() &&
    then.getUTCMonth() === now.getUTCMonth() &&
    then.getUTCDate() === now.getUTCDate()
  );
};

export const localDashboardSource: DashboardSource = {
  async runs(query) {
    const q = RunQuery.parse(query ?? {});
    return runsAll()
      .filter((r) => (q.needsYouOnly ? r.status === "needs-you" : true))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, q.limit);
  },

  async pipeline() {
    return pipelineAll();
  },

  async notes(limit = 5) {
    return notesAll()
      .sort((a, b) => b.citedInRuns - a.citedInRuns)
      .slice(0, limit);
  },

  async summary() {
    const runs = runsAll();
    const pipeline = pipelineAll();

    // Null, not zero, where nothing supports a figure.
    const costed = runs.filter((r) => r.costPence !== null);
    const evaluated = runs.filter((r) => r.evalPassed !== null);

    return DashboardSummary.parse({
      needsYou: runs.filter((r) => r.status === "needs-you").length,
      runsToday: runs.filter((r) => isToday(r.startedAt)).length,
      activeBuilds: pipeline.length,
      health: {
        clean: pipeline.filter((p) => p.health === "clean").length,
        live: pipeline.filter((p) => p.health === "live").length,
        blocked: pipeline.filter((p) => p.health === "blocked").length,
      },
      spendPence: costed.length
        ? costed.reduce((sum, r) => sum + (r.costPence ?? 0), 0)
        : null,
      evalPassRate: evaluated.length
        ? evaluated.filter((r) => r.evalPassed).length / evaluated.length
        : null,
    });
  },
};
