// Screen 1 · Product (LB-4, doc p.14): photos + what the bot recognised + the cleaned cover; the bot's 21 values in
// one collapsed card the maker must review and confirm; the Pack of 1 confirm row; then the 5 rows only he can answer.
import { useState } from 'react';
import { Button } from '../../../../components/ui';
import { productTypeName, type ProductTypeId } from '../../../../engine/ui';
import { useT } from '../../../../i18n';
import { ADD_ON_CHIPS, addOnsOf, cleanedFor, MANDATORY_IDS, TODAY_IMAGE_SLOTS, toggleAddOn } from '../bot';
import type { DraftImage } from '../draftStore';
import { FIELDS, PLACEHOLDER_OPTIONS } from '../fields';
import { SelectInput } from '../FormBits';
import { Choice, GREEN_CHECK, LinkButton, NumberBox, QField, QRow, StepCard } from './Bits';
import { FilledCard } from './FilledCard';
import type { BotModel } from './useBotModel';

const opts = (id: string) => FIELDS.find((f) => f.id === id)?.options ?? PLACEHOLDER_OPTIONS[id] ?? [];

function UnitPicker({ id, m, label }: { id: string; m: BotModel; label: string }) {
  const t = useT();
  return (
    <div className="w-24 shrink-0" aria-label={label} title={label} data-field={id}>
      <SelectInput value={m.values[id] ?? ''} onChange={(v) => m.setValue(id, v)} options={opts(id)} placeholder={t('placeholder.select')} />
    </div>
  );
}

export function PhotosCard({ photos, type, categoryPath, onEditPhotos, onChangeCategory }: { photos: DraftImage[]; type: ProductTypeId; categoryPath: string[]; onEditPhotos: () => void; onChangeCategory: () => void }) {
  const t = useT();
  const cover = photos[0];
  const cleaned = cleanedFor(cover);
  return (
    <StepCard c2m="LB-4" testId="botPhotos">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 font-button text-xl leading-5 text-primary-text">{t('bot.photos.title')}</p>
        <LinkButton onClick={onEditPhotos}>{t('bot.photos.edit')}</LinkButton>
      </div>
      <div className="mt-3 flex gap-2">
        {photos.map((p, i) => (
          <figure key={p.id} className="m-0 w-16">
            <img src={p.url} alt={p.name} className="box-border block size-16 rounded-sm border border-solid border-tertiary-border object-cover" />
            {i === 0 && <figcaption className="mt-1 text-center font-body text-sm leading-4 text-secondary-text">{t('bot.photos.cover')}</figcaption>}
          </figure>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-sm bg-brand-secondary-bg px-3 py-2.5" data-testid="recognised">
        <p className="m-0 min-w-0 flex-1 font-body text-lg leading-5 text-primary-text">
          <span className="font-button">{t('recognised.label')}</span> {productTypeName(type)} · <span className="text-secondary-text">{categoryPath.slice(-2).join(' / ')}</span>
        </p>
        <LinkButton onClick={onChangeCategory} className="shrink-0" testId="changeCategory">
          {t('recognised.change')}
        </LinkButton>
      </div>
      <div className="mt-4 flex items-center gap-3" data-testid="cleanedImage">
        <figure className="m-0 w-16">
          {cover && <img src={cover.url} alt="" className="block size-16 rounded-sm object-cover" />}
          <figcaption className="mt-1 text-center font-body text-sm leading-4 text-secondary-text">{t('bot.cleaned.before')}</figcaption>
        </figure>
        <img src="/brand/msa/merlin/lined/chevron-right-grey.svg" alt="" width="20" height="20" className="mb-5 size-5" />
        <figure className="m-0 w-16">
          <img src={(cleaned ?? cover)?.url} alt="" className="box-border block size-16 rounded-sm border border-solid border-tertiary-border bg-white object-contain" />
          <figcaption className="mt-1 -mx-2 text-center font-body text-sm leading-4 whitespace-nowrap text-secondary-text">{t('bot.cleaned.after')}</figcaption>
        </figure>
        <div className="mb-5 min-w-0 flex-1 pl-1">
          <p className="m-0 font-button text-lg leading-5 text-primary-text">{t('bot.cleaned.title')}</p>
          <p className="m-0 mt-0.5 font-body text-base leading-4 text-secondary-text">{cleaned ? t('bot.cleaned.note') : t('bot.cleaned.demoOnly')}</p>
        </div>
      </div>
    </StepCard>
  );
}

/** "Pack of 1 — correct? [Yes] [Change]" — one of the 21, but the maker must say yes. */
export function NetQtyRow({ m }: { m: BotModel }) {
  const t = useT();
  const [changing, setChanging] = useState(false);
  const n = m.values.netQuantity ?? '';
  const ok = m.d.netQtyConfirmed;
  return (
    <section className="mt-2.5 flex flex-wrap items-center gap-3 rounded bg-white px-5 py-3.5" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="netQtyConfirm" data-confirmed={ok ? 'true' : 'false'}>
      <p className="m-0 flex min-w-0 flex-1 items-center gap-2 font-body text-xl leading-5 text-primary-text">
        {ok && <img src={GREEN_CHECK} alt="" width="20" height="20" className="size-5" />}
        {ok ? t('netQty.confirmed', { n }) : t('netQty.question', { n })}
      </p>
      {changing ? (
        <div className="w-28" data-field="netQuantity">
          <SelectInput
            value={n}
            onChange={(v) => {
              m.setValue('netQuantity', v);
              m.d.setBot({ netQtyConfirmed: true });
              setChanging(false);
            }}
            options={opts('netQuantity')}
          />
        </div>
      ) : ok ? (
        <LinkButton onClick={() => setChanging(true)}>{t('netQty.change')}</LinkButton>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => m.d.setBot({ netQtyConfirmed: true })} data-testid="netQtyYes">
            {t('netQty.yes')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
            {t('netQty.change')}
          </Button>
        </div>
      )}
    </section>
  );
}

export function ProductMakerCard({ m }: { m: BotModel }) {
  const t = useT();
  const v = m.values;
  const addOns = addOnsOf(v.addOns);
  const num = (id: string, suffix?: string, width = 'w-24', placeholder?: string) => (
    <NumberBox value={v[id] ?? ''} onChange={(x) => m.setValue(id, x)} suffix={suffix} width={width} placeholder={placeholder} ariaLabel={t(`field.${id}`)} testId={`in-${id}`} />
  );
  return (
    <StepCard title={t('maker.title')} c2m="LB-4" testId="makerCard">
      <QRow testId="row-material">
        <QField label={t('q.material')} className="flex-1">
          <div data-field="material">
            <SelectInput value={v.material ?? ''} onChange={(x) => m.setValue('material', x)} options={opts('material')} placeholder={t('placeholder.select')} />
          </div>
        </QField>
        <QField label={t('q.capacity')}>
          <div className="flex gap-2">
            {num('capacity', undefined, 'w-20')}
            <UnitPicker id="volumeUnit" m={m} label={t('field.volumeUnit')} />
          </div>
        </QField>
      </QRow>
      <QRow testId="row-leakProof">
        <QField label={t('q.leakProof')}>
          <div className="flex gap-2" role="group">
            {['Yes', 'No'].map((o) => (
              <Choice key={o} on={v.leakProof === o} onClick={() => m.setValue('leakProof', o)} testId={`leak-${o}`}>
                {t(`opt.${o}`)}
              </Choice>
            ))}
          </div>
        </QField>
      </QRow>
      <QRow testId="row-addOns">
        <QField label={t('q.addOns')}>
          <div className="flex flex-wrap gap-2" role="group">
            {ADD_ON_CHIPS.map((o) => (
              <Choice key={o} round on={addOns.includes(o)} onClick={() => m.setValue('addOns', toggleAddOn(v.addOns, o))} testId={`addon-${o}`}>
                {t(`opt.${o}`)}
              </Choice>
            ))}
          </div>
        </QField>
      </QRow>
      <QRow testId="row-size">
        <QField label={t('q.size')}>
          <div className="flex items-center gap-2">
            {num('length', undefined, 'w-20', 'L')}
            <span className="font-body text-xl text-tertiary-text">×</span>
            {num('breadth', undefined, 'w-20', 'B')}
            <span className="font-body text-xl text-tertiary-text">×</span>
            {num('height', undefined, 'w-20', 'H')}
            <UnitPicker id="productUnit" m={m} label={t('field.productUnit')} />
          </div>
        </QField>
      </QRow>
      <QRow testId="row-weight">
        <QField label={t('q.weight')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-lg text-secondary-text">{t('q.weight.product')}</span>
            {num('netWeight', 'g', 'w-28')}
            <span className="px-1 font-body text-lg text-tertiary-text">·</span>
            <span className="font-body text-lg text-secondary-text">{t('q.weight.packed')}</span>
            {num('productWeight', v.productWeightUnit || 'g', 'w-28')}
          </div>
        </QField>
      </QRow>
    </StepCard>
  );
}

export function ProductStep({ m, type, onEditPhotos, onChangeCategory, onFullForm, onCompare }: { m: BotModel; type: ProductTypeId; onEditPhotos: () => void; onChangeCategory: () => void; onFullForm: () => void; onCompare: () => void }) {
  const t = useT();
  return (
    <div data-testid="botStep-product">
      <PhotosCard photos={m.d.photos.length ? m.d.photos : m.d.images} type={type} categoryPath={m.d.categoryPath} onEditPhotos={onEditPhotos} onChangeCategory={onChangeCategory} />
      <FilledCard values={m.values} row={m.row} botFilled={m.d.botFilled} review={m.d.botReview} reviewed={m.reviewed} onSave={(id, v) => m.setValue(id, v)} onConfirm={m.confirm} />
      <NetQtyRow m={m} />
      <ProductMakerCard m={m} />
      <div className="mt-4 flex items-center justify-between px-1" data-c2m="LB-4" data-c2m-id="LB-4">
        <LinkButton onClick={onCompare} className="font-body text-secondary-text underline" testId="openCompare">
          {t('flow.compare', { n: MANDATORY_IDS.length + TODAY_IMAGE_SLOTS })}
        </LinkButton>
        <LinkButton onClick={onFullForm} testId="fullForm">
          {t('flow.fullForm')}
        </LinkButton>
      </div>
    </div>
  );
}
