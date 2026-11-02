import "server-only";

import {
  CaseStudy,
  CaseStudySummary,
  ListQuery,
  type CaseStudySource,
} from "./contract";
import { env } from "@/global/lib/env";

/**
 * Strapi 5 adapter.
 *
 * Deliberately unimplemented until the CMS exists. The shape of the work
 * is already fixed by the contract: fetch, then `CaseStudy.parse()` the
 * mapped object. If Strapi returns something the schema rejects, that is
 * a mapping bug caught at the boundary rather than a render crash.
 */
function notReady(): never {
  throw new Error(
    "Strapi adapter not implemented. Set CONTENT_SOURCE=local until the CMS is live.",
  );
}

export const strapiCaseStudySource: CaseStudySource = {
  async list(query) {
    ListQuery.parse(query ?? {});
    if (!env.STRAPI_URL) notReady();
    // const res = await fetch(`${env.STRAPI_URL}/api/case-studies?...`, {
    //   headers: { Authorization: `Bearer ${env.STRAPI_API_TOKEN}` },
    //   next: { revalidate: 60, tags: ["case-studies"] },
    // });
    // return CaseStudySummary.array().parse(mapMany(await res.json()));
    return notReady();
  },

  async bySlug(slug) {
    void slug;
    if (!env.STRAPI_URL) notReady();
    // return CaseStudy.parse(mapOne(await res.json()));
    return notReady();
  },

  async slugs() {
    if (!env.STRAPI_URL) notReady();
    return notReady();
  },
};

void CaseStudy;
