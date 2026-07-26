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

`@typescript-eslint/no-explicit-any` is a **warning**, and 73 remain. Most are the Block components that #15 converts to `@repo/strapi-types`. It becomes an error under #30, once #15 has removed the bulk — promoting it earlier would force either a red build or the wave of suppressions this decision exists to avoid.

Fixing the 60 errors changed real code: dead imports removed, unused parameters prefixed or dropped, two empty `else` blocks deleted, a `@ts-ignore` narrowed to `@ts-expect-error`, and a `Function` type given a real signature. One latent bug was found and deliberately **not** fixed here — `components/elements/subheading.tsx` destructures `...props` and never spreads it, so the component silently drops the HTML attributes its own type advertises. Changing that alters rendering, which does not belong in a lint change.
