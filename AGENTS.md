# AGENTS.md

Guidance for LLM agents working in this repository.

## Repo Overview

LaunchPad is the official Strapi demo app.

- `strapi/`: Strapi 5 backend, content types, components, seeded demo data, SQLite default database.
- `next/`: Next.js 15 App Router frontend, React 19, Tailwind, localized `en` and `fr` routes.
- Root: workspace-level setup/dev/format scripts using Yarn 4.5.0.

## First Read

Before editing, read:

- `README.md`
- `package.json`
- `next/package.json`
- `strapi/package.json`
- Relevant files under `next/app`, `next/components`, `next/lib/strapi`, or `strapi/src`.

## Commands

Run commands from the correct directory.

- Root setup: `yarn setup`
- Root dev: `yarn dev`
- Seed Strapi: `yarn seed`
- Format check: `yarn check:format`
- Format fix: `yarn fix:format`
- Next dev: `cd next && yarn dev`
- Next build: `cd next && yarn build`
- Next lint: `cd next && yarn lint`
- Strapi dev: `cd strapi && yarn develop`
- Strapi build: `cd strapi && yarn build`

## Setup

Run once after cloning, from the repo root:

```sh
yarn install          # install root workspace deps first
yarn setup            # installs next/ and strapi/ deps, copies .env files
yarn seed             # imports demo data into SQLite (191 entities, 115 assets)
```

`yarn setup` calls `setup:next` and `setup:strapi` in sequence. Each sub-script runs `yarn` in the sub-directory then copies `.env.example` → `.env` only if `.env` does not already exist.

`yarn seed` is destructive — it wipes existing data before importing. Re-run it to reset to the demo baseline.

After setup, verify both apps are healthy:

```sh
cd next && yarn build
cd strapi && yarn build
```

First `yarn develop` in `strapi/` will prompt to create a Super Admin at `http://localhost:1337/admin`; the seed does not include admin credentials.

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
- Run: `yarn test` (root, runs strapi then next), `cd next && yarn test`, or `cd strapi && yarn test` (add `:run` for a single non-watch pass, e.g. `yarn test:run`).
- Follow the `/tdd` skill: agree the seam (the public interface under test) before writing a test, assert behavior through that interface only, and use independent literal expected values — never recompute the expectation the way the implementation does.
- `cd next && yarn lint` is currently broken upstream (Next 16 removed the `lint` subcommand; tracked in issue #1) — `yarn build` is the only frontend correctness gate until that's fixed.

## Verification

Choose the smallest useful check for the change:

- Docs-only: `yarn check:format`
- Next UI/data changes: `cd next && yarn build && yarn test:run`
- Strapi schema/backend changes: `cd strapi && yarn build && yarn test:run`
- Full confidence path: `yarn check:format`, `cd next && yarn build && yarn test:run`, `cd strapi && yarn build && yarn test:run`

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (Herman-Adu/adu-dev), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### Strapi MCP server

Strapi's built-in MCP server (`http://localhost:1337/mcp`, project-scoped `.mcp.json`, name `strapi`) exposes schema-aware content tools gated by an Admin API token in the `STRAPI_MCP_TOKEN` environment variable. Enabled per-environment via `STRAPI_MCP_ENABLED` in `strapi/.env`; requires the Strapi dev server running. Prefer MCP introspection over guessing content-type shapes when frontend code consumes Strapi data.
