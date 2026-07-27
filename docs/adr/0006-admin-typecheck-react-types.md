# Pin React types in the admin tsconfig, not in the dependency graph

`apps/strapi/src/admin/` was typechecked by nothing. It is excluded from the backend `tsconfig.json` so admin code stays out of the server build, and its own `tsconfig.json` failed with 26 errors — 24 of them `TS2786: 'X' cannot be used as a JSX component`, React-18 JSX checked against React-19 component types. We make the admin panel's own `tsconfig.json` pin `react` and `react-dom` through `compilerOptions.paths` to the app's own copies, and add it to `pnpm typecheck` as a second project.

## The conflict is a resolution fallback, not a dependency edge

This matters because it determines which fixes can possibly work, and the obvious one cannot.

The Strapi dependency tree is **cleanly React 18 throughout** — `pnpm --filter strapi why @types/react` reports `18.3.31` at every node, and `apps/strapi/node_modules/@types/react` is `18.3.31`. No parent-child edge in that graph resolves React 19.

The second copy is reachable another way. `node_modules/.pnpm/node_modules/` is pnpm's hidden hoist directory, a flat fallback that holds exactly **one** version of each package. It holds `@types/react@19.2.17`, because the frontend's `@react-three/fiber` and `zustand` demand React 19. Packages that live inside the virtual store — `@strapi/icons` among them — have no `@types/react` sibling of their own, so when TypeScript resolves `react` from inside their `.d.ts` files it walks up and lands in that directory. The types arrive through a filesystem fallback that no manifest describes.

## Considered Options

**A pnpm `overrides` entry with a `parent>child` selector**, which is what issue #25 proposed first, and the natural instinct. We rejected it because there is no edge for it to bind to: nothing in the Strapi graph resolves React 19, so the selector has nothing to match. Making it work would mean forcing the _global_ hoist to React 18 — which would break the frontend, an app that legitimately runs React 19. The fix would reach across the whole repository to correct a problem confined to one directory.

**Restricting the admin config with `types` / `typeRoots`.** This governs automatic `@types` inclusion, and automatic inclusion is not the leak — verified: the repository root holds only `@types/node`, and `apps/strapi/node_modules/@types/react` is already 18. Nothing would change.

**Leaving the admin unchecked, as the reference implementation does.** [notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter) excludes its admin panel from typechecking, so this would be the conventional choice and needs no argument to defend. We diverge deliberately. `src/admin/app.tsx` is the file whose undeclared `@strapi/icons` import was the headline defect of #19 — the admin is where this repository has already shipped a type-level bug, which makes it the last place worth leaving unchecked rather than the easiest place to skip.

`paths` was chosen because its blast radius matches the problem's. It changes what one `tsc` invocation resolves, and nothing else: not installation, not the runtime tree, not the build, not the frontend.

## Consequences

`apps/strapi` typechecks two projects. `typecheck` runs the backend config and then the admin config; `typecheck:admin` runs the admin alone. `turbo.json` needs no change — the `typecheck` task declares no `inputs`, so admin files already participate in its hash.

**Two `@types/react` majors remain reachable in this repository, and that is correct.** The monorepo genuinely hosts React 19 on the frontend and React 18 on the backend; that split is the point of pnpm's isolated `node_modules`, per `0002-pnpm-not-yarn.md`. What the `paths` pin guarantees is narrower and sufficient: only React 18 types are reachable _from the admin's typecheck_.

The gate was proven in both directions. A deliberate type error in `src/admin/app.tsx` fails `pnpm --filter strapi typecheck` with `TS2322`, while the previous gate — the backend config alone — reported **zero** errors against that same file, which is precisely the blindness this removes.

Turning the gate on immediately found two real defects that had been invisible. A `@ts-expect-error` in `app.tsx` was suppressing an error that no longer occurred, once #20 declared `@strapi/admin` and the real types became reachable. And `DemoWidget.tsx` passed `as="h2"` to `Typography`, whose v2 types declare `as?: never` because the prop was renamed to `tag` — so the heading was silently rendering as a `<span>`, an accessibility defect that no build or lint run would have reported.

The pin is written as relative paths from the admin directory to `apps/strapi/node_modules`. Moving the admin panel means updating that depth, the same constraint `turbopack.root` carries in the frontend.
