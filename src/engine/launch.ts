// Factory Launch Week sales arithmetic (LW-7, GL-2 inputs). Pure: the daily series is seed data.

export type DailyOrders = Record<string, number>;

export interface LaunchProgress {
  /** orders on the given day (null before the first sales day or past the series) */
  today: number | null;
  soldToDate: number;
  left: number;
  /** sold ÷ lot */
  sellThrough: number;
  /** days with orders up to and including `day`, oldest first */
  days: { day: number; orders: number }[];
}

/** Sales of a committed lot up to the end of `day`. */
export function launchProgress(daily: DailyOrders, lot: number, day: number): LaunchProgress {
  const days = Object.entries(daily)
    .map(([d, orders]) => ({ day: Number(d), orders }))
    .filter((d) => d.day <= day)
    .sort((a, b) => a.day - b.day);
  const soldToDate = days.reduce((s, d) => s + d.orders, 0);
  return {
    today: daily[String(day)] ?? null,
    soldToDate,
    left: lot - soldToDate,
    sellThrough: lot > 0 ? soldToDate / lot : 0,
    days,
  };
}

/** Run-rate from the trailing 7 days before `day` (days day−7 … day−1), as the deck defines it. */
export function trailingRunRate(daily: DailyOrders, day: number): number {
  let sum = 0;
  for (let d = day - 7; d <= day - 1; d++) sum += daily[String(d)] ?? 0;
  return sum / 7;
}
