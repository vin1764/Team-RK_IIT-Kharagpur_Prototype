// "Plan this batch" on the GL-2 restock card. Pure: every number the plan panel and the planned
// card show comes from here, through src/engine/ui.ts.
//
// Stock after the snapshot day is a projection. The seeded daily order series (launch.json) ends at
// D30, so from the D28 snapshot on we project with the snapshot's 7-day run-rate: each day sells
// `runRate` units (never below zero stock), and a planned batch adds its units on the morning it lands.
import { dayToDate } from './calendar';

/** The stock snapshot the projection starts from (the D28 restock card: day, on hand that morning, run-rate). */
export interface StockBase {
  asOfDay: number;
  onHand: number;
  runRate: number;
}

/** A batch the maker confirmed: how many units, which demo day production starts, his lead time. */
export interface PlannedBatch {
  units: number;
  startDay: number;
  leadTimeDays: number;
}

/** Demo day a batch lands (start + lead time). */
export const landsDayOf = (b: Pick<PlannedBatch, 'startDay' | 'leadTimeDays'>) => b.startDay + b.leadTimeDays;

interface Walk {
  /** units on hand on the morning of the target day */
  stock: number;
  /** some day before the target day had less stock than a day's sales */
  ranShort: boolean;
}

function walk(day: number, base: StockBase, batches: PlannedBatch[]): Walk {
  let stock = base.onHand;
  let ranShort = false;
  for (let d = base.asOfDay; d < day; d++) {
    if (stock < base.runRate) ranShort = true;
    stock = Math.max(0, stock - base.runRate);
    for (const b of batches) if (landsDayOf(b) === d + 1) stock += b.units;
  }
  return { stock, ranShort };
}

/**
 * Units on hand on the morning of `day` (≥ the snapshot day): the snapshot's on-hand, less the
 * run-rate for every day since (floored at 0), plus each batch that has landed by then.
 */
export function stockOn(day: number, base: StockBase, batches: PlannedBatch[] = []): number {
  if (day < base.asOfDay) throw new RangeError(`stockOn: day ${day} is before the snapshot day ${base.asOfDay}`);
  return walk(day, base, batches).stock;
}

export interface PlanInput {
  base: StockBase;
  units: number;
  startDay: number;
  leadTimeDays: number;
  /** ₹ per unit, the maker's making cost */
  makingCost: number;
  /** the maker's own minimum run (soft warning below it) */
  minRun: number;
  /** batches already confirmed before this one (they land on their own days) */
  earlier?: PlannedBatch[];
}

export interface BatchPlan {
  units: number;
  startDay: number;
  /** ISO date production starts */
  startsOn: string;
  landsDay: number;
  /** ISO date the batch is ready (start + lead time) */
  landsOn: string;
  /** units × making cost, ₹ */
  atCost: number;
  /** units still on hand the morning it lands, before the batch is added */
  onHandAtLanding: number;
  /** (on hand at landing + units) ÷ run-rate, one decimal */
  coverAfter: number;
  /** the same, floored to whole days: shown as "≈ 22 days" (never overstates the cover) */
  coverAfterDays: number;
  /** units below the maker's own minimum run */
  belowMinRun: boolean;
  /** stock runs short of a day's sales before the batch lands */
  runsOutBeforeLanding: boolean;
}

/** Plan panel numbers for a batch of `units` started on `startDay`. */
export function planBatch(input: PlanInput): BatchPlan {
  const { base, units, startDay, leadTimeDays, makingCost, minRun, earlier = [] } = input;
  const landsDay = startDay + leadTimeDays;
  const w = walk(landsDay, base, earlier);
  const afterUnits = w.stock + units;
  return {
    units,
    startDay,
    startsOn: dayToDate(startDay),
    landsDay,
    landsOn: dayToDate(landsDay),
    atCost: units * makingCost,
    onHandAtLanding: w.stock,
    coverAfter: Math.round((afterUnits / base.runRate) * 10) / 10,
    coverAfterDays: Math.floor(afterUnits / base.runRate),
    belowMinRun: units < minRun,
    runsOutBeforeLanding: w.ranShort,
  };
}
