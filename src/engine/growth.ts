// Make-to-Demand Growth Loop view (GL-2 to GL-6), composed from the seed and the other engine functions.
// Everything shown on Inventory → Low Stock, the SKU Health Coach and the Business Dashboard tiles comes from here.

import growth from '../data/growth.json';
import launch from '../data/launch.json';
import { dayToDate } from './calendar';
import { coachFix, type CoachFix } from './coach';
import { switchSuggestions, type SwitchSuggestion } from './demand';
import { funnelStats, pctDisplay, type FunnelStats } from './funnel';
import { launchProgress, trailingRunRate } from './launch';
import { restock, type Restock } from './restock';
import type { ProductTypeId } from './types';
import { verdict, type Verdict } from './verdict';

/** The maker's own numbers for the launched bottle listing (from their listing and commit). */
export interface MakerInputs {
  lot: number;
  leadTimeDays: number;
  minRun: number;
  makingCost: number;
  listPrice: number;
}

export type VerdictReason = 'coverBelowLead' | 'weakListing' | 'sellThroughLow' | 'inBand' | 'afterStop';

export interface SkuVerdict {
  id: string;
  name: string;
  verdict: Verdict;
  /** one-line reason key; the UI words it (no numbers for the lunch box and sipper, team Q5) */
  reason: VerdictReason;
}

export interface CoachCard {
  skuId: string;
  skuName: string;
  fix: CoachFix;
  views: number;
  clicks: number;
  orders: number;
  /** orders ÷ clicks, e.g. "7.9%" */
  conversionDisplay: string;
}

export interface GrowthView {
  /** the snapshot day (D28) and its date */
  asOfDay: number;
  asOf: string;
  /** the 7 days the funnel and run-rate cover: D21–D27 */
  weekFrom: string;
  weekTo: string;
  restock: Restock;
  /** stock of the bottle at the start of the snapshot day */
  onHand: number;
  runRate: number;
  verdicts: SkuVerdict[];
  coach: CoachCard | null;
  /** "What to make instead" for each SKU whose verdict is stop or switch */
  switchTo: Record<string, SwitchSuggestion[]>;
  dashboard: FunnelStats;
}

const BOTTLE_TYPE: ProductTypeId = 'steel-bottle-1l';

interface SkuSeed {
  id: string;
  name: string;
  funnel?: { views: number; clicks: number; orders: number };
  weeksSellThroughBelowP25?: number;
  typeDemandSteady?: boolean;
  stopped?: boolean;
  line?: string;
}
const SKUS = growth.skus as SkuSeed[];

/**
 * The growth-loop snapshot for a demo day, or null before the snapshot day (D28).
 * From D28 on it always shows the D28 week, as the team specified ("last 7 days at D28").
 */
export function growthAt(day: number, maker: MakerInputs): GrowthView | null {
  const asOfDay = growth.asOfDay;
  if (day < asOfDay) return null;

  const daily = launch.dailyOrders;
  const runRate = trailingRunRate(daily, asOfDay);
  const onHand = launchProgress(daily, maker.lot, asOfDay - 1).left;
  const asOf = dayToDate(asOfDay);
  const r = restock({
    runRate,
    onHand,
    leadTimeDays: maker.leadTimeDays,
    safetyDays: growth.safetyDays,
    makingCost: maker.makingCost,
    minRun: maker.minRun,
    today: asOf,
  });

  const bands = growth.coachBands;
  const weekOrders = launchProgress(daily, maker.lot, asOfDay - 1).days
    .filter((d) => d.day >= asOfDay - 7)
    .reduce((s, d) => s + d.orders, 0);
  const dashboard = funnelStats(
    { views: growth.dashboard.views, clicks: growth.dashboard.clicks, orders: weekOrders, returns: growth.dashboard.returns },
    maker.listPrice,
  );

  const verdicts: SkuVerdict[] = [];
  let coach: CoachCard | null = null;
  const switchTo: Record<string, SwitchSuggestion[]> = {};

  for (const sku of SKUS) {
    if (sku.id === 'bottle') {
      const fix = coachFix({ views: dashboard.views, clicks: dashboard.clicks, orders: dashboard.orders }, bands);
      const v = verdict({
        sku: sku.id,
        coverDays: r.coverDays,
        leadTimeDays: maker.leadTimeDays,
        safetyDays: growth.safetyDays,
        outOfBand: fix ? ['clickThrough'] : [],
        weeksSellThroughBelowP25: 0,
        typeDemandSteady: true,
        stopped: false,
      });
      verdicts.push({ id: sku.id, name: sku.name, verdict: v, reason: reasonFor(v) });
      continue;
    }
    const fix = sku.funnel ? coachFix(sku.funnel, bands) : null;
    const v = verdict({
      sku: sku.id,
      coverDays: null,
      leadTimeDays: maker.leadTimeDays,
      safetyDays: growth.safetyDays,
      outOfBand: fix ? ['clickThrough'] : [],
      weeksSellThroughBelowP25: sku.weeksSellThroughBelowP25 ?? 0,
      typeDemandSteady: sku.typeDemandSteady ?? true,
      stopped: sku.stopped ?? false,
    });
    verdicts.push({ id: sku.id, name: sku.name, verdict: v, reason: reasonFor(v) });
    if (fix && sku.funnel && !coach) {
      coach = {
        skuId: sku.id,
        skuName: sku.name,
        fix,
        views: sku.funnel.views,
        clicks: sku.funnel.clicks,
        orders: sku.funnel.orders,
        conversionDisplay: pctDisplay(sku.funnel.orders / sku.funnel.clicks),
      };
    }
    if ((v === 'stop' || v === 'switch') && sku.line) switchTo[sku.id] = switchSuggestions(sku.line, [BOTTLE_TYPE]);
  }

  return {
    asOfDay,
    asOf,
    weekFrom: dayToDate(asOfDay - 7),
    weekTo: dayToDate(asOfDay - 1),
    restock: r,
    onHand,
    runRate,
    verdicts,
    coach,
    switchTo,
    dashboard,
  };
}

function reasonFor(v: Verdict): VerdictReason {
  switch (v) {
    case 'makeMore':
      return 'coverBelowLead';
    case 'fix':
      return 'weakListing';
    case 'stop':
      return 'sellThroughLow';
    case 'switch':
      return 'afterStop';
    default:
      return 'inBand';
  }
}
