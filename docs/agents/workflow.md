# Workflow: which skill, at which step

The skills under `.claude/skills/` are vendored from
[mattpocock/skills](https://github.com/mattpocock/skills) and hash-locked in
`skills-lock.json`. They are deliberately generic. This file is the layer
upstream cannot ship: how they sequence against **this** repository — two apps,
a shared types package, a protected `main`, and a `Verify` gate.

Upstream also publishes a narrative doc per skill under
[`docs/engineering`](https://github.com/mattpocock/skills/tree/main/docs/engineering)
and [`docs/productivity`](https://github.com/mattpocock/skills/tree/main/docs/productivity),
each with a "Where it fits" section. Those are **not** vendored here — they sit
outside the `skills/` tree that `npx skills add` copies, and duplicating them
would create a second drift surface to lock. Read them upstream; this file
links to them rather than restating them.

## Who can invoke what

This split is upstream's design, not an accident, and it is the answer to "when
does a human need to step in". Skills that **commit** to something — publishing
tickets, planning a body of work, handing off — are human-triggered. Skills that
**analyse** can be reached for by the agent.

| Human-only (`/command`)                                                                                                                                                                                         | Agent may reach for it                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask-matt`, `grill-me`, `grill-with-docs`, `handoff`, `implement`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `teach`, `to-spec`, `to-tickets`, `triage`, `wayfinder`, `writing-great-skills` | `codebase-design`, `code-review`, `diagnosing-bugs`, `domain-modeling`, `grilling`, `prototype`, `research`, `resolving-merge-conflicts`, `tdd` |

If a step below is human-only and nobody has run it, the agent should **say so
and stop**, not improvise a substitute. Hand-writing an issue instead of running
`/to-tickets` loses the blocking edges that make the frontier computable.

## The pipeline

### 1. Framing — what are we even building

| Situation                                                   | Command       | Who   |
| ----------------------------------------------------------- | ------------- | ----- |
| A body of work larger than one session                      | `/wayfinder`  | human |
| The conversation already contains the decision; write it up | `/to-spec`    | human |
| Turn a spec or plan into tickets **with blocking edges**    | `/to-tickets` | human |
| Unsure which skill or flow fits                             | `/ask-matt`   | human |

Tickets live in GitHub Issues — see `issue-tracker.md`. Blocking edges are
native `blocked_by` links, which is what makes the frontier computed rather than
remembered. An issue created by hand needs its edges added by hand, or the next
session will guess.

### 2. Before designing anything new

Read [notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)
**first**. It is the reference implementation for this repo's monorepo tooling.
Take its structure; judge its specifics. Where we diverge, the reason goes in the
ADR and the pull request — `docs/adr/` 0002, 0004 and 0005 are worked
examples of both adopting and declining.

Use `/research` when a question needs primary sources rather than recall; it
captures findings as a Markdown file under `docs/research/`.

### 3. Design questions — settle them before implementing

| Question                                                     | Command                         |
| ------------------------------------------------------------ | ------------------------------- |
| "Does this state model feel right?"                          | `/prototype` → its LOGIC branch |
| "What should this look like?"                                | `/prototype` → its UI branch    |
| "Where does the seam go? Is this module deep enough?"        | `/codebase-design`              |
| "What do we call this, and is the decision worth recording?" | `/domain-modeling`              |

`/prototype` is the most under-used skill available and the one this repo most
often needs, because most remaining work is frontend. Reach for it when a design
question is hard to settle on paper — a state machine with cases you cannot hold
in your head, or a screen you cannot picture until you see versions side by side.
It is **not** for diagnosing something already built and misbehaving; that is
`/diagnosing-bugs`.

**Repo rule for prototypes.** A prototype is throwaway code but not disposable
evidence. Capture the _answer_ durably — in the issue, an ADR, or a commit
message — then commit the prototype itself to a throwaway branch, never merged to
`main`, and leave a pointer to that branch on the implementation issue. `main`
keeps only the validated decision; the raw exploration stays one click away.

### 4. Building

| Situation                           | Command                      | Who   |
| ----------------------------------- | ---------------------------- | ----- |
| Implement against a spec or tickets | `/implement`                 | human |
| Build it test-first                 | `/tdd`                       | agent |
| Something built is misbehaving      | `/diagnosing-bugs`           | agent |
| A merge or rebase has conflicted    | `/resolving-merge-conflicts` | agent |

Branch from `main`. The `.husky/pre-commit` hook refuses a commit while `main` is
checked out, because `main` rejects pushes anyway and failing locally costs a
second rather than a rejected push.

Gates and the prove-it-fails rule are in the Verification section of `AGENTS.md`.

### 5. Review, before the pull request leaves draft

Run `/code-review since main`. It reviews two axes in parallel sub-agents —
Standards against `AGENTS.md` and `CONTEXT.md`, Spec against the originating
issue — and reports them separately so neither masks the other.

Open the pull request **early and as a draft**, so work is visible on GitHub
while it is still moving rather than only at the end.

`/improve-codebase-architecture` (human-only) is the periodic sweep for
deepening opportunities across the whole codebase, not a per-pull-request step.

### 6. Landing

`gh pr merge --merge --delete-branch`, with a `Merge PR #N: <title>` subject.
`main` requires a pull request and the `Verify` check; see the branch-protection
section of `AGENTS.md`.

### 7. Ending a session

Run `/handoff` (human-only — the agent cannot invoke it). It compacts the
conversation into a handoff document in your OS temp directory, including a
"suggested skills" section for whoever picks the work up.

This matters more than it looks. Ending a session cleanly and starting a fresh
one is **cheaper and more reliable** than keeping a long context warm, provided
the state survives the gap. `/handoff` plus the memory files are what make that
gap safe to cross.

## Resource discipline

Not a nicety — token spend is a primary constraint here, and quality is not the
thing to trade for it.

- **Read narrowly.** A 15-line window beats a whole file. Prefer `grep -c`, a
  targeted range, or a count over dumping content into context, because anything
  that enters context is paid for once and then rides along in every later turn.
- **Subagents cost a cold context each.** They share no cache with the session.
  Use them where a fresh, uncontaminated read genuinely earns it — a pre-merge
  `/code-review` — not for routine lookups.
- **Batch independent tool calls** into one message rather than a round-trip each.
- **Report in fewer words.** Decisions and evidence, not narration.
- **Prefer ending the session** over letting one sprawl. See `/handoff` above.

## Keeping this file honest

`AGENTS.md` is the router for the repository; this file is the router for the
workflow. Both are kept truthful deliberately. If a step here stops matching what
we actually do, fix it in the same pull request that changed the practice —
a stale process doc is worse than none, because it is followed.
