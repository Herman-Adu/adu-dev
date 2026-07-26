# Keep one glossary at the root, not one per app

Moving the applications under `apps/` is the point where a monorepo would normally grow per-package documentation, and a domain glossary is the obvious candidate to split. We decline that split. `CONTEXT.md` stays at the repository root and describes one language for the whole system, because the two applications do not have two vocabularies — they have one, seen from two sides. The backend authors Blocks, Fieldsets and Pages; the frontend renders them. A Block is the same Block in both.

## Considered Options

Splitting into `apps/strapi/CONTEXT.md` and `apps/next/CONTEXT.md` is what the new directory shape suggests, and it is not an unreasonable instinct: co-locating docs with the code they describe usually keeps them honest. We rejected it because the seam is wrong. An application boundary is a deployment and runtime boundary, not a meaning boundary, and splitting a glossary along it would produce two definitions of Block that must be kept in agreement by hand. The failure mode is quiet: the definitions drift, each side stays internally consistent, and the disagreement only surfaces when someone builds against the wrong one.

The deeper reason is that this glossary exists to stop exactly that drift. `CONTEXT.md` was written because Strapi and React both say "component" and meant different things (see `docs/adr/0001-block-not-component.md`). A vocabulary whose whole job is to keep two sides agreeing cannot itself be stored twice.

Keeping it at the root also matches where the terms are decided. Naming arguments are settled in issues and decision records at the repository level, not inside one application.

## Consequences

`CONTEXT.md` and `docs/adr/` stay at the root and continue to govern both applications. There is no per-app glossary, and a reader who expects one — reasonably, given the `apps/` layout — should find this record instead. If a genuinely app-local vocabulary ever appears, one that the other side has no view of at all, that is the signal to revisit this, and it should be a new record rather than an edit to this one.

Decision records written before this move describe the layout of the time: `0001` and `0002` refer to `strapi/` and `next/` at the repository root. They are left as written, because a decision record documents a decision at a point in time rather than the current tree. Read their paths as `apps/strapi/` and `apps/next/`.
