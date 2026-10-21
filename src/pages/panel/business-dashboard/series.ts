// Business Dashboard chart series from the growth snapshot (D28+, team Q13). Pure.
// Orders per day = the launch series D21–D27 (growthAt().weekDaily); sales per day = orders × the
// listing's list price, the same rule funnelStats uses for the Total Sales tile.

export type Metric = 'orders' | 'sales';

export interface SeriesPoint {
  date: string;
  value: number;
}

export function weekSeries(weekDaily: { date: string; orders: number }[], listPrice: number, metric: Metric): SeriesPoint[] {
  return weekDaily.map((d) => ({ date: d.date, value: metric === 'orders' ? d.orders : d.orders * listPrice }));
}

/** A round axis top and its step: the smallest of 1, 2, 2.5, 5 × 10ⁿ that fits the data in 3 steps. */
export function niceAxis(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 1 };
  const raw = max / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { top: Math.ceil(max / step) * step, step };
}
