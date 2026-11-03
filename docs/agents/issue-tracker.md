# Issue tracker: GitHub (REST only)

Issues and specs live as GitHub issues on `Herman-Adu/adu-dev`.

## Use `gh api`, never `gh issue` / `gh pr`

Every `gh issue *` and `gh pr *` subcommand routes through GitHub's GraphQL
endpoint, which is **blocked in Claude Code cloud sessions** and fails with:

```
HTTP 403: GitHub GraphQL is not available from Claude Code sessions
```

This is environmental, not a credentials problem — `gh auth status` also
reports a false "token is invalid" while REST works fine. Reach for
`gh api repos/{owner}/{repo}/...` from the start.

## Operations

`gh api` infers nothing; pass the repo path explicitly.

- **Create**: `gh api repos/{o}/{r}/issues --input issue.json` where the JSON
  holds `title`, `body`, `labels`. Build the JSON with a heredoc or `python3
  -c 'import json…'` so the body's newlines and backticks survive.
- **Read**: `gh api repos/{o}/{r}/issues/{n}` and
  `gh api repos/{o}/{r}/issues/{n}/comments`.
- **List**: `gh api "repos/{o}/{r}/issues?state=open&labels=X&per_page=100"`
- **Comment**: `gh api repos/{o}/{r}/issues/{n}/comments -f body="..."`
- **Label**: `gh api repos/{o}/{r}/issues/{n}/labels -f "labels[]=..."`;
  remove with `-X DELETE .../labels/{label}`.
- **Close**: `gh api -X PATCH repos/{o}/{r}/issues/{n} -f state=closed`

**The REST `/issues` collection includes pull requests.** GitHub shares one
number space, and a PR comes back as an issue with a `pull_request` key.
Filter every list: `--jq '[.[] | select(.pull_request == null)]'`. Omitting
this is how a triage queue silently fills with PRs.

## Reviews on a pull request

`gh api repos/{o}/{r}/pulls/{n}/reviews --input review.json`, with `event` set
to `COMMENT`. GitHub refuses `APPROVE` on your own PR with a 422, so a review
of your own work is always a comment — say so in the body rather than
implying approval.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external
PRs as feature requests; `/triage` reads this flag.)_

When `yes`, use `repos/{o}/{r}/pulls` and keep only `author_association` of
`CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` or `NONE`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue (above).

## When a skill says "fetch the relevant ticket"

Read the issue and its comments (above).

## Wayfinding operations

Used by `/wayfinder`. The **map** is one issue; **children** are its tickets.

- **Map**: an issue labelled `wayfinder:map` holding the Notes /
  Decisions-so-far / Fog body.
- **Child ticket**: `gh api repos/{o}/{r}/issues/{n}/sub_issues -F
  sub_issue_id=<child-db-id>`. Where sub-issues are unavailable, use a task
  list in the map body and `Part of #<map>` atop the child. Label
  `wayfinder:<research|prototype|grilling|task>`.
- **Blocking**: `gh api --method POST
  repos/{o}/{r}/issues/{child}/dependencies/blocked_by -F
  issue_id=<blocker-db-id>`. That is the numeric **database id** from
  `gh api repos/{o}/{r}/issues/{n} --jq .id`, not the `#number` or `node_id`.
  Fall back to a `Blocked by: #<n>` line. Unblocked when every blocker closes.
- **Frontier**: the map's open children, dropping any with
  `issue_dependencies_summary.blocked_by > 0` or an assignee; map order wins.
- **Claim**: `gh api -X PATCH repos/{o}/{r}/issues/{n} -f assignees[]=@me` —
  the session's first write.
- **Resolve**: comment the answer, close, then append a context pointer to the
  map's Decisions-so-far.
