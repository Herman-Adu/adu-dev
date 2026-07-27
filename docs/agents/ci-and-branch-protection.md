# CI and branch protection

Read when changing the workflow, adding a job, or when a merge is blocked.

## What CI runs

`.github/workflows/ci.yml` verifies every pull request. It runs only the work a
change actually affects, worked out from **Turbo's dependency graph** rather than
from path globs:

```
change apps/strapi only        -> strapi
change packages/strapi-types   -> @repo/strapi-types, nextjs
```

The second line is the reason globs were not used. `packages/strapi-types` is
consumed by the frontend, so a change there has to run the frontend's checks — a
per-application path filter would miss exactly that case, and it is the case most
likely to break something silently.

Jobs: `format` always runs, because formatting covers docs and config too.
`frontend` and `backend` are conditional. `types-drift` runs when **either** the
backend or the shared types package moved, since the mirror can fall out of date
from either end.

## Branch protection

`main` is protected by an active repository ruleset named `main-protection`,
targeting the default branch. It requires a pull request (0 approvals), requires
the **`Verify`** check, blocks force pushes and restricts deletion. Branches are
not forced up to date before merging.

**`Verify` is the only required check, and no other job may be added to that
list.** The per-application jobs are conditional, and GitHub treats a skipped
check as blocking rather than passing — requiring them directly would stop every
pull request that legitimately skips one. `Verify` always runs, depends on all
the others, and fails if any of them failed while tolerating the ones that were
skipped.

Two settings that look wrong and are not:

- **Required approvals is 0** because GitHub forbids self-approval, so requiring
  one would lock a solo maintainer out of their own repository.
- **Admin bypass is `pull_request` mode**, not `always`. It allows forcing a merge
  when CI itself is broken but does **not** allow a direct push — pushing to
  `main` is rejected for the repository admin too.

## The only route to main

Branch, open a pull request, wait for `Verify`, then
`gh pr merge --merge --delete-branch` with a `Merge PR #N: <title>` subject.

The `.husky/pre-commit` hook enforces the first step locally, refusing a commit
while `main` is checked out so the mistake costs a second rather than a rejected
push. A detached HEAD reports an empty branch name and is left alone.
