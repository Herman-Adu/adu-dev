# Spike: can this repo become a true Yarn 4 monorepo?

**Date:** 2026-07-26
**Question:** Can `next/` and `strapi/` become real Yarn workspaces without migrating to pnpm, given they require different React majors?
**Answer:** **Yes — but only with `nmHoistingLimits: workspaces`.** Without it, both apps fail to build.

Run in an isolated copy (`git archive` of tracked files, fresh install), never in the working tree.

## Result

| Check                             | Without hoisting limit   | With `nmHoistingLimits: workspaces` |
| --------------------------------- | ------------------------ | ----------------------------------- |
| `yarn install`                    | exit 0                   | exit 0                              |
| React split (next 19 / strapi 18) | correct                  | correct                             |
| `strapi build`                    | exit 0                   | exit 0                              |
| `next build`                      | **fails — 100 errors**   | **exit 0**, compiled in 5.2s        |
| Vitest (next)                     | **fails to load config** | **exit 0**                          |
| Full suite                        | 2 of 11 tests ran        | **11 of 11 pass**                   |

## What the failures actually were

Two distinct hoisting collisions, both invisible until a fresh workspace install:

**1. Vite major collision.** Strapi's admin panel uses Vite 5; Vitest 4 uses Vite 8. With default hoisting, Vite 5.4.21 won the root and `@vitejs/plugin-react` was hoisted alongside it:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './internal' is not
defined by "exports" in .../node_modules/vite/package.json
imported from .../node_modules/@vitejs/plugin-react/dist/index.js
```

**2. Phantom dependency.** `next`'s nested `postcss` could not resolve `picocolors` once hoisting rearranged the tree — 100 Turbopack errors, all from one missing transitive module.

With `nmHoistingLimits: workspaces`, nothing hoists past a workspace root: `next/` keeps Vite 8, `strapi/` keeps Vite 5, and both resolve their own transitive dependencies. Verified:

```
root   -> vite absent      next -> vite 8.1.5      strapi -> vite 5.4.21
next   react -> 19.2.8     strapi react -> 18.3.1
```

## The false lead worth recording

The first run failed with `TurbopackInternalError: path length ... exceeds max length of filesystem`. That was an artifact of the spike's own deep scratchpad path (242 characters before Turbopack appended more), **not** a workspace problem — re-running at `C:\tmp\ws` made it vanish and exposed the real hoisting failure underneath.

It is still a genuine risk to note: **Windows `MAX_PATH` (260) is a live constraint for this repo.** Moving apps into `apps/next/` and `apps/strapi/` adds depth to every generated artifact path. Enable Windows long-path support, or weigh the depth cost, before restructuring.

## Confirmed: the `resolutions` field breaks

Yarn's documentation states resolutions "can only be set at the root of the project, and will generate a warning if used in any other workspace." `next/package.json` has one. The install confirmed it verbatim:

```
➤ YN0057: │ nextjs: Resolutions field will be ignored
```

Notably, `@types/react` still resolved correctly per workspace **without** it (next 19.2.17, strapi 18.3.31), so the field may simply be droppable rather than needing relocation to the root. Worth confirming before assuming it must be preserved.

## Pre-existing peer warnings (not caused by the conversion)

```
eslint 8.57.1 doesn't satisfy what eslint-config-next requests (^9.7.0)
@react-three/fiber 9.6.1 doesn't satisfy what @react-three/drei requests (^8.0.0)
next 16.2.12 doesn't satisfy what next-view-transitions requests (^14.0.0)
```

The first is issue #1. The other two are upstream LaunchPad drift and out of scope here.

## Conclusion

**Stay on Yarn 4.** The reference implementation ([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)) migrated to pnpm over this exact React conflict, but from Yarn **v1**, which hoists far more aggressively. Yarn 4 with `nodeLinker: node-modules` plus `nmHoistingLimits: workspaces` handles it, and avoids bundling a package-manager migration into an already-substantial change.

Required for the conversion:

1. `workspaces: ["next", "strapi"]` and `private: true` at the root.
2. `nmHoistingLimits: workspaces` in `.yarnrc.yml` — **not optional**; both apps break without it.
3. Delete `next/yarn.lock` and `strapi/yarn.lock`; the root lockfile becomes the single source.
4. Resolve the ignored `resolutions` field in `next/package.json` — drop it if unnecessary, otherwise move it to the root with a parent-scoped descriptor.
