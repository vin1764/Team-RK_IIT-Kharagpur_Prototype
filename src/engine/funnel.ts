// Business Dashboard funnel arithmetic (GL-1 inputs, team Q13). Pure.

export interface FunnelInput {
  views: number;
  clicks: number;
  orders: number;
  returns: number;
}

export interface FunnelStats extends FunnelInput {
  /** clicks ÷ views */
  clickRate: number;
  /** orders ÷ clicks */
  conversion: number;
  /** orders × list price, whole rupees */
  sales: number;
  /** returns ÷ orders */
  returnRate: number;
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

/** "1.6%": one decimal, as the panel shows rates. */
export function pctDisplay(x: number): string {
  return `${(Math.round(x * 1000) / 10).toFixed(1)}%`;
}

export function funnelStats(f: FunnelInput, listPrice: number): FunnelStats {
  return {
    ...f,
    clickRate: ratio(f.clicks, f.views),
    conversion: ratio(f.orders, f.clicks),
    sales: f.orders * listPrice,
    returnRate: ratio(f.returns, f.orders),
  };
}
