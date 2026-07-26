# Use pnpm, not Yarn 4

This repo is a template that gets cloned into client projects, so a resolver that refuses to guess is worth more than one that warns. pnpm's isolated `node_modules` found three real defects that Yarn 4 tolerated — an undeclared `@strapi/icons` import in our own admin code, a phantom `vite` peer that Vitest needed and nothing provided, and a `turbopack.root` that had never worked on Windows. All three were dependency landmines that surface on someone else's machine or in CI rather than on the author's. We adopt **pnpm** as the package manager for both workspaces, and we do it before the apps move under `apps/` (#10).

## Considered Options

Staying on Yarn 4 is the honest alternative and it is not free to reject: it works, it is proven here, and migration costs the lockfile, every script, the documentation, and eventually CI. We rejected it because the cost only rises — the shared types package (#12) and CI (#14) both encode package-manager assumptions, so the cheapest moment to switch is while only the workspace conversion has landed.

The main risk was Strapi, which is widely assumed to need a hoisted layout. It does not: the admin panel builds and runs under pnpm's default isolated layout with **no `.npmrc` escape hatch** — no `shamefully-hoist`, no `node-linker=hoisted`. The reference implementation ([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)) also ships without a root `.npmrc`, which corroborates it.

Disk was considered and deliberately did **not** decide this. The per-project saving is real but unremarkable for one repository in isolation; it only compounds across an agency's worth of cloned templates.

## Consequences

`pnpm-workspace.yaml` replaces the `workspaces` field in the root `package.json`, and `.yarnrc.yml` and `yarn.lock` are removed. Every script that says `yarn workspace <name>` becomes `pnpm --filter <name>`, in `package.json`, `README.md`, and `AGENTS.md`. The `nmHoistingLimits: workspaces` setting that kept the React 19/18 split intact is no longer needed — pnpm's isolated layout gives that for free.

pnpm gates dependency install scripts, so `onlyBuiltDependencies` must name the ones we allow. pnpm reports nine ignored scripts; only five are approved — `@swc/core`, `better-sqlite3`, `esbuild`, `sharp`, `unrs-resolver` — because those are the ones that build or link a native binary. `@tsparticles/engine` and `core-js-pure` are deliberately excluded: their scripts print a thank-you banner and a donation notice respectively, and both packages work correctly with them blocked. Approving only what needs it keeps the install-time execution surface minimal, which is the security half of the same argument that chose pnpm. Moving the backend to Postgres would drop `better-sqlite3` from the list.

Validated end to end before adopting — install, both builds, 11 tests, both dev servers, the admin panel, `/mcp`, and hot reload on both sides. See `docs/research/2026-07-26-pnpm-workspaces-spike.md`.
