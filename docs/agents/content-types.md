# Content types, and the code that renders them

Read when touching a Strapi schema, or any frontend code that renders content.

## The shared types package

The frontend consumes the backend's content model through `@repo/strapi-types`
rather than reaching into `apps/strapi`. That package is a **mirror**: Strapi
generates into `apps/strapi/types/generated` and stays there, because its own
`ts:generate-types --help` warns that redirecting the output can break types the
platform depends on.

- After changing any schema, run **`pnpm sync:types`**. It regenerates and updates
  the mirror in one command, so the two cannot diverge by doing only half the job.
- **`pnpm check:types-drift`** regenerates and fails if the committed mirror
  differs. It is part of the verification path for backend changes.
- The mirror is committed on purpose: a content-model change then shows up as a
  reviewable type diff in the pull request.

This loop is proven, not assumed. In #39 a field rename in the backend schema
produced a **frontend compile error at the exact consuming lines** — see that
pull request for the full before/after.

## The generated files describe schemas, not data

`Schema.Attribute.String` is a description of a field, not a `string`. Use the
helpers the package exports rather than the raw interfaces:

```ts
import type { Block, Entry, Fieldset } from '@repo/strapi-types';

type Hero = Block<'dynamic-zone.hero'>; // a dynamic-zone entry
type Button = Fieldset<'shared.button'>; // a reusable field group
type Page = Entry<'api::page.page'>; // a content type
```

The vocabulary is fixed by `CONTEXT.md`: a **Block** is one authored entry in a
dynamic zone, a **Fieldset** is a reusable group of fields, an **Entry** is a
content type. Naming a dynamic-zone union `Entry` inverts that and has already
slipped through review once.

## The schema is the source

Type components **against** the generated definitions, not around them. If a
component demands `title: string` and the schema says the field is optional, the
component's contract is wrong — not the data. Do not write
`title={item.title ?? ''}` to bridge it; `''` renders an empty heading rather
than no heading.

Read `packages/strapi-types/generated/*.d.ts` for the real shape before typing
anything. Where the generated types genuinely cannot express it — media is `any`,
and the dynamic-zone dispatcher needs `any` because props are contravariant —
record that in the pull request rather than casting it away.

## Strapi changes

- Update content-type schemas under
  `apps/strapi/src/api/**/content-types/**/schema.json`.
- Update components under `apps/strapi/src/components/**`.
- After any schema or component change, run `pnpm sync:types`.
- When adding a new dynamic-zone component, update both the Strapi
  schema/components **and** the Next dynamic-zone mapping in
  `apps/next/components/dynamic-zone/manager.tsx`.
- `deepPopulate` shapes every default GET API response, so weigh any change to it
  against both apps.
- The default database is SQLite at `apps/strapi/.tmp/data.db`. Keep generated
  database files local; `.gitignore` already covers them.
- Renaming a field **orphans the column behind it**. Seeded demo data may not
  cover the component you are changing, so check the export before claiming
  existing content still renders.

## Next changes

- App routes live under `apps/next/app/[locale]`.
- Shared Strapi rendering logic lives under `apps/next/lib/shared`.
- UI components live under `apps/next/components`.
- Use the `@/` alias from `apps/next/tsconfig.json`.
- When touching localized pages, verify localized slugs and locale switcher
  behaviour.
- `turbopack.root` in `apps/next/next.config.mjs` resolves the repo root two
  levels up from that file. Moving the app means updating that depth in the same
  change.

### Server components first, client islands second

This is Next.js 16 with the App Router, so **a component is a Server Component
until something forces otherwise**. `'use client'` is not a file-level habit; it
is a boundary, and everything imported below it joins the client bundle whether
it needs to or not.

The rules that follow:

- **Fetch and render on the server.** Data fetching, schema-typed rendering and
  anything touching `@repo/strapi-types` belongs in a Server Component or a
  helper under `lib/shared`.
- **Push `'use client'` as deep as it will go.** A Block that is mostly static
  markup with one animated element should not be a client component — the
  animated element should be, and the Block should render it. Marking the parent
  drags every child across the boundary with it.
- **The client boundary is a bundle decision, not a convenience.** Reach for it
  for interactivity, browser APIs, or hooks — not to avoid thinking about where
  the data comes from.
- **Keep domain logic server-side.** Content shape, population and the rules
  about what a Block means live on the server where the schema types are
  authoritative. The client gets props, not the domain.

**Current state, measured rather than assumed: 45 of 82 `.tsx` files under
`app/` and `components/` carry `'use client'` — 55%.** That is a long way from
islands, and the `server-only` package is not used anywhere to enforce the
boundary. Reducing that surface is #44; until then, do not add to
it, and when touching a client component ask whether the directive can move
downward in the same change.

## Testing

- Framework: Vitest in both apps. Next also uses React Testing Library (`jsdom`
  environment) for components.
- Tests are co-located with the code they cover: `<name>.test.ts` /
  `<name>.test.tsx` next to the source file, not in a separate `__tests__` tree.
- Inside an app, `pnpm test` is a single pass and `pnpm test:watch` is the
  watcher.
- Follow the `/tdd` skill: agree the seam (the public interface under test)
  before writing a test, assert behaviour through that interface only, and write
  expected values as independent literals so the test states the answer rather
  than recomputing it.
