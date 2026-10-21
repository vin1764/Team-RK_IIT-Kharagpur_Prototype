import { describe, expect, it } from 'vitest';
import { growthAt, type MakerInputs } from './growth';

// Team Phase 5 answers: one SKU per verdict, D28 snapshot, Business Dashboard tiles (Q13)
const jasmeet: MakerInputs = { lot: 150, leadTimeDays: 5, minRun: 100, makingCost: 80, listPrice: 147 };

describe('growthAt', () => {
  it('nothing before D28', () => expect(growthAt(27, jasmeet)).toBeNull());

  const g = growthAt(28, jasmeet)!;

  it('week is D21–D27 = 14–20 Nov; snapshot 21 Nov', () => {
    expect([g.weekFrom, g.weekTo, g.asOf]).toEqual(['2026-11-14', '2026-11-20', '2026-11-21']);
  });

  it('restock: 11/day, 73 on hand, 6.6 days, reorder 77, batch 230 (₹18,400), start 21 Nov, lands 26 Nov', () => {
    expect([g.runRate, g.onHand]).toEqual([11, 73]);
    expect(g.restock).toMatchObject({
      coverDays: 6.6,
      reorderPoint: 77,
      nextBatch: 230,
      batchAtCost: 18400,
      startBy: '2026-11-21',
      landsOn: '2026-11-26',
      leftOnLanding: 18,
    });
  });

  it('verdicts: bottle Make more, lunch box Fix, sipper Stop', () => {
    expect(g.verdicts.map((v) => [v.id, v.verdict, v.reason])).toEqual([
      ['bottle', 'makeMore', 'coverBelowLead'],
      ['lunchbox', 'fix', 'weakListing'],
      ['sipper', 'stop', 'sellThroughLow'],
    ]);
  });

  it('coach is on the lunch box: 2,400 views, 38 clicks (1.6%), 3 orders, 7.9% conversion vs 4.2%', () => {
    expect(g.coach).toEqual({
      skuId: 'lunchbox',
      skuName: 'Steel lunch box, 2-tier',
      fix: { fix: 'changeMainPhoto', ctrDisplay: '1.6%', similarDisplay: '4.2%' },
      views: 2400,
      clicks: 38,
      orders: 3,
      conversionDisplay: '7.9%',
    });
  });

  it('what to make instead (sipper only): 1.5 L casserole ~200/wk High, 500 ml flask ~120/wk Medium', () => {
    expect(Object.keys(g.switchTo)).toEqual(['sipper']);
    expect(g.switchTo.sipper!.map((s) => [s.name, s.gapPerWeek.low, s.confidence])).toEqual([
      ['1.5 L steel casserole', 200, 'High'],
      ['500 ml steel flask', 120, 'Medium'],
    ]);
  });

  it('dashboard: 19,250 views, 770 clicks (4.0%), 77 orders, 10.0% conversion, ₹11,319, 1 return (1.3%)', () => {
    const d = g.dashboard;
    expect([d.views, d.clicks, d.orders, d.sales, d.returns]).toEqual([19250, 770, 77, 11319, 1]);
    expect((d.clickRate * 100).toFixed(1)).toBe('4.0');
    expect((d.conversion * 100).toFixed(1)).toBe('10.0');
    expect((d.returnRate * 100).toFixed(1)).toBe('1.3');
  });

  it('Home and restock agree: 77 sold by end of D27, 73 left', () => expect([g.soldBefore, g.onHand]).toEqual([77, 73]));

  it('week daily orders D21–D27 = 12, 10, 11, 11, 12, 11, 10 (14–20 Nov)', () => {
    expect(g.weekDaily.map((d) => d.orders)).toEqual([12, 10, 11, 11, 12, 11, 10]);
    expect([g.weekDaily[0]!.date, g.weekDaily[6]!.date]).toEqual(['2026-11-14', '2026-11-20']);
  });

  it('after D28 the D28 week stays', () => expect(growthAt(35, jasmeet)).toEqual(g));
});
