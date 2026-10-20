import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';
import { CrystalTip, T } from '../manage-pricing/crystal';

export type FunnelKey = 'views' | 'clicks' | 'orders' | 'conversion' | 'sales' | 'returnPct';

// Order and (i) icons as captured. Tooltip copy wasn't captured: short neutral definitions (ours).
export const FUNNEL_TILES: Array<{ key: FunnelKey; label: string; info?: string }> = [
  { key: 'views', label: 'Total Views', info: 'Number of times buyers viewed your products' },
  { key: 'clicks', label: 'Total Clicks', info: 'Number of times buyers clicked on your products' },
  { key: 'orders', label: 'Total Orders' },
  { key: 'conversion', label: 'Conversion Rate', info: 'Share of product clicks that turned into orders' },
  { key: 'sales', label: 'Total Sales' },
  { key: 'returnPct', label: 'Return Percentage' },
];

/** The six joined funnel tiles under the Business Overview chart. Values are passed in. */
export function FunnelTiles({ values }: { values: Record<FunnelKey, ReactNode> }) {
  return (
    <div className="flex justify-center">
      {FUNNEL_TILES.map((t) => (
        <div
          key={t.key}
          data-funnel={t.key}
          className="flex flex-1 flex-col border border-solid border-neutral-light border-r-0 p-4 first:rounded-l-8 last:rounded-r-8 last:border-r"
        >
          <div className="flex items-center gap-1">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t.label}</p>
            {t.info && <CrystalTip icon="blue" text={t.info} />}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <h3 className={T.h3}>{values[t.key]}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
