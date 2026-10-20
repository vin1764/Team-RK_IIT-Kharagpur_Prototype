import { describe, expect, it } from 'vitest';
import { benchmarkB, priceCheck, priceDrop, pricePosition, type Comparable } from './benchmark';
import productTypes from '../data/productTypes.json';

const seed = productTypes['steel-bottle-1l'].benchmark;
const bottle = seed.comparables as Comparable[];
const N = seed.minDeliveredOrders; // 30, team answer 21 Oct 2026

// plan §8b Benchmark B (hidden)
describe('benchmarkB — 1 L steel bottle', () => {
  it('counts listings with at least 30 delivered orders', () => expect(N).toBe(30));

  it('B = ₹160: the 250th of 1,000 qualifying orders', () => {
    expect(benchmarkB(bottle, N)).toBe(160);
  });

  // Deck appendix rows A, B, C: each must be excluded for its own reason.
  const deckExclusions: Comparable[] = [
    { id: 'A', price: { from: 99, to: 99 }, deliveredOrders: 400, aboveQualityFloor: false, ownedByMaker: false },
    { id: 'B', price: { from: 135, to: 135 }, deliveredOrders: 6, aboveQualityFloor: true, ownedByMaker: false },
    { id: 'C', price: { from: 155, to: 155 }, deliveredOrders: 120, aboveQualityFloor: true, ownedByMaker: true },
  ];

  it('ignores below-floor, too-few-orders (6 < 30) and own listings', () => {
    expect(benchmarkB([...deckExclusions, ...bottle], N)).toBe(160);
  });
});

// plan §8 priceCheck · §8b Price check
describe('priceCheck — break-even ₹133, B ₹160', () => {
  it('₹147 qualifies (133 ≤ 147 ≤ 160)', () => expect(priceCheck(147, 133, 160)).toBe('qualifies'));
  it('₹165 does not (above the cap)', () => expect(priceCheck(165, 133, 160)).toBe('aboveCap'));
  it('both ends of the band qualify', () => {
    expect(priceCheck(133, 133, 160)).toBe('qualifies');
    expect(priceCheck(160, 133, 160)).toBe('qualifies');
  });
  it('below break-even is belowCost', () => expect(priceCheck(132, 133, 160)).toBe('belowCost'));
});

// plan §8 pricePosition
describe('pricePosition — thirds of like-for-like listings', () => {
  it('₹147 → low', () => expect(pricePosition(147, bottle, N)).toBe('low'));
  it('₹165 → mid', () => expect(pricePosition(165, bottle, N)).toBe('mid'));
});

// plan §8b Hero's price drop
describe('priceDrop (ops only)', () => {
  it('₹160 − ₹147 = ₹13 = 8.1% of B, meets the ≥ 8% target', () => {
    const d = priceDrop(147, 160);
    expect(d.rupees).toBe(13);
    expect(d.shareOfB).toBeCloseTo(0.08125, 5);
    expect(Math.round(d.shareOfB * 1000) / 10).toBe(8.1);
    expect(d.meetsTarget).toBe(true);
  });
});
