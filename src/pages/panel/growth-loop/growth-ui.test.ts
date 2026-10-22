import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { growthAt, planBatch } from '../../../engine/ui';
import en from '../../../i18n/en.json';
import hi from '../../../i18n/hi.json';
import { fmt, translate } from '../../../i18n';
import { scriptedListingFor } from '../../../store/timeline';
import { LAUNCH, effectiveCommit } from '../factory-launch/launch';
import { stockTabRows } from './SkuList';
import { makerInputs, shortDate } from './useGrowth';

// The growth-loop screens feed growthAt() from Jasmeet's scripted listing and commit, the same way
// the Factory Launch screens do. These checks pin that wiring to the D28 hero values.
const listing = scriptedListingFor('jasmeet')!;
const commit = effectiveCommit(undefined, 28, { typeId: listing.typeId, price: listing.price });
const maker = makerInputs(listing, commit)!;

describe('growth loop UI wiring', () => {
  it('maker inputs = lot 150, lead 5, min run 100, cost 80, price 147', () => {
    expect(maker).toEqual({ lot: LAUNCH.scriptedCommit.units, leadTimeDays: 5, minRun: 100, makingCost: 80, listPrice: 147 });
  });

  it('no snapshot before D28, the D28 week after', () => {
    expect(growthAt(27, maker)).toBeNull();
    // the week stays; only the coach's follow-up moves on (fix not applied → "Still pending" from D35)
    const { coachFollowUp: f40, ...at40 } = growthAt(40, maker)!;
    const { coachFollowUp: f28, ...at28 } = growthAt(28, maker)!;
    expect(at40).toEqual(at28);
    expect([f28!.stage, f40!.stage]).toEqual(['fix', 'pending']);
  });

  const g = growthAt(28, maker)!;

  it('coach copy after the fix: applied line, result line, no fix needed (EN and HI keys exist)', () => {
    expect(translate('en', 'gl.coach.applied', { date: '21 Nov 2026' })).toBe('Fix applied · main photo changed on 21 Nov 2026 · we\'ll check again next week');
    const r = growthAt(35, maker, [], { sku: 'lunchbox', day: 28 })!.coachFollowUp!.result!;
    expect(translate('en', 'gl.coach.ctrUp', { before: r.ctrBeforeDisplay, after: r.ctrAfterDisplay })).toBe('Click-through up from 1.6% to 3.9%');
    expect(translate('en', 'gl.coach.noFix')).toBe('No fix needed this week');
    expect(translate('en', 'gl.photo.now', { ctr: '1.6%' })).toBe('Now · 1.6% click-through');
    for (const k of ['gl.coach.applied', 'gl.coach.ctrUp', 'gl.coach.noFix', 'gl.coach.pending', 'gl.photo.title', 'gl.photo.tip', 'gl.photo.useSuggested', 'gl.photo.upload', 'gl.photo.apply'])
      expect(translate('hi', k, { date: 'x', before: 'a', after: 'b', sku: 's', ctr: 'c' })).not.toBe(k);
  });

  it('restock card copy: "Start 230 by 21 Nov", lands 26 Nov with 18 left', () => {
    expect(translate('en', 'gl.restock.startBy', { n: g.restock.nextBatch, date: shortDate(g.restock.startBy) })).toBe('Start 230 by 21 Nov');
    expect(translate('en', 'gl.restock.lands', { date: shortDate(g.restock.landsOn), left: g.restock.leftOnLanding })).toBe(
      'It lands 26 Nov, with 18 still on hand.',
    );
  });

  it('Inventory tab counts follow the rows: All 3, Out 0, Low 1 (the bottle)', () => {
    const rows = stockTabRows(g);
    expect([rows.all_stock.length, rows.out_of_stock.length, rows.low_stock.map((r) => r.id)]).toEqual([3, 0, ['bottle']]);
  });

  it('plan panel and planned card copy: 230 / 21 Nov / 26 Nov / ₹18,400 / ≈ 22 days', () => {
    const p = planBatch({ base: g.stockBase, units: g.restock.nextBatch, startDay: 28, leadTimeDays: maker.leadTimeDays, makingCost: maker.makingCost, minRun: maker.minRun });
    expect(translate('en', 'gl.plan.plannedDetail', { n: p.units, start: shortDate(p.startsOn), lands: shortDate(p.landsOn) })).toBe('230 units · starts 21 Nov · lands 26 Nov');
    expect(`₹${fmt(p.atCost)}`).toBe('₹18,400');
    expect(translate('en', 'gl.plan.coverValue', { days: p.coverAfterDays })).toBe('≈ 22 days');
    expect(translate('en', 'gl.plan.coverSub', { left: p.onHandAtLanding, n: p.units, rate: g.runRate })).toBe('(18 on hand + 230) ÷ 11 a day');
  });

  it('after the planned batch lands (D33): the bottle is Keep and leaves Low Stock (All 3, Low 0)', () => {
    const g33 = growthAt(33, maker, [{ units: 230, startDay: 28, leadTimeDays: maker.leadTimeDays }])!;
    const rows = stockTabRows(g33);
    expect([g33.onHand, rows.all_stock.length, rows.low_stock.length]).toEqual([248, 3, 0]);
  });

  it('sipper reason reads exactly "Sell-through low for 2+ weeks"', () => {
    const sipper = g.verdicts.find((v) => v.id === 'sipper')!;
    expect(translate('en', `gl.reason.${sipper.reason}`)).toBe('Sell-through low for 2+ weeks');
  });

  it('coach copy: "1.6% click-through vs 4.2% for similar listings"', () => {
    expect(translate('en', 'gl.coach.vs', { ctr: g.coach!.fix.ctrDisplay, similar: g.coach!.fix.similarDisplay })).toBe(
      '1.6% click-through vs 4.2% for similar listings',
    );
  });

  it('every gl.* key has a Hindi draft', () => {
    const glKeys = (o: object) => Object.keys(o).filter((k) => k.startsWith('gl.')).sort();
    expect(glKeys(hi)).toEqual(glKeys(en));
  });

  it('the internal coach trigger never reaches the copy', () => {
    for (const f of ['en.json', 'hi.json']) {
      expect(readFileSync(new URL(`../../../i18n/${f}`, import.meta.url), 'utf8')).not.toMatch(/2\.5/);
    }
  });
});
