import { describe, expect, it } from 'vitest';
import { dayToDate } from './calendar';
import { demoInputsForType } from './demand';
import { firstLotPlan } from './firstLot';

// GL-6 "Plan a lot" (team spec): Jasmeet at D28, her listing's minimum run 100 and lead time 5 days.
const jasmeet = { startDay: 28, leadTimeDays: 5, minRun: 100 };

describe('firstLotPlan — 1.5 L steel casserole', () => {
  const p = firstLotPlan({ type: 'steel-casserole-1-5l', units: 80, ...jasmeet });
  it('open demand ~200 a week, High; buyers pay ₹340–400', () => {
    expect(p).toMatchObject({ name: '1.5 L steel casserole', gapPerWeek: { low: 200, high: 200, approx: true }, confidence: 'High', priceBand: { low: 340, high: 400 } });
  });
  it('likely orders: 20% → 40 a week · 5–6 a day', () => {
    expect([p.share, p.likelyPerWeek, p.likelyPerDay]).toEqual([0.2, { low: 40, high: 40 }, { low: 5, high: 6 }]);
  });
  it('suggested first lot 80 (two weeks, not raised to his minimum run of 100); 80 is below it', () => {
    expect([p.suggested, p.units, p.belowMinRun]).toEqual([80, 80, true]);
  });
  it('start 21 Nov (D28) → ready 26 Nov (D33) with a 5-day lead time', () => {
    expect([dayToDate(p.startDay), p.readyDay, dayToDate(p.readyDay)]).toEqual(['2026-11-21', 33, '2026-11-26']);
  });
});

describe('firstLotPlan — 500 ml steel flask', () => {
  const p = firstLotPlan({ type: 'steel-flask-500ml', units: 50, ...jasmeet });
  it('open demand ~120 a week, Medium; buyers pay ₹170–200', () => {
    expect(p).toMatchObject({ gapPerWeek: { low: 120, high: 120 }, confidence: 'Medium', priceBand: { low: 170, high: 200 } });
  });
  it('likely orders: 24 a week · 3–4 a day; suggested 50', () => {
    expect([p.likelyPerWeek, p.likelyPerDay, p.suggested]).toEqual([{ low: 24, high: 24 }, { low: 3, high: 4 }, 50]);
  });
  it('ready = start + lead time, any start', () => {
    expect(firstLotPlan({ type: 'steel-flask-500ml', units: 50, startDay: 40, leadTimeDays: 7, minRun: 100 }).readyDay).toBe(47);
  });
});

describe('firstLotPlan — units are the maker’s', () => {
  it('any whole number; at or above his minimum run no warning', () => {
    expect(firstLotPlan({ type: 'steel-casserole-1-5l', units: 100, ...jasmeet }).belowMinRun).toBe(false);
    expect(firstLotPlan({ type: 'steel-casserole-1-5l', units: 7, ...jasmeet })).toMatchObject({ units: 7, belowMinRun: true });
  });
  it('empty, zero or fractional → no units (Save disabled)', () => {
    for (const u of [null, 0, 2.5]) expect(firstLotPlan({ type: 'steel-casserole-1-5l', units: u, ...jasmeet }).units).toBeNull();
  });
});

describe('demoInputsForType', () => {
  it('casserole ₹220 / 15%, flask ₹100 / 15%; none seeded for the bottle (the persona’s own)', () => {
    expect(demoInputsForType('steel-casserole-1-5l')).toEqual({ makingCost: 220, marginPct: 15 });
    expect(demoInputsForType('steel-flask-500ml')).toEqual({ makingCost: 100, marginPct: 15 });
    expect(demoInputsForType('steel-bottle-1l')).toBeNull();
  });
});
