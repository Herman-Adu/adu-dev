# AGENTS.md

Guidance for LLM agents working in this repository.

## Repo Overview

adu-dev is a Strapi + Next.js monorepo template. It began as Strapi's LaunchPad demo and no longer tracks it.

- `apps/strapi/`: Strapi 5 backend, content types, components, seeded demo data, SQLite default database.
- `apps/next/`: Next.js 16 App Router frontend, React 19, Tailwind, localized `en` and `fr` routes.
- `packages/strapi-types/`: `@repo/strapi-types`, a types-only mirror of the backend's generated content-type definitions.
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
- Lint, both apps: `pnpm lint`
- Tests, both apps: `pnpm test`
- Typecheck, both apps: `pnpm typecheck`
- Build, both apps: `pnpm build`
- Next dev: `pnpm --filter nextjs dev`
- Next build: `pnpm build:next`
- Strapi dev: `pnpm --filter strapi develop`
- Strapi build: `pnpm build:strapi`

`build`, `test`, `typecheck` and `lint` run through Turborepo, which hashes each task's inputs and skips what has not changed — a repeat run with nothing touched finishes in milliseconds and prints `FULL TURBO`. Change one app and only that app is rebuilt. See `docs/adr/0004-turborepo-task-runner.md`. Add `--force` to bypass the cache when you need to see a task actually execute.

Inside an app, `pnpm test` is a single pass and `pnpm test:watch` is the watcher. `pnpm dev` is deliberately not a Turbo task: it starts Strapi, waits for port 1337, then starts Next, and Turbo has no equivalent readiness gate.

Running a script from inside `apps/next/` or `apps/strapi/` also works; the root commands are the documented path because they need no directory changes.

Lint rules live in `@repo/eslint-config`: a TypeScript base every workspace uses, plus a frontend layer for the React and Next.js rules. Both apps run ESLint 9 flat config and both lint clean. The strictness was set by measuring what the code already satisfied rather than by picking an ambitious preset — see `docs/adr/0005-shared-lint-config.md`. `@typescript-eslint/no-explicit-any` is deliberately a warning until #15 converts the remaining Block components; #30 promotes it.

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
pnpm build
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

## Content types and the frontend

The frontend consumes the backend's content model through `@repo/strapi-types` rather than reaching into `apps/strapi`. That package is a **mirror**: Strapi generates into `apps/strapi/types/generated` and stays there, because its own `ts:generate-types --help` warns that redirecting the output can break types the platform depends on.

- After changing any schema, run `pnpm sync:types`. It regenerates and updates the mirror in one command, so the two cannot diverge by doing only half the job.
- `pnpm check:types-drift` regenerates and fails if the committed mirror differs. It is part of the verification path for backend changes.
- The mirror is committed on purpose: a content-model change then shows up as a reviewable type diff in the pull request.

The generated files describe **schemas**, not data — `Schema.Attribute.String` is a description of a field, not a `string`. Use the helpers the package exports rather than the raw interfaces:

```ts
import type { Block, Entry, Fieldset } from '@repo/strapi-types';

type Hero = Block<'dynamic-zone.hero'>; // a dynamic-zone entry
type Button = Fieldset<'shared.button'>; // a reusable field group
type Page = Entry<'api::page.page'>; // a content type
```

`apps/next/components/dynamic-zone/hero.tsx` is the worked example. Most other Block components are still untyped; issue #15 converts them.

## Strapi Changes

- Update content-type schemas under `apps/strapi/src/api/**/content-types/**/schema.json`.
- After any schema or component change, run `pnpm sync:types` so `@repo/strapi-types` keeps up.
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
- Run: `pnpm test` from the root for a single pass over both apps, in parallel via Turbo. Inside an app, `pnpm test` is that same single pass and `pnpm test:watch` is the watcher.
- Follow the `/tdd` skill: agree the seam (the public interface under test) before writing a test, assert behavior through that interface only, and write expected values as independent literals so the test states the answer rather than recomputing it.
- Lint, typecheck, build and the test suites are all correctness gates; run the smallest set that covers the change.

## Verification

Choose the smallest useful check for the change:

- Docs-only: `pnpm check:format`
- Next UI/data changes: `pnpm lint`, `pnpm typecheck:next`, `pnpm build:next` and `pnpm test:next`
- Strapi schema/backend changes: `pnpm check:types-drift`, `pnpm lint`, `pnpm typecheck:strapi`, `pnpm build:strapi` and `pnpm test:strapi`
- Full confidence path: `pnpm check:format`, then `pnpm check:types-drift`, then `pnpm lint`, then `pnpm typecheck`, then `pnpm build`, then `pnpm test`

`pnpm typecheck` runs `tsc --noEmit` in each app and emits no build output. Run it before the builds — it is faster and its failures are more specific.

What it does **not** cover, in both cases matching the reference implementation ([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)), whose Strapi app draws the same boundary:

- `apps/strapi/src/admin/` — excluded from the backend `tsconfig.json` so it stays out of the server build. It has its own `tsconfig.json`, which does not currently pass: Strapi's design-system packages pull React 19 types into an app pinned to React 18. Tracked in issue #25. The admin panel is still covered by `pnpm build:strapi`.
- `apps/strapi/**/*.test.ts` — excluded by the same config, to keep tests out of `dist/`. The frontend has no such exclusion, so its tests are typechecked.

## Continuous integration

`.github/workflows/ci.yml` verifies every pull request. It runs only the work a change actually affects, which it works out from Turbo's dependency graph rather than from path globs:

```
change apps/strapi only        -> strapi
change packages/strapi-types   -> @repo/strapi-types, nextjs
```

The second line is the reason globs were not used. `packages/strapi-types` is consumed by the frontend, so a change there has to run the frontend's checks — a per-application path filter would miss that.

Jobs: `format` always runs, because formatting covers docs and config too. `frontend` and `backend` are conditional. `types-drift` runs when either the backend or the shared types package moved, since the mirror can fall out of date from either end.

**Branch protection**: `main` is protected by an active repository ruleset named `main-protection`, targeting the default branch. It requires a pull request (0 approvals), requires the **`Verify`** check, blocks force pushes and restricts deletion. Branches are not forced up to date before merging.

`Verify` is the only required check, and no other job may be added to that list. The per-application jobs are conditional, and GitHub treats a skipped check as blocking rather than passing — requiring them directly would stop every pull request that legitimately skips one. `Verify` always runs, depends on all the others, and fails if any of them failed while tolerating the ones that were skipped.

Two settings that look wrong and are not. Required approvals is **0** because GitHub forbids self-approval, so requiring one would lock a solo maintainer out of their own repository. Admin bypass is `pull_request` mode rather than `always`, so it allows forcing a merge when CI itself is broken but does **not** allow a direct push — pushing to `main` is rejected for the repository admin too.

So the only route to `main` is: branch, open a pull request, wait for `Verify`, then `gh pr merge --merge --delete-branch`. The `.husky/pre-commit` hook enforces the first step locally, refusing a commit while `main` is checked out so the mistake costs a second rather than a rejected push.

To see a task actually execute rather than come from cache, add `--force`.

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
