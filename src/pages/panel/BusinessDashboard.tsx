// Performance → Business Dashboard. Faithful replica of reference/html/meesho-business-dashboard.html
// in its captured empty state. The date label follows the demo day instead of the capture date.
import { useState, type ReactNode } from 'react';
import { notInPrototype } from '../../components/Toast';
import { cx } from '../../components/ui';
import { useDemo } from '../../store/demo';
import { CrystalPage, T } from './manage-pricing/crystal';
import { FUNNEL_TILES, FunnelTiles, type FunnelKey } from './business-dashboard/FunnelTiles';
import { SegmentTabs } from './business-dashboard/SegmentTabs';
import { dashDate, rangeLabel, type RangeId } from './business-dashboard/dates';
import { DashboardCoachCard } from './growth-loop/CoachCard';
import { useGrowth } from './growth-loop/useGrowth';
import { pctDisplay, type GrowthView } from '../../engine/ui';
import { fmt, useT } from '../../i18n';
import growthSeed from '../../data/growth.json';
import { useScriptedListing } from '../../store/timeline';
import { MerlinTable, type Col } from './factory-launch/parts';
import { THUMBS, Thumb } from './growth-loop/parts';
import { weekSeries, type Metric } from './business-dashboard/series';
import { WeekChart } from './business-dashboard/WeekChart';

// As captured: no views, clicks, orders or sales for this seller yet.
const CAPTURED_FUNNEL: Record<FunnelKey, ReactNode> = { views: 0, clicks: 0, orders: 0, conversion: 0, sales: 0, returnPct: 0 };

type Chip = RangeId | 'CUSTOM';
const RANGES: Array<{ id: Chip; label: string }> = [
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'SEVEN_DAYS', label: 'Last 7 Days' },
  { id: 'THIRTY_DAYS', label: 'Last 30 Days' },
  { id: 'CUSTOM', label: 'Custom Date' },
];
const METRICS: Array<{ id: Metric; label: string }> = [
  { id: 'orders', label: 'Orders' },
  { id: 'sales', label: 'Sales' },
];

function NoTrend() {
  return (
    <div className="flex h-62.5 items-center justify-center">
      <div className="text-center">
        <img src="/brand/msa/merlin/filled/no-trend.svg" alt="No trend" width="90" height="75" className="mx-auto block" />
        <p className={cx(T.bodyMd.replace('font-regular', 'font-medium'), 'text-neutral-primary mt-2 mb-1')}>No Trend to Show</p>
        <p className={cx(T.bodySm, 'mx-auto w-67.5 text-neutral-secondary')}>
          There is no sufficient data to show the results in the selected timeframe.
        </p>
      </div>
    </div>
  );
}

/** The snapshot week the chart and Product Performance show (D28+), or null as captured. */
interface Week {
  g: GrowthView;
  listPrice: number;
}

function TrendCard({ week }: { week: Week | null }) {
  const [metric, setMetric] = useState<Metric>('orders');
  return (
    <div className="rounded-8 border border-solid border-neutral-light px-4 pt-4 pb-2 mt-4 mb-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={T.h3}>{METRICS.find((m) => m.id === metric)!.label}</h3>
        <SegmentTabs tabs={METRICS} active={metric} onChange={setMetric} itemClass="min-w-17.5" />
      </div>
      {week ? <WeekChart metric={metric} points={weekSeries(week.g.weekDaily, week.listPrice, metric)} /> : <NoTrend />}
    </div>
  );
}

/** D28+ (C2M, GL-1 inputs, team Q13): the tiles filled from the growth snapshot's last 7 days. */
function useSnapshotTiles(g: GrowthView | null): Record<FunnelKey, ReactNode> {
  const t = useT();
  if (!g) return CAPTURED_FUNNEL;
  const d = g.dashboard;
  const sub = (s: string) => <span className={cx(T.bodySm, 'text-neutral-secondary')}>{s}</span>;
  return {
    views: fmt(d.views),
    clicks: (
      <span className="inline-flex items-baseline gap-2">
        {fmt(d.clicks)} {sub(`(${pctDisplay(d.clickRate)})`)}
      </span>
    ),
    orders: fmt(d.orders),
    conversion: pctDisplay(d.conversion),
    sales: `₹${fmt(d.sales)}`,
    returnPct: (
      <span className="inline-flex items-baseline gap-2">
        {pctDisplay(d.returnRate)} {sub(`(${t(d.returns === 1 ? 'gl.tile.returnOne' : 'gl.tile.returnMany', { n: fmt(d.returns) })})`)}
      </span>
    ),
  };
}

function BusinessOverview({ label, range, onRange, tiles, week }: { label: string; range: Chip; onRange: (r: Chip) => void; tiles: Record<FunnelKey, ReactNode>; week: Week | null }) {
  return (
    <div className="p-4 bg-neutral-base mb-3">
      <div className="flex flex-row flex-nowrap">
        <div className="flex flex-1 flex-col flex-nowrap">
          <h2 className={T.h2}>Business Overview</h2>
          <p className={cx(T.bodySm, 'mt-1 text-neutral-tertiary')}>{label}</p>
        </div>
        <div className="flex flex-1 items-center justify-end overflow-visible">
          <div className="relative">
            <SegmentTabs tabs={RANGES} active={range} onChange={onRange} />
          </div>
        </div>
      </div>
      <TrendCard week={week} />
      <FunnelTiles values={tiles} />
    </div>
  );
}

/** D28+ (C2M, GL-1 inputs): one row for the launched SKU, the same metrics as the tiles above. */
function ProductTable({ g, tiles }: { g: GrowthView; tiles: Record<FunnelKey, ReactNode> }) {
  const t = useT();
  const sku = g.verdicts.find((v) => v.id === growthSeed.dashboard.sku);
  const cols: Col[] = [
    { key: 'product', header: t('gl.perf.product'), width: '25%' },
    ...FUNNEL_TILES.map((f) => ({ key: f.key, header: f.label })),
  ];
  const row = {
    id: growthSeed.dashboard.sku,
    product: (
      <div className="flex items-start gap-3">
        <Thumb src={THUMBS[growthSeed.dashboard.sku]} />
        <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{sku?.name}</p>
      </div>
    ),
    ...Object.fromEntries(FUNNEL_TILES.map((f) => [f.key, <p className={cx(T.bodyMd, 'text-neutral-primary')}>{tiles[f.key]}</p>])),
  };
  return (
    <div className="px-4 pb-4 bg-neutral-base" data-c2m="GL-1" data-product-performance>
      <div className="overflow-hidden rounded-8 border border-solid border-neutral-light">
        <MerlinTable cols={cols} rows={[row]} label="Product Performance" />
      </div>
    </div>
  );
}

function ProductPerformance({ label, g, tiles }: { label: string; g: GrowthView | null; tiles: Record<FunnelKey, ReactNode> }) {
  return (
    <>
      <div className="flex flex-row flex-nowrap bg-neutral-base sticky top-(--concept-strip-h) z-10 p-4">
        <div className="flex flex-1 flex-col flex-nowrap">
          <h2 className={T.h2}>Product Performance</h2>
          <div className="mt-1 flex">
            <p className={cx(T.bodySm, 'text-neutral-tertiary whitespace-nowrap')}>{label}</p>
          </div>
        </div>
      </div>
      {g ? (
        <ProductTable g={g} tiles={tiles} />
      ) : (
      <div className="flex flex-1 flex-col items-center justify-center py-10 bg-neutral-base">
        <img src="/brand/msa/merlin/filled/no-data.svg" alt="No data" width="90" height="75" />
        <p className={cx(T.bodyMd.replace('font-regular', 'font-medium'), 'text-neutral-primary pt-2 pb-1')}>No Data to Show</p>
        <p className={cx(T.bodySm, 'text-neutral-secondary text-center')}>
          There is no sufficient data to show the results in the
          <br />
          selected timeframe.
        </p>
      </div>
      )}
    </>
  );
}

export default function BusinessDashboard() {
  const day = useDemo((s) => s.day);
  const g = useGrowth();
  const t = useT();
  const [picked, setRange] = useState<RangeId>('SEVEN_DAYS');
  const tiles = useSnapshotTiles(g);
  const listing = useScriptedListing();
  const week = g && listing ? { g, listPrice: listing.price } : null;
  // From D28 the page shows the growth snapshot: Last 7 Days = the D28 week (14–20 Nov), the only range seeded.
  const range: RangeId = g ? 'SEVEN_DAYS' : picked;
  const label = g ? `${dashDate(g.weekFrom)} - ${dashDate(g.weekTo)}` : rangeLabel(day, range);
  const onRange = (r: Chip) =>
    r === 'CUSTOM' ? notInPrototype('Custom date range') : g && r !== 'SEVEN_DAYS' ? notInPrototype(t('gl.otherRanges')) : setRange(r);
  return (
    <CrystalPage className="flex flex-col">
      <div className="flex flex-row items-center p-4 bg-neutral-base mb-3 border-0 border-b border-solid border-b-neutral-light">
        <h1 className={T.h1}>Business Dashboard</h1>
      </div>
      {g && <DashboardCoachCard g={g} />}
      <BusinessOverview label={label} range={range} onRange={onRange} tiles={tiles} week={week} />
      <ProductPerformance label={label} g={g} tiles={tiles} />
    </CrystalPage>
  );
}
