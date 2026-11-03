# Triage Labels

The skills speak in five canonical triage roles. This maps them to the label
strings in this repo's tracker. Defaults kept — the label string equals the
role name.

| Role in mattpocock/skills | Label in our tracker | Meaning                                  |
| ------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`            | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`              | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`         | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`         | `ready-for-human`    | Requires human implementation            |
| `wontfix`                 | `wontfix`            | Will not be actioned                     |

When a skill names a role ("apply the AFK-ready triage label"), use the
right-hand string. Edit that column to match any vocabulary you adopt later.

None of these labels exist on the repo yet. Create one on first use:
`gh api repos/{o}/{r}/labels -f name=needs-triage -f color=ededed`.
`/triage` is not currently enabled in this workspace; this file is here so it
works the moment it is.
