---
name: resolve-review-suggestions
description: >
  Address unresolved GitHub pull request review threads and close the ones
  actually fixed. GitHub only; requires an explicit PR number or URL.
disable-model-invocation: true
argument-hint: "<pr-number | pr-url>"
---

# Resolve Review Suggestions

Load the unresolved review threads on a PR, implement the ones that hold,
push, and resolve only those. Leave the rest open and report them.

Adapted from the upstream skill for this environment: **GraphQL is blocked
in Claude Code cloud sessions**, so `gh api graphql`, `gh pr view` and
`gh pr checkout` all return HTTP 403. The two phases that upstream does in
GraphQL are done here with the harness's CCR REST routes. Everything else is
`gh api repos/{owner}/{repo}/...` — see `docs/agents/issue-tracker.md`.

Threads only. Top-level PR comments have no resolve action; read them for
context and summarise them in the report.

**Be automated.** Ask only when the PR argument is missing or invalid, the
worktree has unrelated dirty changes, or a thread needs a product decision.

## Phase 1 — Resolve the PR

Require an argument: digits, `#123`, or a `github.com/<org>/<repo>/pull/<n>`
URL. Never infer the PR from the branch name. Then:

```bash
gh api repos/{o}/{r}/pulls/<n> --jq '{number,title,state,draft,head:.head.ref,base:.base.ref}'
```

Abort if the PR is closed or merged. A draft is fine; leave it a draft.

## Phase 2 — Prepare the branch

```bash
git status --short
git branch --show-current
```

Switch only when the worktree is clean (`git fetch origin <head>` then
`git checkout <head>` — `gh pr checkout` is GraphQL and will 403). If there
are unrelated changes, stop and say so. Never stash the user's work.

## Phase 3 — Load unresolved threads

```bash
gh api repos/{o}/{r}/pulls/<n>/ccr/review_threads
```

Returns `[{resolved, outdated, path, line, comment_ids}]`. Keep
`resolved == false`. Then fetch the bodies, which that route does not carry:

```bash
gh api repos/{o}/{r}/pulls/<n>/comments --jq '[.[] | {id, path, line, user: .user.login, body, diff_hunk}]'
```

Join on `comment_ids`. Read the referenced code at each `path:line`.

## Phase 4 — Triage, and verify before you believe

Classify each thread:

- **Implement** — concrete, in scope, safely fixable now.
- **Already addressed** — the current code satisfies it. A reviewer races
  pushes: a comment can describe code that no longer exists. Check the file
  as it stands before believing either the comment or yourself.
- **Not relevant** — obsolete, out of scope, against a documented rule in
  `CLAUDE.md`, or a duplicate.
- **Needs user** — ambiguous, or a product decision.

**Reproduce the defect before fixing it, and re-verify after.** A reviewer's
claim is a hypothesis. So is your fix: confirm the repro with a measurement,
not a reading. A test harness that races initialisation will report a bug
that is not there and a fix that did not work — wait on a readiness
condition, never a fixed sleep.

Never resolve **Not relevant** or **Needs user**. List them with the comment
URL and a one-line reason.

## Phase 5 — Implement

Keep edits tightly scoped to the feedback. Then run the narrowest useful
check:

```bash
npm run typecheck
npm run house-rules     # the rules that pass tsc and still break
npm run build
```

Anything visual is verified by looking, at the five states in
`/house-review`. A screenshot is the evidence; an assumption is not.

## Phase 6 — Commit and push

Stage explicit files. Never `git add -A` here — the point is a tight diff.

```bash
git add <file...>
git commit -m "fix: address PR review suggestions"
git push
```

If hooks fail, fix and recommit. Do not bypass them.

## Phase 7 — Resolve what was addressed

Only **Implement** and **Already addressed**, and only after verifying the
fix is in the pushed branch. Reply first, so the thread records why:

```bash
gh api repos/{o}/{r}/pulls/<n>/comments/<comment_id>/replies -f body="..."
gh api --method POST repos/{o}/{r}/pulls/<n>/ccr/comments/<comment_id>/resolve
```

Re-read `ccr/review_threads` afterwards and confirm `resolved` actually
flipped. A 200 from a route is not proof the state changed — requesting
Copilot as a reviewer returns 200 and silently adds nobody.

Never resolve a thread because it is inconvenient or you disagree. If it was
not fixed or verified as already fixed, it stays open.

## Report

```text
PR: <url>
Branch: <head>
Implemented: <n>   Already addressed: <n>   Resolved on GitHub: <n>
Left open:
- <url> — <reason>
Needs user:
- <url> — <question>
Validation:
- <command>: pass | fail | not run (<reason>)
Pushed: <commit or "no changes">
```

Do not merge the PR, mark a draft ready, or dismiss reviews.
