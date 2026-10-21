import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { growthAt } from '../../../engine/ui';
import en from '../../../i18n/en.json';
import hi from '../../../i18n/hi.json';
import { translate } from '../../../i18n';
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
    expect(growthAt(40, maker)).toEqual(growthAt(28, maker));
  });

  const g = growthAt(28, maker)!;

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
