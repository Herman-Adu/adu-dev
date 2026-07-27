# Monorepo mechanics

Read when adding a dependency, touching workspace wiring, or when a resolution
looks wrong. Not needed for ordinary feature work.

## Workspaces

Both apps are pnpm workspaces matched by the `apps/*` glob in
`pnpm-workspace.yaml` and resolved by a single root lockfile. The directory is
`apps/next`, but the workspace name is **`nextjs`** — `pnpm --filter` takes the
name, not the path.

pnpm's isolated `node_modules` gives each app its own dependency versions by
default — the frontend on React 19, the backend on React 18 — with no hoisting
configuration to maintain and no root `.npmrc`. **A package a workspace does not
declare is a package it cannot import**, which is the point: see
`docs/adr/0002-pnpm-not-yarn.md` for why this was chosen over Yarn 4, and
`docs/research/2026-07-26-pnpm-workspaces-spike.md` for the evidence.

That rule has already caught real defects — see #20, where the Strapi admin
imported `@strapi/design-system` without declaring it, so the package was absent
from `apps/strapi/node_modules` entirely.

## Install scripts

pnpm blocks dependency install scripts by default. `onlyBuiltDependencies` in
`pnpm-workspace.yaml` lists the five packages that genuinely need to build or
link a native binary. Adding a dependency with a native component means adding it
there too; a package whose install script only prints a banner belongs off that
list, and pnpm will keep reporting it as ignored, which is the intended steady
state.

## Task running

`build`, `test`, `typecheck` and `lint` run through Turborepo, which hashes each
task's inputs and skips what has not changed — a repeat run with nothing touched
finishes in milliseconds and prints `FULL TURBO`. Change one app and only that
app is rebuilt. See `docs/adr/0004-turborepo-task-runner.md`. Add `--force` to
bypass the cache when you need to see a task actually execute.

`pnpm dev` is deliberately **not** a Turbo task: it starts Strapi, waits for port
1337, then starts Next, and Turbo has no equivalent readiness gate.

## Lint configuration

Lint rules live in `@repo/eslint-config`: a TypeScript base every workspace uses,
plus a frontend layer for the React and Next.js rules. Both apps run ESLint 9
flat config and both lint clean. The strictness was set by measuring what the code
already satisfied rather than by picking an ambitious preset — see
`docs/adr/0005-shared-lint-config.md`.

## Two `@types/react` majors, and why that is correct

The frontend runs React 19 and the backend React 18 — the split pnpm gives us by
design. The Strapi admin panel's own dependency tree is cleanly React 18
throughout; the second copy leaks in only through
`node_modules/.pnpm/node_modules/`, pnpm's **hidden hoist directory**, which holds
exactly one version and holds 19 because the frontend needs it. Packages resolved
from inside the virtual store, such as `@strapi/icons`, fall back to that
directory when TypeScript looks up types for `react`.

The admin `tsconfig.json` therefore pins `react` and `react-dom` through `paths`
to the app's own copies. **Do not "fix" this with a pnpm `overrides` entry**:
nothing in the Strapi dependency graph resolves React 19, so there is no edge to
override, and forcing the hoist would break the frontend. See
`docs/adr/0006-admin-typecheck-react-types.md`.

## Typecheck scope

The Strapi app typechecks **two** projects, because its admin panel is
deliberately excluded from the backend `tsconfig.json` so it stays out of the
server build. `pnpm --filter strapi typecheck` runs the backend config and then
`src/admin/tsconfig.json`; `pnpm --filter strapi typecheck:admin` runs the admin
alone. Both are covered by `pnpm typecheck`.

What `pnpm typecheck` still does **not** cover: `apps/strapi/**/*.test.ts`,
excluded by the backend config to keep tests out of `dist/`. The frontend has no
such exclusion, so its tests are typechecked.

The reference implementation
([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter))
excludes its admin panel from typechecking entirely. This repository diverges
deliberately: the admin is where a type-level bug has already shipped here, so it
is the last place worth leaving unchecked.
