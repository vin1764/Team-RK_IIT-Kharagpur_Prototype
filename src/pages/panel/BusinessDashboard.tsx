// Performance → Business Dashboard. Faithful replica of reference/html/meesho-business-dashboard.html
// in its captured empty state. The date label follows the demo day instead of the capture date.
import { useState } from 'react';
import { notInPrototype } from '../../components/Toast';
import { cx } from '../../components/ui';
import { useDemo } from '../../store/demo';
import { CrystalPage, T } from './manage-pricing/crystal';
import { FunnelTiles, type FunnelKey } from './business-dashboard/FunnelTiles';
import { SegmentTabs } from './business-dashboard/SegmentTabs';
import { rangeLabel, type RangeId } from './business-dashboard/dates';

// As captured: no views, clicks, orders or sales for this seller yet.
const CAPTURED_FUNNEL: Record<FunnelKey, number> = { views: 0, clicks: 0, orders: 0, conversion: 0, sales: 0, returnPct: 0 };

type Chip = RangeId | 'CUSTOM';
const RANGES: Array<{ id: Chip; label: string }> = [
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'SEVEN_DAYS', label: 'Last 7 Days' },
  { id: 'THIRTY_DAYS', label: 'Last 30 Days' },
  { id: 'CUSTOM', label: 'Custom Date' },
];
type Metric = 'orders' | 'sales';
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

function TrendCard() {
  const [metric, setMetric] = useState<Metric>('orders');
  return (
    <div className="rounded-8 border border-solid border-neutral-light px-4 pt-4 pb-2 mt-4 mb-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={T.h3}>{METRICS.find((m) => m.id === metric)!.label}</h3>
        <SegmentTabs tabs={METRICS} active={metric} onChange={setMetric} itemClass="min-w-17.5" />
      </div>
      <NoTrend />
    </div>
  );
}

function BusinessOverview({ label, range, onRange }: { label: string; range: Chip; onRange: (r: Chip) => void }) {
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
      <TrendCard />
      {/* Later phases slot the SKU Health Coach card here, above the funnel tiles. */}
      <FunnelTiles values={CAPTURED_FUNNEL} />
    </div>
  );
}

function ProductPerformance({ label }: { label: string }) {
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
      <div className="flex flex-1 flex-col items-center justify-center py-10 bg-neutral-base">
        <img src="/brand/msa/merlin/filled/no-data.svg" alt="No data" width="90" height="75" />
        <p className={cx(T.bodyMd.replace('font-regular', 'font-medium'), 'text-neutral-primary pt-2 pb-1')}>No Data to Show</p>
        <p className={cx(T.bodySm, 'text-neutral-secondary text-center')}>
          There is no sufficient data to show the results in the
          <br />
          selected timeframe.
        </p>
      </div>
    </>
  );
}

export default function BusinessDashboard() {
  const day = useDemo((s) => s.day);
  const [range, setRange] = useState<RangeId>('SEVEN_DAYS');
  const label = rangeLabel(day, range);
  const onRange = (r: Chip) => (r === 'CUSTOM' ? notInPrototype('Custom date range') : setRange(r));
  return (
    <CrystalPage className="flex flex-col">
      <div className="flex flex-row items-center p-4 bg-neutral-base mb-3 border-0 border-b border-solid border-b-neutral-light">
        <h1 className={T.h1}>Business Dashboard</h1>
      </div>
      <BusinessOverview label={label} range={range} onRange={onRange} />
      <ProductPerformance label={label} />
    </CrystalPage>
  );
}
