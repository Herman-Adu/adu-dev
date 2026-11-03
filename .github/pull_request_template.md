## What this changes

<!-- One paragraph. What moved, and why. -->

## Against the canvas

<!-- Which board, and every deliberate departure from it with the reason.
     An undocumented departure is the thing review is looking for. -->

- Board:
- Departures:

## Checks

CI covers typecheck, the house rules, and a `CONTENT_SOURCE=local` build.
These are the ones it cannot:

- [ ] An **independent** review: Copilot (Reviewers → Copilot), or a human.
      A self-review is a comment, not an approval — GitHub refuses `APPROVE`
      on your own PR, and an agent reviewing its own diff is not a gate.
- [ ] `/code-review` run against the merge-base — Standards and Spec
- [ ] `/house-review` run for the probes CI does not automate
- [ ] Looked at, not assumed: at rest, mid-motion, scrolled,
      `prefers-reduced-motion`, and 320px wide
- [ ] No body text scrubs; every scene has a static end state
- [ ] `docs/STATE.md` updated — it is the only thing that survives the session
- [ ] Every new figure is real or bracketed, and no bracket reaches the DOM
