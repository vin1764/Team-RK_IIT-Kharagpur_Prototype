// PI-2 · Manage Pricing → Price position: per Factory Launch listing, whether its price qualifies
// and which third of like-for-like listings it sits in (doc p.7 mock-up), with an edit-price
// control. PI-3 · the price-hold banner when an edit no longer qualifies (slot removed).
// No benchmark, cut-off or other sellers' prices appear: status and third only, from priceHold.ts.
import { useState } from 'react';
import { Banner, Button, InfoTip, Pill, cx } from '../../../components/ui';
import { dayLabel, type PricePosition } from '../../../engine/ui';
import { fmt, useT, type T as Tr } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { usePriceEdits } from '../../../store/priceEdits';
import { THUMBS, Thumb } from '../growth-loop/parts';
import { T } from './crystal';
import type { PriceHoldView } from './priceHold';

const THIRDS: PricePosition[] = ['low', 'mid', 'high'];

/** The listing photo this prototype has (the bot's cleaned cover of the 1 L bottle). */
const THUMB_BY_TYPE: Record<string, string | undefined> = { 'steel-bottle-1l': THUMBS.bottle };

function statusChip(v: PriceHoldView, t: Tr) {
  if (v.status === 'qualifies') return { tone: 'success' as const, text: t('pi.status.qualifies') };
  if (v.slotRemoved) return { tone: 'error' as const, text: t('pi.status.slotRemoved') };
  return { tone: 'error' as const, text: t(v.status === 'belowCost' ? 'pi.status.belowCost' : 'pi.status.aboveCap') };
}

/** Three equal segments, the sitting third filled (doc p.7). */
function ThirdsBar({ position, t }: { position: PricePosition | null; t: Tr }) {
  return (
    <div className="flex flex-col gap-1.5" data-position={position ?? 'none'}>
      <div className="flex items-center gap-1">
        <p className={cx(T.bodySm, 'text-neutral-primary')}>{position && t(`pi.position.${position}`)}</p>
        <InfoTip text={t('pi.thirdsTip')} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-72">
        {THIRDS.map((p) => (
          <div key={p} className="flex flex-col items-center gap-1">
            <div className={cx('h-2 w-full rounded-full border border-solid', p === position ? 'bg-brand-base border-brand-base' : 'bg-neutral-base border-neutral-light')} />
            <p className={cx(T.bodyXs, p === position ? 'text-brand-primary font-medium' : 'text-neutral-secondary')}>{t(`pi.third.${p}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditPrice({ current, onSave, onCancel, t }: { current: number; onSave: (p: number) => void; onCancel: () => void; t: Tr }) {
  const [value, setValue] = useState(String(current));
  const n = Number(value);
  const ok = value !== '' && Number.isInteger(n) && n > 0;
  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave(n);
      }}
      data-edit-price
    >
      <label className={cx(T.bodySm, 'text-neutral-secondary')} htmlFor="pi-new-price">
        {t('pi.newPrice')}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center h-8 w-28 rounded-sm border border-solid border-neutral-light focus-within:border-brand-base px-2 gap-1">
          <span className={cx(T.bodyMd, 'text-neutral-secondary')}>₹</span>
          <input
            id="pi-new-price"
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border-none outline-none bg-transparent text-body-medium leading-5 text-neutral-primary [font-family:inherit]"
          />
        </div>
        <Button size="sm" type="submit" disabled={!ok}>
          {t('pi.save')}
        </Button>
        <Button size="sm" variant="text" onClick={onCancel}>
          {t('pi.cancel')}
        </Button>
      </div>
      {!ok && <p className={cx(T.bodyXs, 'text-danger-secondary')}>{t('pi.invalid')}</p>}
    </form>
  );
}

/** PI-3 banner under the row when the price doesn't qualify. */
function HoldBanner({ v, t }: { v: PriceHoldView; t: Tr }) {
  if (v.status === 'qualifies') return null;
  const lines =
    v.status === 'belowCost'
      ? [t('pi.below.title', { be: fmt(v.breakEven) }), t('pi.below.body'), v.slotRemoved ? t('pi.below.slot') : null]
      : v.slotRemoved
        ? [t('pi.hold.title'), t('pi.hold.body')]
        : [t('pi.hold.noSlotTitle'), t('pi.hold.noSlot')];
  return (
    <Banner tone="error" className="mt-3">
      <span data-c2m="PI-3" data-price-hold={v.slotRemoved ? 'slotRemoved' : v.status}>
        <b className="font-button">{lines[0]}</b>
        {lines.slice(1).filter(Boolean).map((l) => (
          <span key={l}>
            <br />
            {l}
          </span>
        ))}
      </span>
    </Banner>
  );
}

export function PricePositionTab({ v }: { v: PriceHoldView }) {
  const t = useT();
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const setPrice = usePriceEdits((s) => s.setPrice);
  const [editing, setEditing] = useState(false);
  const chip = statusChip(v, t);
  return (
    <div className="px-4 pb-6 pt-3 bg-neutral-base flex flex-col gap-3" data-c2m="PI-2" data-price-position>
      <Banner tone="info">
        {t('pi.scope')}
        <br />
        <span className="text-secondary-text">{t('pi.weekly')}</span>
      </Banner>

      <div className="rounded-8 border border-solid border-neutral-light bg-neutral-base p-4" data-listing={v.typeId}>
        <div className="flex items-start gap-4">
          <Thumb src={THUMB_BY_TYPE[v.typeId]} />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{v.name}</p>
            {v.listingId && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('pi.catalogId', { id: v.listingId })}</p>}
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('pi.listing')}</p>
          </div>
          <div className="w-56 shrink-0 flex flex-col gap-1">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('pi.yourPrice')}</p>
            {editing ? (
              <EditPrice
                current={v.price}
                t={t}
                onCancel={() => setEditing(false)}
                onSave={(price) => {
                  setPrice(persona, { price, day });
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h3 className={T.h3} data-price={v.price}>
                    ₹{fmt(v.price)}
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-edit-open>
                    {t('pi.edit')}
                  </Button>
                </div>
                <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('pi.breakEven', { v: fmt(v.breakEven) })}</p>
                {v.edit && v.edit.price !== v.originalPrice && (
                  <p className={cx(T.bodySm, 'text-neutral-secondary')} data-was>
                    {t('pi.was', { v: fmt(v.originalPrice), date: dayLabel(v.edit.day) })}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="w-80 shrink-0 flex flex-col items-start gap-3">
            <Pill tone={chip.tone} bordered className="!text-body-small whitespace-nowrap">
              <span data-status={v.slotRemoved ? 'slotRemoved' : v.status}>{chip.text}</span>
            </Pill>
            <ThirdsBar position={v.position} t={t} />
          </div>
        </div>
        <HoldBanner v={v} t={t} />
      </div>

      <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('pi.never')}</p>
    </div>
  );
}
