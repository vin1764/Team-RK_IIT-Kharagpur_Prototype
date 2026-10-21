// Live launch chart series (LW-7). Pure.

/**
 * The days the chart shows: every live day (D21–D25) and, after the week, each later day up to
 * the demo day while the seeded series has orders. Days not reached yet carry `orders: null`.
 */
export function chartDays(daily: Record<string, number>, from: number, to: number, day: number): { day: number; orders: number | null }[] {
  const lastSeeded = Math.max(...Object.keys(daily).map(Number));
  const last = Math.max(to, Math.min(day, lastSeeded));
  const out: { day: number; orders: number | null }[] = [];
  for (let d = from; d <= last; d++) out.push({ day: d, orders: d <= day ? (daily[String(d)] ?? null) : null });
  return out;
}

/** Sell-through as a whole percent: 110 ÷ 150 → 73. */
export const percent = (share: number) => Math.round(share * 100);
