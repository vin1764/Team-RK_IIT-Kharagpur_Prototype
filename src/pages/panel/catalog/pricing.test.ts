import { describe, expect, it } from 'vitest';
import { suggestWdrp } from './pricing';

describe('suggestWdrp', () => {
  it('reproduces the one captured data point (350 → 332)', () => {
    expect(suggestWdrp(350)).toBe(332);
  });
  it('rounds down', () => {
    expect(suggestWdrp(101)).toBe(95);
  });
});
