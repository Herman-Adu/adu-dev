# adu-dev — working rules

**Starting a session? Read `docs/STATE.md` first** — it holds current
status, decisions already made, and what is next.

## Architecture

Hybrid atomic + feature-sliced. The split is load-bearing, not cosmetic.

- `src/global/ui` — atoms and molecules **only**. Zero domain knowledge. If a
  component knows what a case study is, it does not belong here.
- `src/global/lib` — cross-cutting helpers (`cn`, parsed `env`).
- `src/features/<name>/` — owns its `lib/`, `components/`, `data/`, and any
  actions or schemas. **Organisms live inside features, never globally** —
  that is what stops the shared folder bloating.
- Cross-feature imports go through a feature's `lib/index.ts`, never deep.

## The contract rule

`src/features/<name>/lib/contract.ts` is the agreement, and the front end owns it.

- Zod schemas define the shape; a CMS **implements** it.
- Never replace these schemas with CMS-generated types. That inverts the
  dependency and turns a migration into a rewrite.
- Adapters (`source.local.ts`, `source.strapi.ts`) implement the source
  interface. `lib/index.ts` is the only file that knows which is active.
- The Strapi side of the Work contract is committed at `cms/` — Strapi's own
  `schema.json` layout, copied into a Strapi project verbatim, with the
  field-by-field reasoning in `cms/README.md`. It is excluded from
  `tsconfig.json` and `eslint.config.mjs`: it belongs to that project.
- Validate at the boundary: `Schema.parse()` the mapped object so a CMS
  mismatch is a caught mapping bug, not a render crash.
- `CONTENT_SOURCE=local` must always work with no back end running.

## Motion

- GSAP owns anything scroll-linked. Framer Motion owns component state
  (hover, layout, route transitions). Two libraries on one property is a
  fight nobody can debug.
- Every scroll-linked scene registers through `useScrollScene` — one
  `gsap.matchMedia()`, one teardown. App-router remounts leak ScrollTriggers
  otherwise.
- **A scene with no scroll link is CSS, not GSAP.** If it plays once on load,
  its from-state has to exist in the server-rendered HTML: a JS-only
  from-state paints the finished markup, then hides it on hydration and
  replays — invisible on a fast machine, a snap-back on a slow one. Scene 01
  is the case. It creates no ScrollTrigger, so there is nothing to leak, and
  the first viewport ships no JavaScript.
- Three behaviours, always: `full` (pinned, desktop), `compact` (unpinned,
  narrow), `reduced` (static end state, zero scrub).
- **Body text never scrubs.** Opacity on a paragraph tied to scroll position
  is the most common scrollytelling mistake.
- One R3F `<Canvas>` per page, `frameloop="demand"`.
- Budget: 60fps on a mid-range Android. If a scene cannot hold it, the scene
  changes — not the budget.

## Brand

Tokens live in `src/app/globals.css` under `@theme`. They mirror the
Foundations board on the design canvas.

| Token | Value | On `--color-ground` |
|---|---|---|
| `--color-ground` | `#0F0F0F` | — |
| `--color-band` | `#141414` | — |
| `--color-surface` | `#1A1A1A` | — |
| `--color-hairline` | `#1F1F1F` | — |
| `--color-line` | `#262626` | — |
| `--color-border` | `#2D2D2D` | — |
| `--color-ink` | `#FFFFFF` | 19.2:1 |
| `--color-ink-2` | `#CACACA` | 11.7:1 |
| `--color-ink-3` | `#8A8A8A` | 5.6:1 |
| `--color-ink-mute` | `#6B6B73` | 3.6:1 |
| `--color-brand` | `#F47C00` | 7.1:1 |
| `--color-brand-hover` | `#FF8A1F` | 8.1:1 |

`--color-ink-mute` is the quiet second line of a display pair, and clears
the 3:1 large-text floor only — never body text. The canvas Home board draws
that line at `#5E5E66`, which measures 2.98:1 and fails; the token wins.

**Ink on brand is `--color-ground`, never white.** White on `#F47C00`
measures 2.7:1 and fails WCAG AA at every size, including large bold.

Type: Inter (800 display / 400 body), JetBrains Mono for metadata and
anything technical. Radius 2px controls / 4px panels — nothing pill-shaped.

Glass is a surface with four sanctioned uses: sticky nav once scrolled,
overlay cards inside a pinned 3D scene, the dashboard command bar, modals.
One layer deep, never stacked, always with a solid `@supports` fallback.

## Content

No invented figures. Where a metric does not exist, `result.metrics` stays
empty and `result.note` says so plainly. An honest "not yet measured" beats
a rounded-up guess — technical buyers spot the difference.

## Commands

```
npm run dev        # dev server
npm run build      # production build (type errors fail the build)
npm run typecheck  # tsc --noEmit
```

## MCP — kie.ai

`.mcp.json` registers the KIE.ai connector as a stdio server. It gives five
generic tools (`kie_post`, `kie_get`, `kie_upload_file`, `kie_download`,
`kie_fetch_model_docs`) covering every current and future KIE model; model
specs are pulled live from docs.kie.ai rather than bundled.

It needs two things that are **not** in this repo, set on the cloud
environment and picked up when a session starts:

1. `KIE_API_KEY` as an environment variable. `.mcp.json` references it as
   `${KIE_API_KEY}` — the value itself is never committed.
2. `*.kie.ai` on the network allowlist. Without it the server starts fine
   and every call fails at the proxy, which looks like a bad key and is not.

Generation costs KIE credits. It produces assets; it does not replace the
Blender renders that scene 02 depends on.

## Agent skills

### Issue tracker

GitHub issues on `Herman-Adu/adu-dev`, driven through `gh api` (REST) —
`gh issue` and `gh pr` are blocked in cloud sessions. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label strings unchanged. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context. `docs/STATE.md` is the handoff and stands in for `CONTEXT.md`
until one exists. See `docs/agents/domain.md`.

### House review

`/house-review` — runnable probes for the rules above that break silently.
User-invoked; run it after `/code-review`, against the same range.
