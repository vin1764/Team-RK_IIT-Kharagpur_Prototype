import { NotImplemented } from './types';

export type Verdict = 'makeMore' | 'keep' | 'fix' | 'stop' | 'switch';

export interface SkuHealth {
  sku: string;
  /** whole days until on-hand reaches the reorder point (from restock) */
  daysToReorderPoint: number;
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
 * switch (after a stop) → stop (sell-through < p25 for 2+ weeks, type steady)
 * → make more (restock should start now: daysToReorderPoint < 1, proposed, Q6)
 * → fix (exactly one metric out of band) → keep.
 */
export function verdict(sku: SkuHealth): Verdict {
  throw new NotImplemented('verdict');
}
