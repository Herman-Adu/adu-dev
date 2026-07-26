# AGENTS.md

Guidance for LLM agents working in this repository.

## Repo Overview

adu-dev is a Strapi + Next.js monorepo template. It began as Strapi's LaunchPad demo and no longer tracks it.

- `apps/strapi/`: Strapi 5 backend, content types, components, seeded demo data, SQLite default database.
- `apps/next/`: Next.js 16 App Router frontend, React 19, Tailwind, localized `en` and `fr` routes.
- Root: a pnpm workspaces root holding the shared toolchain and the scripts that drive both apps.

Both apps are pnpm workspaces matched by the `apps/*` glob in `pnpm-workspace.yaml` and resolved by a single root lockfile. The directory is `apps/next`, but the workspace name is `nextjs` — `pnpm --filter` takes the name, not the path. pnpm's isolated `node_modules` gives each app its own dependency versions by default — the frontend on React 19, the backend on React 18 — with no hoisting configuration to maintain and no root `.npmrc`. A package a workspace does not declare is a package it cannot import, which is the point: see `docs/adr/0002-pnpm-not-yarn.md` for why this was chosen over Yarn 4, and `docs/research/2026-07-26-pnpm-workspaces-spike.md` for the evidence.

pnpm blocks dependency install scripts by default. `onlyBuiltDependencies` in `pnpm-workspace.yaml` lists the five packages that genuinely need to build or link a native binary. Adding a dependency with a native component means adding it there too; a package whose install script only prints a banner belongs off that list, and pnpm will keep reporting it as ignored, which is the intended steady state.

## First Read

Before editing, read:

- `README.md`
- `package.json`
- `apps/next/package.json`
- `apps/strapi/package.json`
- Relevant files under `apps/next/app`, `apps/next/components`, `apps/next/lib/strapi`, or `apps/strapi/src`.

## Commands

Run these from the repo root. `pnpm --filter <name> <script>` targets one app — the workspaces are named `nextjs` and `strapi`.

- Setup: `pnpm setup`
- Dev, both apps: `pnpm dev`
- Seed Strapi: `pnpm seed`
- Format check: `pnpm check:format`
- Format fix: `pnpm fix:format`
- Tests, both apps: `pnpm test`
- Next dev: `pnpm --filter nextjs dev`
- Next build: `pnpm --filter nextjs build`
- Strapi dev: `pnpm --filter strapi develop`
- Strapi build: `pnpm --filter strapi build`

Running a script from inside `apps/next/` or `apps/strapi/` also works; the root commands are the documented path because they need no directory changes.

`pnpm --filter nextjs lint` is currently broken upstream — Next 16 removed the `lint` subcommand and `eslint-config-next` is flat-config-only against this app's ESLint 8. Tracked in issue #13, which replaces it with a shared flat config.

## Setup

Run once after cloning, from the repo root:

```sh
pnpm setup            # installs every workspace, then copies .env files
pnpm seed             # imports demo data into SQLite (191 entities, 115 assets)
```

One `pnpm install` at the root installs both apps — there is no per-app install step. `pnpm setup` runs that install and then copies `.env.example` → `.env` in each app, only where `.env` does not already exist.

`pnpm seed` is destructive — it wipes existing data before importing. Re-run it to reset to the demo baseline.

After setup, verify both apps are healthy:

```sh
pnpm --filter nextjs build
pnpm --filter strapi build
```

The first `pnpm --filter strapi develop` will prompt to create a Super Admin at `http://localhost:1337/admin`; the seed does not include admin credentials.

## Environment

Create local env files before running the apps:

- `cp ./apps/strapi/.env.example ./apps/strapi/.env`
- `cp ./apps/next/.env.example ./apps/next/.env`

`pnpm setup` does this automatically. Keep committed env files to demo placeholders; real secrets belong in your local `.env`, which `.gitignore` already excludes. If using Next.js draft/preview mode, set a matching `PREVIEW_SECRET` in both files.

## Coding Style

- Prefer small, direct changes over broad refactors.
- Prefer `type` over `interface` unless extending existing interfaces or matching local code.
- Prefer `unknown` over `any`; tighten existing broad types incrementally.
- Write comparisons explicitly, so the intended check is visible where it happens: `value === undefined`, `value === null`, `items.length === 0`, `enabled === true`.
- Keep existing Prettier settings: semicolons, single quotes, 2 spaces, trailing commas where valid.
- Let names carry what the code does, and reserve comments for why something non-obvious is the way it is.

## Strapi Changes

- Update content-type schemas under `apps/strapi/src/api/**/content-types/**/schema.json`.
- Update components under `apps/strapi/src/components/**`.
- When adding a new dynamic-zone component, update both Strapi schema/components and the Next dynamic-zone mapping.
- `deepPopulate` shapes every default GET API response, so weigh any change to it against both apps.
- The default database is SQLite at `apps/strapi/.tmp/data.db`. Keep generated database files local; `.gitignore` already covers them.

## Next Changes

- App routes live under `apps/next/app/[locale]`.
- Shared Strapi rendering logic lives under `apps/next/lib/shared`.
- UI components live under `apps/next/components`.
- Use the `@/` alias from `apps/next/tsconfig.json`.
- Keep server data fetching in server components/helpers unless interactivity requires a client component.
- When touching localized pages, verify localized slugs and locale switcher behavior.
- `turbopack.root` in `apps/next/next.config.mjs` resolves the repo root two levels up from that file. Moving the app means updating that depth in the same change.

## Testing

- Framework: Vitest in both apps. Next also uses React Testing Library (`jsdom` environment) for components.
- Tests are co-located with the code they cover: `<name>.test.ts` / `<name>.test.tsx` next to the source file, not in a separate `__tests__` tree.
- Run: `pnpm test` from the root for a single pass over both apps (strapi then next). Inside an app, `pnpm test` watches and `pnpm test:run` is a single pass — there is no `test:run` at the root, because the root script is already single-pass.
- Follow the `/tdd` skill: agree the seam (the public interface under test) before writing a test, assert behavior through that interface only, and write expected values as independent literals so the test states the answer rather than recomputing it.
- Linting the frontend is currently broken upstream (see Commands) — its build and test suite are the correctness gates until issue #13 lands.

## Verification

Choose the smallest useful check for the change:

- Docs-only: `pnpm check:format`
- Next UI/data changes: `pnpm --filter nextjs build` and `pnpm test:next`
- Strapi schema/backend changes: `pnpm --filter strapi build` and `pnpm test:strapi`
- Full confidence path: `pnpm check:format`, then both builds, then `pnpm test`

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (Herman-Adu/adu-dev), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root plus `docs/adr/`. Both apps speak one language about the same things, so the glossary stays at the root rather than splitting per app — see `docs/adr/0003-single-context-glossary.md`. See `docs/agents/domain.md`.

### Strapi MCP server

Strapi's built-in MCP server (`http://localhost:1337/mcp`, project-scoped `.mcp.json`, name `strapi`) exposes schema-aware content tools. Two separate settings enable it, and both are opt-in:

- `STRAPI_MCP_ENABLED` in `apps/strapi/.env` turns the endpoint on. It ships `false`.
- `STRAPI_MCP_TOKEN` must hold a Strapi Admin token (Settings → Administration Panel → Admin Tokens) and lives in your **shell environment**, not in any `.env` file — `.mcp.json` interpolates it at session start, which is why a new token only takes effect in a newly launched terminal. The token's permissions decide which MCP tools exist at all.

The server is only reachable while the Strapi dev server is running; if Claude Code starts first, `/mcp` shows it failed until you reconnect. Prefer MCP introspection over guessing content-type shapes when frontend code consumes Strapi data.
