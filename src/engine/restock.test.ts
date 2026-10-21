import { describe, expect, it } from 'vitest';
import { restock } from './restock';

// plan §8 restock · §8b Restock (team Phase 4 answers: restock moment is D28 = 21 Nov)
describe('restock — bottle at D28', () => {
  const r = () =>
    restock({ runRate: 11, onHand: 73, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-21' });

  it('cover 73 ÷ 11 = 6.6 days', () => expect(r().coverDays).toBe(6.6));
  it('reorder point 11 × (5 + 2) = 77', () => expect(r().reorderPoint).toBe(77));
  it('next batch 11 × 21 = 231 → 230', () => expect(r().nextBatch).toBe(230));
  it('230 × ₹80 = ₹18,400', () => expect(r().batchAtCost).toBe(18400));
  it('73 < 77, so start today (21 Nov); lands 21 Nov + 5 days = 26 Nov', () => {
    expect(r().startBy).toBe('2026-11-21');
    expect(r().landsOn).toBe('2026-11-26');
  });
  it('18 units still on hand when it lands (73 − 11 × 5)', () => expect(r().leftOnLanding).toBe(18));
  it('never below the maker’s minimum run', () => {
    const small = restock({ runRate: 2, onHand: 10, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-21' });
    expect(small.nextBatch).toBe(100);
  });
  it('above the reorder point, start is dated ahead', () => {
    const later = restock({ runRate: 11, onHand: 110, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-18' });
    expect(later.startBy).toBe('2026-11-21'); // floor((110 − 77) ÷ 11) = 3 days
  });
});
