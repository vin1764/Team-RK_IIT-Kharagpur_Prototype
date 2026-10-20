import { dayToDate } from '../../../engine/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ordinal = (n: number) => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

/** ISO date → "14th Oct '26", the Business Dashboard's date style. */
export function dashDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${ordinal(d)} ${MONTHS[m - 1]} '${String(y).slice(-2)}`;
}

export type RangeId = 'YESTERDAY' | 'SEVEN_DAYS' | 'THIRTY_DAYS';

/** Days covered by each chip, all ending yesterday (the live panel's label for Last 7 Days, captured 21 Oct, read 14th–20th Oct). */
const SPAN: Record<RangeId, number> = { YESTERDAY: 1, SEVEN_DAYS: 7, THIRTY_DAYS: 30 };

/** Demo day + chip → "14th Oct '26 - 20th Oct '26" (Yesterday shows a single date). */
export function rangeLabel(day: number, range: RangeId): string {
  const end = dashDate(dayToDate(day - 1));
  if (range === 'YESTERDAY') return end;
  return `${dashDate(dayToDate(day - SPAN[range]))} - ${end}`;
}
