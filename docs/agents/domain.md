# Domain Docs

How the engineering skills consume this repo's documentation when exploring.
Layout: **single-context** (one package, no workspaces).

## Before exploring, read these

- **`docs/STATE.md`** — the handoff. Current status, decisions already made
  and why, and what is next. Read it first, every session. It is the nearest
  thing this repo has to a context doc and the only thing that survives
  between sessions.
- **`CLAUDE.md`** — the working rules: the architecture split, the contract
  rule, the motion rules, the brand tokens, the content rule.
- **`CONTEXT.md`** at the root and **`docs/adr/`** — neither exists yet.
  Proceed silently; do not flag their absence or propose creating them
  upfront. `/domain-modeling` creates them lazily, when a term or a decision
  actually needs resolving.

## The decisions that are already settled

`docs/STATE.md` carries a **"Decisions already made — do not relitigate"**
section. Treat it as this repo's ADR set until real ADRs exist: reopening one
needs the same explicit justification an ADR conflict does (below).

## Use the project's vocabulary

Name things the way `CLAUDE.md` and the design canvas already do — a *scene*
(a scroll-linked unit registered through `useScrollScene`), the *contract*
(the Zod schema a CMS implements, never the other way round), a *feature*,
*glass* (a surface with four sanctioned uses), the *canvas* (the design
artboards that are the source of truth for layout and copy).

A concept with no existing term is a signal: either the language is being
invented and should be reconsidered, or there is a real gap worth noting for
`/domain-modeling`.

## Flag conflicts

Where output contradicts a settled decision in `docs/STATE.md`, or a future
ADR, surface it rather than silently overriding:

> _Contradicts the "No Blender" decision in STATE.md, but worth reopening
> because…_

The canvas is the design's source of truth, so a deliberate departure from it
is recorded in `docs/STATE.md` with the measurement or reason that forced it.
