import { describe, expect, it } from 'vitest';
import { dayToDate, formatDate } from '../../../engine/ui';
import type { PlannedLot } from '../../../store/fulfilmentSwitch';
import { lotRows, packPointLocation, seededLotRow, stockAtNode } from './lots';

const plan = (id: string, sendDay: number, units = 150): PlannedLot => ({
  id,
  planDay: 28,
  node: 'Rajkot',
  sendDay,
  lines: [{ listing: 'scripted-steel-bottle-1l', type: 'steel-bottle-1l', units }],
});

describe('Lots (PP-5)', () => {
  it('Samar’s seeded lot: Planned before D50 (90 expected), Received from D50 (90 received)', () => {
    expect(seededLotRow(40)).toMatchObject({ status: 'planned', units: 90, node: 'Agra', day: 50 });
    expect(seededLotRow(50)).toMatchObject({ status: 'received', units: 90 });
  });
  it('a planned lot is Planned before its send day and In transit from it (no receipt is seeded, so never Received)', () => {
    expect(lotRows({ seeded: false, planned: [plan('lot-1', 30)], day: 29 })[0]!.status).toBe('planned');
    expect(lotRows({ seeded: false, planned: [plan('lot-1', 30)], day: 30 })[0]!.status).toBe('inTransit');
    expect(lotRows({ seeded: false, planned: [plan('lot-1', 30)], day: 90 })[0]!.status).toBe('inTransit');
  });
  it('newest first', () => {
    const rows = lotRows({ seeded: true, planned: [plan('lot-1', 55), plan('lot-2', 70), plan('lot-3', 55)], day: 60 });
    expect(rows.map((r) => r.id)).toEqual(['lot-2', 'lot-3', 'lot-1', 'seed']);
    expect(rows.map((r) => r.units)).toEqual([150, 150, 150, 90]);
  });
});

describe('Stock at Pack Point (PP-6)', () => {
  it('nothing before the lot is received', () => {
    expect(stockAtNode(49, true)).toBeNull();
    expect(stockAtNode(60, false)).toBeNull();
  });
  it('D50: 90 pairs by size (UK 6–10: 10/20/25/20/15), held 0 days, free to 12 Jan 2027, then 90 × ₹0.29 = ₹26.10 a day', () => {
    const s = stockAtNode(50, true)!;
    expect(s.rows.map((r) => [r.size, r.units])).toEqual([
      ['6', 10],
      ['7', 20],
      ['8', 25],
      ['9', 20],
      ['10', 15],
    ]);
    expect(s.units).toBe(90);
    expect(s.rows[0]!.daysHeld).toBe(0);
    expect(s.freeUntilDay).toBe(80);
    expect(formatDate(dayToDate(s.freeUntilDay))).toBe('12 Jan 2027');
    expect(s.perUnitPerDay).toBe(0.29);
    expect(s.perDayAfterFree).toBe(26.1);
    expect([s.chargedDays, s.chargedSoFar]).toEqual([0, 0]);
  });
  it('D90: held 40 days, 10 charged days × ₹26.10 = ₹261', () => {
    const s = stockAtNode(90, true)!;
    expect(s.rows[0]!.daysHeld).toBe(40);
    expect([s.chargedDays, s.chargedSoFar]).toEqual([10, 261]);
  });
});

describe('Inventory location tag', () => {
  const overlay = { fulfilment: 'packPoint', node: 'Rajkot' };
  it('shows the Pack Point once a lot carrying the product has been sent', () => {
    expect(packPointLocation('scripted-steel-bottle-1l', overlay, [plan('lot-1', 35)], 34)).toBeNull();
    expect(packPointLocation('scripted-steel-bottle-1l', overlay, [plan('lot-1', 35)], 35)).toBe('Rajkot');
  });
  it('not for self-ship products or products with no lot', () => {
    expect(packPointLocation('scripted-steel-bottle-1l', { fulfilment: 'selfShip', node: null }, [plan('lot-1', 30)], 40)).toBeNull();
    expect(packPointLocation('scripted-steel-bottle-1l', overlay, [], 40)).toBeNull();
    expect(packPointLocation('other', overlay, [plan('lot-1', 30)], 40)).toBeNull();
  });
});
