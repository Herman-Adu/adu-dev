import { z } from "zod";

/**
 * The data contract for the Work feature.
 *
 * This file is the agreement. The front end owns it; a CMS implements it.
 * Nothing in here may import from a CMS client, and no generated CMS type
 * may replace these schemas — that would invert the dependency and turn a
 * future migration into a rewrite.
 */

export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug");
export type Slug = z.infer<typeof Slug>;

export const MediaRef = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type MediaRef = z.infer<typeof MediaRef>;

export const Discipline = z.enum([
  "ecommerce",
  "marketing-site",
  "agent-system",
  "product",
]);
export type Discipline = z.infer<typeof Discipline>;

/**
 * Every case study answers the same four questions. Constraint and
 * decision are required; result and revision are nullable because an
 * honest "not yet measured" beats an invented number.
 */
export const CaseStudy = z.object({
  slug: Slug,
  title: z.string().min(1),
  summary: z.string().min(1),
  year: z.number().int().min(1990).max(2100),
  disciplines: z.array(Discipline).min(1),
  liveUrl: z.string().url().nullable(),
  scope: z.array(z.string()).min(1),
  stack: z.array(z.string()),
  cover: MediaRef.nullable(),

  constraint: z.string().min(1),
  decision: z.object({
    body: z.string().min(1),
    rejectedOption: z.string().nullable(),
    cost: z.string().nullable(),
  }),
  result: z.object({
    metrics: z.array(
      z.object({ label: z.string(), value: z.string() }),
    ),
    note: z.string().nullable(),
  }),
  whatIWouldChange: z.string().nullable(),

  featured: z.boolean().default(false),
});
export type CaseStudy = z.infer<typeof CaseStudy>;

/** A trimmed shape for index pages — avoids shipping full bodies to a list. */
export const CaseStudySummary = CaseStudy.pick({
  slug: true,
  title: true,
  summary: true,
  year: true,
  disciplines: true,
  liveUrl: true,
  scope: true,
  cover: true,
  featured: true,
});
export type CaseStudySummary = z.infer<typeof CaseStudySummary>;

export const ListQuery = z.object({
  discipline: Discipline.optional(),
  featuredOnly: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(50),
});
export type ListQuery = z.infer<typeof ListQuery>;

/**
 * The seam. Swapping Strapi for Sanity, Payload, or a flat file means
 * writing one more implementation of this interface — components never
 * learn where the data came from.
 */
export interface CaseStudySource {
  list(query?: Partial<ListQuery>): Promise<CaseStudySummary[]>;
  bySlug(slug: string): Promise<CaseStudy | null>;
  slugs(): Promise<string[]>;
}
