# `cms/` — the Strapi 5 implementation of the Work contract

This folder is **not** part of the Next app. It is the content model the
Strapi instance has to have, kept in version control next to the schema it
implements, and copied into a Strapi project verbatim.

The direction of dependency is the whole point: `src/features/work/lib/contract.ts`
is the spec, and the files here follow it. Nothing in the app is generated
from Strapi. If the two disagree, this folder is wrong.

```
cms/src/api/case-study/
  content-types/case-study/schema.json   the collection type
  controllers|routes|services/           default factories, unmodified
cms/src/components/work/
  discipline.json  text-item.json  decision.json  result.json  metric.json
```

`tsconfig.json` and `eslint.config.mjs` both exclude `cms`, because those
three `.ts` files are compiled by the Strapi project, not by this one.

## Standing one up

Postgres first, then Strapi, then the model, then a token.

```bash
createdb strapi
```

```bash
npx create-strapi@5 ../adu-cms --skip-cloud --ts --no-example \
  --dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 --dbname=strapi \
  --dbusername=postgres --dbpassword=<password>
```

Copy the model in **before the first start**, so Strapi creates the tables
from it rather than migrating them afterwards:

```bash
cp -r cms/src/api/case-study ../adu-cms/src/api/
cp -r cms/src/components/work ../adu-cms/src/components/
```

```bash
cd ../adu-cms && npm run develop
```

Create the first administrator at `/admin`, then mint a token under
Settings → API Tokens. **Read-only is enough** — the site never writes. Put
the two halves in the front end's environment:

```bash
CONTENT_SOURCE=strapi
STRAPI_URL=https://cms.example.com
STRAPI_API_TOKEN=<the token>
```

`CONTENT_SOURCE=local` continues to work with nothing running, which is how
the contract stays honest.

## The field map

Every row is a decision, not a transcription. `source.strapi.ts` does the
mapping; this table is why it looks the way it does.

| `contract.ts` | Strapi attribute | Why |
|---|---|---|
| `slug` | `uid`, target `title`, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` | Strapi's own kebab-casing plus the contract's regex, so an editor cannot type a slug the router will not match. |
| `title`, `summary`, `constraint` | `string` / `text`, required | — |
| `year` | `integer`, 1990–2100 | Same bounds as the schema. A typo'd `202` fails in the editor, not at render. |
| `disciplines: Discipline[]` | repeatable component `work.discipline`, min 1 | Strapi has no multi-select enumeration. A repeatable one-field component is the closest thing that still constrains the values — and the enum strings are **identical** to the contract's, hyphens included, so there is no translation table to drift. |
| `scope: string[]`, `stack: string[]` | repeatable component `work.text-item` | Same reason: an ordered list of plain strings. `scope` is `min: 1`; `stack` may be empty, as in the schema. |
| `liveUrl: string \| null` | `string`, regex `^https?://`, optional | The contract parses this with `z.string().url()`. The regex catches the common paste (`momo-audio.adudev.co.uk`) in the editor instead of at the boundary. |
| `cover: MediaRef \| null` | single `media`, images only | Mapped to `{ url, alt, width, height }`. See below — this one has a real failure mode. |
| `decision` | component `work.decision` | `body` required; `rejectedOption` and `cost` optional, because "no rejected option" is a legitimate answer and an invented one is not. |
| `result` | component `work.result` → repeatable `work.metric` | `metrics` may be empty with a `note` saying so. That is the Content rule in `CLAUDE.md` expressed as a schema. |
| `whatIWouldChange` | `text`, optional | — |
| `featured` | `boolean`, default `false` | — |

### Draft and publish is on

The adapter sends `status=published` on every request, which is also Strapi
5's default — stated twice on purpose, so a draft cannot reach the site
because someone changed a setting. A draft-only entry is invisible to
`list`, `bySlug` and `slugs`.

### A cover image needs alternative text

`MediaRef` requires `alt`, `width` and `height`. Strapi guarantees none of
them, so an image missing alt text (or dimensions) is **dropped** and
`cover` reads as `null`, with a warning on the server log naming the entry.

The alternatives are both worse: throwing would take a page down over an
editor's omission, and deriving alt text from the title would ship a
description of an image nobody has looked at. `cover` is nullable in the
contract and every component already handles it, so dropping it is the only
option that stays honest. Fill in **Alternative text** in the media library
and the cover appears.

### Cache and revalidation

Reads are tagged `case-studies` and revalidate after 60 seconds. A Strapi
webhook pointed at a route that calls
`revalidateTag("case-studies", { expire: 0 })` would
make publishing instant; until that route exists, a change is live within
the minute.

## Verified against a real instance

Strapi 5.60 on Postgres 16, seeded with the two real case studies through
the admin content-manager API, read back through a read-only API token:

- `list`, `bySlug` and `slugs` returned **byte-identical** results to the
  local source across nine queries — unfiltered, `featuredOnly`,
  `discipline` (both a match and a miss), `limit`, and a slug that does not
  exist.
- A draft-only entry stayed invisible to all three methods.
- A cover with no alternative text was dropped with a warning; filling the
  alt text in made it appear, with the relative `/uploads/…` URL
  absolutised against `STRAPI_URL`.
- An entry edited in the database to hold `momo-audio.adudev.co.uk` (past
  Strapi's own validation) failed at the boundary with
  `Strapi case study "momo-audio" does not satisfy the contract — liveUrl: Invalid URL`,
  which is the mapping bug the contract rule exists to produce.
- A bad token and a missing `STRAPI_URL` each failed with a message that
  names the fix.
- `CONTENT_SOURCE=local` built and rendered throughout.
