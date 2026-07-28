# React types resolve from the workspace root, so the hidden hoist never arbitrates

`@types/react` and `@types/react-dom` are declared as devDependencies of the
**workspace root**. That is the whole change. It stops
`node_modules/.pnpm/node_modules/` — pnpm's hidden hoist directory — from
deciding which React major the frontend compiles against, which it had been
doing nondeterministically and getting wrong roughly half the time.

## The failure this removes

The `Frontend` CI job failed on two commits and passed on a re-run of the
identical commit: `main` at the merge of PR #55 (22 errors) and PR #63's first
attempt (10 errors). Different lockfiles, identical signature — every React Three
Fiber JSX intrinsic vanishing at once as `TS2339`, alongside
`ComponentType<any> is not assignable to ComponentType<any>`.

The hidden hoist directory holds exactly **one** version of each package, chosen
by graph-traversal order rather than by the lockfile. `--frozen-lockfile` does
not make it deterministic. Seventeen packages in the frontend's graph — including
`next`, `framer-motion`, `@headlessui/react` and `@react-three/fiber` — depend on
`react` without depending on `@types/react`, so pnpm gives them no types sibling
and TypeScript walks up into that directory from inside their `.d.ts` files.
Because this repository hosts React 19 on the frontend and React 18 on the
backend deliberately, whichever major won that one slot leaked into every
compilation reaching those seventeen.

`0006-admin-typecheck-react-types.md` documented the same directory as the
admin panel's leak path. This is that finding's mirror image: when 19 wins, the
admin breaks; when 18 wins, the frontend does.

## Why a root devDependency, of all things

pnpm hoists into the hidden directory only what is not already resolvable from
the real root `node_modules`. Declaring the types at the root therefore puts them
in `node_modules/@types/react` and **stops pnpm creating the ambiguous slot at
all** — measured, not assumed: after a clean `--frozen-lockfile` install,
`node_modules/.pnpm/node_modules/@types/react` does not exist.

The per-app siblings are untouched — `apps/next` keeps 19, `apps/strapi` keeps 18
— because real dependency edges are always linked. Hoisting was only ever the
fallback for undeclared access, and it is undeclared access that this fixes.

## Considered and rejected, each on evidence

**Mirroring 0006's `paths` pin into the frontend**, the obvious symmetry. Tested
with the hoist deliberately poisoned to 18: all nine `TS2339` remained and the
`TS2322`s merely reversed polarity. `paths` governs the app's own imports; the
leak is inside third-party `.d.ts` in the virtual store, which it cannot reach.
0006's pin worked for the admin because there the admin's _own_ files resolved
wrong.

**`packageExtensions`, to give each package a real `@types/react` edge.** The
measurement killed it: seventeen packages, a list that regrows with every
dependency added.

**`hoistPattern`, excluding the React types from the hoist.** This works, and was
implemented first. It was withdrawn because it is redundant — the root
devDependency alone already removes the slot — and because it would have made
this the repository's first hoisting configuration, falsifying a property
`docs/agents/monorepo.md` and `0002-pnpm-not-yarn.md` both advertise.

**A global `overrides` entry.** Already rejected by 0006, and still right: the two
majors are legitimate, forcing one breaks the other app, and it would now also
collide with the admin's own pin.

## What this does not promise

The fix is **preventive, not immune**. TypeScript's walk-up still consults the
hidden hoist directory _before_ the repository root, so a copy planted there by
hand would still win — verified by planting one, which reproduces the original
failure exactly. What changes is that pnpm no longer creates it. That is
sufficient, because pnpm is what builds the tree, but it is a weaker guarantee
than "resolution is now immune" and should not be described as one.

The caret range `^19.2.0` tracks the frontend's own declaration rather than
pinning an exact version. If the two ever need to diverge, this is the record to
revisit.

## Consequences

`node_modules/.pnpm/node_modules/` no longer holds `@types/react` or
`@types/react-dom` after a clean install. The full gate passes on a freshly
removed tree installed with CI's exact command, including all three typecheck
projects and the Strapi admin.

Adding a React types major to either app now means considering the root
declaration too, which is a real maintenance edge this record exists to make
visible.
