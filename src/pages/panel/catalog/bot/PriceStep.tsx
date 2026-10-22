// Screen 3 · Price (LB-6, LB-8; doc pp.15-18): the maker's three numbers, the engine's list price and take-home with
// the Qualifies chip (status only, never B), "How we got ₹…" (the bot's fee stack), fulfilment for this product
// ([Self-ship] [Pack Point] when his pickup pincode is in a cluster), and the go-live checklist. Every ₹ value comes
// from costStack / takeHomeShown / checkListingPrice / packPointExtra.
import { useState } from 'react';
import { Pill } from '../../../../components/ui';
import { fmt, useT } from '../../../../i18n';
import { PackPointDrawer } from '../../../onboarding/packpoint/PackPointDrawer';
import type { BotStep, GoLiveChecks, ShipMode } from '../bot';
import { packPointExtra, selfShipPossible, takeHomeShown } from '../bot';
import { StatusChip } from '../BotPrice';
import { Checkbox } from '../FormBits';
import { Choice, LinkButton, NumberBox, QField, QRow, StepCard } from './Bits';
import { FilledCard } from './FilledCard';
import type { BotModel } from './useBotModel';

function HowWeGotIt({ m }: { m: BotModel }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const s = m.stack;
  if (!s) return null;
  const f = s.fees;
  const parts = [
    f.packaging !== undefined ? t('how.packaging', { v: fmt(f.packaging) }) : null,
    f.packPointFee !== undefined ? t('how.packPointFee', { v: fmt(f.packPointFee) }) : null,
    t('how.shipping', { v: fmt(f.shippingAndFixed) }),
    t('how.returns', { v: fmt(f.returnsBuffer) }),
    t('how.gst', { rate: fmt(s.gstRate * 100), v: fmt(f.gst) }),
  ].filter(Boolean);
  return (
    <div className="mt-4 border-0 border-t border-solid border-tertiary-border pt-3" data-c2m="LB-6" data-c2m-id="LB-6" data-testid="howWeGot" data-open={open ? 'true' : 'false'}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-button text-lg leading-5 text-brand-primary-text">
        {t('how.title', { v: fmt(s.listPrice) })}
        <img src={open ? '/brand/msa/merlin/lined/chevron-up-blue.svg' : '/brand/msa/merlin/lined/chevron-right-blue.svg'} alt="" width="16" height="16" className="size-4" />
      </button>
      {open && (
        <div className="mt-2 rounded-sm bg-secondary-bg px-3 py-2.5">
          <p className="m-0 font-body text-lg leading-5 text-primary-text" data-testid="stackLine">
            {parts.join(' · ')} → <b className="font-button">{t('how.breakEven', { v: fmt(s.breakEven) })}</b>
          </p>
          <p className="m-0 mt-1 font-body text-base leading-4 text-secondary-text">
            {t('how.note', { making: fmt(s.makingCost), margin: fmt(m.margin ?? 0), take: fmt(s.takeHome), v: fmt(s.listPrice) })}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultCard({ m }: { m: BotModel }) {
  const t = useT();
  const [changing, setChanging] = useState(false);
  const s = m.stack;
  if (!s) {
    return (
      <StepCard c2m="LB-6" testId="priceResult">
        <p className="m-0 font-body text-lg leading-5 text-secondary-text">{t('price.waiting')}</p>
      </StepCard>
    );
  }
  const price = m.price;
  const edited = !m.filled.has('meeshoPrice');
  return (
    <StepCard c2m="LB-6" testId="priceResult">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 min-w-0 flex-1 font-heading text-3xl leading-6 text-primary-text" data-testid="listAt">
          {price ? t('price.result', { price: fmt(price), take: fmt(takeHomeShown(price, s)) }) : t('price.enterPrice')}
        </p>
        <StatusChip status={m.status} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        {changing ? (
          <>
            <NumberBox value={m.row.meeshoPrice} onChange={(x) => m.setPrice({ meeshoPrice: x })} prefix="₹" width="w-32" ariaLabel={t('col.meeshoPrice')} testId="in-meeshoPrice" />
            <LinkButton onClick={() => setChanging(false)}>{t('filled.save')}</LinkButton>
          </>
        ) : (
          <LinkButton onClick={() => setChanging(true)} testId="changePrice">
            {t('price.change')}
          </LinkButton>
        )}
        {edited && (
          <LinkButton
            onClick={() => {
              m.remarkBot('meeshoPrice');
              setChanging(false);
            }}
            className="font-body text-secondary-text underline"
          >
            {t('price.reset', { v: fmt(s.listPrice) })}
          </LinkButton>
        )}
      </div>
      <HowWeGotIt m={m} />
    </StepCard>
  );
}

/**
 * Fulfilment for this product: [Self-ship] [Pack Point] (Pack Point only when his pickup pincode is in a cluster; an
 * opening cluster shows it disabled), one comparison line with the per-order difference, "See rate cards", and the
 * scope note. With no cluster it stays the plain "Fulfilment: Self-ship" line.
 */
function FulfilmentChoice({ m }: { m: BotModel }) {
  const t = useT();
  const [drawer, setDrawer] = useState(false);
  const opt = m.ppOption;
  const type = m.type;
  const canSelfShip = !!type && selfShipPossible(type);
  const extra = type ? packPointExtra(type, opt?.state === 'live' ? opt.makersPooled : undefined) : null;
  const retail =
    m.mode === 'packPoint' ? (
      <Checkbox
        className="mt-3"
        checked={m.d.retailPacked}
        onChange={m.setRetailPacked}
        label={<span className="ml-2 font-body text-lg leading-5 text-secondary-text">{t('bot.retailPacked')}</span>}
      />
    ) : null;
  if (!opt || !canSelfShip) {
    return (
      <div data-testid="fulfilment" data-mode={m.mode}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-body text-lg leading-5 text-secondary-text">{t('fulfil.label')}</span>
          <span className="font-button text-lg leading-5 text-primary-text">{t(`fulfil.${m.mode}`)}</span>
        </div>
        {retail}
      </div>
    );
  }
  const live = opt.state === 'live';
  const option = (mode: ShipMode) => (
    <Choice key={mode} on={m.mode === mode} disabled={mode === 'packPoint' && !live} onClick={() => m.setMode(mode)} testId={`ship-${mode}`}>
      {t(`fulfil.${mode}`)}
    </Choice>
  );
  return (
    <div data-testid="fulfilment" data-mode={m.mode}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-body text-lg leading-5 text-secondary-text">{t('fulfil.label')}</span>
        <div className="flex gap-2" role="group" aria-label={t('fulfil.label')} data-testid="fulfilmentToggle">
          {option('selfShip')}
          {option('packPoint')}
        </div>
        {!live && (
          <span className="font-body text-base leading-4 text-tertiary-text" data-testid="ppOpensAt">
            {t('fulfil.opensAt', { n: fmt(opt.opensAtMakers) })}
          </span>
        )}
      </div>
      <p className="m-0 mt-2.5 font-body text-lg leading-5 text-secondary-text" data-testid="fulfilCompare">
        {extra !== null ? t('fulfil.compare', { extra: fmt(extra) }) : t('fulfil.compareNoExtra')}{' '}
        ·{' '}
        <LinkButton onClick={() => setDrawer(true)} className="font-body" testId="seeRateCards">
          {t('fulfil.rateCards')}
        </LinkButton>
      </p>
      <p className="m-0 mt-1 font-body text-base leading-4 text-tertiary-text" data-testid="fulfilScope">
        {t('fulfil.scope', { mode: t(`fulfil.${m.defaultMode}`) })}
      </p>
      {retail}
      <PackPointDrawer open={drawer} onClose={() => setDrawer(false)} pincode={m.pincode} onChoose={live && m.mode !== 'packPoint' ? () => m.setMode('packPoint') : undefined} />
    </div>
  );
}

const CHECK_STEP: Record<keyof Omit<GoLiveChecks, 'all'>, BotStep | 'details' | 'review'> = { images: 'product', details: 'details', review: 'review', price: 'price', lot: 'quantity' };

export function PriceStep({ m, onGoTo }: { m: BotModel; onGoTo: (s: BotStep) => void }) {
  const t = useT();
  const v = m.values;
  const checks = m.checks;
  const priceLabel = !checks.price && m.status && m.status !== 'qualifies' ? `${t('check.price')} · ${t(`status.${m.status}`)}` : t('check.price');
  const items: Array<[keyof typeof CHECK_STEP, string]> = [
    ['images', t('check.images')],
    ['details', t('check.details')],
    ['review', t('check.review')],
    ['price', priceLabel],
    ['lot', m.inventory ? t('check.lot', { units: fmt(m.inventory) }) : t('check.lotEmpty')],
  ];
  const go = (k: keyof typeof CHECK_STEP) => {
    const s = CHECK_STEP[k];
    if (s === 'review') {
      // The card is on this screen while it needs review; else (never confirmed) it is on Product.
      const card = document.querySelector('[data-testid="filledCardPrice"]');
      if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      else onGoTo('product');
      return;
    }
    onGoTo(s === 'details' ? (!m.done.product ? 'product' : !m.done.quantity ? 'quantity' : 'price') : s);
  };
  return (
    <div data-testid="botStep-price">
      <StepCard title={t('price.yours')} c2m="LB-6" testId="numbersCard">
        <QRow testId="row-cost">
          <QField label={t('price.makingCost')}>
            <NumberBox value={v.makingCost ?? ''} onChange={(x) => m.setValue('makingCost', x)} prefix="₹" width="w-40" ariaLabel={t('price.makingCost')} testId="in-makingCost" />
          </QField>
          <QField label={t('price.margin')}>
            <NumberBox value={v.marginPct ?? ''} onChange={(x) => m.setValue('marginPct', x)} suffix="%" width="w-32" ariaLabel={t('price.margin')} testId="in-marginPct" />
          </QField>
        </QRow>
        <QRow testId="row-mrp">
          <QField label={t('price.mrp')}>
            <NumberBox value={m.row.mrp} onChange={(x) => m.setPrice({ mrp: x })} prefix="₹" width="w-40" ariaLabel={t('price.mrp')} testId="in-mrp" />
          </QField>
        </QRow>
      </StepCard>

      <ResultCard m={m} />

      {/* A detail changed after he confirmed (e.g. the Packer followed the fulfilment switch): check it here. */}
      {!m.reviewed && m.d.botReview && (
        <FilledCard values={m.values} row={m.row} botFilled={m.d.botFilled} review={m.d.botReview} reviewed={false} onSave={(id, x) => m.setValue(id, x)} onConfirm={m.confirm} testId="filledCardPrice" />
      )}

      <StepCard c2m="LB-8" testId="goLive">
        <FulfilmentChoice m={m} />
        <div className="mt-4 border-0 border-t border-solid border-tertiary-border pt-4">
          <p className="m-0 font-button text-lg leading-5 text-primary-text">{t('check.title')}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {items.map(([k, label]) => (
              <button key={k} type="button" onClick={() => go(k)} className="cursor-pointer border-0 bg-transparent p-0" data-check={checks[k] ? 'pass' : 'fail'} data-check-id={k}>
                <Pill tone={checks[k] ? 'success' : 'error'} bordered className="px-3 text-base whitespace-nowrap">
                  {label} {checks[k] ? '✓' : '✗'}
                </Pill>
              </button>
            ))}
          </div>
          <p className="m-0 mt-3 font-body text-base leading-4 text-secondary-text">{t('check.feesLocked')}</p>
        </div>
      </StepCard>
    </div>
  );
}
