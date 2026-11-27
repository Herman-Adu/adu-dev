# Agent skills

Two kinds live here.

**Repo-authored** — written for this repo, edited freely:
`house-review`, `resolve-review-suggestions`.

**Vendored** — Matt Pocock's official skills (`mattpocock/skills`,
engineering + productivity), copied verbatim at the release recorded in
`vendor.lock.json` (source, tag, commit, and a hash per skill). The upstream
MIT licence is kept as `LICENSE.mattpocock-skills`.

## Rules for vendored skills

- **Never edit them in place.** `npm run skills:check` recomputes every hash
  and fails on any difference; CI runs it. A pinned copy is the point: this
  machine, a cloud runner and a client checkout run the same instructions.
- **Upgrade deliberately:** `npm run skills:pull -- <tag>` (needs `gh`),
  then read the diff. Upstream renames show up here first: v1.3.x moved the
  glossary from `CONTEXT.md` to `GLOSSARY.md`, which is why this repo uses
  `GLOSSARY.md`. Update `docs/agents/*` in the same PR when the skills'
  expectations change.
- **A deliberate local patch** needs its own entry and a line here saying
  what changed and why, so the next upgrade can reapply it.

## Name collisions with Claude Code built-ins

`code-review`, `research` and `prototype` share names with Claude Code
built-ins. Upstream will not rename them (`.out-of-scope/harness-name-collisions.md`
in `mattpocock/skills`). Project skills appear to take the name; if a
session ever runs the built-in instead, say so here and rename this repo's
copy (folder and `name:`), recorded as a local patch.
