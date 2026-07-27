/**
 * PROTOTYPE — headless driver. Run with `pnpm prototype:slider:cases`.
 *
 * The TUI (`pnpm prototype:slider`) is for driving by hand. This walks the
 * three cases that answer the question in slider-state.ts and prints the
 * verdict, so the answer is reproducible without a terminal.
 */
import {
  type SliderState,
  advance,
  advanceAsShipped,
  isOutOfRange,
} from './slider-state.ts';

const show = (label: string, s: SliderState) =>
  `  ${label.padEnd(12)} active=${String(s.active).padEnd(3)} count=${s.count}  ${
    isOutOfRange(s) ? 'OUT OF RANGE' : 'ok'
  }`;

console.log('CASE 1 — the list is empty, then three ticks');
{
  let p: SliderState = { active: 0, autorotate: true, count: 0 };
  let s: SliderState = { active: 0, autorotate: true, count: 0 };
  let captured = 0;
  for (let i = 0; i < 3; i++) {
    p = advance(p);
    s = advanceAsShipped(s, captured);
    captured = s.active;
  }
  console.log(show('proposed', p));
  console.log(show('as shipped', s));
}

console.log('\nCASE 2 — showing slide 3 of 3, list shrinks to 1, one tick');
{
  let p: SliderState = { active: 2, autorotate: true, count: 1 };
  let s: SliderState = { active: 2, autorotate: true, count: 1 };
  p = advance(p);
  s = advanceAsShipped(s, 2);
  console.log(show('proposed', p));
  console.log(show('as shipped', s));
}

console.log('\nCASE 3 — `active` removed from the dep array, five ticks');
{
  let p: SliderState = { active: 0, autorotate: true, count: 3 };
  let s: SliderState = { active: 0, autorotate: true, count: 3 };
  // The effect closes over active once and never re-runs, so it stays 0.
  const captured = 0;
  for (let i = 0; i < 5; i++) {
    p = advance(p);
    s = advanceAsShipped(s, captured);
  }
  console.log(show('proposed', p));
  console.log(show('as shipped', s));
}
