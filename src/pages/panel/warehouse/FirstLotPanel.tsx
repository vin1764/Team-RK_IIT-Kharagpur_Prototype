// PP-5 · "Plan first lot" after a Warehouse switch to a Pack Point (and "Plan a lot" on the Lots tab): the growth-loop side panel frame (SidePanel)
// with one row per product the switch applied to: units to send (pre-filled with the engine's suggested lot,
// ≈ 14 days of expected sales, never below his minimum run), units per size where the seed has a split for that
// lot, and the send date. "Save plan" stores it (src/store/fulfilmentSwitch.ts lots; Reset demo clears).
import { useId, useState } from 'react';
import calendar from '../../../data/calendar.json';
import { Button, cx } from '../../../components/ui';
import { dateToDay, dayToDate, productTypeName, sizeSplitFor, suggestedLot, type ProductTypeId } from '../../../engine/ui';
import { fmt } from '../../../i18n';
import type { FirstLot } from '../../../store/fulfilmentSwitch';
import { C2M } from '../../onboarding/stepper/copy';
import { BOX, DateField, INPUT, Row, SidePanel } from '../growth-loop/SidePanel';
import { T } from '../manage-pricing/crystal';

export interface LotProduct {
  key: string;
  name: string;
  type: ProductTypeId;
  makingCost: number;
  minRun: number;
}

/** Units per size when the seed's split fits these units, else null (no split shown). */
function splitFor(type: ProductTypeId, units: number) {
  try {
    return sizeSplitFor(type, units);
  } catch {
    return null;
  }
}

export function FirstLotPanel({
  city,
  day,
  products,
  initial,
  title,
  onClose,
  onSave,
}: {
  city: string;
  day: number;
  products: LotProduct[];
  initial: FirstLot | null;
  /** default "Plan first lot · <city>" */
  title?: string;
  onClose: () => void;
  onSave: (lot: FirstLot) => void;
}) {
  const dateId = useId();
  const maxDay = calendar.maxDay;
  const clamp = (d: number) => Math.min(maxDay, Math.max(day, d));
  const [units, setUnits] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.key, String(initial?.lines.find((l) => l.listing === p.key)?.units ?? suggestedLot(p.type, p.makingCost, p.minRun).units)])),
  );
  const [sendDay, setSendDay] = useState(clamp(initial?.sendDay ?? day));
  const parsed = products.map((p) => ({ p, n: /^\d+$/.test(units[p.key] ?? '') && Number(units[p.key]) > 0 ? Number(units[p.key]) : null }));
  const valid = products.length > 0 && parsed.every((x) => x.n !== null);
  const total = parsed.reduce((s, x) => s + (x.n ?? 0), 0);

  return (
    <SidePanel
      title={title ?? C2M.ppLotTitle(city)}
      closeLabel={C2M.ppClose}
      onClose={onClose}
      c2m="PP-5"
      rootAttrs={{ 'data-pp-lot-root': true }}
      panelAttrs={{ 'data-pp-lot-panel': city }}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {C2M.ppCancel}
          </Button>
          <Button
            disabled={!valid}
            data-pp-lot-save
            onClick={() => onSave({ node: city, sendDay, lines: parsed.map(({ p, n }) => ({ listing: p.key, type: p.type, units: n! })) })}
          >
            {C2M.ppLotSave}
          </Button>
        </>
      }
    >
      {products.length === 0 && (
        <Row label={C2M.ppLotProduct}>
          <p className={T.bodyMd}>{C2M.ppLotNone}</p>
        </Row>
      )}
      {parsed.map(({ p, n }) => {
        const s = suggestedLot(p.type, p.makingCost, p.minRun);
        const split = n !== null ? splitFor(p.type, n) : null;
        return (
          <Row key={p.key} label={<span className="font-medium text-neutral-primary">{p.name}</span>}>
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{productTypeName(p.type)}</p>
            <div className="flex items-center gap-2">
              <div className={cx(BOX, 'w-28', n === null && '!border-danger-dark')}>
                <input
                  aria-label={`${C2M.ppLotProduct} · ${p.name}`}
                  inputMode="numeric"
                  value={units[p.key] ?? ''}
                  onChange={(e) => setUnits((u) => ({ ...u, [p.key]: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                  className={INPUT}
                  data-pp-lot-units={p.key}
                />
              </div>
              <p className={cx(T.bodyMd, 'text-neutral-secondary')}>{C2M.ppLotProduct.toLowerCase()}</p>
            </div>
            <p className={cx(T.bodySm, 'text-neutral-secondary')} data-pp-lot-suggested={s.units}>
              {C2M.ppLotSuggested(fmt(s.units), s.days)}
            </p>
            {split && (
              <div className="flex flex-wrap gap-x-4 gap-y-1" data-pp-lot-sizes>
                <p className={cx(T.bodySm, 'text-neutral-secondary')}>{C2M.ppLotSizes}:</p>
                {split.map((x) => (
                  <p key={x.size} className={T.bodySm}>
                    UK {x.size} · {fmt(x.units)}
                  </p>
                ))}
              </div>
            )}
          </Row>
        );
      })}
      <section className="border-0 border-b border-solid border-neutral-light px-5 py-4">
        <label htmlFor={dateId} className={cx(T.bodySm, 'text-neutral-secondary block')}>
          {C2M.ppLotSendOn}
        </label>
        <div className="mt-2">
          <DateField id={dateId} value={dayToDate(sendDay)} min={dayToDate(day)} max={dayToDate(maxDay)} onChange={(iso) => setSendDay(clamp(dateToDay(iso)))} attr="data-pp-lot-send" />
        </div>
        <p className={cx(T.bodyMd, 'mt-3 font-medium')} data-pp-lot-total={total}>
          {C2M.ppLotTotal(fmt(total))}
        </p>
      </section>
    </SidePanel>
  );
}
