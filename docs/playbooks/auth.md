# Playbook — gate `/platform/app` with Better Auth

Item 2 in `docs/STATE.md`. Written to be executed locally, with the
architectural calls already made so none of them has to be re-argued at
11pm.

API names below are from Better Auth as of late 2026 and are the part most
likely to have moved — check each against the docs for the version you
install. **The decisions are the durable half; the function names are not.**

## What Better Auth actually is here

A library that runs **inside this app**, against **a database you own**. Not
a service the app calls. So:

- No Vercel integration, which is what you wanted.
- It needs `BETTER_AUTH_SECRET` and a database URL. These are the real
  requirements.
- The **API key from your Better Auth account is a different thing**: it
  belongs to Better Auth Infrastructure (the `dash()` plugin — analytics,
  activity, admin APIs, audit logs) and is read from `BETTER_AUTH_API_KEY`.
  It is additive. Sessions work without it. Add it last, once sign-in
  works, so that if something breaks you know which half broke.

## Decisions already made

**It is a feature slice.** `src/features/auth/`, owning its `lib/`,
`components/` and schema. Nothing in `src/global/ui` learns what a session
is — that is the rule that keeps the shared folder from bloating.

**`lib/index.ts` is the only export surface.** The dashboard imports
`requireOperator()` from `@/features/auth/lib`, never from a file below it.
`npm run house-rules` fails a deep cross-feature import, so this is
enforced, not advisory.

**The contract rule applies to auth too.** Define the session shape you
depend on in `src/features/auth/lib/contract.ts` as Zod, and parse what
Better Auth hands back at the boundary:

```ts
export const Operator = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).nullable(),
});
```

The app depends on `Operator`, not on Better Auth's inferred user type.
Same argument as the CMS: spreading a library's generated types through
components inverts the dependency and turns a swap into a rewrite. The
difference from the CMS is that there is no second adapter to write — the
value is that an upgrade which renames a field fails in one file with a
message, instead of rendering `undefined` in the UI.

**Its own database, on the same Postgres.** A separate database (or at
minimum a separate schema) from Strapi's. Strapi owns and migrates its
schema; auth tables must never be inside the thing another tool migrates.
`AUTH_DATABASE_URL` keeps them independently movable.

**No public sign-up.** This gates an operator dashboard for one person.
Enable email + password, turn sign-up **off**, and insert the single
operator row with a script. An open sign-up form on a public URL is the
failure mode here, not a feature.

**Middleware redirects; the server component is the gate.** Middleware is
the cheap "bounce them to `/sign-in`" so a locked page does not flash.
The check that *matters* runs in the server component, immediately before
anything reads data:

```ts
const operator = await requireOperator(); // redirects when absent
const summary = await dashboard.summary();
```

Treating middleware as the gate is the classic mistake: it is a routing
convenience, not an authorisation boundary.

**Fail closed, and do not break the build.** CI runs a
`CONTENT_SOURCE=local` build with no auth environment set. So missing
`BETTER_AUTH_SECRET` must mean *locked* (redirect to `/sign-in`), never a
throw at module load. `src/global/lib/env.ts` parses at import time and a
required-but-absent variable would fail the build — keep the auth vars
`.optional()` there and decide in `requireOperator()`.

## The order of work

Each step ends in something you can check, so a break is local to the step
that caused it.

**1. Database.** `createdb adu_auth` on the same Postgres as Strapi. Put
`AUTH_DATABASE_URL` in `.env.local` (see `.env.example`). Check: `psql` can
connect.

**2. Install and configure.** `npm i better-auth pg` (plus `@types/pg`).
The repo has no ORM, so a plain `pg` Pool is the lightest adapter — no
Prisma or Drizzle needed for this. Create
`src/features/auth/lib/auth.ts`: `betterAuth({ database: pool,
emailAndPassword: { enabled: true, disableSignUp: true }, secret:
env.BETTER_AUTH_SECRET, baseURL: env.BETTER_AUTH_URL })`. Check:
`npm run typecheck`.

**3. Migrate.** Better Auth ships a CLI that writes its own tables
(`npx @better-auth/cli migrate`, or `generate` if you want to read the SQL
first — do that the first time). Check: the tables exist in `adu_auth`.

**4. Route handler.** `src/app/api/auth/[...all]/route.ts`, exporting the
Next handler Better Auth provides (`toNextJsHandler`). Check:
`curl -i localhost:3000/api/auth/session` returns JSON, not a 404.

**5. Seed the operator and sign in.** Create the one user with a script
against the auth API (sign-up is disabled for the public, so do it
server-side or temporarily enable, seed, disable again — and note which you
chose in `docs/STATE.md`). Build `/sign-in` as a feature component using
the existing `Button`/`Container` atoms; it is a form on `--color-ground`,
not a new design language. Check: signing in sets a cookie.

**6. Gate the dashboard.** `requireOperator()` in
`src/features/auth/lib/`, called at the top of `/platform/app`'s page (and
any future segment under it), plus middleware for the redirect. Check,
without clicking anything:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/platform/app
```

Expect a redirect with no cookie, `200` with one. Re-run after
`npm run build && npm start` — a gate that only works in dev is not a gate.

**7. Only then** add `BETTER_AUTH_API_KEY` and the `dash()` plugin, if you
want the hosted analytics and admin APIs. Separate commit, so it is
revertible on its own.

## Then the live dashboard source

The second half of item 2. `src/features/dashboard/lib/contract.ts` already
defines `AgentRun`, `PipelineEntry`, `BrainNote` and a **derived**
`DashboardSummary`. A live feed is one more implementation of
`DashboardSource`, selected in that feature's `lib/index.ts` exactly as
`CONTENT_SOURCE` selects the work source. **The shell does not change**, and
the empty local seed stays the default so the page keeps rendering with
nothing running.

Keep every figure nullable. The dashboard renders an em dash for "not
measured" and that is the honest answer until a real feed exists — see the
Content rule in `CLAUDE.md`.

## Traps specific to this repo

- **`src/global/ui` must stay session-blind.** A `<SignedIn>` wrapper
  belongs in `features/auth/components`, not in the atoms folder.
- **`/platform/app` is already `noindex`** but carries nothing. It can hold
  real data only once step 6 passes in a production build.
- **Glass has four sanctioned uses** and the command bar is one of them. A
  sign-in card is not; it is a plain surface.
- **Ink on brand is `--color-ground`.** A sign-in button is the one place
  it is tempting to type `text-white` out of habit; `npm run house-rules`
  will fail you for it.
