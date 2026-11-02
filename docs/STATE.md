# Project state

Read this at the start of a session. It is the handoff: what exists, what
was decided and why, and what is next. Keep it current — it is the only
thing that survives between sessions.

Last updated: 2026-11-02

## Where this is

Design phase complete. Scaffold pushed. Nothing deployed.

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
- **Glass has four sanctioned uses.** See CLAUDE.md. Not a general style.

## Next, in order

1. **Blender scene 02.** The only blocker nothing can route around.
   Spec: `public/sequences/hero/README.md`. 120 WebP frames 1600x900,
   ground `#0F0F0F` baked in, under 4 MB total, plus `poster.webp` of the
   end state. Option B (frame sequence) was chosen over a live GLB for
   guaranteed frame rate on mid-range Android.
2. **Build the home scroll spine** against those frames using
   `SequenceScene` + `useScrollScene`. One scene at award standard proves
   the whole site; breadth does not.
3. Services, Work and Case study pages from the canvas.
4. Operator dashboard.
5. Strapi 5 + Postgres behind the existing contract — a new adapter, not a
   rewrite.

## Open items

- **Monogram asset** (the AD orbit mark) never reached the container.
  Needed for the nav below ~480px, the favicon, and the orbit loader.
  The wordmark is uploaded to the canvas and used in the page boards.
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
