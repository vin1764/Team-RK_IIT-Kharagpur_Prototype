import { describe, expect, it } from 'vitest';
import { dayToDate } from './calendar';

// Team answer, 21 Oct 2026: D0 = 24 Oct 2026
describe('dayToDate', () => {
  it('D0 = 24 Oct 2026', () => expect(dayToDate(0)).toBe('2026-10-24'));
  it('launch live D21–D25 = 14–18 Nov', () => {
    expect(dayToDate(21)).toBe('2026-11-14');
    expect(dayToDate(25)).toBe('2026-11-18');
  });
  it('restock starts D31 = 24 Nov', () => expect(dayToDate(31)).toBe('2026-11-24'));
});
