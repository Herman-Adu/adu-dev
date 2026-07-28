# The SEO component sheds its five unread fields, and two of them return computed

`canonicalURL`, `metaRobots`, `metaViewport`, `structuredData` and `keywords`
are removed from `shared.seo`. The component keeps `metaTitle`,
`metaDescription` and `metaImage` — the three the frontend actually reads.
ADR 0009 left this question open deliberately, calling it the more valuable half
of what #40 uncovered; this is the answer.

The five were decided one at a time rather than as a bloc, because they are not
alike. Two of them shed a **field** while affirming a **need**, and a single
verdict would have buried that distinction.

## The evidence they were never used

The local database holds 24 `shared.seo` rows. `metaTitle` and `metaDescription`
are populated in all 24. All five of these fields are populated in **none** of
them. Nothing is being taken away from anybody.

`generateMetadataObject` is called from six route files and reads three fields.
`lib/next-metadata.ts` — which ADR 0009 described as a hardcoded placeholder no
Strapi content flows through — is imported by nothing at all; its only other
mention in the repository is a redundant `include` entry in the frontend
`tsconfig.json` that `**/*.ts` already covers. It is the frontend half of the
same defect, and it goes with them.

## The five, one at a time

**`metaViewport`.** Next already owns this surface: the root layout exports a
`Viewport` object and Next emits the default tag regardless, so a Strapi value
would have to fight it. Viewport is a per-app rendering concern, not per-page
editorial content. The decisive argument is narrower: a CMS-editable viewport
lets an editor type `user-scalable=no` and disable pinch-zoom across the site,
a WCAG 1.4.4 failure shipped by a text input. This template's defaults become
its client projects' accessibility posture, and that is not a switch to hand out.

**`keywords`.** Search engines have ignored `<meta name="keywords">` since 2009.
The stronger objection is internal: if the intent is "topics this content is
about", #55 already built that as `Category`, a real localised relational
taxonomy. Honouring `keywords` would stand a weaker freetext taxonomy beside the
good one and invite editors to disagree with themselves.

**`metaRobots`.** The robots directives a site genuinely needs — noindex
previews, noindex staging — are derived from request or environment state, which
a per-page string cannot express. Here even that need is already met, because
draft mode is cookie-gated and crawlers never reach it. What remains is the
editorial case, "noindex this one page", which is real in principle and
unproven here. Against it, the failure is asymmetric: a typo silently deindexes
a page, and the `[^,]+` regex is unanchored, so any string containing one
non-comma character passes. The validation is decorative.

## Two fields whose need is real and whose shape is wrong

**`canonicalURL`.** Canonical URLs matter here more than anything else in this
schema, because `en` and `fr` versions of the same content publish today with no
canonical and no `hreflang`. That is exactly why the field is the wrong answer:
the correct canonical is derivable from locale and slug, and the frontend can
compute both it and the language alternates correctly every time. A hand-typed
canonical is strictly worse than none — a wrong one deindexes the page in favour
of whatever URL was typed, and it rots the moment a slug changes. The one honest
editorial use is external syndication, which is rare and has no user here.

**`structuredData`.** JSON-LD is the most valuable capability of the five, and
still the wrong shape. Article and Product structured data is derivable from
content already held — headline, publication date, image, author, price — so
hand-authoring it duplicates the record and drifts from it. Editors get no
validation, and injecting editor-controlled JSON into a `<script>` tag is an
escaping hazard rather than the one-liner it appears to be.

Its concrete cost is already on the books. This is the **only** JSON field in the
schema, and it is the one named in `pnpm-workspace.yaml`: the `@strapi/design-system`
override exists because a JSON field on the SEO component broke most of the
content manager. The repository carries a dependency override to work around a
crash caused by a field that has never held a value.

## What would change the answer

The two needs above are affirmed, not dismissed, and each is the trigger that
reopens this record:

- **Computed canonical and `hreflang` alternates.** The live gap — a bilingual
  site publishing duplicates with no `alternates`. This arrives as route-derived
  metadata, not as a field an editor fills in.
- **Computed Article and Product JSON-LD.** Derived from the content types that
  already carry the data, emitted per type, with the schema.org shape in code
  where it can be typed and tested.

Neither is filed as an issue yet, for the same reason ADR 0009 gave for the six
override fields: no editorial need has been demonstrated. Recording them here is
how the last open question survived long enough to be answered properly.

A third trigger sits outside both: a client project cloned from this template
that genuinely needs an editor-supplied canonical for syndication. As with #40,
that arrives as that project's change, not as a widening of the default.

## Consequences

Editors lose five inputs from the SEO panel on every content type that carries
it. All five were empty, so no content changes and no editorial workflow does.

The type mirror in `@repo/strapi-types` must be regenerated or the drift gate
fails, and the seed round trip from #52 confirms the narrowed component survives
export and re-import.

Two things this record does not establish, both of which belong to the
implementation. Whether removing a component attribute drops the underlying
column or orphans it was **not** verified here and must not be assumed. And the
24-row count comes from one local database — evidence that the seed is clean,
not proof; the round trip is what proves it. A populated field found in some
other developer's database is content to migrate, not grounds to reopen this,
which is the same posture ADR 0010 took.

This lands after #46's implementation, which edits the same component file.
