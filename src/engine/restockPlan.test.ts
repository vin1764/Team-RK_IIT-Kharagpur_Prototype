import { describe, expect, it } from 'vitest';
import { growthAt, type MakerInputs } from './growth';
import { landsDayOf, planBatch, stockOn, type PlannedBatch } from './restockPlan';

// Jasmeet's bottle at D28 (growth.test.ts): 11 a day, 73 on hand, lead 5, min run 100, ₹80 making cost.
const jasmeet: MakerInputs = { lot: 150, leadTimeDays: 5, minRun: 100, makingCost: 80, listPrice: 147 };
const g28 = growthAt(28, jasmeet)!;
const base = g28.stockBase;
const plan = (units: number, startDay: number) =>
  planBatch({ base, units, startDay, leadTimeDays: jasmeet.leadTimeDays, makingCost: jasmeet.makingCost, minRun: jasmeet.minRun });
const batch = (units: number, startDay: number): PlannedBatch => ({ units, startDay, leadTimeDays: jasmeet.leadTimeDays });

describe('planBatch (GL-2 "Plan this batch")', () => {
  it('projects from the D28 snapshot: D28, 73 on hand, 11 a day', () => {
    expect(base).toEqual({ asOfDay: 28, onHand: 73, runRate: 11 });
  });

  it('default plan = the card: 230 units, starts 21 Nov, lands 26 Nov, ₹18,400, 18 on hand at landing', () => {
    const p = plan(g28.restock.nextBatch, 28);
    expect(p).toMatchObject({ units: 230, startDay: 28, startsOn: '2026-11-21', landsDay: 33, landsOn: '2026-11-26', atCost: 18400, onHandAtLanding: 18 });
    expect([p.startsOn, p.landsOn, p.onHandAtLanding]).toEqual([g28.restock.startBy, g28.restock.landsOn, g28.restock.leftOnLanding]);
  });

  it('cover after landing = (18 + 230) ÷ 11 = 22.5 days, shown as ≈ 22 (floored)', () => {
    const p = plan(230, 28);
    expect([p.coverAfter, p.coverAfterDays]).toEqual([22.5, 22]);
    expect(p.coverAfterDays).toBe(Math.floor((18 + 230) / 11));
    expect([p.belowMinRun, p.runsOutBeforeLanding]).toEqual([false, false]);
  });

  it('150 units: ₹12,000, cover (18 + 150) ÷ 11 = 15.3', () => {
    const p = plan(150, 28);
    expect([p.atCost, p.coverAfter, p.coverAfterDays]).toEqual([12000, 15.3, 15]);
  });

  it('90 units: below his minimum run (100), ₹7,200, cover (18 + 90) ÷ 11 = 9.8', () => {
    const p = plan(90, 28);
    expect([p.belowMinRun, p.atCost, p.coverAfter, p.coverAfterDays]).toEqual([true, 7200, 9.8, 9]);
  });

  it('start 23 Nov (D30): lands 28 Nov; 73 − 11 × 7 < 0 → 0 on hand, stock runs out first; cover 230 ÷ 11 = 20.9', () => {
    const p = plan(230, 30);
    expect([p.startsOn, p.landsOn, p.onHandAtLanding, p.runsOutBeforeLanding]).toEqual(['2026-11-23', '2026-11-28', 0, true]);
    expect([p.coverAfter, p.coverAfterDays]).toEqual([20.9, 20]);
  });

  it('an earlier batch counts before a later one lands', () => {
    // 230 lands D33 (248 that morning); a second batch started D45 lands D50: 248 − 11 × 17 = 61 on hand.
    const p = planBatch({ base, units: 230, startDay: 45, leadTimeDays: 5, makingCost: 80, minRun: 100, earlier: [batch(230, 28)] });
    expect(p.onHandAtLanding).toBe(248 - 11 * 17);
  });
});

describe('stockOn', () => {
  it('without a plan: 73 − 11 a day, floored at 0', () => {
    expect([28, 29, 33, 34, 35, 60].map((d) => stockOn(d, base))).toEqual([73, 62, 18, 7, 0, 0]);
  });

  it('with the default plan: 18 + 230 = 248 the morning it lands, then 11 a day', () => {
    const b = [batch(230, 28)];
    expect(landsDayOf(b[0]!)).toBe(33);
    expect([32, 33, 34, 40].map((d) => stockOn(d, base, b))).toEqual([29, 248, 237, 248 - 77]);
  });

  it('refuses a day before the snapshot', () => {
    expect(() => stockOn(27, base)).toThrow(RangeError);
  });
});

describe('growthAt with a planned batch', () => {
  const plan230 = [batch(230, 28)];

  it('D28–D32: the D28 snapshot is unchanged (still Make more)', () => {
    for (const d of [28, 32]) {
      const g = growthAt(d, jasmeet, plan230)!;
      expect(g).toEqual(growthAt(d, jasmeet));
      expect([g.stockDay, g.onHand, g.restock.coverDays]).toEqual([28, 73, 6.6]);
      expect(g.verdicts.find((v) => v.id === 'bottle')!.verdict).toBe('makeMore');
    }
  });

  it('D33 (lands 26 Nov): 248 on hand, cover 22.5 ≥ 5 + 2 → Keep; the bottle leaves Low Stock', () => {
    const g = growthAt(33, jasmeet, plan230)!;
    expect([g.stockDay, g.onHand, g.restock.coverDays, g.restock.reorderPoint]).toEqual([33, 248, 22.5, 77]);
    const bottle = g.verdicts.find((v) => v.id === 'bottle')!;
    expect([bottle.verdict, bottle.reason]).toEqual(['keep', 'inBand']);
    // the run-rate, the week and the other SKUs stay the D28 week's
    expect([g.runRate, g.weekFrom, g.weekTo, g.soldBefore]).toEqual([11, '2026-11-14', '2026-11-20', 77]);
    expect(g.verdicts.filter((v) => v.id !== 'bottle')).toEqual(g28.verdicts.filter((v) => v.id !== 'bottle'));
  });

  it('later days keep selling at 11 a day: Make more again once cover drops below 7 days (D49, 72 on hand)', () => {
    const at = (d: number) => growthAt(d, jasmeet, plan230)!;
    expect([at(40).onHand, at(40).verdicts[0]!.verdict]).toEqual([171, 'keep']);
    expect([at(48).onHand, at(48).verdicts[0]!.verdict]).toEqual([83, 'keep']);
    expect([at(49).onHand, at(49).restock.coverDays, at(49).verdicts[0]!.verdict]).toEqual([72, 6.5, 'makeMore']);
  });

  it('a later start (D30, lands D35): Make more until it lands, then 230 on hand → Keep', () => {
    const b = [batch(230, 30)];
    expect(growthAt(34, jasmeet, b)!.stockDay).toBe(28);
    const g = growthAt(35, jasmeet, b)!;
    expect([g.onHand, g.restock.coverDays, g.verdicts[0]!.verdict]).toEqual([230, 20.9, 'keep']);
  });
});
