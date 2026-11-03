import "server-only";

import type { DashboardSource } from "./contract";
import { localDashboardSource } from "./source.local";

/**
 * The only place that knows which back end is in play. There is one
 * adapter today; a live source is a second file implementing
 * `DashboardSource`, selected here, and nothing else changes.
 */
export const dashboard: DashboardSource = localDashboardSource;

export * from "./contract";
export { DashboardShell } from "../components/dashboard-shell";
