# Spike: should this repo use pnpm instead of Yarn 4?

**Date:** 2026-07-26
**Question:** Is pnpm a better fit than Yarn 4 for this monorepo, now that both apps are workspaces?
**Answer:** **Yes — and the deciding argument is not disk or speed. It is that pnpm found three real bugs in this repository that Yarn silently tolerated.**

Run in an isolated `git archive` copy at a short path, never in the working tree.

## Result

Everything passes under pnpm: 11 tests, both builds, React 19/18 split intact — but only after four changes. Two are pnpm configuration. **Three are genuine latent defects that should be fixed whatever package manager we use.**

| Change                                      | Nature                                           |
| ------------------------------------------- | ------------------------------------------------ |
| `onlyBuiltDependencies` for native packages | pnpm config — its build-script gate              |
| `turbopack.root` set from the config file   | **Real bug** — Windows path handling             |
| Declare `vite` in both apps                 | **Real bug** — phantom dependency                |
| Declare `@strapi/icons` in the backend      | **Real bug** — undeclared import in our own code |

## The three real bugs

**1. `@strapi/icons` was never declared.** `strapi/src/admin/app.tsx` opens with `import { Information } from '@strapi/icons'`, and nothing in `strapi/package.json` declares it. It resolved only because `@strapi/admin` pulls it in transitively and a hoisted layout makes that reachable. Under pnpm the admin build fails outright:

```
[vite]: Rollup failed to resolve import "@strapi/icons" from "strapi/src/admin/app.tsx"
```

This is a real dependency on a package we never asked for. A change to Strapi's own dependency tree could remove it without warning.

**2. Nothing declared a `vite` that Vitest can use.** Vitest 4 requires `vite ^6 || ^7 || ^8`. The only `vite` in the tree was Strapi's **5.4.21**, and pnpm satisfied Vitest's peer with it — a version that does not satisfy the range:

```
ERR_PACKAGE_PATH_NOT_EXPORTED: './module-runner' is not defined by "exports" in .../vite/package.json
```

Yarn reported the same defect as a warning nobody acts on: `YN0002: nextjs@workspace:next doesn't provide vite, requested by @vitejs/plugin-react`. Declaring `vite ^8` in both apps fixes it, and both majors then coexist — 8.1.5 for Vitest, 5.4.21 for Strapi's admin, isolated from each other.

**3. `turbopack.root` never worked on Windows.** The config read:

```js
root: process.cwd().replace('/next', '');
```

`process.cwd()` returns `C:\tmp\pn\next` on Windows, with backslashes, so the replace matches nothing and the root stays wrong. Next's hoisted-layout inference papered over it; under pnpm's symlinks the build fails. Now resolved from the config file itself, which is correct on any platform and from any working directory.

**None of these are pnpm's fault. pnpm is simply the tool that refuses to guess.**

## Disk

The current Yarn tree costs **1.9 GB** for this one project — 88 MB root, 1017 MB frontend, 829 MB backend — and a second clone costs the same again.

Under pnpm the per-app directories are **116 KB and 72 KB**: symlinks only. The virtual store reports 1.6 GB, but that figure is misleading, because those files are hard links into the global store. Verified directly — the link count on a store file is 2, meaning the project's copy and the store entry are the same bytes on disk:

```
2 node_modules/.pnpm/react@19.2.8/node_modules/react/package.json
```

So a second project sharing these dependencies costs close to nothing. Across an agency's worth of cloned templates, that compounds; for one repository in isolation it is unremarkable.

## Timings

A warm reinstall from a populated store took **26 seconds**. No clean Yarn comparison under identical conditions was taken, so no performance claim is made either way — both are fast enough that this should not decide the choice.

## What did not go wrong

Worth recording, because it was the main risk: **Strapi needs no `.npmrc` escape hatch.** No `shamefully-hoist`, no `node-linker=hoisted`. Its admin panel builds under pnpm's default isolated layout once the undeclared import is declared. The reference implementation ([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)) also ships without a root `.npmrc`, which corroborates it.

The `better-sqlite3` native module rebuilt correctly once allowed through the build gate. Note that moving the backend to Postgres would remove that native dependency from the approval list entirely.

## Recommendation

**Adopt pnpm, and do it before the apps move.**

The argument is correctness, not disk. Three defects had been sitting in this repository — two of them dependency landmines that surface on someone else's machine or in CI rather than on the author's — and a strict package manager surfaced all three in twenty minutes. For a template that will be cloned into client projects, a resolver that refuses to guess is worth more than one that warns.

The counter-argument is honest: Yarn 4 works, it is proven here, and migration costs a lockfile, every script, the documentation and eventually CI. But the cost only rises — the shared types package and CI both encode package-manager assumptions, so the cheapest moment to switch is now, with only the workspace conversion landed.

**Fix the three real bugs regardless of the outcome.** They are defects today, on Yarn, and they do not depend on this decision.
