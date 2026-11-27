# Adu Dev software factory: design

Status: **draft for approval**. Nothing here is built yet. Written 2026-11-27.

One harness for every Adu Dev project. Matt Pocock's skills decide **what** to
build and leave it as tickets; the factory decides **how it runs**: it picks up
ready tickets, builds each in its own worktree, gates it, reviews it, and ends
it as a PR. Built once as a portable template, proven in adu-dev, then in the
Notum testbed (Strapi + Next.js monorepo).

## Sources this design rests on

Every mechanism below traces to one of these. Anything not traced is marked
**(ours)**: a choice we are making, not a fact we read.

| Source | What it contributed |
|---|---|
| `zazencodes/zazencodes-season-3` `src/software-factory-claude-code-v2/DESIGN.md` (GPLv3) | Scripts own state and verdicts, agents own judgment; `job.json` single-writer; gate before review and before merge; risk-routed reviewers; issue → worktree → PR; resume from files. **Design only: no code is copied** (licence; see memory `software-factory-direction`). |
| `mattpocock/skills` docs: `wayfinder`, `to-tickets`, `implement`, `implement-spec`, `code-review`, `retro`, `domain-modeling`, `codebase-design`, `improve-codebase-architecture`, in-progress `software-factory` | The planning chain; tracer-bullet tickets with native blocking edges; seams and TDD; two-axis review with the Fowler smell baseline; the learning loop; vocabulary; "start slow, brakes before accelerators"; the failure modes listed under *Known hazards*. |
| `docs/research/strapi-mcp-and-nextjs-workflow.md` | Everything in *Backend provisioner*. |
| `notum-starter-testbed` (`CLAUDE.md`, `worktree.config.json`, its skills) | Worktree setup recipe, `pnpm verify` gate, draft-PR rule, the hand-run version of this chain. |
| This repo: `CLAUDE.md`, `docs/agents/*`, `.github/workflows/ci.yml`, `house-review` | The contract rule, REST-only `gh api`, the existing gate commands. |

## Vocabulary

Matt's `software-factory` terms, used as-is so the skills and this doc speak
one language: **task** (a kind of work, defined once), **trigger**, **run** (one
execution of a task), **runner** (where a run executes), **ticket tracker**,
**git host**, **orchestrator**. Plus three of ours:

- **Job** — one ticket's journey through the build task, from pickup to PR.
- **Spine** — the deterministic scripts (`factory/bin/*`). They never use an LLM.
- **Surface** — which part of the stack a ticket touches: `contract`, `ui`,
  `strapi-schema`, `strapi-content`, `security`. Drives routing and the gate.

## The two halves

```
PLAN (human-led, Matt's skills)                 EXECUTE (the factory)
──────────────────────────────                  ─────────────────────
/grill-with-docs  ─┐                            /factory run
/wayfinder ── map ─┴→ /to-spec → /to-tickets ──→ queue (label: ready-for-agent)
   + /domain-modeling (by name)    GitHub issues   → job → worktree → build
   + /prototype when talk can't    with sub-issues   → gate → review → approve
     settle it                     + blocked-by        → PR (merge = approval)
                                                   → /retro on hard jobs ─┐
                                                                          │
        ┌────── new checks / reviewer standards / tickets ◄───────────────┘
```

Planning stays human-in-the-loop on purpose: wayfinder and grilling tickets
are HITL by definition (Matt, `wayfinder.md`), and the factory never resolves
a decision ticket. **The factory only runs implementation tickets.**

## Services (Matt's "fill every slot")

| Slot | Product | Why |
|---|---|---|
| Ticket tracker | GitHub Issues on each project's repo | Native sub-issues and blocking links make the frontier visible (Matt, `to-tickets.md`). Already configured (`docs/agents/issue-tracker.md`). |
| Git host | GitHub | PR per job; branch protection and CI apply to every merge (Zazen V2). |
| Orchestrator | The Claude Code session running `/factory run` | Zazen V2: one orchestrator, background subagents, up to 20 per session. |
| Runner | This machine, one git worktree per job | Local first; cloud runners are a later phase. |
| Observability | Job files + a static dashboard | Optional per Matt; start with files. |

**All GitHub access goes through `gh api` (REST).** `gh issue` / `gh pr` use
GraphQL, which is blocked in Claude Code cloud sessions
(`docs/agents/issue-tracker.md`). The spine must work in both. **(ours)**:
sub-issue and blocked-by REST endpoints are to be verified before Phase 1
(open question Q1).

## The build task

### Stages and legal moves

Owned by `factory/bin/job` (Node, zero dependencies **(ours)**: Windows is the
primary machine, and every project already has Node).

```
queued → intake → build → gate → review → approve → merging → merged
            │        ▲      │       │         │
            │        └─FAIL─┘       │         └─ESCALATE→ needs-human
            │        ▲              │                         │
            │        └──CHANGES─────┘ (max_rounds)            └─(human comments)→ build
            ├─NEEDS-INFO→ needs-info ─(author replies)→ intake
            └─REJECT→ rejected
```

- `job.json` per job holds stage, round, surface, risk, agents run, gate
  results, review verdicts, PR number, timings. **Only `bin/job` writes it**;
  it refuses illegal moves (no review without a passing gate, no merge
  without APPROVE). Agents ask the orchestrator to call `bin/job`.
- Each agent writes exactly one file in `factory/jobs/<id>/` and replies with
  one line, so the orchestrator's context stays small (Zazen V2).
- `factory/jobs/` is gitignored and local. Losing it loses audit detail, not
  work: the issue, branch and PR carry the durable record.
- A run never waits for a human (Matt, `software-factory`). `needs-info` and
  `needs-human` end the run; the human's comment on the issue or PR is picked
  up by the next `/factory run`.

### Why no spec-writer

Zazen's spec-writer turns a raw issue into a spec. Our tickets come from
`/to-tickets`, already agent-ready by construction, with acceptance criteria
and a parent spec issue (Matt, `to-tickets.md`). So: **no spec-writer**, and
intake shrinks to a deterministic check plus a short judgment.

### Intake (deterministic first)

`bin/job intake <issue>` checks, without an LLM:

1. Has the queue label, is open, is not a PR.
2. Every blocker is **merged into main** (computed by the spine from merged
   PRs, not GitHub's blocked-by count, which goes stale mid-run — Matt,
   `implement-spec.md`).
3. Body has acceptance criteria and a parent spec link.
4. Exactly one `surface:*` label (**ours**: one surface per job keeps routing
   and the gate simple; `/to-tickets` vertical slices that cross surfaces get
   the dominant surface plus `+ui` etc. — see Q4).

Then the **intake agent** (strong model, read-only, no shell) rates risk
`low|medium|high`, may narrow scope, or returns NEEDS-INFO with a question
posted to the issue. Issue text reaches it as quoted data, never as
instructions (Zazen V2 guardrail).

### Router

`factory/config.json` maps surface × risk to the agents that run and their
models. Routing lives in one file and changes without touching a prompt
(Zazen V2). Starting table **(ours)**:

| Surface | Builder | Reviewers |
|---|---|---|
| any | strong model | `reviewer-spec` + `reviewer-standards` always |
| `ui` | | + `reviewer-ui` |
| `security`, or risk `high` | | + `reviewer-security` |
| `strapi-schema` | | + `reviewer-schema` (drift + data-loss) |

Reviewers start on the **same tier as the builder**. Zazen found cheaper
reviewers bounce correct work and can cost more; Matt's skills put the
standards burden on the reviewer, so it needs the capacity. Cheaper tiers are
an experiment for later, measured per job.

This is also the answer to "when do I switch models": **per agent, in
config**, set by the `model:` field in each `.claude/agents/*.md`. You stop
switching by hand once Phase 1 runs.

### Builder

Follows `/implement`'s method: read the ticket, find the seams, drive `/tdd`
one red-green slice at a time, typecheck often, full suite once, commit
(Matt, `implement.md`). Two facts shape how it is wired:

- `/implement` ships `disable-model-invocation: true`, so a subagent cannot
  invoke it. The builder agent's prompt **references the installed
  `implement/SKILL.md` as its method** and invokes `/tdd` (model-invocable)
  itself. **(ours)**, to be confirmed in Phase 1.
- Matt's `/implement` runs `/code-review` before committing, which then sees
  no diff (Matt, `implement.md`). In the factory the builder **does not
  review itself**; review is a separate stage on the committed branch.

First round pushes the branch `<type>/<issue>-<slug>` (the settled
convention, e.g. `feat/123-case-study-filter`; the `factory` label marks it
as factory-made) and opens a **draft** PR
`Closes #<n>` (Notum's draft-first rule, so CI minutes are spent after review).

### Gate (the deterministic brake)

`bin/gate` runs the project's check list from the **main checkout's**
`factory/checks.json`, so a branch can't edit the checks it is judged by, and
fails any branch touching `protected_paths` (Zazen V2).

| Project | Checks |
|---|---|
| adu-dev | `npm run typecheck`, `npm run lint`, `npm run house-rules`, `CONTENT_SOURCE=local npm run build`, tests once a runner exists (Q3) |
| Notum | `pnpm verify` |
| Strapi surface | + schema drift gate (below) |

Runs before review and again after syncing with main before merge, because
another job may have merged in between (Zazen V2). A failure goes back to the
builder with the log; no reviewer is spawned.

### Review

Each reviewer runs in a fresh context on the committed diff (Matt: an agent
is a poor reviewer of what it just wrote).

- `reviewer-spec` — Matt's Spec axis: does the diff do what the ticket and
  parent spec ask, no more, no less. Catches acceptance criteria that grade
  nothing.
- `reviewer-standards` — Matt's Standards axis: repo standards (`CLAUDE.md`,
  `CODING_STANDARDS.md` when it exists) plus the Fowler **smell baseline**,
  each smell a labelled judgment, repo standards override. Also runs the
  `house-review` probes in adu-dev. Flags weakened or skipped tests.
- `reviewer-ui`, `reviewer-security`, `reviewer-schema` — routed.

All reviewers WAIT FOR ALL; any CHANGES → builder → gate → review, up to
`max_rounds` (start at 2 **(ours)**), then `needs-human`.

### Approve and merge

Approver (strong model) either APPROVEs, then `bin/job merge` syncs with main,
re-gates and merges through the REST merge endpoint, or ESCALATEs: PR marked
ready, a specific question as a PR comment, label `factory:needs-human`.
**Merging the PR yourself is approval** (Zazen V2). Phase 1 runs with
**auto-merge off**: every PR escalates, by design (Matt's "start slow").

After merge, `bin/job` closes the issue and ticks nothing it can't verify.
`/implement` never closes tickets (Matt), so the spine owns closure; that is
what moves the frontier.

## Backend provisioner (Strapi surface)

From `docs/research/strapi-mcp-and-nextjs-workflow.md`. The contract stays the
seam; Strapi is one adapter behind it (`codebase-design`: interface at the
seam, adapter behind it), so the factory never depends on Strapi tools for
the shape of the data.

**Schema is files, never MCP calls.** No MCP server we checked should author
schema: the official one has no schema tools; l33tdawg's drives the
Content-Type Builder with an admin password, is stale, and has an unguarded
`delete_content_type`; the VirtusLab plugin is read-only but unauthenticated
by default. Strapi's own blog pattern is: introspect read-only, write
`schema.json`, restart, seed via API. We add one ordering rule to it:
**Strapi is stopped while schema files change.** `strapi develop` watches
the source tree and restarts on edits, and that restart runs the
destructive schema sync before any gate has looked at the diff.

**The official MCP is for content**: introspection reads and seeding on a
**local dev** Strapi only, with a least-privilege admin token from an
environment variable, never a committed `.mcp.json` value.

The research's safe sequence becomes ticket shapes `/to-tickets` should emit
for a new content type, each a vertical slice that still demos:

1. `surface:contract` — Zod schema in `src/features/<x>/lib/contract.ts`,
   local adapter + seed JSON, UI reading it with `CONTENT_SOURCE=local`.
   Demoable with no back end (the repo's own rule).
2. `surface:strapi-schema` — with Strapi and its watcher **stopped**: write
   `schema.json` + components to mirror the contract and update the field
   map in `cms/README.md`. The drift gate runs on that diff. Only after it
   passes does Strapi start (schema sync), and then types regenerate.
3. `surface:strapi-content` — seed through `bootstrap()` / official MCP,
   find-before-create on a unique key, media first, read back after writes.
4. Adapter ticket — `source.strapi.ts` maps wire → contract → `Schema.parse()`;
   verified byte-identical against the local source (the existing
   `cms/README.md` verification pattern).

For "take an existing app's data and build Strapi for it", a prior **mapping
decision** runs through `/grill-with-docs` or a wayfinder `grilling` ticket:
component vs dynamic zone, relations, i18n, draft/publish. Those are design
choices and land as glossary terms (Q5) and ADRs via `/domain-modeling`
(invoked by name — Matt notes models skip it otherwise). The factory builds
only after the mapping is decided.

**Schema drift gate** (`reviewer-schema` + a script):
- Block, unless a matching migration exists: field or type removed or
  renamed, type changed, `required`/`unique` added, file deleted. Schema sync
  drops removed columns on startup with no prompt, in dev and prod.
- Renames only through `strapi rename:field` (5.57+), never a key edit.
- `strapi export` of the dev DB before any destructive change.
- Never `strapi import` / `transfer` for incremental seeding: both wipe the
  destination.
- Preflight refuses to run unless the target is the dev database and Strapi
  is stopped. It restarts under `strapi develop` only once the gate passes.

**Serialised**: at most one `strapi-schema` job in flight
(`exclusive_surfaces` in config). Schema jobs share generated types and
registries, the exact collision Matt documents for parallel tickets.

## Concurrency

- One worktree per job, from `origin/main`, setup by a per-project recipe
  (Notum's `worktree.config.json` shape: files to copy, symlinks, post-setup
  commands, dev-server health checks). adu-dev's recipe is `npm ci`.
- `concurrency` starts at **2** **(ours)**; Zazen uses 3. Raise when the
  brakes have earned it.
- Collisions surface at merge, not in worktrees (Matt). Tickets touching one
  shared file get a blocking edge, or the ticket fixes the exact names.
- Tests reading untracked fixtures silently skip in a worktree (Matt). Any
  such ticket is marked `runs-in-main` and never runs concurrently.
- Each worktree gets its own dev-server ports (Notum `preview.portBase`).

## Learning loop

The point of the harness is that the same mistake never happens twice.

- After any job that escalated, failed the gate twice, or took more than
  `max_rounds`, the orchestrator suggests `/retro` on that job.
- `retro`'s routing is the rule: **mechanical violation → a check in the gate**;
  judgment call → a line in `CODING_STANDARDS.md`, which the standards
  reviewer reads; **never** more steering in `CLAUDE.md` (Matt, `retro.md`).
- Periodically, `/improve-codebase-architecture` surveys hot paths; accepted
  candidates become tickets in the same queue.
- Session-level lessons about how you work go to Claude memory, one fact per
  file, as now.

## Known hazards, and the design answer

| Hazard (source) | Answer |
|---|---|
| Wayfinder starts writing product code (Matt) | Factory never runs `wayfinder:*` tickets; intake rejects them. |
| `/to-tickets` over-decomposes or slices by layer (Matt) | The quiz step before publish is yours; intake checks for a demo path line. |
| Stale blocked-by count mid-run (Matt) | Spine computes the frontier from merged PRs. |
| `/implement` never closes the ticket (Matt) | `bin/job` closes on merge. |
| Self-review bias (Matt, Zazen) | Separate reviewer agents, fresh context. |
| Cheap reviewers cost more (Zazen) | Same-tier reviewers until measured. |
| Killing the orchestrator kills in-flight agents (Zazen) | Resume from files; in-flight stage restarts. Accepted. |
| Prompt injection via issue text (Zazen) | Queue label needs write access; issue text is quoted data; intake has no shell. |
| Schema sync data loss (research) | Strapi stopped while schema files change, drift gate before restart, export-before, serialised schema jobs. |

## Template layout

```
.claude/
  agents/      intake, builder, reviewer-spec, reviewer-standards,
               reviewer-ui, reviewer-security, reviewer-schema, approver
  skills/factory/SKILL.md      the orchestrator: /factory run [n]
factory/
  bin/job  bin/gate  bin/route  bin/worktree     Node, no deps
  config.json      concurrency, max_rounds, routing, models, exclusive_surfaces,
                   protected_paths, queue_label (ready-for-agent), auto_merge
  checks.json      per-project gate commands
  worktree.json    per-project worktree recipe
  dashboard.html   reads factory/jobs/*/job.json
  jobs/            gitignored
```

Only `checks.json`, `worktree.json` and `config.json` differ per project.
Matt's skills are vendored and pinned in each project's `.claude/skills/`
(see *Cross-project standards*), so the factory calls the exact versions
that project has accepted, on this machine, a cloud runner or a client
checkout alike. The factory template itself ships none of them.

## Harness hygiene

One skill per job. Two skills that both answer "how do I plan / test /
review" make the model pick at random and cost context every session.
Audit of 2026-11-27, and the target state:

**Applied 2026-11-27** (backup: `~/.claude/settings.json.bak-2026-11-27`):
the three plugins below disabled, the loose files moved to
`~/.claude/skills-archive/`, both global MCPs removed (re-add per project),
stale permission allows pruned.

**Keep: the spine of the workflow**
- Matt's skills, **vendored and pinned per repo** (see *Cross-project
  standards*), then the global `mattpocock-skills` plugin is disabled.
- `frontend-design`, `context7` (current library docs instead of guessing),
  `typescript-lsp`, `watch`, `generate-anything`, `graphify`, `scroll-world`:
  no overlap with the chain.
- Repo skills: `house-review` (runnable probes the standards reviewer
  calls), `resolve-review-suggestions` (human or Copilot PR threads, REST-only:
  a different job from the factory's internal review).

**Retire: overlaps the chain** (user-level settings; needs your go-ahead)

| Item | Overlaps | Why it goes |
|---|---|---|
| `superpowers` plugin | `brainstorming`↔`grill-*`, `writing-plans`↔`to-spec`/`to-tickets`, `subagent-driven-development`↔the factory, `test-driven-development`↔`tdd`, `requesting-code-review`↔`code-review`, `using-git-worktrees`↔`bin/worktree` | Its SessionStart hook injects "you MUST invoke a skill before any response" into every session: tokens spent each session, and it pushes its own process over Matt's. |
| `feature-dev` plugin | `implement`, `codebase-design`, review | A second build-and-review flow. |
| `code-review@claude-plugins-official` plugin | Matt's `code-review` (same name) and Claude Code's built-in `/code-review` | Three things answer to one name. Docs name Matt's as `/mattpocock-skills:code-review` until only one remains. |
| Loose files `~/.claude/skills/{architecture-review,content-layer,drift-check,strapi-block,view-model}.md` | — | Old single-file format for another project ("8 content type modules"); not loaded as skills. Archive. |
| Global MCP servers `postgres` (another project's DB) and `strapi` (`docker exec v0_strapi_mcp`) | the project-scoped Strapi MCP in this design | Global MCPs load into every session. Move each to the project that uses it. |
| Stale global permission allows (`taskkill /PID 22824`, `killall -9 node`, one-off test greps) | — | Dead entries; `killall -9 node` globally is a hazard. |

**GitHub workflows: the standard every project meets**
- `permissions: contents: read` at the top; widen per job only when needed.
- Third-party actions pinned to a commit SHA, with Dependabot keeping the
  pins current (Notum does this, throttled).
- `timeout-minutes` on every job; `cancel-in-progress` only for PRs, never on
  `main`.
- CI runs the **same command list as the factory gate** (`checks.json`), so a
  green gate predicts a green PR. adu-dev's CI today omits `npm run lint`.
- No LLM inside CI. The factory runs locally on your plan; CI is the
  deterministic referee. That is the token saving: agents never read CI logs
  unless a check fails, and then only the failing step's tail.
- `main` branch protection requires the `verify` check.

## Cross-project standards (settled 2026-11-27)

The template carries these into every project, so no project re-decides them.

1. **Matt's skills are vendored and pinned per repo**: copies in
   `.claude/skills/`, `skills-lock.json` plus Notum's commit-pinned
   integrity check (`skills-vendor-baseline.json`). Updates arrive as a
   reviewed diff. Why: the global plugin auto-updates (`autoUpdatesChannel:
   latest`) and changed behaviour silently (`CONTEXT.md`→`GLOSSARY.md`); in
   Notum the plugin and the vendored copies both load. A cloud runner or a
   client checkout must get the same skills as this machine.
2. **Conventional Commits and `<type>/<issue>-<slug>` branches**, enforced
   by a git hook and re-checked in CI (Notum's pattern: lefthook locally, CI
   the authority). Factory branches follow it too (`feat/123-…`, not
   `factory/<id>`); a `factory` label marks factory PRs.
3. **`.gitattributes` (LF) and `.nvmrc` (Node 24)**, and CI reads `.nvmrc`.
   Today adu-dev has neither, `core.autocrlf` is `true`, and CI runs Node 20
   while this machine runs 24.
4. **Agent safety**: Matt's `git-guardrails-claude-code` hook (blocks
   force-push, `reset --hard` and similar); every factory agent declares a
   `tools:` allowlist (intake: no shell; reviewers: read + gate); the
   factory runs in normal permission mode with a project allowlist, never
   bypass.
5. **The factory's own files are a contract**: `job.json`, `config.json`
   and the ticket format have versioned Zod schemas from day one, so the
   future agency dashboard reads them rather than reverse-engineering them.
6. **Factory PRs will come from a GitHub App identity**, so you review
   rather than self-approve (GitHub refuses approval on your own PR). Phase 1
   uses your account with auto-merge off.
7. **Client repos: decide per engagement, before the first one.** Either the
   factory runs from your side against a client repo and is never committed
   there, or it ships under a licence you choose. It is all our code, so the
   choice is open.
8. **Memory is keyed to the folder path**, so worktree sessions and other
   projects don't share it. Cross-project lessons go into the template
   (checks, reviewer standards); project facts stay in project memory; the
   global `CLAUDE.md` stays minimal. Factory agents run inside the
   orchestrator's session, so worktrees don't fragment memory.

**Design for now, build later**
- *Cloud runners*: GitHub stays the source of truth; only job logs are
  local.
- *Ticket sources* (Sentry, feedback button, socials, contact forms) file
  into triage, never straight into `ready-for-agent`.
- *UI review*: per-worktree dev-server ports (Notum `preview`), so a reviewer
  can take Playwright screenshots later.
- *Gate tiers*: the factory gate is the fast tier; the slow tier (Notum
  `verify:full` takes ~2h40m on Windows) stays in CI.
- *Deploys* never happen inside the factory. The `vps` skill stays
  user-invoked only.
- *Default project shape* for new apps (Notum's pnpm + Turborepo monorepo or
  not) can be decided later: `checks.json` keeps the factory
  package-manager-agnostic.
- *Cost*: once this design is approved, the default session model goes back
  to Sonnet; the factory routes Opus only to the roles that need it.

## Phases, each with a test

| Phase | Done when |
|---|---|
| 0. Prefactoring | Vitest in adu-dev (Q3); `ready-for-agent`, `factory:needs-human` and `surface:*` labels created; overlapping skills and plugins retired (see *Harness hygiene*). |
| 1. Spine on a sandbox repo | A throwaway repo with three seeded tickets (one blocked by another) runs end to end: frontier correct, gate fails a broken build, illegal moves refused, kill-and-resume works. Auto-merge off. |
| 2. adu-dev | Two real tickets from a `/to-tickets` run land as reviewed PRs you merge. |
| 3. Notum | One contract → schema → content → adapter chain lands on the dev Strapi, drift gate proven by a deliberately destructive ticket it blocks. |
| 4. Open the throttle | Auto-merge for `low` risk, concurrency 3, cheaper reviewer tier as a measured experiment. |
| Later | Cloud runner, ticket sources (error tracker, feedback), dashboard for the agency admin. |

## Decisions (settled 2026-11-27)

- **Q1. Sub-issues and blocked-by over REST: supported.** Verified by reads
  on a public issue: `GET /issues/{n}/sub_issues`,
  `/dependencies/blocked_by` and `/dependencies/blocking` return 200, and
  each issue carries `sub_issues_summary` and `issue_dependencies_summary`.
  Local `gh` is 2.83.2, which lacks the `gh issue create --parent` /
  `--blocked-by` flags Matt's template uses (2.94+), and those go through
  GraphQL anyway. So writes use REST, documented in
  `docs/agents/issue-tracker.md`. **Writes are untested**: first thing on the
  Phase 1 sandbox.
- **Q2. Queue label: `ready-for-agent`.** One vocabulary with Matt's triage
  roles. Labels need triage or write access, so it stays the trust boundary.
  The factory's own exit state keeps `factory:needs-human`.
- **Q3. Test runner: Vitest, first prefactoring ticket.** Without one,
  `/tdd` silently degrades and the gate catches only type and build errors.
  ESM-native for a `"type": "module"` repo. First tests sit at the contract
  seam: each adapter's `Schema.parse()` and local-vs-Strapi parity. Playwright
  is a later, separate ticket.
- **Q4. One primary surface, optional `+ui`.** Vertical slices legitimately
  reach the UI; forcing one surface would push tickets back toward
  horizontal slicing. The primary surface decides gate scope and rules;
  `+ui` only adds the UI reviewer. `strapi-schema` never combines with
  anything.
- **Q5. Glossary file: follows the vendored skills, renamed in the same
  commit as the upgrade that changes it.** adu-dev vendors v1.3.2 (#23),
  whose `domain-modeling` writes `GLOSSARY.md` (and `GLOSSARY-MAP.md` for
  multi-context; upstream renamed it from `CONTEXT.md` on 2026-08-15), so
  adu-dev uses `GLOSSARY.md`. Notum stays on `CONTEXT.md` until its own
  upgrade renames its file in that commit.
- **Q6. The template lives in its own repo.** adu-dev is a product; its
  gate, history and `CLAUDE.md` should not carry tooling. Each project pins
  a factory version (like Notum's `skills-vendor-baseline.json`). An install
  script copies agents, the factory skill and `factory/bin`, and never
  overwrites the three per-project files. A Claude Code plugin is an option
  once it is stable.
