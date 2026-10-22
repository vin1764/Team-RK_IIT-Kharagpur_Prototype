// Inventory from D28 (Jasmeet): her live SKUs as rows, each with its make-to-demand verdict chip
// (GL-5). The bottle carries the restock card on Low Stock (GL-2); the SKU marked Stop carries
// "What to make instead" (GL-6). Lunch box and sipper show chip + reason only (team Q5).
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Pill, cx } from '../../../components/ui';
import type { GrowthView, SkuVerdict } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { CrystalTip, T } from '../manage-pricing/crystal';
import { RestockCard } from './RestockCard';
import { SwitchPanel } from './SwitchPanel';
import { Thumb, VerdictChip, useSkuImage } from './parts';
import { STOCKED_SKU as STOCKED } from './useGrowth';
import { useDemo } from '../../../store/demo';
import { useShipSwitch, type PlannedLot } from '../../../store/fulfilmentSwitch';
import { useLiveListings } from '../catalog-uploads/liveListings';
import { packPointLocation } from '../warehouse/lots';

/** The stocked SKU (the launched bottle) is this product type. */
const STOCKED_TYPE = 'steel-bottle-1l';
const NO_LOTS: PlannedLot[] = [];

/** PP-6 · "At Rajkot Pack Point" on the stocked SKU once it ships through a Pack Point and a lot of it has been sent. */
function usePackPointTag(): string | null {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const live = useLiveListings();
  const overlay = useShipSwitch((s) => s.listings);
  const lots = useShipSwitch((s) => s.lots[persona]) ?? NO_LOTS;
  const key = live.find((l) => l.typeId === STOCKED_TYPE)?.key;
  return key ? packPointLocation(key, overlay[`${persona}:${key}`], lots, day) : null;
}

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
  const atPackPoint = usePackPointTag();
  const image = useSkuImage(sku.id);
  const link =
    sku.verdict === 'makeMore' && tab !== 'low_stock' ? (
      <LinkText onClick={() => onTab('low_stock')}>{t('gl.sku.viewRestock')}</LinkText>
    ) : sku.id === g.coach?.skuId ? (
      <LinkText onClick={() => navigate(paths.businessDashboard)}>{t('gl.sku.viewFix')}</LinkText>
    ) : null;
  return (
    <div className="rounded-8 border border-solid border-neutral-light bg-neutral-base p-4" data-sku={sku.id}>
      <div className="flex items-start gap-3">
        <Thumb src={image} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{sku.name}</p>
            {stocked && atPackPoint && (
              <span className="inline-flex" data-c2m="PP-6" data-c2m-id="PP-6" data-sku-location={atPackPoint}>
                <Pill tone="brand" bordered className="!text-body-xsmall">
                  {t('gl.sku.atPackPoint', { city: atPackPoint })}
                </Pill>
              </span>
            )}
          </div>
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
