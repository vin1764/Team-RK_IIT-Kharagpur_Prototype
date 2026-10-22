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
import { landsDayOf, stockOn, type PlannedBatch, type StockBase } from './restockPlan';
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
  /** stock of the bottle at the start of the stock day */
  onHand: number;
  /**
   * The day the stock numbers (onHand, restock, the bottle's verdict) are for: the snapshot day (D28) until a
   * planned batch lands, then the demo day (projected from the snapshot with its run-rate, src/engine/restockPlan.ts).
   */
  stockDay: number;
  /** the D28 stock snapshot a restock plan projects from */
  stockBase: StockBase;
  /** units of the lot sold up to the end of the day before the snapshot (lot − the snapshot's on-hand) */
  soldBefore: number;
  /** the bottle's daily orders over the week (D21–D27), oldest first, with ISO dates */
  weekDaily: { date: string; orders: number }[];
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
 *
 * `batches` are the restock batches the maker confirmed ("Plan this batch", GL-2). Until one has landed the
 * stock numbers stay the D28 snapshot. From a batch's landing day the bottle's on-hand is projected to the
 * demo day (snapshot on-hand − run-rate per day, floored at 0, + each landed batch: stockOn), and its restock
 * numbers, cover and verdict are recomputed with the same rules (restock(), verdict()). The run-rate stays the
 * D28 week's: the seeded daily series ends at D30, so there are no later sales to average.
 */
export function growthAt(day: number, maker: MakerInputs, batches: PlannedBatch[] = []): GrowthView | null {
  const asOfDay = growth.asOfDay;
  if (day < asOfDay) return null;

  const daily = launch.dailyOrders;
  const runRate = trailingRunRate(daily, asOfDay);
  const snapshotOnHand = launchProgress(daily, maker.lot, asOfDay - 1).left;
  const asOf = dayToDate(asOfDay);
  const stockBase: StockBase = { asOfDay, onHand: snapshotOnHand, runRate };
  const landed = batches.some((b) => landsDayOf(b) <= day);
  const stockDay = landed ? day : asOfDay;
  const onHand = landed ? stockOn(day, stockBase, batches) : snapshotOnHand;
  const r = restock({
    runRate,
    onHand,
    leadTimeDays: maker.leadTimeDays,
    safetyDays: growth.safetyDays,
    makingCost: maker.makingCost,
    minRun: maker.minRun,
    today: dayToDate(stockDay),
  });

  const bands = growth.coachBands;
  const weekDays = launchProgress(daily, maker.lot, asOfDay - 1).days.filter((d) => d.day >= asOfDay - 7);
  const weekDaily = weekDays.map((d) => ({ date: dayToDate(d.day), orders: d.orders }));
  const weekOrders = weekDays.reduce((s, d) => s + d.orders, 0);
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
    stockDay,
    stockBase,
    soldBefore: maker.lot - snapshotOnHand,
    weekDaily,
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
