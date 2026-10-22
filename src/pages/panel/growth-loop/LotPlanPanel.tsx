// GL-6 · "Plan a lot" from "What to make instead": the restock plan's side panel frame (SidePanel) for a product
// type the maker doesn't make yet. Shown: the product, its open demand and confidence (as on the card), his likely
// orders (his share of the gap), the suggested first lot (≈ 2 weeks of those orders), what buyers pay, then his own
// units and start date → ready date from his lead time. Every number comes from firstLotPlan() through
// src/engine/ui.ts. No list price, break-even or B here: his price check comes on the bot's Price step.
// "List it with photos" opens Create from photos with this product type; "Save plan" stores the lot (lotPlans).
import { useId, useMemo, useState } from 'react';
import calendar from '../../../data/calendar.json';
import { Banner, Button, Pill, cx } from '../../../components/ui';
import { dateToDay, dayToDate, firstLotPlan, type ProductTypeId } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import type { StoredLot } from '../../../store/lotPlans';
import { CrystalTip, T } from '../manage-pricing/crystal';
import { Thumb } from './parts';
import { BOX, DateField, INPUT, Row, SidePanel, Value } from './SidePanel';
import { shortDate } from './useGrowth';

export const CONFIDENCE_TONE = { High: 'success', Medium: 'warning', Low: 'error' } as const;

/** "40" or "40–60": a weekly range as shown. */
export const span = (r: { low: number; high: number }) => (r.low === r.high ? fmt(r.low) : `${fmt(r.low)}–${fmt(r.high)}`);

export interface LotMaker {
  /** his own lead time and minimum run, from his live listing */
  leadTimeDays: number;
  minRun: number;
}

export function LotPlanPanel({
  type,
  day,
  maker,
  initial,
  onClose,
  onSave,
  onList,
  canList,
}: {
  type: ProductTypeId;
  /** the demo day: the earliest start (and the default one) */
  day: number;
  maker: LotMaker;
  /** the saved plan being edited, or null for a new one (pre-filled with the suggestion) */
  initial: StoredLot | null;
  onClose: () => void;
  onSave: (lot: StoredLot) => void;
  onList: () => void;
  /** Create from photos has data for this type */
  canList: boolean;
}) {
  const t = useT();
  const unitsId = useId();
  const startId = useId();
  const maxDay = calendar.maxDay;
  const clampDay = (d: number) => Math.min(maxDay, Math.max(day, d));
  const suggested = useMemo(() => firstLotPlan({ type, units: null, startDay: day, leadTimeDays: maker.leadTimeDays, minRun: maker.minRun }).suggested, [type, day, maker]);

  const [units, setUnits] = useState(String(initial?.units ?? suggested));
  const [startDay, setStartDay] = useState(clampDay(initial?.startDay ?? day));
  const p = firstLotPlan({ type, units: units.trim() === '' ? null : Number(units), startDay, leadTimeDays: maker.leadTimeDays, minRun: maker.minRun });

  const save = () => {
    if (p.units === null) return;
    onSave({ units: p.units, startDay: p.startDay, leadTimeDays: maker.leadTimeDays });
  };

  return (
    <SidePanel
      title={initial ? t('gl.lot.editTitle') : t('gl.switch.plan')}
      closeLabel={t('gl.plan.close')}
      onClose={onClose}
      c2m="GL-6"
      rootAttrs={{ 'data-lot-root': true }}
      overlayAttrs={{ 'data-lot-overlay': true }}
      panelAttrs={{ 'data-lot-panel': type }}
      footer={
        <>
          {canList && (
            <Button variant="outline" onClick={onList} data-lot-list>
              {t('gl.lot.list')}
            </Button>
          )}
          <Button onClick={save} disabled={p.units === null} data-lot-save>
            {t('gl.lot.save')}
          </Button>
        </>
      }
    >
      {/* The product, its open demand and confidence (as on the suggestion's card) */}
      <section className="flex items-center gap-3 border-0 border-b border-solid border-neutral-light px-5 py-4">
        <Thumb />
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <p className={cx(T.bodyMd, 'font-medium')} data-lot-value="name">
            {p.name}
          </p>
          <p className={cx(T.bodySm, 'text-neutral-secondary')} data-lot-value="demand">
            {t('gl.switch.gap', { n: fmt(p.gapPerWeek.low) })}
          </p>
        </div>
        <Pill tone={CONFIDENCE_TONE[p.confidence]} bordered className="!text-body-small whitespace-nowrap">
          <span data-lot-value="confidence">{t('gl.switch.confidence', { c: t(`confidence.${p.confidence}`) })}</span>
        </Pill>
      </section>

      <Row label={t('gl.lot.likely')}>
        <Value testId="likely" attr="data-lot-value" sub={t('gl.lot.likelySub', { pct: fmt(p.share * 100) })}>
          {t('gl.lot.likelyValue', { week: span(p.likelyPerWeek), low: fmt(p.likelyPerDay.low), high: fmt(p.likelyPerDay.high) })}
        </Value>
      </Row>

      <Row
        label={
          <>
            {t('gl.lot.suggested')}
            <span data-lot-tip>
              <CrystalTip icon="blue" text={t('gl.lot.suggestedTip', { low: fmt(p.likelyPerDay.low), high: fmt(p.likelyPerDay.high) })} />
            </span>
          </>
        }
      >
        <Value testId="suggested" attr="data-lot-value">
          {t('gl.lot.unitsValue', { n: fmt(p.suggested) })}
        </Value>
      </Row>

      <Row label={t('gl.lot.buyers')}>
        {p.priceBand && (
          <Value testId="buyers" attr="data-lot-value">
            {t('gl.lot.buyersValue', { low: fmt(p.priceBand.low), high: fmt(p.priceBand.high) })}
          </Value>
        )}
        <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.lot.buyersSub')}</p>
      </Row>

      <Row label={t('gl.lot.units')}>
        <div className="flex items-center gap-2">
          <div className={cx(BOX, 'w-28', p.units === null && '!border-danger-dark')}>
            <input
              id={unitsId}
              aria-label={t('gl.lot.units')}
              inputMode="numeric"
              value={units}
              onChange={(e) => setUnits(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className={INPUT}
              data-lot-units
            />
          </div>
          <p className={cx(T.bodyMd, 'text-neutral-secondary')}>{t('gl.plan.unitsWord')}</p>
        </div>
        {p.units === null && <p className={cx(T.bodyXs, 'text-danger-secondary')}>{t('gl.plan.unitsInvalid')}</p>}
        {p.belowMinRun && p.units !== null && (
          <Banner tone="warning" className="mt-1">
            <span data-lot-below-min>{t('gl.lot.belowMinRun', { n: fmt(p.units), min: fmt(maker.minRun) })}</span>
          </Banner>
        )}
      </Row>

      <section className="grid grid-cols-2 gap-4 border-0 border-b border-solid border-neutral-light px-5 py-4">
        <div>
          <label htmlFor={startId} className={cx(T.bodySm, 'text-neutral-secondary block')}>
            {t('gl.plan.start')}
          </label>
          <div className="mt-2">
            <DateField id={startId} value={dayToDate(startDay)} min={dayToDate(day)} max={dayToDate(maxDay)} onChange={(iso) => setStartDay(clampDay(dateToDay(iso)))} attr="data-lot-start" />
          </div>
        </div>
        <div>
          <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.lot.ready')}</p>
          <div className="mt-2 flex flex-col gap-0.5">
            <h3 className={T.h3} data-lot-value="ready">
              {shortDate(dayToDate(p.readyDay))}
            </h3>
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.plan.leadTime', { n: fmt(maker.leadTimeDays) })}</p>
          </div>
        </div>
      </section>
    </SidePanel>
  );
}
