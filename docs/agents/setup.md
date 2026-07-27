# Setup and environment

Needed once per clone. Not needed to make a change in an already-working
checkout — see `AGENTS.md` for the day-to-day commands.

## First run

From the repo root:

```sh
pnpm setup            # installs every workspace, then copies .env files
pnpm seed             # imports demo data into SQLite (191 entities, 115 assets)
```

One `pnpm install` at the root installs both apps — there is no per-app install
step. `pnpm setup` runs that install and then copies `.env.example` → `.env` in
each app, only where `.env` does not already exist.

`pnpm seed` is **destructive** — it wipes existing data before importing. Re-run
it to reset to the demo baseline.

Verify both apps are healthy afterwards:

```sh
pnpm build
```

The first `pnpm --filter strapi develop` prompts to create a Super Admin at
`http://localhost:1337/admin`; the seed does not include admin credentials.

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
Code starts first, `/mcp` shows it failed until you reconnect. Prefer MCP
introspection over guessing content-type shapes when frontend code consumes
Strapi data.
