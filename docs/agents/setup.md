# Setup and environment

Needed once per clone. Not needed to make a change in an already-working
checkout — see `AGENTS.md` for the day-to-day commands.

## First run

From the repo root:

```sh
pnpm setup            # installs every workspace, then copies .env files
pnpm seed             # imports demo data into SQLite (216 entities, 115 assets)
```

One `pnpm install` at the root installs both apps — there is no per-app install
step. `pnpm setup` runs that install and then copies `.env.example` → `.env` in
each app, only where `.env` does not already exist.

`pnpm seed` is **destructive** — it wipes existing data before importing, and it
passes `--force`, so it does not stop to ask. Re-run it to reset to the demo
baseline.

Verify both apps are healthy afterwards:

```sh
pnpm build
```

The first `pnpm --filter strapi develop` prompts to create a Super Admin at
`http://localhost:1337/admin`; the seed does not include admin credentials.

## Changing the demo data

Seeding is one half of a loop; `pnpm export` is the other.

```sh
pnpm seed     # apps/strapi/data/seed.tar.gz -> SQLite
pnpm export   # SQLite -> apps/strapi/data/seed.tar.gz
```

So to change what a fresh clone gets: seed, edit in the admin, `pnpm export`,
commit the archive. Both ends read and write that one date-free path, so
regenerating never renames a file or edits a package manifest.

Both scripts live in `apps/strapi/package.json` and the root scripts delegate to
them, so the path is stated in one file — but twice within it, and in two forms:
`import` takes the filename, `export` takes `./data/seed` and appends
`.tar.gz` itself. Change one and you must change the other.

Neither command needs the dev server stopped. Both open
`apps/strapi/.tmp/data.db` directly while `pnpm dev` holds it, and both were
measured succeeding that way; after a seed, the running server serves the
replaced content without a restart.

`pnpm export` overwrites the archive in place without prompting, and writes it
unencrypted; an encrypted archive would demand a key on every import. The
archive is a 23 MB binary, so regenerate it only when the data actually changed.

### What the round trip does and does not preserve

Content, yes. Bytes, no — timestamps make byte-equality meaningless, so it is not
the bar. Measured 2026-07-27, on unchanged data:

|               | seed | export | seed |
| ------------- | ---- | ------ | ---- |
| entities      | 216  | 216    | 216  |
| assets        | 115  | 115    | 115  |
| links         | 715  | 715    | 715  |
| configuration | 78   | 78     | 78   |

All 82 populated **content** tables held identical row counts before and after.
That count excludes the `strapi_*` and `admin_*` tables, which is where
configuration lives — the two rows of the table above do not overlap, so both are
true at once.

Configuration converges rather than shedding a row per cycle. An archive
committed earlier carried one extra row,
`plugin_content_manager_configuration_content_types::admin::audit-log` — a view
setting for an Enterprise-only content type that does not exist in this Community
Edition database, so export cannot emit it. It dropped once, on the first export,
and every cycle since has reported 78.

Re-measure these numbers whenever you regenerate the archive. They are a
description of one export, not a guarantee, and every figure here has been wrong
at least once.

## Environment files

- `cp ./apps/strapi/.env.example ./apps/strapi/.env`
- `cp ./apps/next/.env.example ./apps/next/.env`

`pnpm setup` does this automatically. Keep committed env files to demo
placeholders; real secrets belong in your local `.env`, which `.gitignore`
already excludes. If using Next.js draft/preview mode, set a matching
`PREVIEW_SECRET` in both files.

## Strapi MCP server

Strapi's built-in MCP server (`http://localhost:1337/mcp`, project-scoped
`.mcp.json`, name `strapi`) exposes schema-aware content tools. Two separate
settings enable it, and both are opt-in:

- `STRAPI_MCP_ENABLED` in `apps/strapi/.env` turns the endpoint on. It ships
  `false`.
- `STRAPI_MCP_TOKEN` must hold a Strapi Admin token (Settings → Administration
  Panel → Admin Tokens) and lives in your **shell environment**, not in any
  `.env` file — `.mcp.json` interpolates it at session start, which is why a new
  token only takes effect in a newly launched terminal. The token's permissions
  decide which MCP tools exist at all.

The server is only reachable while the Strapi dev server is running; if Claude
Code starts first, `/mcp` shows it failed until you reconnect.

## Strapi docs MCP server

A second, unrelated server sits in the same `.mcp.json` under the name
`strapi-docs` (`https://strapi-docs.mcp.kapa.ai`). It answers questions against
the full published Strapi documentation — guides, API references and code
examples — and is run by Kapa, the service behind the Ask AI button on
docs.strapi.io.

The two are worth keeping straight, because they answer opposite questions:
`strapi` knows **this project's** content and schema; `strapi-docs` knows **the
product**. Neither substitutes for the other, and neither replaces
`packages/strapi-types/generated/*.d.ts` as the authority on our own schema.

It needs no token, but it is OAuth-protected rather than open: the first
connection returns a 401 whose `www-authenticate` header points at
`https://mcp.kapa.ai/auth/public`. Run `/mcp` in Claude Code and authenticate in
the browser it opens. Being remote, it does not depend on the local Strapi
running.

Reach for it before answering a Strapi API question from memory — the model's
training data lags the docs, and 5.x has moved fast.

### Schema questions and data questions are answered by different things

Neither needs a custom MCP capability. #48 proposed building some and was closed
after grilling, because both halves are already covered:

**Schema — what the model _is_.** `packages/strapi-types/generated/*.d.ts`, which
is authoritative and drift-checked by `pnpm check:types-drift`. It is close to
exhaustive: field types and optionality, validation constraints, `draftAndPublish`,
i18n localisation, relation targets, and the **per-content-type dynamic-zone
allowlist** — `api::article.article` permits only `dynamic-zone.related-articles`
and `dynamic-zone.cta`, while pages permit more. Read the file; do not query for
this.

**Data — what actually exists.** A running Strapi:

```sh
curl 'http://localhost:1337/api/pages?filters[slug][$eq]=x&populate=*'
```

Which entries use a given Block, whether seeded data exercises a component, what
a route really returns — all filter queries. The built-in MCP tools do the same
job with auth pre-wired, when the dev server is up.

The one thing neither answers cheaply is what `deepPopulate` will expand for a
content type _before_ you call it, since that lives in custom middleware. Call
the endpoint and look.
