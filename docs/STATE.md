# Project state

Read this at the start of a session. It is the handoff: what exists, what
was decided and why, and what is next. Keep it current — it is the only
thing that survives between sessions.

Last updated: 2026-11-03 (site complete; dashboard shell landed; Strapi
adapter implemented and verified against a real CMS)

## Where this is

Design phase complete. **The site is built and deployed.** Six scroll
scenes on the home page, every page the canvas defines, and the first slice
of the operator dashboard. Live on Vercel from `main`.

**Design canvas:** https://claude.ai/artifact/T5XWBmHmNJcY46x8tgAb1D
Seven artboards: Foundations (tokens), Scroll spine (scene map + Blender
export contract), Home, Services, Work, Case study, Operator dashboard.
The canvas is the source of truth for layout and copy. `CLAUDE.md` holds
the rules extracted from it.

## Decisions already made — do not relitigate

- **Dark, restrained, type-led.** Deliberately not the glow-heavy AI-agent
  look of the reference sites; that aesthetic is crowded and dates fast.
- **One accent, `#F47C00`**, from the brand sheet. Under 5% of any viewport.
- **Inter 800 display / 400 body + JetBrains Mono** for metadata. Two faces.
- **Ink on brand is `#0F0F0F`, never white** — white on `#F47C00` is 2.7:1
  and fails AA at every size. The brand sheet's own CTA gets this wrong.
- **Scope is deliberately narrow.** The digital-products storefront, the
  second-brain graph view and the SEO retainer page are real parts of the
  business but are NOT on the agency site. Five products on one first
  impression is how a strong site turns to mush. They get their own
  properties later.
- **Contract-first.** See CLAUDE.md. The front end owns the schema.
- **No Blender.** Scene 02 is real-time WebGL in `features/hero`, not a
  rendered frame sequence. The brand's geometry is an orbit and cut facets,
  which procedural 3D does natively — this was the better choice, not a
  fallback. `SequenceScene` still exists in `features/scroll` and still
  works if a commissioned render ever lands.
- **Glass has four sanctioned uses.** See CLAUDE.md. Not a general style.

## Next, in order

1. **Host the CMS.** The adapter is written and verified — see "The Strapi
   adapter, as built". What is left is infrastructure, not code: a Strapi 5
   + Postgres instance somewhere real, `cms/` copied in **before** its
   first start, a read-only API token, and `CONTENT_SOURCE=strapi`,
   `STRAPI_URL`, `STRAPI_API_TOKEN` set on Vercel. `cms/README.md` has the
   commands. Then the one optional piece: a webhook route calling
   `revalidateTag("case-studies")`, so a publish is live in seconds instead
   of within the minute.
2. **Auth, then one live source for the dashboard.** `/platform/app` renders
   the shell against `DashboardSource` with an empty local seed. Agent runs
   is the obvious first feed. Auth comes first — the route is `noindex` and
   carries nothing, but it cannot hold real data until it is gated.
3. **Writing** (`/writing`). No board exists; it needs a design pass before
   a build pass. Nav entry is defined with `ready: false`.
4. **Real figures.** Service prices, momo-audio's Lighthouse/LCP, company
   number. Every page has a slot waiting; all are omitted rather than
   guessed. See the Content rule.
5. **The Work filter row** — worth building at four or five case studies.
   Filtering two does nothing.

## The scroll spine, as built

| | Scene | Behaviour |
|---|---|---|
| 01 | Title hold | CSS keyframe reveal, no JS on the first viewport |
| 02 | The forge | Pinned 300vh, real-time WebGL |
| 03 | Stack peel | Pinned 240vh, layers separate, mono labels land |
| 04 | Fleet assembly | Pinned 280vh, horizontal scrub, inline SVG nodes |
| 05 | Proof wall | Unpinned parallax, reads the work contract |
| 06 | Release | Zero ScrollTriggers, deliberately still |

Scene 04 was specified as a second Blender plate. Superseded by the
"No Blender" decision *and* by one-Canvas-per-page — the forge owns the
page's only R3F context, so the nodes are inline SVG.

`full` requires `min-height: 700px` as well as `min-width: 1024px`. A pinned
scene taller than the viewport traps its own lower content, and a 1280x540
window passes a width-only check. A viewport matching neither `full` nor
`compact` runs no handler at all; every scene's markup is its static end
state, so that is the correct fallback, not a gap.

## The dashboard slice, as built

`/platform` is the public product page. `/platform/app` is the shell.

`src/features/dashboard/lib/contract.ts` owns `AgentRun`, `PipelineEntry`,
`BrainNote` and a `DashboardSummary` that is **derived, never stored**, so a
summary cannot drift from the data it describes.

**Every figure is nullable, and the local seed ships empty.** A dashboard
that cannot tell `0` from "not measured" invents the difference, and every
number on the Dashboard board is a placeholder. `spendPence` and
`evalPassRate` return null when nothing supports them and render an em dash.
An empty seed means each panel shows its real empty state instead of sample
data that would read as real operating figures on a public URL.

Verified with a throwaway fixture (not committed): three runs and two
projects derived £3.33 spend, 67% eval pass and "1 thing needs you".

No auth and no live source. A live source is one more implementation of
`DashboardSource`, selected in that feature's `lib/index.ts`; the shell does
not change.

### Tuning knobs for scene 01

`--title-hold-duration`, `--title-hold-stagger` and `--title-hold-rise` in
`src/app/globals.css`, beside the keyframes. The two display lines are the
only thing on the first viewport that moves — eyebrow, standfirst and
buttons are painted in their end state and stay there.

**Scene 01 is CSS, not GSAP, and `TitleHold` is a server component.** The
first version used GSAP and flashed: the server painted the finished title,
then hydration hid it and replayed it. The from-state has to be in the
server-rendered HTML, so it is a keyframe gated on
`prefers-reduced-motion: no-preference`. Verified with JavaScript disabled
entirely — the reveal still runs. The first viewport now ships no JS.

### Tuning knobs for scene 02

All in `src/features/hero/lib/forge-config.ts`: `orbitRadius`, `cameraZ`,
`offsetX` (keeps the form clear of the copy column), `shardCount`,
`shellRadius`. Lighting is in `forge-scene.tsx` — the core's lower facets
sit near-black by design; raise the `[0, -6, -4]` light to lift them.

Verify changes by eye, not by assumption: `npm run dev`, then screenshot
with the preinstalled Playwright (require it from CommonJS — ESM import
does not resolve) using
`--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.

## The Strapi adapter, as built

`source.strapi.ts` implements all three methods of `CaseStudySource`. The
content model it expects is committed at `cms/` — Strapi's own
`schema.json` layout, copied into a Strapi project verbatim — with the
field-by-field reasoning in `cms/README.md`. `tsconfig.json` and
`eslint.config.mjs` exclude `cms`; it belongs to the Strapi project, not
this one.

Decisions worth not relitigating:

- **The contract stayed the spec.** Nothing is generated from Strapi. The
  Zod schemas are untouched by this work — the adapter was written to
  them, and `CaseStudy.parse()` is the last thing every read passes
  through.
- **Two parse steps, not one.** A loose wire schema asks only "did the
  transport deliver the right primitives"; the contract then decides what
  is *required*. That split is what makes a failure legible: a wire error
  means Strapi changed shape, a contract error means an entry is
  incomplete, and the message names the entry and the field.
- **String arrays are repeatable one-field components.** Strapi has no
  multi-select enumeration, and `work.discipline` holds the **same** enum
  strings as `Discipline`, hyphens included — so there is no translation
  table to drift out of sync. Filtering reaches into it with
  `filters[disciplines][value][$eq]`.
- **`populate` is explicit.** `populate=*` reaches exactly one level,
  which would return `result` with `metrics` missing. Every component the
  app reads is named, and `result.metrics` uses the nested form.
- **A cover with no alternative text is dropped,** with a server warning
  naming the entry, not thrown and not given invented alt text. `cover` is
  nullable in the contract and every component handles it.
- **A read-only token is enough.** The site never writes.
- **`status=published` is sent on every read** even though it is Strapi
  5's default, so a draft cannot surface because a setting changed.
- `slugs()` pages through to the end. Taking the first page only would
  silently stop building case-study pages at entry 101.

**Copilot caught two on PR #9**, both fixed in it: `caption` was being used
as a fallback for alt text (a caption is display copy, often a credit — it
is not a description), and `year:desc` alone is not a total order, so paging
an unordered tie can hand back one slug twice and miss another, which would
quietly stop `generateStaticParams` building a page that had not changed.
Both sources now sort year descending **then slug ascending**, so their
agreement is by construction rather than coincidence.

Verified against Strapi 5.60 + Postgres 16 standing up for real, seeded
with the two live case studies through the admin content-manager API and
read back through a read-only token:

| Check | Result |
|---|---|
| `list` / `bySlug` / `slugs` vs the local source, 9 queries | byte-identical |
| draft-only entry | invisible to all three methods |
| cover with no alt text | dropped, warning logged |
| cover with alt text | mapped, `/uploads/…` absolutised against `STRAPI_URL` |
| `liveUrl` corrupted in the database, past Strapi's validation | caught at the boundary, message named `liveUrl` |
| bad token / missing `STRAPI_URL` | message names the fix |
| `revalidateTag("case-studies")` | flips the answer immediately |
| `CONTENT_SOURCE=local` build | passes, both pages prerendered |

No component changed, and no page knows which source answered.

## The review gate

`npm run house-rules` (`scripts/house-rules.mjs`) turns the silently-breaking
rules into a pass/fail: the global/feature split, deep imports, white-on-brand,
pill radii, raw hexes, placeholders reaching the DOM, and every colour token
measured against the table in `CLAUDE.md`. It is self-tested — reinstating
`#5E5E66` or deleting a token's table row both fail it.

`.github/workflows/ci.yml` runs typecheck, the house rules, and a
`CONTENT_SOURCE=local` build on every PR. `.github/pull_request_template.md`
carries the checks CI cannot make: the two review axes, and the five states
that have to be looked at.

**The independent half is Copilot**, added as a reviewer on the repo. CI and
`/code-review` are both run by whoever wrote the change, so neither is a gate
on its own; Copilot is the one reviewer that is not the author. It runs as a
"Running Copilot Code Review" workflow on each push and posts real review
threads — it caught two bugs on PR #1 that both the two-axis review and the
house rules missed.

Adding it is a repo setting, not an API call: `POST
/pulls/{n}/requested_reviewers` with `copilot-pull-request-reviewer[bot]`
returns 200 and attaches nobody, and the bot never appears in
`requested_reviewers` even once it is reviewing. Judge by whether the
workflow runs, not by the 200.

Threads are resolved with `/resolve-review-suggestions`.

`docs/agents/*.md` configures the mattpocock engineering skills. The GitHub
template there had to be rewritten against `gh api` REST: every `gh issue`
and `gh pr` subcommand routes through GraphQL, which is blocked in cloud
sessions and returns 403.

## Open items

- `public/sequences/hero/` is now unused. Keep or delete depending on
  whether a commissioned render is ever planned.
- **Monogram asset** (the AD orbit mark) still missing. Needed for the
  favicon and the orbit loader. The nav no longer needs it: below `sm` the
  bar wraps to two rows (wordmark + CTA, then the four links) at 108px, and
  the wordmark stays legible at 22px. A monogram would let that collapse to
  one row. The **wordmark** is now in the repo at
  `public/brand/adu-dev-wordmark.png`, pulled from the canvas (988x333,
  light-on-transparent). The dark-on-light variant is still canvas-only.
- **`npm run lint` is not a CI gate yet.** `eslint.config.mjs` now exists
  (there was no config at all, so lint never ran), but `forge-scene.tsx`
  carries 9 pre-existing `react-hooks/refs` errors from scene 02. Fix those,
  then add `npm run lint` to the workflow — it is a one-line change.
- **Open review findings on PR #1**, neither blocking: the 180ms UI duration
  is hard-coded in two files while its ease is a token; and the skip link
  targets `#main`, but `id="main"` lives per-page, so every future page has
  to remember it.
- **Playwright timing.** Scene 02's pin changes the document height, so a
  fixed `waitForTimeout` after load measures the page before ScrollTrigger
  has refreshed — it reports `max` ≈ 1320 instead of 4020 and every
  scroll-state assertion comes back wrong. Wait on a readiness condition
  (`waitForFunction` until the glass appears), never a sleep. This cost an
  hour of chasing a regression that was not there.
- **A Postgres cluster cannot live in the session scratchpad.**
  `/tmp/claude-0` has its mode reset to `700 root` part-way through a cloud
  session, so a cluster running as the `postgres` user dies mid-write with
  `could not open file … Permission denied` and every Strapi call then
  returns 500 that looks like a bad query. Put the data directory under
  `/var/lib/postgresql` instead; logs can stay in the scratchpad.
- **Only one `next dev` runs at a time** — a second instance exits with
  "Another next dev server is already running" and prints the PID to kill.
  Start it with `setsid` and kill it by that PID: killing a plain
  background `next dev` takes the shell with it, which truncates whatever
  came after.
- **`pkill -f "next start"` matches its own command line** and kills the
  shell running it, which silently truncates whatever came after — including
  a build. Use a distinct port per run instead.
- **`NEXT_PUBLIC_CONTACT_EMAIL` is set in Vercel**, so every CTA opens a
  mailto. It is not set locally, so `npm run dev` shows the fallback (links
  to the work instead). That is the intended behaviour, not a bug. No
  address is hardcoded anywhere.
- **Re-tick "Restrict deletions"** on the `main-protection` ruleset. It was
  unticked to let the agent delete branches; that does not work (see below)
  and it only ever protected `main`, since the rule targets the default
  branch.
- **Two stale remote branches**, `scene-01-title-hold-and-nav` and
  `allow-scoped-pr-merge`, both pre-dating auto-delete-on-merge. Deleting a
  remote ref is blocked at the proxy in cloud sessions — over the API *and*
  over the git protocol — so they need a human click. Everything merged
  since cleans itself up.
- **Old note, now stale — nav routes that did not exist.** `/work`, `/services`, `/platform`,
  `/writing` and `/contact` all 404 until step 1-3 land. The hrefs are in
  `src/features/chrome/lib/nav-links.ts`. **Departure from the board:** it
  drew Writing and Start-a-build as same-page anchors (`#writing`,
  `#contact`) because it is one long board; they are routes here because the
  site is not. `Dashboard.dc.html` → `/platform` is the same remap.
- **Two canvas values were overridden, both deliberately:**
  - The Home board draws the quiet second display line at `#5E5E66`, which
    measures **2.98:1** on `--color-ground` and misses the 3:1 large-text
    floor. Built as a new token `--color-ink-mute: #6b6b73` (3.6:1),
    display sizes only. The board should be updated to match.
  - The board sets the h1 at weight 700; Foundations and `CLAUDE.md` both
    say 800 display. Built at 800. One of the two boards is wrong.
- **Scene 01's stagger/travel differ from the Foundations motion tokens.**
  The Scroll spine gives scene 01 `y 24 -> 0` and 80ms apart; Foundations
  caps travel at `y 16px` and stagger at 60ms. The scene-specific numbers
  were used. Worth reconciling on the canvas.
- **Scene 01's first statement wraps to two visual lines** at every width
  (`max-width: 16ch` against a 25-character string), so its mask sweeps the
  whole two-line block as one. Per-visual-line masking would need SplitText.
  This is what the board draws, so it was left alone.
- **Every `[BRACKET]` on the canvas is a placeholder.** Real figures
  needed: service prices, momo-audio Lighthouse/LCP, contact email,
  company number, years. Where no number exists, the honest "not yet
  measured" line stays — see the Content rule in CLAUDE.md.
- **`work.json` carries empty `result.metrics`** for both case studies,
  with a note saying not yet measured. Replace with real figures only.
- Repo is **public** (for Actions minutes). Keep prices and client detail
  out of committed files until it goes private.

## Stack as built

Next.js 16.4.4 · React 19.3.1 · TypeScript strict (`noUncheckedIndexedAccess`)
· Tailwind v4 (`@theme` holds the brand tokens) · Zod 4 · GSAP 3 +
`@gsap/react` · three + @react-three/fiber · motion. `npm run build`
passes; type errors fail the build.
