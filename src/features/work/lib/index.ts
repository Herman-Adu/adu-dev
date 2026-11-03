import "server-only";

import type { CaseStudySource } from "./contract";
import { localCaseStudySource } from "./source.local";
import { strapiCaseStudySource } from "./source.strapi";
import { env } from "@/global/lib/env";

/**
 * The only place in the app that knows which back end is in play.
 * Components import `caseStudies`, never an adapter directly.
 */
export const caseStudies: CaseStudySource =
  env.CONTENT_SOURCE === "strapi" ? strapiCaseStudySource : localCaseStudySource;

export * from "./contract";
export { ProofWall } from "../components/proof-wall";
