import { describe, expect, it } from 'vitest';
import { demandForType, likelyShare, slots, suggestedLot, switchSuggestions } from './demand';

// plan §8 demandForType
describe('demandForType — 1 L steel bottle', () => {
  it('300–450/wk, ₹150–170, High, 600 committed', () => {
    expect(demandForType('steel-bottle-1l')).toMatchObject({
      gapPerWeek: { low: 300, high: 450 },
      priceBand: { low: 150, high: 170 },
      confidence: 'High',
      committedUnits: 600,
    });
  });
});

// plan §8 likelyShare · §8b Orders per listing
describe('likelyShare — 1 L steel bottle', () => {
  it('~20% → 60–90 a week → 9–13 a day', () => {
    const s = likelyShare('steel-bottle-1l');
    expect(s.share).toBe(0.2);
    expect(s.ordersPerWeek).toEqual({ low: 60, high: 90 });
    expect(s.ordersPerDay).toEqual({ low: 9, high: 13 }); // 8.6 and 12.9 rounded
  });
});

// plan §8 slots · §8b Slots
describe('slots — 1 L steel bottle', () => {
  it('300 ÷ 60 = 5 and 450 ÷ 90 = 5', () => expect(slots('steel-bottle-1l')).toBe(5));
});

// plan §8 suggestedLot · §8b Suggested lot
describe('suggestedLot — 1 L steel bottle at ₹80', () => {
  it('~11 a day × 14 = 154 → 150 units, ₹12,000 at cost', () => {
    expect(suggestedLot('steel-bottle-1l', 80)).toEqual({ dailyRunRate: 11, days: 14, units: 150, atCost: 12000 });
  });
});

// plan §8 switchSuggestions
describe('switchSuggestions — steel kitchenware line', () => {
  it('1.5 L casserole ~200/wk High, then 500 ml flask ~120/wk Medium', () => {
    const s = switchSuggestions('steel-kitchenware', 'steel-bottle-1l');
    expect(s.map((x) => [x.name, x.gapPerWeek.low, x.confidence])).toEqual([
      ['1.5 L steel casserole', 200, 'High'],
      ['500 ml steel flask', 120, 'Medium'],
    ]);
  });
});
