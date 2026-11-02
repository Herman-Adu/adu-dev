# adu-dev — working rules

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
- Validate at the boundary: `Schema.parse()` the mapped object so a CMS
  mismatch is a caught mapping bug, not a render crash.
- `CONTENT_SOURCE=local` must always work with no back end running.

## Motion

- GSAP owns anything scroll-linked. Framer Motion owns component state
  (hover, layout, route transitions). Two libraries on one property is a
  fight nobody can debug.
- Every scene registers through `useScrollScene` — one `gsap.matchMedia()`,
  one teardown. App-router remounts leak ScrollTriggers otherwise.
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
| `--color-surface` | `#1A1A1A` | — |
| `--color-border` | `#2D2D2D` | — |
| `--color-ink` | `#FFFFFF` | 19.2:1 |
| `--color-ink-2` | `#CACACA` | 11.7:1 |
| `--color-ink-3` | `#8A8A8A` | 5.6:1 |
| `--color-brand` | `#F47C00` | 7.1:1 |

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
