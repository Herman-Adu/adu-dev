# Playbook — running this locally

Everything below was run for real in a cloud session and worked. The
gotcha list at the end is the expensive half: each entry cost time to find.

## The site alone

```bash
npm install
npm run dev
```

`CONTENT_SOURCE=local` is the default and needs no back end — that promise
is what keeps the contract honest, and CI builds under it on every PR.

Environment, all optional locally:

| Variable | Unset behaviour |
|---|---|
| `CONTENT_SOURCE` | `local` — reads `src/features/work/data/work.json` |
| `STRAPI_URL`, `STRAPI_API_TOKEN` | only read when `CONTENT_SOURCE=strapi` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | CTAs link to the work instead of opening a mailto. **Intended**, not a bug — it is set in Vercel |
| `NEXT_PUBLIC_SITE_URL` | defaults to the production URL |

Auth variables are in `docs/playbooks/auth.md`. `.env.example` lists the
lot with no values in it.

## Strapi + Postgres locally

Full reasoning in `cms/README.md`; this is the command sequence.

```bash
createdb strapi
```

```bash
npx create-strapi@5 cms --skip-cloud --ts --no-example \
  --dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 --dbname=strapi \
  --dbusername=postgres --dbpassword=<password>
```

Copy the committed model in **before the first start**, so Strapi creates
the tables from it rather than migrating them afterwards:

```bash
cp -r cms/src/api/case-study <strapi>/src/api/
cp -r cms/src/components/work <strapi>/src/components/
```

```bash
cd <strapi> && npm run develop
```

Create the admin at `/admin`, then Settings → API Tokens → **read-only**
(the site never writes). Then point the front end at it:

```bash
CONTENT_SOURCE=strapi STRAPI_URL=http://127.0.0.1:1337 STRAPI_API_TOKEN=<token> npm run dev
```

Entries must be **published**, not drafts — the adapter asks for
`status=published` on every read, deliberately.

## Verifying an adapter with no test runner

There is no test runner in this repo, and the pattern that has been used
instead is a **throwaway probe route**, deleted before committing. It is
how the Strapi adapter was proved byte-identical to the local one across
nine queries.

Create `src/app/probe-tmp/route.ts` — note the name:

```ts
import { revalidateTag } from "next/cache";
import { localCaseStudySource } from "@/features/work/lib/source.local";
import { strapiCaseStudySource } from "@/features/work/lib/source.strapi";

export async function GET() {
  revalidateTag("case-studies"); // otherwise you read the last minute's answer
  return Response.json({
    local: await localCaseStudySource.list({}),
    strapi: await strapiCaseStudySource.list({}),
  });
}
```

`curl` it, `JSON.stringify` both halves and compare. Vary the query —
`featuredOnly`, each `discipline`, a `limit`, a slug that does not exist —
and check `slugs()` too. Then **delete the route**: it is a deep
cross-feature import and `npm run house-rules` fails it, which is the
system working.

Worth testing the unhappy paths while you are set up, because each one is a
message someone reads at 3am: a bad token, a missing `STRAPI_URL`, a
draft-only entry, a cover image with no alternative text, and a field
corrupted directly in the database past Strapi's own validation (that last
one should fail at the boundary naming the field).

## Before you push

```bash
npm run typecheck
```

```bash
npm run house-rules
```

```bash
CONTENT_SOURCE=local npm run build
```

Those three are what CI runs. `npm run lint` is **not** a gate yet —
`forge-scene.tsx` carries 9 pre-existing `react-hooks/refs` errors from
scene 02. Fix those and adding lint to `.github/workflows/ci.yml` is a
one-line change.

Copilot reviews on every push and is the only reviewer that is not the
author. It has caught real bugs on both PRs so far — do not merge on CI
alone just because CI is green.

## Gotchas that cost real time

- **A folder named `_thing` in `src/app` does not route.** Underscore-
  prefixed folders are private in the app router, so a probe route at
  `__probe` returns 404 with no error anywhere. Name it `probe-tmp`.
- **A cached `fetch` answer looks like a bug in your mapping.** Reads are
  tagged `case-studies` with `revalidate: 60`, so after changing CMS data
  you keep reading the old answer. `revalidateTag("case-studies")` from a
  route flips it immediately; `rm -rf .next/cache` plus a restart also
  works. This exact thing read as "the media mapper is broken" for a while.
- **Only one `next dev` runs at a time.** A second exits with "Another next
  dev server is already running" and prints the PID. Start it with `setsid`
  and kill it by PID — killing a plain background `next dev` can take the
  shell with it, which silently truncates whatever came after.
- **`pkill -f "next start"` matches its own command line** and kills the
  shell running it. Use a distinct port per run instead.
- **Playwright: wait on a condition, never a sleep.** Scene 02's pin
  changes the document height, so a fixed `waitForTimeout` measures the
  page before ScrollTrigger has refreshed and reports `max ≈ 1320` instead
  of `4020` — every scroll assertion then comes back wrong. Use
  `waitForFunction` until the glass appears. Require Playwright from
  CommonJS; the ESM import does not resolve. WebGL needs
  `--use-angle=swiftshader --enable-unsafe-swiftshader`.
- **In a cloud session, a Postgres cluster cannot live in the scratchpad.**
  `/tmp/claude-0` gets its mode reset to `700 root` mid-session, so a
  cluster running as the `postgres` user dies mid-write with "Permission
  denied" and every Strapi call then returns a 500 that looks like a bad
  query. Put the data directory under `/var/lib/postgresql`. Locally this
  does not apply.
- **`gh issue` and `gh pr` are blocked in cloud sessions** (they route
  through GraphQL, which returns 403). Use `gh api` REST. Locally the
  subcommands work normally.
