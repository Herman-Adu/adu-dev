import { describe, expect, test } from 'vitest';

import { stripStegaMarkers, truncate } from './utils';

describe('truncate', () => {
  test('returns text unchanged when within the limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('cuts at the limit and appends an ellipsis', () => {
    expect(truncate('launchpad delivers content', 9)).toBe('launchpad...');
  });

  test('returns an empty string for null or undefined', () => {
    expect(truncate(null, 5)).toBe('');
    expect(truncate(undefined, 5)).toBe('');
  });
});

describe('stripStegaMarkers', () => {
  test('removes invisible stega characters injected by draft mode', () => {
    expect(stripStegaMarkers('Launch\u200BPad\u2060\uFEFF')).toBe('LaunchPad');
  });

  test('leaves clean text untouched', () => {
    expect(stripStegaMarkers('LaunchPad')).toBe('LaunchPad');
  });
});
