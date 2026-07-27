# An effect is the exception, and it says why it exists

`useEffect` is permitted only for synchronising with something outside React, and every remaining one names the hazard it is guarding in a comment above it. The audit that produced this rule took the frontend from 21 effects to 18 and found four bugs, none of which were in the ticket that asked for it.

The test is not "does this need to run after render" — almost anything can be made to. It is **what owns the thing being touched**. If React owns it, the work belongs in render or in an event handler. If a browser API, a timer, a canvas, a WebGL context or another window owns it, an effect is the seam, and the comment explains which one and what goes wrong without the cleanup.

## What replaces an effect, and with what

Four categories cover almost every effect we removed or would have written.

**Derived state — compute during render.** If a value is a function of props and state, it is not state and does not need an effect. `brands.tsx` kept a split-in-half array in state and rotated it; the halves are now derived and only the index is state.

**Reading a browser fact — `useSyncExternalStore`.** Reading something outside React and rendering it is exactly what this hook exists for, and its third argument is what makes it safe across the server boundary. `draft-mode-banner.tsx` read `window !== window.top` in an effect and corrected itself after mount; it now reads through the store with a server snapshot, so the markup never claims something the server could not know.

**Element-scoped subscriptions — a ref callback.** React 19 lets a ref callback return a cleanup, which ties a listener or an observer to the node rather than to the component. `beam/index.tsx` attached animation listeners this way, and the testimonial slider's height measurement swapped a `visibilitychange` listener for a `ResizeObserver` — which also catches late-loading webfonts and viewport resizes, neither of which hides the tab.

**Everything genuinely external — keep the effect, and justify it.** three.js, tsparticles, canvas paint loops, `postMessage` between windows, `document.body`, timers. These stay, with a comment naming the hazard.

## The ref-callback trap, learned the hard way

A ref callback must have a stable identity. Written inline it is a new function every render, so React detaches and reattaches on each one. For an observer that is waste. For an event listener on a running CSS animation it is a defect: the animation does not restart to match, so an `animationstart` firing in the gap is simply lost.

That is not hypothetical. The first version of the `Beam` conversion did exactly this and the beams stopped rendering — invisible to typecheck, lint and the test suite, and caught only by someone looking at the page. Ref callbacks that attach anything are wrapped in `useCallback`.

## The four bugs

Worth recording because each was invisible to inspection of the effect's own dependency array, which is where attention usually goes.

- **`shooting-star.tsx`** re-armed `setTimeout` from inside its own callback and returned an **empty cleanup**, so the chain outlived the component and went on setting state forever.
- **`skeletons/fourth.tsx`** held its interval id at **module scope**. A second instance overwrote the first's id, and the first's cleanup then cleared the second's timer while its own ran on unwatched.
- **`animated-modal.tsx`** set `document.body.style.overflow = 'hidden'` with **no cleanup**. Unmounting while open — a route change with the modal up — left the page unscrollable until reload.
- **`brands.tsx`** called `setActiveLogoSet` **inside a `setLogos` updater**. Updater functions must be pure; React 19's StrictMode calls them twice.

## The one effect kept against the ticket's own classification

`ClientSlugHandler` dispatches server-computed slugs into context on mount, and the ticket listed it under "should not be effects". It stays. The slugs are computed per route by a Server Component and the only consumer is the locale switcher in the root layout, above every page. Props do not thread upwards, and a child may not set an ancestor's state during render, so there is no render-phase way to move that value. Recorded here rather than argued again later.

## Considered Options

**The React Compiler — trialled, measured, and declined for now.** `apps/next/next.config.mjs` sets `cacheComponents` but not `reactCompiler`, and auto-memoization is the principled answer to hand-placed `useMemo`/`useCallback`. It was enabled against `babel-plugin-react-compiler` and measured on a clean production build:

|                   | baseline  | React Compiler |
| ----------------- | --------- | -------------- |
| client JS on disk | 4550.4 KB | 4618.2 KB      |
| build time        | 20s       | 19s            |

**+67.8 KB, +1.5%**, build time inside noise, against **8** hand-memoization sites across 6 files that it would supersede. The compiler demonstrably ran — 14 `useMemoCache` slots in the output.

Declined in this change for two reasons, neither of them the bundle size. It is a codegen change affecting every client component, and the session that trialled it could not verify runtime behaviour in a real browser — the test browser reached the dev server cross-origin and never executed the page's chunks, which invalidated it as a harness. This repository's rule is to prove by running, and that proof was not available. It is also a second concern: folding a global codegen switch into an effect-cleanup change makes both harder to review and to revert. The plugin was uninstalled rather than left dormant.

Revisit it as its own change, with the measurement above as the baseline and a real browser to check against. The specific win to look for is in `useOutsideClick`, whose callers pass inline arrows — so both document listeners are detached and reattached on every render today, and memoizing the arrow at the call site is exactly what the compiler does.

**A lint rule instead of a convention.** `react-hooks/exhaustive-deps` is already `error` (#30) and it catches stale closures, but it has nothing to say about the four bugs above — an empty cleanup, a module-scoped timer id, a missing cleanup and an impure updater all satisfy it. No rule was added, because the thing being asked for is a justification a human reads.

## Consequences

Every `useEffect` in `apps/next` carries a comment naming its hazard. A new one without that comment should not pass review, and the reviewer's question is "what outside React owns this?".

Three suppressions of `react-hooks/exhaustive-deps` remain, all in `globe.tsx`, all line-level and all explaining which identity would change every render and what it would restart. There is no file-wide suppression left anywhere.

18 effects remain: 5 in `globe.tsx` and 1 in `sparkles.tsx` (three.js and tsparticles), 2 in `star-background.tsx` and 2 in `shooting-star.tsx` (canvas and animation frames), 2 in `animated-modal.tsx`, and one each in `preview.tsx`, `toast.tsx`, `brands.tsx`, `skeletons/fourth.tsx`, the testimonial slider and `ClientSlugHandler`. #44 will remove some of these components from the client entirely, which is the cheaper way to delete an effect.
