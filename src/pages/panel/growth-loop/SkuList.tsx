// Inventory from D28 (Jasmeet): her live SKUs as rows, each with its make-to-demand verdict chip
// (GL-5). The bottle carries the restock card on Low Stock (GL-2); the SKU marked Stop carries
// "What to make instead" (GL-6). Lunch box and sipper show chip + reason only (team Q5).
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { cx } from '../../../components/ui';
import type { GrowthView, SkuVerdict } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { CrystalTip, T } from '../manage-pricing/crystal';
import { RestockCard } from './RestockCard';
import { SwitchPanel } from './SwitchPanel';
import { THUMBS, Thumb, VerdictChip } from './parts';
import { STOCKED_SKU as STOCKED } from './useGrowth';

/** Stock-tab membership of the growth-loop SKUs: Low Stock = the verdict says make more. */
export function stockTabRows(g: GrowthView): Record<'all_stock' | 'out_of_stock' | 'low_stock', SkuVerdict[]> {
  return { all_stock: g.verdicts, out_of_stock: [], low_stock: g.verdicts.filter((v) => v.verdict === 'makeMore') };
}

function LinkText({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-0 border-none bg-transparent cursor-pointer text-body-small leading-4 font-medium text-brand-primary hover:underline">
      {children}
    </button>
  );
}

function SkuRow({ g, sku, tab, onTab }: { g: GrowthView; sku: SkuVerdict; tab: string; onTab: (id: string) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const stocked = sku.id === STOCKED;
  const link =
    sku.verdict === 'makeMore' && tab !== 'low_stock' ? (
      <LinkText onClick={() => onTab('low_stock')}>{t('gl.sku.viewRestock')}</LinkText>
    ) : sku.id === g.coach?.skuId ? (
      <LinkText onClick={() => navigate(paths.businessDashboard)}>{t('gl.sku.viewFix')}</LinkText>
    ) : null;
  return (
    <div className="rounded-8 border border-solid border-neutral-light bg-neutral-base p-4" data-sku={sku.id}>
      <div className="flex items-start gap-3">
        <Thumb src={THUMBS[sku.id]} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{sku.name}</p>
          <p className={cx(T.bodySm, 'text-neutral-secondary')}>
            {t('gl.sku.live')}
            {stocked && ` · ${t('gl.sku.inStock', { n: fmt(g.onHand) })}`}
          </p>
          {link && <div className="pt-1">{link}</div>}
        </div>
        <div className="w-80 shrink-0">
          <VerdictChip verdict={sku.verdict} reason={sku.reason} t={t} />
        </div>
      </div>
      {stocked && tab === 'low_stock' && <RestockCard g={g} />}
      {(sku.verdict === 'stop' || sku.verdict === 'switch') && <SwitchPanel suggestions={g.switchTo[sku.id]} />}
    </div>
  );
}

export function SkuList({ g, rows, tab, onTab }: { g: GrowthView; rows: SkuVerdict[]; tab: string; onTab: (id: string) => void }) {
  const t = useT();
  return (
    <div className="bg-neutral-base px-4 pb-4 shrink-0 min-h-[calc(100vh-4rem)]" data-growth-skus>
      <div className="flex justify-end pb-2">
        <div className="w-80 mr-4 flex items-center gap-1" data-c2m="GL-5" data-c2m-id="GL-5">
          <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.verdict.label')}</p>
          <CrystalTip text={t('gl.verdict.tip')} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((sku) => (
          <SkuRow key={sku.id} g={g} sku={sku} tab={tab} onTab={onTab} />
        ))}
      </div>
    </div>
  );
}
