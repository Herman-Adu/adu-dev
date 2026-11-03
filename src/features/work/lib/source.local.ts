import "server-only";

import {
  CaseStudy,
  CaseStudySummary,
  ListQuery,
  type CaseStudySource,
} from "./contract";
import raw from "../data/work.json";

/**
 * Local adapter. Lets the whole front end run with no back end at all,
 * which is what keeps the contract honest — if a component needs
 * something this adapter cannot provide, the contract is wrong.
 */
const all = (): CaseStudy[] => CaseStudy.array().parse(raw);

export const localCaseStudySource: CaseStudySource = {
  async list(query) {
    const q = ListQuery.parse(query ?? {});
    return all()
      .filter((c) => (q.featuredOnly ? c.featured : true))
      .filter((c) => (q.discipline ? c.disciplines.includes(q.discipline) : true))
      // Year descending, slug ascending. The tie-break is not cosmetic:
      // it is what makes this order reproducible, and what lets the Strapi
      // source return the same sequence rather than a coincidental match.
      .sort((a, b) => b.year - a.year || a.slug.localeCompare(b.slug))
      .slice(0, q.limit)
      .map((c) => CaseStudySummary.parse(c));
  },

  async bySlug(slug) {
    return all().find((c) => c.slug === slug) ?? null;
  },

  async slugs() {
    return all().map((c) => c.slug);
  },
};
