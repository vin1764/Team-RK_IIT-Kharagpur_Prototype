// GL-2 · "Plan this batch": right-side drawer from the restock card (the Pack Point drawer's frame,
// src/pages/onboarding/packpoint/PackPointDrawer.tsx) with Inventory's own crystal type and the panel's
// Button / Banner. Units and start date are the maker's; every number shown (landing date, cost at making
// price, units on hand when it lands, days of cover after) comes from planBatch() through src/engine/ui.ts.
// Ship from = the listing's fulfilment, switchable to Pack Point only when his pickup pincode is in a live
// cluster (an opening cluster shows it disabled, "Opens at 40 makers"), as on the bot's Price screen.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import calendar from '../../../data/calendar.json';
import { Banner, Button, cx } from '../../../components/ui';
import { dateToDay, dayToDate, formatDate, planBatch, type GrowthView, type PlannedBatch } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { packPointStatus } from '../../onboarding/packpoint/status';
import type { ShipFrom, StoredBatch } from '../../../store/restockPlan';
import { T } from '../manage-pricing/crystal';
import { THUMBS, Thumb } from './parts';
import { shortDate } from './useGrowth';

export interface PlanMaker {
  name: string;
  leadTimeDays: number;
  minRun: number;
  makingCost: number;
  /** the listing's fulfilment: the default "Ship from" */
  fulfilment: ShipFrom;
  pincode: string;
}

const BOX = 'flex items-center h-8 rounded-sm border border-solid border-neutral-light focus-within:border-brand-base px-2 gap-1 bg-neutral-base';
const INPUT = 'w-full border-none outline-none bg-transparent text-body-medium leading-5 text-neutral-primary [font-family:inherit]';

function Row({ label, children, c }: { label: string; children: ReactNode; c?: string }) {
  return (
    <section className={cx('border-0 border-b border-solid border-neutral-light px-5 py-4 last:border-b-0', c)}>
      <p className={cx(T.bodySm, 'text-neutral-secondary')}>{label}</p>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Value({ children, sub, testId }: { children: ReactNode; sub?: ReactNode; testId: string }) {
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <h3 className={T.h3} data-plan-value={testId}>
        {children}
      </h3>
      {sub && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{sub}</p>}
    </div>
  );
}

/** Two-way toggle in the Inventory filter-button look (crystal brand tokens). */
function ShipOption({ on, disabled, onClick, children, mode }: { on: boolean; disabled?: boolean; onClick: () => void; children: ReactNode; mode: ShipFrom }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      data-plan-ship-option={mode}
      className={cx(
        'inline-flex h-8 items-center justify-center rounded-6 border border-solid px-3 text-body-small leading-4 font-default transition-all duration-200',
        on ? 'border-brand-base bg-brand-light text-brand-primary font-[500]' : disabled ? 'border-neutral-light bg-neutral-base text-neutral-tertiary cursor-not-allowed' : 'border-neutral-light bg-neutral-base text-neutral-primary cursor-pointer hover:bg-brand-light',
      )}
    >
      {children}
    </button>
  );
}

/** The panel's date field: shows "21 Nov 2026"; the browser's own picker sits under it (as on the notice board). */
function DateField({ id, value, min, max, onChange }: { id: string; value: string; min: string; max: string; onChange: (iso: string) => void }) {
  const native = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = native.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };
  return (
    <div className="relative w-44">
      <input
        ref={native}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        data-plan-start-native
        className="absolute left-0 bottom-0 w-full h-px opacity-0 pointer-events-none"
      />
      <div className={cx(BOX, 'cursor-pointer')} onClick={open}>
        <input
          id={id}
          readOnly
          aria-haspopup="dialog"
          value={formatDate(value)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
          className={cx(INPUT, 'cursor-pointer')}
          data-plan-start
        />
        <img src="/brand/msa/merlin/lined/calendar.svg" alt="" width="16" height="16" className="size-4 shrink-0" />
      </div>
    </div>
  );
}

export function RestockPlanPanel({
  open,
  onClose,
  g,
  maker,
  initial,
  earlier,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  g: GrowthView;
  maker: PlanMaker;
  /** the batch being edited ("Edit plan"), or null for a new plan (pre-filled from the restock card) */
  initial: StoredBatch | null;
  /** batches confirmed before this one */
  earlier: PlannedBatch[];
  onConfirm: (b: StoredBatch) => void;
}) {
  const t = useT();
  const titleId = useId();
  const unitsId = useId();
  const startId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const r = g.restock;
  const minDay = g.stockDay;
  const maxDay = calendar.maxDay;
  const clampDay = (d: number) => Math.min(maxDay, Math.max(minDay, d));

  const pp = packPointStatus(maker.pincode);
  const ppLive = pp?.kind === 'live';
  const defaultShip: ShipFrom = maker.fulfilment === 'packPoint' && !ppLive ? 'selfShip' : maker.fulfilment;

  const [units, setUnits] = useState(String(initial?.units ?? r.nextBatch));
  const [startDay, setStartDay] = useState(clampDay(initial?.startDay ?? dateToDay(r.startBy)));
  const [ship, setShip] = useState<ShipFrom>(initial?.shipFrom ?? defaultShip);

  const n = Number(units);
  const validUnits = units.trim() !== '' && Number.isInteger(n) && n > 0;
  // Dates come from the plan whatever the units; cost and cover only show for a valid number of units.
  const calc = useMemo(
    () => planBatch({ base: g.stockBase, units: validUnits ? n : 0, startDay, leadTimeDays: maker.leadTimeDays, makingCost: maker.makingCost, minRun: maker.minRun, earlier }),
    [validUnits, n, startDay, g.stockBase, maker.leadTimeDays, maker.makingCost, maker.minRun, earlier],
  );
  const plan = validUnits ? calc : null;
  const landsOn = calc.landsOn;

  // The latest onClose, so a new callback identity (the URL changing behind the drawer) doesn't re-run the effect below.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Esc closes; Tab stays inside the drawer; focus returns to the opener on close; the page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'));
      if (f.length === 0) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const confirm = () => {
    if (!plan) return;
    onConfirm({ units: plan.units, startDay: plan.startDay, leadTimeDays: maker.leadTimeDays, shipFrom: ship });
  };

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-modal font-default text-neutral-primary tracking-[-0.1px]" style={{ top: 'var(--concept-strip-h)' }} data-plan-root>
      <div className="absolute inset-0 bg-overlay-bg" onClick={onClose} data-plan-overlay />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-c2m="GL-2"
        data-c2m-id="GL-2"
        data-plan-panel
        className="absolute top-0 right-0 bottom-0 flex w-[30rem] max-w-full flex-col bg-neutral-base outline-none animate-fade-in"
      >
        <div className="flex items-center justify-between gap-3 border-0 border-b border-solid border-neutral-light px-5 py-4">
          <h3 id={titleId} className={T.h3}>
            {initial ? t('gl.plan.editTitle') : t('gl.restock.plan')}
          </h3>
          <button type="button" aria-label={t('gl.plan.close')} onClick={onClose} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0">
            <img src="/brand/msa/merlin/lined/cross-grey.svg" alt="" width="24" height="24" className="size-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* The SKU and where its stock stands (the card's numbers) */}
          <section className="flex items-center gap-3 border-0 border-b border-solid border-neutral-light px-5 py-4">
            <Thumb src={THUMBS.bottle} />
            <div className="min-w-0 flex-1">
              <p className={cx(T.bodyMd, 'font-medium')}>{maker.name}</p>
              <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.plan.now', { rate: fmt(g.runRate), onHand: fmt(g.onHand) })}</p>
            </div>
          </section>

          <Row label={t('gl.plan.units')}>
            <div className="flex items-center gap-2">
              <div className={cx(BOX, 'w-28', !validUnits && '!border-danger-dark')}>
                <input
                  id={unitsId}
                  aria-label={t('gl.plan.units')}
                  inputMode="numeric"
                  value={units}
                  onChange={(e) => setUnits(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className={INPUT}
                  data-plan-units
                />
              </div>
              <p className={cx(T.bodyMd, 'text-neutral-secondary')}>{t('gl.plan.unitsWord')}</p>
            </div>
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.plan.unitsHint', { n: fmt(r.nextBatch) })}</p>
            {!validUnits && <p className={cx(T.bodyXs, 'text-danger-secondary')}>{t('gl.plan.unitsInvalid')}</p>}
            {plan?.belowMinRun && (
              <Banner tone="warning" className="mt-1">
                <span data-plan-below-min>{t('gl.plan.belowMinRun', { min: fmt(maker.minRun) })}</span>
              </Banner>
            )}
          </Row>

          <section className="grid grid-cols-2 gap-4 border-0 border-b border-solid border-neutral-light px-5 py-4">
            <div>
              <label htmlFor={startId} className={cx(T.bodySm, 'text-neutral-secondary block')}>
                {t('gl.plan.start')}
              </label>
              <div className="mt-2">
                <DateField id={startId} value={dayToDate(startDay)} min={dayToDate(minDay)} max={dayToDate(maxDay)} onChange={(iso) => setStartDay(clampDay(dateToDay(iso)))} />
              </div>
            </div>
            <div>
              <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.plan.lands')}</p>
              <div className="mt-2 flex flex-col gap-0.5">
                <h3 className={T.h3} data-plan-value="lands">
                  {shortDate(landsOn)}
                </h3>
                <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.plan.leadTime', { n: fmt(maker.leadTimeDays) })}</p>
              </div>
            </div>
          </section>

          <Row label={t('gl.plan.cost')}>
            <Value testId="cost" sub={plan ? t('gl.plan.costSub', { n: fmt(plan.units), each: fmt(maker.makingCost) }) : undefined}>
              {plan ? `₹${fmt(plan.atCost)}` : '–'}
            </Value>
          </Row>

          <Row label={t('gl.plan.shipFrom')}>
            {pp ? (
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={t('gl.plan.shipFrom')} data-plan-ship={ship}>
                <ShipOption mode="selfShip" on={ship === 'selfShip'} onClick={() => setShip('selfShip')}>
                  {t('gl.plan.selfShip')}
                </ShipOption>
                <ShipOption mode="packPoint" on={ship === 'packPoint'} disabled={!ppLive} onClick={() => setShip('packPoint')}>
                  {t('gl.plan.packPoint')}
                </ShipOption>
                {pp.kind === 'opening' && <span className={cx(T.bodyXs, 'text-neutral-tertiary')}>{t('gl.plan.opensAt', { n: fmt(pp.opensAt) })}</span>}
              </div>
            ) : (
              <p className={cx(T.bodyMd, 'font-medium')} data-plan-ship={ship}>
                {t(`gl.plan.${ship}`)}
              </p>
            )}
            <p className={cx(T.bodySm, 'text-neutral-secondary')} data-plan-lands-at>
              {ship === 'packPoint' && pp
                ? t('gl.plan.landsAtPackPoint', { city: pp.node.city, date: shortDate(landsOn) })
                : t('gl.plan.readyAtUnit', { date: shortDate(landsOn) })}
            </p>
          </Row>

          <Row label={t('gl.plan.cover')}>
            <Value
              testId="cover"
              sub={plan ? t('gl.plan.coverSub', { left: fmt(plan.onHandAtLanding), n: fmt(plan.units), rate: fmt(g.runRate) }) : undefined}
            >
              {plan ? t('gl.plan.coverValue', { days: fmt(plan.coverAfterDays) }) : '–'}
            </Value>
            {plan?.runsOutBeforeLanding && (
              <Banner tone="warning" className="mt-1">
                <span data-plan-runs-out>{t('gl.plan.runsOut')}</span>
              </Banner>
            )}
          </Row>
        </div>

        <div className="flex justify-end gap-3 border-0 border-t border-solid border-neutral-light px-5 py-4">
          <Button variant="outline" onClick={onClose} data-plan-cancel>
            {t('gl.plan.cancel')}
          </Button>
          <Button onClick={confirm} disabled={!plan} data-plan-confirm>
            {t('gl.plan.confirm')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
