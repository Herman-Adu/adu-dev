# Project state

Read this at the start of a session. It is the handoff: what exists, what
was decided and why, and what is next. Keep it current — it is the only
thing that survives between sessions.

Last updated: 2026-11-03 (scene 01 + nav, reviewed; CI gate added)

## Where this is

Design phase complete. Scaffold pushed. **Scene 01, the nav and scene 02
are built and working.** Nothing deployed.

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

1. **Scenes 03-06** from the Scroll spine board: stack peel, fleet
   assembly, proof wall, release. Reuse `useScrollScene` for each.
2. Services, Work and Case study pages from the canvas.
3. Operator dashboard.
4. Strapi 5 + Postgres behind the existing contract — a new adapter, not a
   rewrite.

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

**The independent half is Copilot.** CI and `/code-review` are both run by
whoever wrote the change, so neither is a gate on its own. Request Copilot on
a PR via Reviewers → Copilot, or make it automatic in Settings → Rules →
Rulesets ("Request pull request review from Copilot"). Requesting it through
the API (`POST /pulls/{n}/requested_reviewers` with
`copilot-pull-request-reviewer[bot]`) returns 200 and silently adds nobody
when Copilot code review is not enabled for the account — check the PR's
`requested_reviewers` actually changed rather than trusting the 200.

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
- **Nav routes that do not exist yet.** `/work`, `/services`, `/platform`,
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
