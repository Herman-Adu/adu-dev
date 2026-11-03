import "server-only";

import { z } from "zod";

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
 * The direction of travel is fixed by the contract rule: fetch, map, then
 * `CaseStudy.parse()` the mapped object. Nothing here is generated from
 * Strapi, and nothing Strapi returns is handed to a component untouched —
 * if the CMS sends a shape the schema rejects, that is a mapping bug
 * caught at the boundary with a message naming the field, not a render
 * crash three components deep.
 *
 * The content model this expects lives in `cms/` and is copied into a
 * Strapi project verbatim. `cms/README.md` maps it field by field.
 */

/* -------------------------------------------------------------------- */
/* Configuration                                                         */
/* -------------------------------------------------------------------- */

/** Long enough for a cold CMS, short enough that a build cannot hang. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Published content changes on a human timescale, so a minute is plenty. */
const REVALIDATE_SECONDS = 60;

/** `revalidateTag("case-studies")` from a Strapi webhook busts every read. */
const CACHE_TAG = "case-studies";

/** Strapi's own ceiling on `pagination[pageSize]` is 100. */
const PAGE_SIZE = 100;

type Config = { readonly base: string; readonly token: string };

function config(): Config {
  const { STRAPI_URL, STRAPI_API_TOKEN } = env;
  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    throw new Error(
      "CONTENT_SOURCE=strapi requires STRAPI_URL and STRAPI_API_TOKEN. " +
        "Set both, or set CONTENT_SOURCE=local — the local source needs no back end.",
    );
  }
  return { base: STRAPI_URL.replace(/\/+$/, ""), token: STRAPI_API_TOKEN };
}

/* -------------------------------------------------------------------- */
/* The wire shape                                                        */
/* -------------------------------------------------------------------- */

/**
 * What Strapi 5 puts on the wire — not what this app requires.
 *
 * Every field is optional here on purpose. This layer only answers "did
 * the transport deliver something of the right primitive type"; whether a
 * field is *required* is the contract's judgement, made one step later by
 * `CaseStudy.parse()`. Keeping those two questions apart is what makes a
 * failure legible: a wire error means Strapi changed, a contract error
 * means an entry is incomplete.
 *
 * Loose objects, because an entry also carries `documentId`,
 * `createdAt`, `publishedAt` and anything a future field adds.
 */
const WireValue = z.looseObject({ value: z.string().nullish() });

const WireMedia = z.looseObject({
  url: z.string().nullish(),
  alternativeText: z.string().nullish(),
  caption: z.string().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});

const WireEntry = z.looseObject({
  slug: z.string().nullish(),
  title: z.string().nullish(),
  summary: z.string().nullish(),
  year: z.number().nullish(),
  disciplines: z.array(WireValue).nullish(),
  liveUrl: z.string().nullish(),
  scope: z.array(WireValue).nullish(),
  stack: z.array(WireValue).nullish(),
  cover: WireMedia.nullish(),
  constraint: z.string().nullish(),
  decision: z
    .looseObject({
      body: z.string().nullish(),
      rejectedOption: z.string().nullish(),
      cost: z.string().nullish(),
    })
    .nullish(),
  result: z
    .looseObject({
      metrics: z
        .array(
          z.looseObject({
            label: z.string().nullish(),
            value: z.string().nullish(),
          }),
        )
        .nullish(),
      note: z.string().nullish(),
    })
    .nullish(),
  whatIWouldChange: z.string().nullish(),
  featured: z.boolean().nullish(),
});
type WireEntry = z.infer<typeof WireEntry>;

const WireCollection = z.looseObject({
  data: z.array(WireEntry).nullish(),
  meta: z
    .looseObject({
      pagination: z
        .looseObject({
          page: z.number().nullish(),
          pageCount: z.number().nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

/* -------------------------------------------------------------------- */
/* Fetching                                                             */
/* -------------------------------------------------------------------- */

type Param = readonly [string, string];

/**
 * Strapi 5 populates nothing by default, and `populate=*` reaches exactly
 * one level — which would return `result` with its `metrics` missing. So
 * every relation this app reads is named explicitly, and the nested form
 * is spelled out for the one component that holds another.
 */
const POPULATE_FULL: readonly Param[] = [
  ["populate[disciplines]", "true"],
  ["populate[scope]", "true"],
  ["populate[stack]", "true"],
  ["populate[cover]", "true"],
  ["populate[decision]", "true"],
  ["populate[result][populate][metrics]", "true"],
];

/** A list page needs no bodies — `CaseStudySummary` is the whole point. */
const POPULATE_SUMMARY: readonly Param[] = [
  ["populate[disciplines]", "true"],
  ["populate[scope]", "true"],
  ["populate[cover]", "true"],
];

const SUMMARY_FIELDS: readonly string[] = [
  "slug",
  "title",
  "summary",
  "year",
  "liveUrl",
  "featured",
];

/** `fields[0]=slug&fields[1]=title&…` — Strapi reads indexed arrays only. */
function fields(names: readonly string[]): Param[] {
  return names.map((name, i) => [`fields[${i}]`, name] as const);
}

async function get(path: string, params: readonly Param[]): Promise<unknown> {
  const { base, token } = config();
  const search = new URLSearchParams();
  // Explicit, though it is also Strapi 5's default: a draft must never
  // reach the public site because someone changed a setting.
  search.set("status", "published");
  for (const [key, value] of params) search.append(key, value);
  const url = `${base}${path}?${search.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
    });
  } catch (cause) {
    // A DNS failure, a refused connection or the timeout above. Say which
    // URL, because "fetch failed" on its own has cost everyone an hour.
    throw new Error(`Strapi request failed: GET ${path}`, { cause });
  }

  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(
      `Strapi returned ${res.status} ${res.statusText} for GET ${path}` +
        (body ? `: ${body}` : "") +
        (res.status === 401 || res.status === 403
          ? " — check STRAPI_API_TOKEN, and that the token's role can read case studies."
          : ""),
    );
  }

  return res.json();
}

async function getCollection(params: readonly Param[]): Promise<WireEntry[]> {
  const raw = await get("/api/case-studies", params);
  const parsed = WireCollection.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Strapi sent a case-study collection this adapter does not recognise. ` +
        `This is a wire-shape change, not a content problem: ${issues(parsed.error)}`,
    );
  }
  return parsed.data.data ?? [];
}

/* -------------------------------------------------------------------- */
/* Mapping                                                              */
/* -------------------------------------------------------------------- */

function issues(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

/**
 * The contract gate. A Strapi entry that cannot satisfy the schema is a
 * mapping or content bug, and the thrown message names the entry and the
 * field so it is fixable without a debugger.
 */
function parseAgainstContract<T>(
  schema: z.ZodType<T>,
  value: unknown,
  slug: string,
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Strapi case study "${slug}" does not satisfy the contract — ` +
        `${issues(parsed.error)}. Fix the entry in Strapi, or the mapping in ` +
        `source.strapi.ts. The schema in contract.ts is the spec.`,
    );
  }
  return parsed.data;
}

/** A repeatable one-field component is Strapi's only ordered string list. */
function values(items: readonly z.infer<typeof WireValue>[] | null | undefined): string[] {
  return (items ?? [])
    .map((item) => item.value)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

/** Local-provider uploads come back as `/uploads/…` and need the host. */
function absolute(url: string, base: string): string {
  return url.startsWith("/") ? `${base}${url}` : url;
}

/**
 * `MediaRef` requires alt text and real dimensions. Strapi guarantees
 * neither, so an image missing either is dropped and the cover reads as
 * `null` — which the contract allows and every component already handles.
 *
 * Dropping it is the deliberate choice over two alternatives: throwing
 * would take a page down over an editor's omission, and inventing alt
 * text from the title would ship a description of something nobody has
 * looked at. A warning goes to the server log instead, where it belongs.
 */
function toMediaRef(
  wire: z.infer<typeof WireMedia> | null | undefined,
  base: string,
  slug: string,
): z.infer<typeof CaseStudy>["cover"] {
  if (!wire?.url) return null;

  // Alt text only ever comes from the alt-text field. A caption is
  // display copy — often a credit — and reusing it would ship a photo
  // credit to a screen reader as a description of the image.
  const alt = wire.alternativeText?.trim();
  if (!alt) {
    console.warn(
      `[strapi] case study "${slug}": cover image has no alternative text, ` +
        `so it was dropped rather than rendered without one.`,
    );
    return null;
  }
  if (!wire.width || !wire.height) {
    console.warn(
      `[strapi] case study "${slug}": cover image reports no width/height, ` +
        `so it was dropped rather than rendered without reserved space.`,
    );
    return null;
  }

  return {
    url: absolute(wire.url, base),
    alt,
    width: wire.width,
    height: wire.height,
  };
}

function toSummary(wire: WireEntry, base: string): CaseStudySummary {
  const slug = wire.slug ?? "(no slug)";
  return parseAgainstContract(
    CaseStudySummary,
    {
      slug: wire.slug,
      title: wire.title,
      summary: wire.summary,
      year: wire.year,
      disciplines: values(wire.disciplines),
      liveUrl: wire.liveUrl ?? null,
      scope: values(wire.scope),
      cover: toMediaRef(wire.cover, base, slug),
      featured: wire.featured ?? false,
    },
    slug,
  );
}

function toCaseStudy(wire: WireEntry, base: string): CaseStudy {
  const slug = wire.slug ?? "(no slug)";
  return parseAgainstContract(
    CaseStudy,
    {
      slug: wire.slug,
      title: wire.title,
      summary: wire.summary,
      year: wire.year,
      disciplines: values(wire.disciplines),
      liveUrl: wire.liveUrl ?? null,
      scope: values(wire.scope),
      stack: values(wire.stack),
      cover: toMediaRef(wire.cover, base, slug),

      constraint: wire.constraint,
      decision: {
        body: wire.decision?.body,
        rejectedOption: wire.decision?.rejectedOption ?? null,
        cost: wire.decision?.cost ?? null,
      },
      result: {
        // An empty `metrics` with a note is the honest shape for work that
        // has not been measured. It is not a missing value to paper over.
        metrics: (wire.result?.metrics ?? [])
          .filter((m) => m.label && m.value)
          .map((m) => ({ label: m.label, value: m.value })),
        note: wire.result?.note ?? null,
      },
      whatIWouldChange: wire.whatIWouldChange ?? null,

      featured: wire.featured ?? false,
    },
    slug,
  );
}

/* -------------------------------------------------------------------- */
/* The source                                                           */
/* -------------------------------------------------------------------- */

export const strapiCaseStudySource: CaseStudySource = {
  async list(query) {
    const q = ListQuery.parse(query ?? {});
    const { base } = config();

    const params: Param[] = [
      ...fields(SUMMARY_FIELDS),
      ...POPULATE_SUMMARY,
      // Newest first, matching the local source — ordering is part of the
      // behaviour a component sees, so the two adapters must agree on it.
      // Slug breaks the tie: years repeat, and an unordered tie is free to
      // come back differently on each request.
      ["sort[0]", "year:desc"],
      ["sort[1]", "slug:asc"],
      ["pagination[page]", "1"],
      ["pagination[pageSize]", String(q.limit)],
      ["pagination[withCount]", "false"],
    ];
    if (q.featuredOnly) params.push(["filters[featured][$eq]", "true"]);
    if (q.discipline) {
      // Filtering across a repeatable component reaches into its one field.
      params.push(["filters[disciplines][value][$eq]", q.discipline]);
    }

    const entries = await getCollection(params);
    return entries.map((entry) => toSummary(entry, base));
  },

  async bySlug(slug) {
    const { base } = config();
    const entries = await getCollection([
      ...POPULATE_FULL,
      ["filters[slug][$eq]", slug],
      ["pagination[pageSize]", "1"],
      ["pagination[withCount]", "false"],
    ]);

    const entry = entries[0];
    // A slug that matches nothing is a 404, not an error. `notFound()` is
    // the caller's decision to make.
    return entry ? toCaseStudy(entry, base) : null;
  },

  async slugs() {
    // This feeds `generateStaticParams`, so it has to be complete. Taking
    // the first page only would silently stop building pages at entry 101.
    const out: string[] = [];
    for (let page = 1; ; page += 1) {
      const raw = await get("/api/case-studies", [
        ...fields(["slug"]),
        // The tie-break matters most here. Paging through an unordered
        // tie can hand back the same slug twice and miss another, so
        // `generateStaticParams` would quietly stop building a page that
        // has not changed.
        ["sort[0]", "year:desc"],
        ["sort[1]", "slug:asc"],
        ["pagination[page]", String(page)],
        ["pagination[pageSize]", String(PAGE_SIZE)],
        ["pagination[withCount]", "true"],
      ]);
      const parsed = WireCollection.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `Strapi sent a case-study collection this adapter does not recognise: ` +
            issues(parsed.error),
        );
      }

      const entries = parsed.data.data ?? [];
      for (const entry of entries) {
        if (entry.slug) out.push(entry.slug);
      }

      const pageCount = parsed.data.meta?.pagination?.pageCount ?? 1;
      // The empty-page check is the belt to `pageCount`'s braces: a page
      // count that disagrees with the data would otherwise spin forever,
      // and a build that hangs is worse than a build that stops.
      if (entries.length === 0 || page >= pageCount) break;
    }
    return out;
  },
};
