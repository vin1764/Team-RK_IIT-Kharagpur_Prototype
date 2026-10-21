export type Verdict = 'makeMore' | 'keep' | 'fix' | 'stop' | 'switch';

export interface SkuHealth {
  sku: string;
  /** on hand ÷ run-rate (from restock); null when the SKU has no tracked stock in the demo, so "make more" can't fire */
  coverDays: number | null;
  leadTimeDays: number;
  safetyDays: number;
  /** metrics outside the category band; one with a clear cause → fix */
  outOfBand: Array<'sellThrough' | 'margin' | 'returns' | 'clickThrough' | 'conversion'>;
  /** consecutive weeks with sell-through below the category's 25th percentile */
  weeksSellThroughBelowP25: number;
  /** product-type demand is steady (not a type-wide slump) */
  typeDemandSteady: boolean;
  /** already stopped last cycle */
  stopped: boolean;
}

/**
 * Make-to-demand verdict chip (GL-5), deck appendix rules, checked in this order:
 * switch (after a stop) → stop (sell-through < p25 for 2+ weeks while the type is steady)
 * → make more (days of cover below lead time + safety days) → fix (one metric out of band) → keep.
 */
export function verdict(sku: SkuHealth): Verdict {
  if (sku.stopped) return 'switch';
  if (sku.weeksSellThroughBelowP25 >= 2 && sku.typeDemandSteady) return 'stop';
  if (sku.coverDays !== null && sku.coverDays < sku.leadTimeDays + sku.safetyDays) return 'makeMore';
  if (sku.outOfBand.length === 1) return 'fix';
  return 'keep';
}
