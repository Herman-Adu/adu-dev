# AGENTS.md

Guidance for LLM agents working in this repository.

This file is a **router**, not an encyclopedia. It is read at the start of every
session, so everything here is paid for on every task. Depth lives in
`docs/agents/` and is read only when the task needs it. Adding here rather than
there is how this file silts up.

## Repo overview

adu-dev is a Strapi + Next.js monorepo template. It began as Strapi's LaunchPad
demo and no longer tracks it.

- `apps/strapi/` — Strapi 5 backend, content types, components, seeded demo data,
  SQLite default database.
- `apps/next/` — Next.js 16 App Router frontend, React 19, Tailwind, localized
  `en` and `fr` routes.
- `packages/strapi-types/` — `@repo/strapi-types`, a types-only mirror of the
  backend's generated content-type definitions.
- `packages/eslint-config/` — `@repo/eslint-config`, the shared lint rules.
- Root — a pnpm workspaces root holding the shared toolchain.

The directory is `apps/next`, but the workspace name is **`nextjs`** —
`pnpm --filter` takes the name, not the path.

## Commands

Run from the repo root.

|                                                             |                                               |
| ----------------------------------------------------------- | --------------------------------------------- |
| `pnpm dev`                                                  | both apps                                     |
| `pnpm build` / `pnpm test` / `pnpm typecheck` / `pnpm lint` | both apps, via Turbo                          |
| `pnpm check:format` / `pnpm fix:format`                     | Prettier                                      |
| `pnpm sync:types`                                           | regenerate Strapi types and update the mirror |
| `pnpm check:types-drift`                                    | fail if the committed mirror is stale         |
| `pnpm build:next` / `pnpm build:strapi`                     | one app                                       |
| `pnpm typecheck:next` / `pnpm typecheck:strapi`             | one app                                       |
| `pnpm test:next` / `pnpm test:strapi`                       | one app                                       |
| `pnpm --filter <name> <script>`                             | anything else, per workspace                  |

Add `--force` to make a Turbo task actually execute rather than come from cache.

## Verification

Run the **smallest** check that covers the change, not the full path by reflex:

- Docs-only → `pnpm check:format`
- Next UI/data → `pnpm lint`, `pnpm typecheck:next`, `pnpm test:next`,
  `pnpm build:next`
- Strapi schema/backend → `pnpm check:types-drift`, `pnpm lint`,
  `pnpm typecheck:strapi`, `pnpm test:strapi`, `pnpm build:strapi`
- Full confidence → `check:format`, `check:types-drift`, `lint`, `typecheck`,
  `test`, `build`

`pnpm typecheck` runs `tsc --noEmit` and emits no build output. Run it before the
builds — it is faster and its failures are more specific.

**A new gate must be shown to fail, not only to pass.** Inject a deliberate
failure, watch it fail, revert it, confirm the file is byte-identical, and show
both outcomes in the pull request. Where a threshold is being chosen, publish the
measurement that justified it.

## Coding style

- Prefer small, direct changes over broad refactors.
- Prefer `type` over `interface` unless extending existing interfaces or matching
  local code.
- Prefer `unknown` over `any`; tighten existing broad types incrementally.
- Write comparisons explicitly: `value === undefined`, `value === null`,
  `items.length === 0`, `enabled === true`.
- Keep existing Prettier settings: semicolons, single quotes, 2 spaces, trailing
  commas where valid.
- Let names carry what the code does, and reserve comments for **why** something
  non-obvious is the way it is — not for what it used to be.
- Type against the schema, never around it, and default to Server Components
  with client islands pushed as deep as they go. See
  `docs/agents/content-types.md`.

## Where to look next

Read these when the task calls for them, not before.

| Topic                                                                                                | File                                               |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Read before starting work** — which skill at which step, which are human-only, resource discipline | `docs/agents/workflow.md`                          |
| Schemas, `@repo/strapi-types`, Strapi and Next conventions, testing                                  | `docs/agents/content-types.md`                     |
| pnpm workspaces, install scripts, Turbo, the two React type majors                                   | `docs/agents/monorepo.md`                          |
| CI jobs, `Verify`, branch protection, the only route to `main`                                       | `docs/agents/ci-and-branch-protection.md`          |
| First-run setup, env files, the Strapi MCP server                                                    | `docs/agents/setup.md`                             |
| Issues, via the `gh` CLI                                                                             | `docs/agents/issue-tracker.md`                     |
| Triage labels                                                                                        | `docs/agents/triage-labels.md`                     |
| Domain vocabulary and ADRs                                                                           | `CONTEXT.md`, `docs/adr/`, `docs/agents/domain.md` |

## Working agreement

Pick an unblocked issue, branch, implement, run the gate, open a pull request
that closes the issue, merge with a `Merge PR #N: <title>` commit, delete the
branch. **Never commit to `main`** — the `.husky/pre-commit` hook refuses it.

One concern per pull request. Findings that surface mid-implementation are
welcome: act on them, but keep them to their own commit or their own pull
request, and say in the body what you did **not** do and why. Architectural
choices get an ADR in `docs/adr/`; known gaps get a follow-up issue, referenced
by real number once created.

**Thirteen skills are human-only** and cannot be invoked by an agent — including
`/wayfinder`, `/to-spec`, `/to-tickets`, `/implement` and `/handoff`. When one of
those is the right next step, say so and stop rather than improvising: a
hand-written issue loses the `blocked_by` edges that make the frontier
computable. The full list is in `docs/agents/workflow.md`.

Two habits that carry the most weight here:

- **Prove claims by running them**, not by reading config. Several defects in
  this repo were invisible to inspection and obvious on execution.
- **Open the pull request early as a draft**, and run `/code-review since main`
  before taking it out of draft.
