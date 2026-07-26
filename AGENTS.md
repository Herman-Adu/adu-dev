# AGENTS.md

Guidance for LLM agents working in this repository.

## Repo Overview

adu-dev is a Strapi + Next.js monorepo template. It began as Strapi's LaunchPad demo and no longer tracks it.

- `strapi/`: Strapi 5 backend, content types, components, seeded demo data, SQLite default database.
- `next/`: Next.js 16 App Router frontend, React 19, Tailwind, localized `en` and `fr` routes.
- Root: a Yarn 4 workspaces root holding the shared toolchain and the scripts that drive both apps.

Both apps are Yarn workspaces resolved by a single root lockfile. Hoisting is limited to workspaces (`nmHoistingLimits`), which keeps each app on its own dependency versions — the frontend on React 19, the backend on React 18. Removing that setting breaks both apps; see `docs/research/2026-07-26-yarn-workspaces-spike.md`.

## First Read

Before editing, read:

- `README.md`
- `package.json`
- `next/package.json`
- `strapi/package.json`
- Relevant files under `next/app`, `next/components`, `next/lib/strapi`, or `strapi/src`.

## Commands

Run these from the repo root. `yarn workspace <name> <script>` targets one app — the workspaces are named `nextjs` and `strapi`.

- Setup: `yarn setup`
- Dev, both apps: `yarn dev`
- Seed Strapi: `yarn seed`
- Format check: `yarn check:format`
- Format fix: `yarn fix:format`
- Tests, both apps: `yarn test`
- Next dev: `yarn workspace nextjs dev`
- Next build: `yarn workspace nextjs build`
- Strapi dev: `yarn workspace strapi develop`
- Strapi build: `yarn workspace strapi build`

Running a script from inside `next/` or `strapi/` still works; the root commands are the documented path because they need no directory changes.

`yarn workspace nextjs lint` is currently broken upstream — Next 16 removed the `lint` subcommand and `eslint-config-next` is flat-config-only against this app's ESLint 8. Tracked in issue #1, superseded by issue #13.

## Setup

Run once after cloning, from the repo root:

```sh
yarn setup            # installs every workspace, then copies .env files
yarn seed             # imports demo data into SQLite (191 entities, 115 assets)
```

One `yarn install` at the root installs both apps — there is no per-app install step. `yarn setup` runs that install and then copies `.env.example` → `.env` in each app, only where `.env` does not already exist.

`yarn seed` is destructive — it wipes existing data before importing. Re-run it to reset to the demo baseline.

After setup, verify both apps are healthy:

```sh
yarn workspace nextjs build
yarn workspace strapi build
```

The first `yarn workspace strapi develop` will prompt to create a Super Admin at `http://localhost:1337/admin`; the seed does not include admin credentials.

## Environment

Create local env files before running the apps:

- `cp ./strapi/.env.example ./strapi/.env`
- `cp ./next/.env.example ./next/.env`

`yarn setup` does this automatically. Do not commit real secrets. Keep demo placeholders only. If using Next.js draft/preview mode, set a matching `PREVIEW_SECRET` in both files.

## Coding Style

- Prefer small, direct changes over broad refactors.
- Prefer `type` over `interface` unless extending existing interfaces or matching local code.
- Prefer `unknown` over `any`; tighten existing broad types incrementally.
- Use explicit comparisons:
  - Prefer `value === undefined`, `value === null`, `items.length === 0`, `enabled === true`.
  - Avoid relying on broad truthy/falsy checks for new code.
- Keep existing Prettier settings: semicolons, single quotes, 2 spaces, trailing commas where valid.
- Add comments only when they explain non-obvious behavior.

## Strapi Changes

- Update content-type schemas under `strapi/src/api/**/content-types/**/schema.json`.
- Update components under `strapi/src/components/**`.
- When adding a new dynamic-zone component, update both Strapi schema/components and the Next dynamic-zone mapping.
- Be careful with `deepPopulate`: it affects default GET API responses globally.
- The default database is SQLite at `strapi/.tmp/data.db`; do not commit generated database files.

## Next Changes

- App routes live under `next/app/[locale]`.
- Shared Strapi rendering logic lives under `next/lib/shared`.
- UI components live under `next/components`.
- Use the `@/` alias from `next/tsconfig.json`.
- Keep server data fetching in server components/helpers unless interactivity requires a client component.
- When touching localized pages, verify localized slugs and locale switcher behavior.

## Testing

- Framework: Vitest in both apps. Next also uses React Testing Library (`jsdom` environment) for components.
- Tests are co-located with the code they cover: `<name>.test.ts` / `<name>.test.tsx` next to the source file, not in a separate `__tests__` tree.
- Run: `yarn test` from the root for a single pass over both apps (strapi then next). Inside an app, `yarn test` watches and `yarn test:run` is a single pass — there is no `test:run` at the root, because the root script is already single-pass.
- Follow the `/tdd` skill: agree the seam (the public interface under test) before writing a test, assert behavior through that interface only, and use independent literal expected values — never recompute the expectation the way the implementation does.
- Linting the frontend is currently broken upstream (see Commands) — its build and test suite are the correctness gates until issue #13 lands.

## Verification

Choose the smallest useful check for the change:

- Docs-only: `yarn check:format`
- Next UI/data changes: `yarn workspace nextjs build` and `yarn test:next`
- Strapi schema/backend changes: `yarn workspace strapi build` and `yarn test:strapi`
- Full confidence path: `yarn check:format`, then both builds, then `yarn test`

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (Herman-Adu/adu-dev), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### Strapi MCP server

Strapi's built-in MCP server (`http://localhost:1337/mcp`, project-scoped `.mcp.json`, name `strapi`) exposes schema-aware content tools. Two separate settings enable it, and both are opt-in:

- `STRAPI_MCP_ENABLED` in `strapi/.env` turns the endpoint on. It ships `false`.
- `STRAPI_MCP_TOKEN` must hold a Strapi Admin token (Settings → Administration Panel → Admin Tokens) and lives in your **shell environment**, not in any `.env` file — `.mcp.json` interpolates it at session start, which is why a new token only takes effect in a newly launched terminal. The token's permissions decide which MCP tools exist at all.

The server is only reachable while the Strapi dev server is running; if Claude Code starts first, `/mcp` shows it failed until you reconnect. Prefer MCP introspection over guessing content-type shapes when frontend code consumes Strapi data.
