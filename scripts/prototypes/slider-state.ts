/**
 * PROTOTYPE — throwaway. Not imported by either app.
 *
 * ## The question
 *
 * `apps/next/components/dynamic-zone/testimonials/slider.tsx` autorotates
 * through the first three testimonials. Its state model is:
 *
 *   const [active, setActive] = useState(0);
 *   const [autorotate, setAutorotate] = useState(true);
 *
 *   useEffect(() => {
 *     if (!autorotate) return;
 *     const interval = setInterval(() => {
 *       setActive(active + 1 === sliced.length ? 0 : (active) => active + 1);
 *     }, 7000);
 *     return () => clearInterval(interval);
 *   }, [active, autorotate, sliced.length]);
 *
 * Two things look wrong on paper: `active` sits in the dependency array, so the
 * interval is torn down and recreated on every tick; and the `setActive` call
 * mixes a **value** (`0`) with an **updater function** in the same expression,
 * so the wrap-around test reads the captured `active` while the increment reads
 * the current one.
 *
 * The question this answers: **does the model survive the cases that are hard
 * to reason about on paper** — an empty list, a list that shrinks under it, a
 * manual selection mid-cycle, and the dependency array being "tidied up"?
 *
 * `advance` below is the proposed model. `advanceAsShipped` reproduces today's
 * arithmetic so the two can be driven side by side and watched to diverge.
 */

export type SliderState = {
  active: number;
  autorotate: boolean;
  /** How many slides the component is rendering — `testimonials.slice(0, 3)`. */
  count: number;
};

export type SliderAction =
  | { type: 'tick' }
  | { type: 'select'; index: number }
  | { type: 'setCount'; count: number }
  | { type: 'resume' };

export const initialState: SliderState = {
  active: 0,
  autorotate: true,
  count: 3,
};

/** Proposed: wrap by modulo, and treat an empty list as having no active slide. */
export function advance(state: SliderState): SliderState {
  if (state.count === 0) return { ...state, active: 0 };
  return { ...state, active: (state.active + 1) % state.count };
}

/**
 * As shipped: the wrap test compares against the *captured* active, and the
 * increment is unbounded. Identical to `advance` only while `active` stays in
 * the dependency array and `count` is non-zero.
 */
export function advanceAsShipped(
  state: SliderState,
  capturedActive: number
): SliderState {
  const next = capturedActive + 1 === state.count ? 0 : (a: number) => a + 1;
  return {
    ...state,
    active: typeof next === 'number' ? next : next(state.active),
  };
}

export function reducer(state: SliderState, action: SliderAction): SliderState {
  switch (action.type) {
    case 'tick':
      return state.autorotate ? advance(state) : state;
    case 'select':
      // Selecting pauses rotation, which is what the shipped component does.
      return { ...state, active: action.index, autorotate: false };
    case 'setCount': {
      const count = Math.max(0, action.count);
      // Proposed: keep `active` inside the list when it shrinks.
      const active = count === 0 ? 0 : Math.min(state.active, count - 1);
      return { ...state, count, active };
    }
    case 'resume':
      return { ...state, autorotate: true };
  }
}

/** True when `active` cannot index the rendered list — the failure to watch for. */
export function isOutOfRange(state: SliderState): boolean {
  return state.count === 0 ? state.active !== 0 : state.active >= state.count;
}
