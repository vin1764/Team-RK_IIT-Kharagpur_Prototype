import { describe, expect, it } from 'vitest';
import { restock } from './restock';

// plan §8 restock · §8b Restock · deck appendix worked example
describe('restock — bottle at D31', () => {
  const r = () =>
    restock({ runRate: 11, onHand: 84, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-24' });

  it('cover 84 ÷ 11 = 7.6 days', () => expect(r().coverDays).toBe(7.6));
  it('reorder point 11 × (5 + 2) = 77', () => expect(r().reorderPoint).toBe(77));
  it('next batch 11 × 21 = 231 → 230', () => expect(r().nextBatch).toBe(230));
  it('230 × ₹80 = ₹18,400', () => expect(r().batchAtCost).toBe(18400));
  it('start 24 Nov, lands 24 Nov + 5 days = 29 Nov', () => {
    expect(r().startBy).toBe('2026-11-24');
    expect(r().landsOn).toBe('2026-11-29');
  });
  it('never below the minimum run', () => {
    const small = restock({ runRate: 2, onHand: 10, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-24' });
    expect(small.nextBatch).toBe(100);
  });
});
