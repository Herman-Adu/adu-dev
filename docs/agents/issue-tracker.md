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

## Sub-issues and blocking edges (REST)

`/to-tickets` and `/wayfinder` need parent links and blocking edges. Their
GitHub template uses `gh issue create --parent` / `--blocked-by`, which need
`gh` 2.94+ and go through GraphQL. Use REST instead:

- **Make a sub-issue**: `gh api repos/{o}/{r}/issues/{parent}/sub_issues -F sub_issue_id={id}`
- **Add a blocker**: `gh api repos/{o}/{r}/issues/{n}/dependencies/blocked_by -F issue_id={id}`
- **Read**: `.../issues/{n}/sub_issues`, `.../dependencies/blocked_by`,
  `.../dependencies/blocking`, or the `sub_issues_summary` and
  `issue_dependencies_summary` fields on the issue itself.

`{id}` is the issue's numeric **`id`** (the database id) from the REST
response, not its `#number` or `node_id`. The v1.3.2 tracker template in
`.claude/skills/setup-matt-pocock-skills/issue-tracker-github.md` documents
the same calls.

Verified on 2026-11-27:
- **Add a blocker** works (#16 blocked by #23). Its response body is the
  child issue, not the blocker.
- **The summary lags.** Right after the write, `issue_dependencies_summary`
  still read `blocked_by: 0` while the `dependencies/blocked_by` list already
  showed the blocker; about 20 s later both agreed. So anything deciding
  "can this ticket start?" right after tickets are published reads the
  **list**, never the summary.
- **Make a sub-issue** is not yet exercised here.

Publish blockers first so their ids exist when the dependent ticket is made.

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
- **Claim**: `gh api -X POST repos/{o}/{r}/issues/{n}/assignees -f
  "assignees[]=$(gh api user --jq .login)" --jq '[.assignees[].login]'` —
  the session's first write. Use the real login: REST **silently ignores**
  `@me` (it returns no assignees and no error; verified 2026-11-27), so a
  claim made with it looks done but is invisible to other sessions. Check
  the returned list contains the login before working the ticket.
- **Resolve**: comment the answer, close, then append a context pointer to the
  map's Decisions-so-far.
