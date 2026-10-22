import { describe, expect, it } from 'vitest';
import { checkListingPrice, listingPricePosition, qualifyingPriceExists } from './ui';

// The UI-safe wrappers: same hero results, B never crosses the boundary.
describe('ui facade — 1 L steel bottle', () => {
  it('cost check: a qualifying price exists for break-even ₹133', () => {
    expect(qualifyingPriceExists('steel-bottle-1l', 133)).toBe(true);
  });
  it('bot Price screen: ₹147 qualifies', () => {
    expect(checkListingPrice('steel-bottle-1l', 147, 133)).toBe('qualifies');
  });
  it('D40 price edit: ₹165 does not qualify, position mid', () => {
    expect(checkListingPrice('steel-bottle-1l', 165, 133)).toBe('aboveCap');
    expect(listingPricePosition('steel-bottle-1l', 165)).toBe('mid');
  });
  it('via Pack Point, ₹172 (break-even ₹158) does not qualify, so Jasmeet self-ships', () => {
    expect(checkListingPrice('steel-bottle-1l', 172, 158)).toBe('aboveCap');
  });
  it('₹147 sits in the lowest third', () => {
    expect(listingPricePosition('steel-bottle-1l', 147)).toBe('low');
  });
});
