import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { costStack, demandForType, launchProgress, likelyShare, slots, suggestedLot } from '../../../engine/ui';
import { todaySlot } from './KeyDates';
import { LAUNCH, dateRange, effectiveCommit, liveDates, liveDayIndex, phaseForDay, slotStatus, statusForPhase } from './launch';
import { chartDays, percent } from './liveSeries';

const BOTTLE = 'steel-bottle-1l' as const;

describe('phaseForDay (calendar: close D7, stock D18, live D21–D25)', () => {
  it.each([
    [0, 'open'],
    [5, 'open'],
    [7, 'open'],
    [8, 'closed'],
    [17, 'closed'],
    [18, 'stockReady'],
    [20, 'stockReady'],
    [21, 'live'],
    [25, 'live'],
    [26, 'ended'],
    [30, 'ended'],
  ] as const)('D%i → %s', (day, phase) => expect(phaseForDay(day)).toBe(phase));
  it('status sub-tab', () => {
    expect(statusForPhase('open')).toBe('UPCOMING');
    expect(statusForPhase('stockReady')).toBe('UPCOMING');
    expect(statusForPhase('live')).toBe('LIVE');
    expect(statusForPhase('ended')).toBe('COMPLETED');
  });
});

describe('liveDayIndex — "day 3 of 5 is day 23" (doc p.22)', () => {
  it('D23 → 3 of 5', () => expect(liveDayIndex(23)).toEqual({ n: 3, of: 5 }));
  it('outside the week → null', () => {
    expect(liveDayIndex(20)).toBeNull();
    expect(liveDayIndex(26)).toBeNull();
  });
});

describe('order book (team Q9: 4 of 5 slots taken before Jasmeet)', () => {
  it('before Jasmeet: 4/5, 1 slot left, not crowded', () => {
    expect(slotStatus(LAUNCH.slotsTakenBefore, slots(BOTTLE))).toEqual({ taken: 4, total: 5, left: 1, crowded: false });
  });
  it('after Jasmeet: 5/5, crowded', () => {
    expect(slotStatus(LAUNCH.slotsTakenBefore + 1, slots(BOTTLE))).toEqual({ taken: 5, total: 5, left: 0, crowded: true });
  });
  it('slots taken = 600 committed ÷ 150 suggested lot', () => {
    expect(demandForType(BOTTLE).committedUnits / suggestedLot(BOTTLE, 0).units).toBe(LAUNCH.slotsTakenBefore);
  });
  it('expected 9–13 a day, lot 150, committed 600 → 750 with Jasmeet', () => {
    expect(likelyShare(BOTTLE).ordersPerDay).toEqual({ low: 9, high: 13 });
    expect(suggestedLot(BOTTLE, 0).units).toBe(150);
    expect(demandForType(BOTTLE).committedUnits + LAUNCH.scriptedCommit.units).toBe(750);
  });
  it('Pack Point fee ₹30 per delivered order', () => expect(costStack(BOTTLE, 0, 0, 'packPoint').fees.packPointFee).toBe(30));
});

describe('dates', () => {
  it('live week 14–18 Nov 2026', () => expect(liveDates()).toBe('14–18 Nov 2026'));
  it('range across months', () => expect(dateRange(5, 10)).toBe('29 Oct – 3 Nov 2026'));
  it('today marker sits before the next key date, or on it', () => {
    expect(todaySlot(5)).toEqual({ index: 0, on: false });
    expect(todaySlot(7)).toEqual({ index: 0, on: true });
    expect(todaySlot(10)).toEqual({ index: 1, on: false });
    expect(todaySlot(23)).toEqual({ index: 2, on: true });
    expect(todaySlot(30)).toEqual({ index: 3, on: false });
  });
});

describe('effectiveCommit — interactive wins, script fills in after D7', () => {
  const scripted = { typeId: BOTTLE, price: 147 };
  const real = { typeId: BOTTLE, units: 120, day: 5, price: 147 };
  it('no script before commitments close', () => expect(effectiveCommit(undefined, 7, scripted)).toBeNull());
  it('scripted 150 at D5 from D8', () => expect(effectiveCommit(undefined, 8, scripted)).toMatchObject({ units: 150, day: 5, scripted: true }));
  it('interactive commit overrides the script', () => expect(effectiveCommit(real, 23, scripted)).toMatchObject({ units: 120, scripted: false }));
  it('a commit made on a later demo day does not count yet', () => expect(effectiveCommit({ ...real, day: 6 }, 5, scripted)).toBeNull());
  it('personas without a script get nothing', () => expect(effectiveCommit(undefined, 23, null)).toBeNull());
});

describe('live view series (team Q12)', () => {
  const lot = LAUNCH.scriptedCommit.units;
  it('D23: 11 today, 33 of 150, 117 left; chart D21–D25 with D24–25 empty', () => {
    const p = launchProgress(LAUNCH.dailyOrders, lot, 23);
    expect([p.today, p.soldToDate, p.left]).toEqual([11, 33, 117]);
    expect(chartDays(LAUNCH.dailyOrders, 21, 25, 23)).toEqual([
      { day: 21, orders: 12 },
      { day: 22, orders: 10 },
      { day: 23, orders: 11 },
      { day: 24, orders: null },
      { day: 25, orders: null },
    ]);
  });
  it('D30: 110 of 150 = 73%, chart runs D21–D30', () => {
    const p = launchProgress(LAUNCH.dailyOrders, lot, 30);
    expect(p.soldToDate).toBe(110);
    expect(percent(p.sellThrough)).toBe(73);
    expect(chartDays(LAUNCH.dailyOrders, 21, 25, 30)).toHaveLength(10);
  });
  it('after the seeded series the chart stops at its last day', () => expect(chartDays(LAUNCH.dailyOrders, 21, 25, 45)).toHaveLength(10));
});

// B guard for the Factory Launch screens: "the price cap is checked at commit, not printed".
describe('B stays out of the Factory Launch UI', () => {
  const DIR = fileURLToPath(new URL('./', import.meta.url));
  const files = readdirSync(DIR).filter((n) => /\.(ts|tsx)$/.test(n) && !n.endsWith('.test.ts')).map((n) => join(DIR, n));
  // Built from parts so this test file itself doesn't match the engine-wide guard.
  const forbidden = new RegExp(['productTypes\\.json', 'engine/' + 'bench', 'bench' + 'markB', 'comparables'].join('|'));
  it('no file reads productTypes.json or the benchmark seed directly', () => {
    for (const f of files) {
      expect(statSync(f).isFile()).toBe(true);
      expect(readFileSync(f, 'utf8')).not.toMatch(forbidden);
    }
  });
});
