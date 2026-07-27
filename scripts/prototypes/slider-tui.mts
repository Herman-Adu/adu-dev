/**
 * PROTOTYPE — throwaway TUI shell. Run with `pnpm prototype:slider`.
 *
 * Drives two slider models side by side: the proposed one, and today's
 * arithmetic. See slider-state.ts for the question this answers.
 *
 * The interesting keys are [0] (empty the list) and [-] (shrink it) — those are
 * the cases the shipped model was never pushed through.
 */
import {
  type SliderState,
  advanceAsShipped,
  initialState,
  isOutOfRange,
  reducer,
} from './slider-state.ts';

const B = '\x1b[1m';
const D = '\x1b[2m';
const R = '\x1b[0m';
const RED = '\x1b[31m';
const GRN = '\x1b[32m';

let proposed: SliderState = { ...initialState };
let shipped: SliderState = { ...initialState };
/**
 * What the shipped effect closed over when its interval was created. With
 * `active` in the dependency array this tracks `shipped.active`; press [f] to
 * simulate "tidying" that dependency away and watch the two separate.
 */
let capturedActive = 0;
let depsIncludeActive = true;
let ticks = 0;

function row(label: string, s: SliderState) {
  const bad = isOutOfRange(s);
  const mark = bad ? `${RED}OUT OF RANGE${R}` : `${GRN}ok${R}`;
  return `  ${B}${label.padEnd(10)}${R} active=${String(s.active).padEnd(4)} count=${String(s.count).padEnd(3)} autorotate=${String(s.autorotate).padEnd(6)} ${mark}`;
}

function render() {
  console.clear();
  console.log(`${B}Testimonials slider — state model prototype${R}`);
  console.log(
    `${D}  ticks=${ticks}  effect deps include \`active\`: ${depsIncludeActive}  captured=${capturedActive}${R}\n`
  );
  console.log(row('proposed', proposed));
  console.log(row('as shipped', shipped));

  if (isOutOfRange(shipped) && !isOutOfRange(proposed)) {
    console.log(
      `\n  ${RED}the shipped model is indexing past the end of the list${R}`
    );
    console.log(
      `  ${D}slicedTestimonials[${shipped.active}] is undefined -> item.user?.image reads on undefined${R}`
    );
  }

  console.log(
    `\n${D}  [t] tick   [s] select slide 1   [-] shrink list   [+] grow list${R}`
  );
  console.log(
    `${D}  [0] empty the list   [f] toggle \`active\` in deps   [r] resume   [q] quit${R}`
  );
}

function tick() {
  ticks += 1;
  proposed = reducer(proposed, { type: 'tick' });
  if (shipped.autorotate) {
    shipped = advanceAsShipped(shipped, capturedActive);
    // The effect re-runs and re-closes over `active` only while it is a dep.
    if (depsIncludeActive) capturedActive = shipped.active;
  }
}

function setCount(count: number) {
  proposed = reducer(proposed, { type: 'setCount', count });
  // As shipped: nothing re-clamps `active` when the list shrinks.
  shipped = { ...shipped, count: Math.max(0, count) };
}

const actions: Record<string, () => void> = {
  t: tick,
  s: () => {
    proposed = reducer(proposed, { type: 'select', index: 1 });
    shipped = { ...shipped, active: 1, autorotate: false };
    capturedActive = 1;
  },
  '-': () => setCount(proposed.count - 1),
  '+': () => setCount(proposed.count + 1),
  '0': () => setCount(0),
  f: () => {
    depsIncludeActive = !depsIncludeActive;
  },
  r: () => {
    proposed = reducer(proposed, { type: 'resume' });
    shipped = { ...shipped, autorotate: true };
  },
};

process.stdin.setRawMode?.(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
render();

process.stdin.on('data', (key: string) => {
  if (key === 'q' || key === '') {
    console.clear();
    process.exit(0);
  }
  actions[key]?.();
  render();
});
