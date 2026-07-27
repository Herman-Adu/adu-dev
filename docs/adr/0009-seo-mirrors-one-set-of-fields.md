# OG and Twitter mirror one set of SEO fields, and gain overrides only on demand

`shared.seo` keeps a single set of `meta*` fields. Open Graph and Twitter cards
are derived from them, and no per-network override fields are added. #40 asked
whether to add six — `ogTitle`, `ogDescription`, `twitterCard`, `twitterTitle`,
`twitterDescription`, `twitterImage` — and the answer is no, for now, on
evidence rather than taste.

## What prompted the question

#15 found `generateMetadataObject` reading those six fields off a component that
has never had them. Every read was permanently `undefined` and the `||` fallback
was the only live path, so the code merely _looked_ like an editor could give a
page a different title on Twitter than on Google. #15 deleted the dead reads
rather than carrying them forward as decoration, which left the honest question
behind: should the fields exist for real?

## Why not

**The schema is already wider than the frontend honours, and that is the actual
problem.** `shared.seo` has eight fields. The Strapi-driven metadata path reads
three:

| Read by `generateMetadataObject`            | Never read anywhere                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `metaTitle`, `metaDescription`, `metaImage` | `canonicalURL`, `metaRobots`, `metaViewport`, `structuredData`, `keywords` |

So an editor can today fill in a canonical URL, a robots directive and a
structured-data blob, and none of them reach the page. (`keywords` matches only
in `lib/next-metadata.ts`, a hardcoded placeholder object that no Strapi content
flows through.) #40 is the mirror image of a defect this repo already had —
reads for fields that do not exist — and the reflection is fields that exist and
are not read. Adding six more would widen the same gap, not close it.

**Twitter mostly does not need its own fields.** X falls back to Open Graph when
the `twitter:*` tags are absent: `twitter:title` to `og:title`,
`twitter:description` to `og:description`, `twitter:image` to `og:image`. The one
tag with no OG equivalent is `twitter:card` itself, which must be set explicitly
— and `generateMetadataObject` already hardcodes `summary_large_image`. Four of
the six proposed fields would therefore buy divergence from OG rather than
presence on Twitter, and divergence is the thing nobody has asked for.

**Nobody has asked for it.** The six field names entered this repo as dead code
copied from a template, not from an editor who wanted a different Twitter
headline. Adding schema for a need no one has demonstrated is speculative
generality, and it is not free: the SEO component sits on most content types, so
six optional fields become six more inputs on every page, article and product
form, for a feature with no established user.

## What would change the answer

This is a reversible decision, and the trigger is a real editorial need rather
than a hypothetical one. Any of these should reopen it:

- An editor asks for a headline that differs by network — the genuine use case,
  usually a punchier social title against a keyword-shaped search title.
- `metaTitle`'s 60-character cap starts distorting social copy. The cap is tuned
  for Google's truncation; OG titles have more room, and a shared field forces
  the tighter limit on both.
- A client project cloned from this template needs it. The template's job is a
  good default, not every option, so this arrives as that project's change.

When it does, model it as a nested `og` component the way `@strapi/plugin-seo`
does, rather than as six flat fields. That keeps the override set visibly
optional and collapsed in the admin, and leaves room for `og:type` and
`og:site_name` without another round of flat additions.

## Consequences

OG and Twitter titles, descriptions and images are the `meta*` ones, and a
change to `metaTitle` moves all three surfaces together. That is the intended
behaviour, not an omission, and `lib/shared/metadata.ts` carries a comment
pointing here so the next reader does not re-derive it.

The five unread fields are **not** resolved by this record. They are a separate
question — whether the frontend should honour them or the schema should lose
them — and that question is worth a ticket of its own. It is the more valuable
half of what #40 uncovered, and it is left explicitly open rather than folded
into a decision about overrides.
