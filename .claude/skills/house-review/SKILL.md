---
name: house-review
description: "Runnable probes for the house rules that break silently. Supplements /code-review; run after it."
disable-model-invocation: true
---

# House review

`/code-review`'s Standards axis already reads `CLAUDE.md` and catches rule
breaches by reading. This carries only what reading cannot do: the commands,
the **silent** failure signatures, and the states you have to look at.

Run it after `/code-review`, against the same range. Every probe gets a
verdict; "no files in range" is a verdict.

## Probes

**Split** — `src/global` never imports a feature; the dependency runs one way.

```bash
rg -n "@/features" src/global
```

**Deep imports** — a cross-feature import lands on `lib/index.ts`, nothing below.

```bash
rg -n "@/features/[a-z-]+/(components|data)/" src
rg -n "@/features/[a-z-]+/lib/[a-z]" src
```

A feature reaching its own files via the `@/` alias reads the same; check the
importer before calling it a finding.

**Contract** — three inversions that all compile:

```bash
rg -n "\.parse\(" src/features/*/lib/source.*.ts   # every adapter validates
rg -n "strapi|cms" src/features/*/lib/contract.ts  # the contract knows no CMS
CONTENT_SOURCE=local npm run build                 # passes with no back end
```

A mapped object reaching a component without `Schema.parse()` turns a CMS
mapping bug into a production render crash.

**Motion** — find the call sites, then read each one:

```bash
rg -n "ScrollTrigger\.create|gsap\.(to|from|fromTo|timeline)" src --glob '!**/use-scroll-scene.ts'
rg -n "<Canvas|frameloop" src
```

A ScrollTrigger outside a `useScrollScene` handler works on first visit and
leaks on the app-router remount — the second visit janks, and no test catches
it. In any timeline carrying `scrub`, the targets are never body copy.

**Hydration** — a client scene whose from-state is set only in JS flashes its
end state: the server paints the finished markup, then hydration hides it and
replays. Invisible on a fast machine, obvious on a slow one. The from-state
belongs in CSS that JS cancels, or the scene renders from-state on the server.

**Brand** —

```bash
rg -n "bg-brand" src | rg -v "text-ground"          # white on brand is 2.7:1
rg -n "#[0-9a-fA-F]{3,8}\b" src --glob '!**/globals.css'
rg -n "rounded-full" src                            # 2px controls, 4px panels
```

Three.js material colours are the one sanctioned literal, and must match the
token values. **Compute every new colour pairing; never eyeball it.** Floors
are 4.5:1 body, 3:1 at ≥24px or ≥19px bold. Anything landing within 0.1 of a
floor is a finding — it will drift.

**Content** — every new figure is real or bracketed, and a bracket that
reaches the DOM is a finding of its own.

```bash
rg -n "\[[A-Z][A-Z ./]+\]" src
```

## Eye

Visual work is verified by looking. `npm run dev`, then Playwright — required
from CommonJS, ESM does not resolve — with
`--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.

Capture the states that hide bugs: at rest, mid-motion, scrolled,
`reducedMotion: 'reduce'`, and 320px wide. Assert
`document.documentElement.scrollWidth` against the viewport — horizontal
overflow does not show in a screenshot.
