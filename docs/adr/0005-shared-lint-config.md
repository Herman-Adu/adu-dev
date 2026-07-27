# Share one lint config, and set its strictness by measurement

Lint rules live in `@repo/eslint-config`: a TypeScript base every workspace uses, plus a frontend layer carrying the React and Next.js rules. A rule is agreed once rather than configured twice. The frontend runs ESLint 9 flat config; the legacy `.eslintrc.json` is gone, and the backend — which had never been linted at all, with no config, no script and no dependency — is now covered by the same base.

How strict that base is was decided by running it, not by argument. The first report-only pass reported **60 errors and 76 warnings**: 33 errors and 75 warnings in the frontend, 27 errors and 1 warning in the backend. That is a small enough number to fix inside one ticket, so it was fixed, and both applications now lint clean.

## Considered Options

Adopting the reference implementation's config wholesale was the obvious shortcut. [notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter) runs roughly twenty plugins — `unicorn`, `sonarjs`, `import-x`, `jsx-a11y`, `@stylistic` and more — and its structure is what this package copies: a shared package, a base plus a layer, flat config throughout. We took the structure and declined the rule set, because that set is calibrated against a codebase that has been linted continuously. Dropped onto a backend that had never been linted, it produces a number nobody triages, and the usual outcome is a blanket suppression that makes the config decorative. Tightening toward it is #30, one deliberate step at a time.

The alternative to a shared package is per-app configs. Rejected because the two applications already disagreed: the frontend had `next/core-web-vitals` and the backend had nothing, which is how the backend accumulated 27 errors unnoticed.

`@next/eslint-plugin-next` is used directly rather than `eslint-config-next`. Next 16 removed the `next lint` subcommand, and that wrapper was the piece that would not load under this app's linter — the plugin beneath it carries the rules and composes cleanly into flat config.

Configuration exists in two places for one reason worth stating. The root `eslint.config.mjs` scopes the frontend layer by path (`apps/next/**`); each app's config applies it to everything, because that app is the working directory. ESLint resolves `files` patterns against the working directory, so a single pattern cannot be correct from both. Both compose the same exports from `@repo/eslint-config`, so the scoping differs but the rules cannot.

## Consequences

`pnpm lint` runs through Turbo across both applications; each app also has its own `lint` and `lint:fix`. Lint is in the documented verification path, and the pre-commit hook runs ESLint on staged files again — it had been reduced to formatting only precisely because the command it called was broken.

Three deliberate exemptions, each narrow and each with a reason rather than a blanket off switch:

- Generated Strapi types and the `@repo/strapi-types` mirror are ignored. Linting generated output reports problems that cannot be fixed at the source.
- `*.example.*` files are ignored. They are scaffolding Strapi ships for developers to copy, never imported and never built.
- `@typescript-eslint/no-require-imports` is off for config files and `scripts/`. Tailwind resolves plugins with `require()` by convention and Strapi's scripts are plain CommonJS run by `node`; in both cases the import style is imposed by the tool.

## The ratchet (#30)

The starting point above was chosen to be survivable, not final. #30 tightened it once #15 had converted the frontend, and kept the same rule: **measure first, publish the count, and give every exemption a reason.**

| Rule                                 | Measured before enabling                       | Now   |
| ------------------------------------ | ---------------------------------------------- | ----- |
| `@typescript-eslint/no-explicit-any` | 73 warnings at #13, **0** after #15            | error |
| `react-hooks/exhaustive-deps`        | **6** violations, hidden behind 3 suppressions | error |
| `jsx-a11y` recommended               | **2** violations, both `media-has-caption`     | error |
| `unused-imports/no-unused-imports`   | **0** violations                               | error |

`exhaustive-deps` is the one that mattered. Three files suppressed it, one with a **file-wide** `/* eslint-disable */`, hiding six real findings. Two were fixed outright — a search result mirrored into state by an effect became derived state, and a `getUniforms` rebuilt every render became a `useCallback`, which had been silently defeating the memo below it. The four in `globe.tsx` are three.js lifecycle and are now disabled per line, each naming its specific hazard, rather than by a blanket at the top of the file.

Promoting that rule needed #41's work first, and the ordering was not obvious. The testimonials slider only wrapped correctly _because_ `active` sat in its dependency array; removing it — exactly what a newly-strict rule invites — made the index climb without bound. A throwaway prototype drove three cases through both models and showed the shipped one going out of range in all three; it is kept on the `prototype/slider-state` branch, out of `main`, with its output recorded on #41. Tightening the rule before fixing the state model would have invited the wrong fix.

Three `any`s survive, each disabled in place where no non-`any` type exists: the dynamic-zone dispatcher (props are contravariant, so no type accepts twelve differing Block components), the polymorphic `Button` element, and react-three-fiber's invariant mesh ref. A fourth was removed on review — tsparticles' `resize` takes `{ enable: true }`, so the cast was a suppression wearing a justification.

**Declined for now**, each with a reason rather than silence: `unicorn` and `sonarjs` (broad opinion sets whose violation count was not measured, so adopting them would breach this ADR's own rule), `import-x` with a TypeScript resolver (overlaps what `unused-imports` and `tsc` already catch here), `@stylistic` (Prettier owns formatting, and two tools arguing about it is worse than either deciding), and `eslint-plugin-turbo` (its value is catching undeclared env vars, and this repo declares them in `turbo.json` already).

Fixing the 60 errors changed real code: dead imports removed, unused parameters prefixed or dropped, two empty `else` blocks deleted, a `@ts-ignore` narrowed to `@ts-expect-error`, and a `Function` type given a real signature. One latent bug was found and deliberately **not** fixed here — `components/elements/subheading.tsx` destructures `...props` and never spreads it, so the component silently drops the HTML attributes its own type advertises. Changing that alters rendering, which does not belong in a lint change.
