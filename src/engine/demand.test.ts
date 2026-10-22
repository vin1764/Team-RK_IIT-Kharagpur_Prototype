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
  it('60–90 a week ÷ 7 → midpoint 10.7 a day × 14 = 150 units, ₹12,000 at cost', () => {
    const l = suggestedLot('steel-bottle-1l', 80);
    expect(l).toMatchObject({ perDay: { low: 9, high: 13 }, days: 14, twoWeeks: 150, units: 150, raisedToMinRun: false, atCost: 12000 });
    expect(l.dailyRunRate).toBeCloseTo(75 / 7, 6);
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

// Team, after Phase 7: the suggestion follows the maker's own minimum run (never below it), share drives the rest
describe('suggestedLot — follows the maker', () => {
  it('min run 100 → still 150 (two weeks of sales is larger)', () => {
    expect(suggestedLot('steel-bottle-1l', 80, 100)).toMatchObject({ twoWeeks: 150, units: 150, raisedToMinRun: false, atCost: 12000 });
  });
  it('min run 200 → 200, ₹16,000 at cost', () => {
    expect(suggestedLot('steel-bottle-1l', 80, 200)).toMatchObject({ twoWeeks: 150, units: 200, raisedToMinRun: true, atCost: 16000 });
  });
  it('no min run entered → two weeks of sales', () => expect(suggestedLot('steel-bottle-1l', 80, null).units).toBe(150));
  it('share sets the run-rate: 9–13 a day for the bottle, 5–8 for Samar → 150 vs 90', () => {
    expect(suggestedLot('steel-bottle-1l', 80).perDay).toEqual({ low: 9, high: 13 });
    expect(suggestedLot('sneakers-slip-on-men', 200).units).toBe(90);
  });
});

// team (What to make instead → Plan a lot)
describe('What to make instead — likely orders and first lot', () => {
  it('1.5 L casserole: 200 a week × 20% = 40 a week = 5–6 a day → 5.7 × 14 = 80 units', () => {
    expect(likelyShare('steel-casserole-1-5l').ordersPerWeek).toEqual({ low: 40, high: 40 });
    expect(likelyShare('steel-casserole-1-5l').ordersPerDay).toEqual({ low: 5, high: 6 });
    expect(suggestedLot('steel-casserole-1-5l', 220)).toMatchObject({ units: 80, atCost: 17600 });
  });
  it('500 ml flask: 120 a week × 20% = 24 a week = 3–4 a day → 3.4 × 14 = 48 → 50 units', () => {
    expect(likelyShare('steel-flask-500ml').ordersPerDay).toEqual({ low: 3, high: 4 });
    expect(suggestedLot('steel-flask-500ml', 100)).toMatchObject({ units: 50, atCost: 5000 });
  });
  it('buyers pay ₹340–400 and ₹170–200', () => {
    expect(demandForType('steel-casserole-1-5l').priceBand).toEqual({ low: 340, high: 400 });
    expect(demandForType('steel-flask-500ml').priceBand).toEqual({ low: 170, high: 200 });
  });
  it('Samar unchanged: 5–8 a day → 6.5 × 14 = 91 → 90', () => expect(suggestedLot('sneakers-slip-on-men', 200).units).toBe(90));
});
