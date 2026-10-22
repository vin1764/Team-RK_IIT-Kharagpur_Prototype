import { describe, expect, it } from 'vitest';
import { dayToDate, firstLotPlan, landsDayOf } from '../../../engine/ui';
import { fmt, translate } from '../../../i18n';
import en from '../../../i18n/en.json';
import hi from '../../../i18n/hi.json';
import { scriptedListingFor } from '../../../store/timeline';
import { span } from './LotPlanPanel';
import { shortDate } from './useGrowth';

// GL-6 "Plan a lot" panel and the "Lot planned" card, fed like the screens: Jasmeet's listing (min run 100, lead 5)
// at D28. Every line is a translation filled with engine numbers.
const listing = scriptedListingFor('jasmeet')!;
const maker = { leadTimeDays: listing.leadTimeDays, minRun: listing.minRun };

describe.each([
  ['steel-casserole-1-5l', '~200 orders a week unserved', 'High', '40 a week · 5–6 a day', '80 units', '₹340–400', 80],
  ['steel-flask-500ml', '~120 orders a week unserved', 'Medium', '24 a week · 3–4 a day', '50 units', '₹170–200', 50],
] as const)('Plan a lot — %s', (type, demand, conf, likely, lot, buyers, units) => {
  const p = firstLotPlan({ type, units, startDay: 28, ...maker });
  it('her listing: minimum run 100, lead time 5 days', () => expect(maker).toEqual({ leadTimeDays: 5, minRun: 100 }));
  it(`${demand} · Confidence: ${conf}`, () => {
    expect(translate('en', 'gl.switch.gap', { n: fmt(p.gapPerWeek.low) })).toBe(demand);
    expect(p.confidence).toBe(conf);
  });
  it(`likely ${likely} (about 20%); suggested ${lot}; buyers pay ${buyers}`, () => {
    expect(translate('en', 'gl.lot.likelyValue', { week: span(p.likelyPerWeek), low: fmt(p.likelyPerDay.low), high: fmt(p.likelyPerDay.high) })).toBe(likely);
    expect(translate('en', 'gl.lot.likelySub', { pct: fmt(p.share * 100) })).toBe('about 20% of the open demand');
    expect(translate('en', 'gl.lot.unitsValue', { n: fmt(p.suggested) })).toBe(lot);
    expect(translate('en', 'gl.lot.buyersValue', { low: fmt(p.priceBand!.low), high: fmt(p.priceBand!.high) })).toBe(buyers);
  });
  it(`${units} is below his minimum run of 100 (soft warning)`, () => {
    expect(p.belowMinRun).toBe(true);
    expect(translate('en', 'gl.lot.belowMinRun', { n: fmt(units), min: fmt(maker.minRun) })).toBe(`${units} units is below your minimum run of 100. You can still plan any number.`);
  });
  it(`start 21 Nov → ready 26 Nov; card "Lot planned · ${units} units · ready 26 Nov"`, () => {
    expect(shortDate(dayToDate(p.startDay))).toBe('21 Nov');
    expect(shortDate(dayToDate(p.readyDay))).toBe('26 Nov');
    const saved = { units, startDay: 28, leadTimeDays: 5 };
    expect(`${translate('en', 'gl.lot.planned')} · ${translate('en', 'gl.lot.plannedDetail', { n: fmt(saved.units), date: shortDate(dayToDate(landsDayOf(saved))) })}`).toBe(
      `Lot planned · ${units} units · ready 26 Nov`,
    );
  });
});

describe('Plan a lot copy', () => {
  it('every gl.lot.* key has a Hindi draft', () => {
    const keys = Object.keys(en).filter((k) => k.startsWith('gl.lot.'));
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.filter((k) => !(k in hi))).toEqual([]);
  });
});
