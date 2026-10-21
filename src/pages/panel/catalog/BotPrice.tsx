// "Create from photos" · screens 2 and 3, Quantity and Price (LB-5, LB-6, LB-8; doc p.15 mock-up):
// demand card above the price table, the bot-filled fee stack and lot hint under it, and the go-live checklist.
// Every number is passed in from the engine; B is never an input here (status only).
import { Banner, Pill } from '../../../components/ui';
import { demandForType, likelyShare, productTypeName, suggestedLot, type CostStack, type PriceStatus, type ProductTypeId } from '../../../engine/ui';

type SuggestedLotView = ReturnType<typeof suggestedLot>;
import { fmt, useT } from '../../../i18n';
import type { GoLiveChecks } from './bot';

export function DemandCard({ type, className = 'mt-4' }: { type: ProductTypeId; className?: string }) {
  const t = useT();
  const d = demandForType(type);
  const s = likelyShare(type);
  return (
    <div className={`${className} rounded bg-secondary-bg px-4 py-3`} data-c2m="LB-5" data-bot-anchor="quantity" data-testid="demandCard">
      <p className="m-0 font-button text-xl leading-5 text-primary-text">
        {t('demand.title', { name: productTypeName(type), confidence: t(`confidence.${d.confidence}`) })}
      </p>
      <p className="m-0 mt-1.5 font-body text-lg leading-5 text-secondary-text">
        {d.priceBand
          ? t('demand.gap', { low: fmt(d.gapPerWeek.low), high: fmt(d.gapPerWeek.high), pLow: fmt(d.priceBand.low), pHigh: fmt(d.priceBand.high), committed: fmt(d.committedUnits) })
          : t('demand.gapNoBand', { low: fmt(d.gapPerWeek.low), high: fmt(d.gapPerWeek.high), committed: fmt(d.committedUnits) })}
      </p>
      <p className="m-0 mt-0.5 font-body text-lg leading-5 text-secondary-text">
        {t('demand.share', { pct: fmt(Math.round(s.share * 100)), low: fmt(s.ordersPerDay.low), high: fmt(s.ordersPerDay.high) })}
      </p>
    </div>
  );
}

/** "Bot filled: packaging ₹6 · shipping + fixed fee ₹32 · returns and refusal ₹8 · GST (5%, in price) ₹7 → break-even ₹133" */
export function StackLine({ stack, gst }: { stack: CostStack | null; gst: number | null }) {
  const t = useT();
  if (!stack) return <p className="m-0 mt-3 font-body text-base leading-4 text-secondary-text" data-c2m="LB-6">{t('stack.waiting')}</p>;
  const f = stack.fees;
  const parts = [
    f.packaging !== undefined ? t('stack.packaging', { v: fmt(f.packaging) }) : null,
    f.packPointFee !== undefined ? t('stack.packPointFee', { v: fmt(f.packPointFee) }) : null,
    t('stack.shipping', { v: fmt(f.shippingAndFixed) }),
    t('stack.returns', { v: fmt(f.returnsBuffer) }),
    t('stack.gst', { rate: fmt(stack.gstRate * 100), v: fmt(gst ?? f.gst) }),
  ].filter(Boolean);
  return (
    <p className="m-0 mt-3 font-body text-base leading-4 text-secondary-text" data-c2m="LB-6" data-testid="stackLine">
      {t('stack.prefix')} {parts.join(' · ')} → {t('stack.breakEven', { v: fmt(stack.breakEven) })}
    </p>
  );
}

/** Lot hint (Q19: any number, no cap) + soft warning when below the maker's own minimum run. */
export function LotLine({ lot, makingCost, inventory, minRun }: { lot: SuggestedLotView; makingCost: number | null; inventory: number | null; minRun: number | null }) {
  const t = useT();
  const weeks = fmt(lot.days / 7);
  return (
    <div data-c2m="LB-5">
      <p className="m-0 mt-1.5 font-body text-base leading-4 text-secondary-text" data-testid="lotLine">
        {makingCost
          ? t('lot.hint', { units: fmt(lot.units), weeks, atCost: fmt(lot.units * makingCost) })
          : t('lot.hintNoCost', { units: fmt(lot.units), weeks })}
      </p>
      {inventory !== null && inventory > 0 && minRun !== null && inventory < minRun && (
        <Banner tone="info" className="mt-3">
          {t('lot.belowMinRun', { units: fmt(inventory), minRun: fmt(minRun) })}
        </Banner>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: PriceStatus | null }) {
  const t = useT();
  if (!status) return <span className="text-tertiary-text">—</span>;
  const tone = status === 'qualifies' ? 'success' : status === 'aboveCap' ? 'error' : 'warning';
  return (
    <Pill tone={tone} bordered className="px-3 text-base whitespace-nowrap">
      <span data-status={status}>{t(`status.${status}`)}</span>
    </Pill>
  );
}

function Check({ ok, label, onClick }: { ok: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer border-0 bg-transparent p-0" data-check={ok ? 'pass' : 'fail'}>
      <Pill tone={ok ? 'success' : 'error'} bordered className="px-3 text-base whitespace-nowrap">
        {label} {ok ? '✓' : '✗'}
      </Pill>
    </button>
  );
}

/** Replaces "Submit Catalog" in bot mode (LB-8). Failing pills scroll to what's missing. */
export function GoLiveBar({
  checks,
  status,
  inventory,
  onGoLive,
  onShow,
}: {
  checks: GoLiveChecks;
  status: PriceStatus | null;
  inventory: number | null;
  onGoLive: () => void;
  onShow: (what: 'images' | 'details' | 'price' | 'lot') => void;
}) {
  const t = useT();
  const priceLabel = !checks.price && status && status !== 'qualifies' ? `${t('check.price')} · ${t(`status.${status}`)}` : t('check.price');
  return (
    <div className="flex items-center gap-4" data-c2m="LB-8" data-testid="goLive">
      <span className="font-button text-lg leading-5 whitespace-nowrap text-primary-text">{t('check.title')}</span>
      <div className="flex flex-wrap gap-2">
        <Check ok={checks.images} label={t('check.images')} onClick={() => onShow('images')} />
        <Check ok={checks.details} label={t('check.details')} onClick={() => onShow('details')} />
        <Check ok={checks.price} label={priceLabel} onClick={() => onShow('price')} />
        <Check ok={checks.lot} label={inventory ? t('check.lot', { units: fmt(inventory) }) : t('check.lotEmpty')} onClick={() => onShow('lot')} />
      </div>
      <span className="max-w-48 font-body text-base leading-4 text-secondary-text">{t('check.feesLocked')}</span>
      <button
        type="button"
        disabled={!checks.all}
        onClick={onGoLive}
        className="inline-flex h-9 cursor-pointer items-center rounded-sm border-none bg-brand-primary-bg px-4 font-button text-xl whitespace-nowrap text-brand-foreground-text transition-all active:scale-90 disabled:cursor-not-allowed disabled:bg-tertiary-text"
      >
        {t('check.goLive')}
      </button>
    </div>
  );
}
