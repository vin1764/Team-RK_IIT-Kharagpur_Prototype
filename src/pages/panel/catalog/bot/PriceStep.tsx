// Screen 3 · Price (LB-6, LB-8; doc pp.15-18): the maker's three numbers, the engine's list price and take-home with
// the Qualifies chip (status only, never B), "How we got ₹…" (the bot's fee stack), fulfilment, and the go-live
// checklist. Every ₹ value comes from costStack / takeHomeAt / checkListingPrice.
import { useState } from 'react';
import { Pill } from '../../../../components/ui';
import { takeHomeAt } from '../../../../engine/ui';
import { fmt, useT } from '../../../../i18n';
import type { BotStep, GoLiveChecks } from '../bot';
import { packerFor } from '../bot';
import { StatusChip } from '../BotPrice';
import { Checkbox } from '../FormBits';
import { LinkButton, NumberBox, QField, QRow, StepCard } from './Bits';
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
    <div className="mt-4 border-0 border-t border-solid border-tertiary-border pt-3" data-c2m="LB-6" data-testid="howWeGot" data-open={open ? 'true' : 'false'}>
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
          {price ? t('price.result', { price: fmt(price), take: fmt(takeHomeAt(price, s)) }) : t('price.enterPrice')}
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

const CHECK_STEP: Record<keyof Omit<GoLiveChecks, 'all'>, BotStep | 'details'> = { images: 'product', details: 'details', price: 'price', lot: 'quantity' };

export function PriceStep({ m, onGoTo }: { m: BotModel; onGoTo: (s: BotStep) => void }) {
  const t = useT();
  const v = m.values;
  const checks = m.checks;
  const priceLabel = !checks.price && m.status && m.status !== 'qualifies' ? `${t('check.price')} · ${t(`status.${m.status}`)}` : t('check.price');
  const items: Array<[keyof typeof CHECK_STEP, string]> = [
    ['images', t('check.images')],
    ['details', t('check.details')],
    ['price', priceLabel],
    ['lot', m.inventory ? t('check.lot', { units: fmt(m.inventory) }) : t('check.lotEmpty')],
  ];
  const go = (k: keyof typeof CHECK_STEP) => {
    const s = CHECK_STEP[k];
    onGoTo(s === 'details' ? (!m.done.product ? 'product' : !m.done.quantity ? 'quantity' : 'price') : s);
  };
  const retailToggle = (on: boolean) => {
    m.d.setBot({ retailPacked: on });
    const p = packerFor(m.mode, on, m.persona);
    m.d.setBot({ sameAsManufacturer: p.sameAsManufacturer });
    m.d.setValues(p.values);
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

      <StepCard c2m="LB-8" testId="goLive">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="fulfilment">
          <span className="font-body text-lg leading-5 text-secondary-text">{t('fulfil.label')}</span>
          <span className="font-button text-lg leading-5 text-primary-text">{t(`fulfil.${m.mode}`)}</span>
          {m.mode === 'packPoint' && (
            <Checkbox
              className="ml-auto"
              checked={m.d.retailPacked}
              onChange={retailToggle}
              label={<span className="ml-2 font-body text-lg leading-5 text-secondary-text">{t('bot.retailPacked')}</span>}
            />
          )}
        </div>
        <div className="mt-4 border-0 border-t border-solid border-tertiary-border pt-4">
          <p className="m-0 font-button text-lg leading-5 text-primary-text">{t('check.title')}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {items.map(([k, label]) => (
              <button key={k} type="button" onClick={() => go(k)} className="cursor-pointer border-0 bg-transparent p-0" data-check={checks[k] ? 'pass' : 'fail'}>
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
