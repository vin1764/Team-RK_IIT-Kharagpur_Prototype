// GL-2 · "Plan this batch": right-side drawer from the restock card (the Pack Point drawer's frame,
// src/pages/onboarding/packpoint/PackPointDrawer.tsx) with Inventory's own crystal type and the panel's
// Button / Banner. Units and start date are the maker's; every number shown (landing date, cost at making
// price, units on hand when it lands, days of cover after) comes from planBatch() through src/engine/ui.ts.
// Ship from = the listing's fulfilment, switchable to Pack Point only when his pickup pincode is in a live
// cluster (an opening cluster shows it disabled, "Opening soon"; no maker counts), as on the bot's Price screen.
import { useId, useMemo, useState, type ReactNode } from 'react';
import calendar from '../../../data/calendar.json';
import { Banner, Button, cx } from '../../../components/ui';
import { dateToDay, dayToDate, planBatch, type GrowthView, type PlannedBatch } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { packPointStatus } from '../../onboarding/packpoint/status';
import type { ShipFrom, StoredBatch } from '../../../store/restockPlan';
import { T } from '../manage-pricing/crystal';
import { THUMBS, Thumb } from './parts';
import { BOX, DateField, INPUT, Row, SidePanel, Value } from './SidePanel';
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
  const unitsId = useId();
  const startId = useId();
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

  if (!open) return null;

  const confirm = () => {
    if (!plan) return;
    onConfirm({ units: plan.units, startDay: plan.startDay, leadTimeDays: maker.leadTimeDays, shipFrom: ship });
  };

  return (
    <SidePanel
      title={initial ? t('gl.plan.editTitle') : t('gl.restock.plan')}
      closeLabel={t('gl.plan.close')}
      onClose={onClose}
      c2m="GL-2"
      rootAttrs={{ 'data-plan-root': true }}
      overlayAttrs={{ 'data-plan-overlay': true }}
      panelAttrs={{ 'data-plan-panel': true }}
      footer={
        <>
          <Button variant="outline" onClick={onClose} data-plan-cancel>
            {t('gl.plan.cancel')}
          </Button>
          <Button onClick={confirm} disabled={!plan} data-plan-confirm>
            {t('gl.plan.confirm')}
          </Button>
        </>
      }
    >
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
            {pp.kind === 'opening' && <span className={cx(T.bodyXs, 'text-neutral-tertiary')}>{t('gl.plan.openingSoon')}</span>}
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
    </SidePanel>
  );
}
