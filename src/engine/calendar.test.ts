import { describe, expect, it } from 'vitest';
import { dayToDate } from './calendar';

// Team answer, 21 Oct 2026: D0 = 24 Oct 2026
describe('dayToDate', () => {
  it('D0 = 24 Oct 2026', () => expect(dayToDate(0)).toBe('2026-10-24'));
  it('launch live D21–D25 = 14–18 Nov', () => {
    expect(dayToDate(21)).toBe('2026-11-14');
    expect(dayToDate(25)).toBe('2026-11-18');
  });
  it('restock moment D28 = 21 Nov (team, Phase 4)', () => expect(dayToDate(28)).toBe('2026-11-21'));
});

describe('dayLabel', () => {
  it('D31 → 24 Nov 2026', async () => {
    const { dayLabel } = await import('./calendar');
    expect(dayLabel(31)).toBe('24 Nov 2026');
  });
});

describe('dateToDay', () => {
  it('inverts dayToDate: 21 Nov = D28, 26 Nov = D33, D0…D90 round-trip', async () => {
    const { dateToDay } = await import('./calendar');
    expect([dateToDay('2026-11-21'), dateToDay('2026-11-26')]).toEqual([28, 33]);
    for (let d = 0; d <= 90; d++) expect(dateToDay(dayToDate(d))).toBe(d);
  });
});
