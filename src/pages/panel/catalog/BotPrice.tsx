// "Create from photos" · screens 2 and 3, Quantity and Price (LB-5, LB-6, LB-8; doc p.15 mock-up):
// demand card above the price table, the bot-filled fee stack and lot hint under it, and the go-live checklist.
// Every number is passed in from the engine; B is never an input here (status only).
import { Banner, Button, Pill } from '../../../components/ui';
import { productTypeName, suggestedLot, type CostStack, type PriceStatus, type ProductTypeId } from '../../../engine/ui';

type SuggestedLotView = ReturnType<typeof suggestedLot>;
import { fmt, useT } from '../../../i18n';
import type { GoLiveChecks } from './bot';
import type { LaunchCheckView } from './launchCheck';
import { demandOrNull, likelyShareOrNull } from '../../onboarding/signup/guards';

export function DemandCard({ type, className = 'mt-4' }: { type: ProductTypeId; className?: string }) {
  const t = useT();
  const d = demandOrNull(type);
  const s = likelyShareOrNull(type);
  if (!d || !s) return null;
  return (
    <div className={`${className} rounded bg-secondary-bg px-4 py-3`} data-c2m="LB-5" data-c2m-id="LB-5" data-bot-anchor="quantity" data-testid="demandCard">
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
  if (!stack) return <p className="m-0 mt-3 font-body text-base leading-4 text-secondary-text" data-c2m="LB-6" data-c2m-id="LB-6">{t('stack.waiting')}</p>;
  const f = stack.fees;
  const parts = [
    f.packaging !== undefined ? t('stack.packaging', { v: fmt(f.packaging) }) : null,
    f.packPointFee !== undefined ? t('stack.packPointFee', { v: fmt(f.packPointFee) }) : null,
    t('stack.shipping', { v: fmt(f.shippingAndFixed) }),
    t('stack.returns', { v: fmt(f.returnsBuffer) }),
    t('stack.gst', { rate: fmt(stack.gstRate * 100), v: fmt(gst ?? f.gst) }),
  ].filter(Boolean);
  return (
    <p className="m-0 mt-3 font-body text-base leading-4 text-secondary-text" data-c2m="LB-6" data-c2m-id="LB-6" data-testid="stackLine">
      {t('stack.prefix')} {parts.join(' · ')} → {t('stack.breakEven', { v: fmt(stack.breakEven) })}
    </p>
  );
}

/** Lot hint (Q19: any number, no cap) + soft warning when below the maker's own minimum run. */
/**
 * Why the lot is what it is: "≈ 2 weeks of sales (9–13 orders a day × 14 days)", or, when the maker's minimum run is
 * larger, "= your minimum run (2 weeks of sales would be 150)"; then the ₹ at cost and "any number" (Q19).
 */
export function lotBasis(t: ReturnType<typeof useT>, lot: SuggestedLotView, makingCost: number | null): string {
  const weeks = fmt(lot.days / 7);
  const basis = lot.raisedToMinRun
    ? t('lot.basisMinRun', { weeks, twoWeeks: fmt(lot.twoWeeks) })
    : t('lot.basis', { weeks, low: fmt(lot.perDay.low), high: fmt(lot.perDay.high) });
  return [basis, makingCost ? t('lot.atCost', { atCost: fmt(lot.units * makingCost) }) : null, t('lot.any')].filter(Boolean).join(' · ');
}

export function LotLine({ lot, makingCost, inventory, minRun }: { lot: SuggestedLotView; makingCost: number | null; inventory: number | null; minRun: number | null }) {
  const t = useT();
  return (
    <div data-c2m="LB-5" data-c2m-id="LB-5">
      <p className="m-0 mt-1.5 font-body text-base leading-4 text-secondary-text" data-testid="lotLine">
        {t('lot.hintHead', { units: fmt(lot.units) })} · {lotBasis(t, lot, makingCost)}
      </p>
      {inventory !== null && inventory > 0 && minRun !== null && inventory < minRun && (
        <Banner tone="info" className="mt-3">
          {t('lot.belowMinRun', { units: fmt(inventory), minRun: fmt(minRun) })}
        </Banner>
      )}
    </div>
  );
}

/** The full form's Factory Launch column: the same rationed status as the banner ("Not checked" for a typed price). */
export function StatusChip({ status, pending = false }: { status: PriceStatus | null; pending?: boolean }) {
  const t = useT();
  if (!status) return <span className="text-tertiary-text" data-status={pending ? 'pending' : undefined}>{pending ? t('launch.chipPending') : '—'}</span>;
  const tone = status === 'qualifies' ? 'success' : status === 'aboveCap' ? 'info' : 'error';
  return (
    <Pill tone={tone} bordered className="px-3 text-base whitespace-nowrap">
      <span data-status={status}>{t(`status.${status}`)}</span>
    </Pill>
  );
}

/**
 * Factory Launch status under the result (LB-6). The price never blocks listing; this only says whether the price
 * qualifies for the launch. Green = qualifies; yellow = lists normally, not eligible (never by how much); red = below
 * break-even (the loss per order, live: it's the maker's own maths); grey = a typed price not checked yet, with
 * "Check price" (MAX_PRICE_CHECKS a day per product). The bot's own price needs no check. Rules: launchCheck.ts.
 */
export function LaunchStatus({ v, breakEven, onCheck, className = 'mt-3' }: { v: LaunchCheckView; breakEven: number | null; onCheck: () => void; className?: string }) {
  const t = useT();
  if (v.state === 'none') return null;
  const left = v.checksLeft === 0 ? t('launch.none') : v.checksLeft === 1 ? t('launch.leftOne') : t('launch.left', { n: fmt(v.checksLeft) });
  // The counter shows once the maker is checking typed prices (not on the bot's own price, nor below break-even).
  const counter = !v.botPrice && v.state !== 'belowCost' ? (
    <p className="m-0 mt-1.5 font-body text-base leading-4 text-secondary-text" data-testid="checksLeft" data-left={v.checksLeft}>
      {left}
    </p>
  ) : null;
  const checkButton = v.needsCheck ? (
    <Button size="sm" variant="outline" className="shrink-0" disabled={!v.canCheck} onClick={onCheck} data-testid="checkPrice">
      {t('launch.check')}
    </Button>
  ) : null;
  let body;
  if (v.state === 'belowCost')
    body = (
      <Banner tone="error">
        <b className="font-button" data-testid="lossLine" data-loss={v.loss ?? undefined}>
          {t('launch.loss', { loss: fmt(v.loss ?? 0) })}
        </b>
        <br />
        {t('launch.lossSub', { be: fmt(breakEven ?? 0) })}
      </Banner>
    );
  else if (v.state === 'qualifies') body = <Banner tone="success">{t('launch.qualifies')}</Banner>;
  else if (v.state === 'aboveCap') body = <Banner tone="info">{t('launch.aboveCap')}</Banner>;
  else
    body = (
      <div className="flex items-center gap-2.5 rounded-lg bg-secondary-bg px-3 py-2.5">
        <img src="/brand/msa/merlin/lined/info-grey.svg" alt="" width="20" height="20" className="size-5 shrink-0" />
        <p className="m-0 flex-1 font-body text-lg leading-5 text-primary-text">{t('launch.stale')}</p>
        {checkButton}
      </div>
    );
  return (
    <div className={className} data-c2m="LB-6" data-c2m-id="LB-6" data-testid="launchStatus" data-state={v.state} data-free={v.botPrice ? 'true' : 'false'}>
      {body}
      {counter}
    </div>
  );
}

/** The go-live checklist's Factory Launch line (LB-8): from the last check or the bot's price; never blocks Go live. */
export function LaunchLine({ v, className = 'text-lg leading-5' }: { v: LaunchCheckView; className?: string }) {
  const t = useT();
  if (!v.line) return null;
  const tone = v.line === 'qualifies' ? 'text-success-text' : 'text-secondary-text';
  return (
    <p className={`m-0 font-body ${tone} ${className}`} data-c2m="LB-8" data-c2m-id="LB-8" data-testid="launchLine" data-line={v.line}>
      {t(`check.launch.${v.line}`)}
    </p>
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
  launch,
  inventory,
  onGoLive,
  onShow,
}: {
  checks: GoLiveChecks;
  launch: LaunchCheckView;
  inventory: number | null;
  onGoLive: () => void;
  onShow: (what: 'images' | 'details' | 'review' | 'price' | 'lot') => void;
}) {
  const t = useT();
  const priceLabel = checks.price ? t('check.priceSet') : t('check.price');
  return (
    <div className="flex items-center gap-4" data-c2m="LB-8" data-c2m-id="LB-8" data-testid="goLive">
      <span className="font-button text-lg leading-5 whitespace-nowrap text-primary-text">{t('check.title')}</span>
      <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Check ok={checks.images} label={t('check.images')} onClick={() => onShow('images')} />
        <Check ok={checks.details} label={t('check.details')} onClick={() => onShow('details')} />
        <Check ok={checks.review} label={t('check.review')} onClick={() => onShow('review')} />
        <Check ok={checks.price} label={priceLabel} onClick={() => onShow('price')} />
        <Check ok={checks.lot} label={inventory ? t('check.lot', { units: fmt(inventory) }) : t('check.lotEmpty')} onClick={() => onShow('lot')} />
      </div>
      <LaunchLine v={launch} className="text-base leading-4" />
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
