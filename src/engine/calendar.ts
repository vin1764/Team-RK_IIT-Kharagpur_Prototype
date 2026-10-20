import calendar from '../data/calendar.json';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Demo day → ISO date. D0 = 24 Oct 2026 (src/data/calendar.json). UTC so it never shifts by timezone. */
export function dayToDate(day: number): string {
  const d = new Date(`${calendar.d0}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return d.toISOString().slice(0, 10);
}

/** "24 Nov 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Demo day → "24 Nov 2026" */
export function dayLabel(day: number): string {
  return formatDate(dayToDate(day));
}
