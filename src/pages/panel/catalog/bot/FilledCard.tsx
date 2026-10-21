// "We filled 21 details for you" (LB-4): every bot-filled mandatory field in ONE grey card, collapsed by default.
// "Review" opens a read-only two-column list; the pencil turns one item into its input (select / text, as in
// fields.ts) with Save / Cancel. A saved edit makes the item the maker's, so the count drops.
import { useState } from 'react';
import { Button } from '../../../../components/ui';
import { fmt, useT } from '../../../../i18n';
import { countBotMandatory, FILLED_CARD_IDS, SET_ON } from '../bot';
import type { PriceRow } from '../draftStore';
import { FIELDS } from '../fields';
import { SelectInput, TextInput } from '../FormBits';
import { GREEN_CHECK, LinkButton, Pencil } from './Bits';

const DEF = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
const PRICE_IDS = new Set(['meeshoPrice', 'inventory']);

export function FilledCard({
  values,
  row,
  botFilled,
  onSave,
}: {
  values: Record<string, string>;
  row: PriceRow;
  botFilled: string[];
  onSave: (id: string, v: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; v: string } | null>(null);
  const filled = new Set(botFilled);
  const n = countBotMandatory(botFilled);

  const label = (id: string) => (PRICE_IDS.has(id) ? t(`col.${id}`) : t(`field.${id}`));
  const valueOf = (id: string) => (PRICE_IDS.has(id) ? row[id as keyof PriceRow] : values[id]) ?? '';
  const shown = (id: string) => {
    const v = valueOf(id);
    if (id === 'meeshoPrice' && v) return `₹${fmt(Number(v))}`;
    return v;
  };

  return (
    <section className="mt-2.5 rounded bg-tertiary-bg px-5 py-4" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="filledCard" data-open={open ? 'true' : 'false'}>
      <div className="flex items-center gap-3">
        <img src={GREEN_CHECK} alt="" width="24" height="24" className="size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-button text-xl leading-5 text-primary-text" data-testid="filledCount">
            {t('filled.title', { n })}
          </p>
          <p className="m-0 mt-0.5 font-body text-base leading-4 text-secondary-text">{t('filled.sub')}</p>
        </div>
        <LinkButton onClick={() => { setOpen(!open); setEditing(null); }} className="shrink-0" testId="filledReview">
          {open ? t('filled.hide') : t('filled.review')}
        </LinkButton>
      </div>

      {open && (
        <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 border-0 border-t border-solid border-secondary-border pt-1" data-testid="filledList">
          {FILLED_CARD_IDS.map((id) => {
            const isBot = filled.has(id);
            const setOn = SET_ON[id];
            const v = shown(id);
            const canEdit = !setOn && id !== 'netQuantity';
            const ed = editing?.id === id ? editing : null;
            const f = DEF[id];
            return (
              <div key={id} className="min-w-0 border-0 border-b border-solid border-secondary-border py-2.5" data-filled-item={id} data-bot={isBot ? 'true' : 'false'}>
                <dt className="flex items-center justify-between gap-2 font-body text-base leading-4 text-secondary-text">
                  <span className="truncate">{label(id)}</span>
                  {!isBot && <span className="shrink-0 text-tertiary-text">{t('filled.edited')}</span>}
                </dt>
                {ed && f ? (
                  <dd className="m-0 mt-1.5">
                    {f.kind === 'select' ? (
                      <SelectInput
                        value={ed.v}
                        onChange={(x) => setEditing({ id, v: x })}
                        options={ed.v && !(f.options ?? []).includes(ed.v) ? [...(f.options ?? []), ed.v] : f.options ?? []}
                        placeholder={t('placeholder.select')}
                      />
                    ) : (
                      <TextInput value={ed.v} onChange={(x) => setEditing({ id, v: x })} />
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" disabled={!ed.v.trim()} onClick={() => { onSave(id, ed.v.trim()); setEditing(null); }}>
                        {t('filled.save')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                        {t('filled.cancel')}
                      </Button>
                    </div>
                  </dd>
                ) : (
                  <dd className="m-0 mt-1 flex items-start justify-between gap-2">
                    <span className={`min-w-0 font-body text-lg leading-5 break-words ${v ? 'text-primary-text' : 'text-tertiary-text'}`}>
                      {v || (setOn ? t(`filled.setOn.${setOn}`) : '—')}
                      {id === 'netQuantity' && <span className="text-tertiary-text"> · {t('filled.confirmBelow')}</span>}
                      {setOn && v && <span className="text-tertiary-text"> · {t(`filled.setOn.${setOn}`)}</span>}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`${t('filled.edit')} ${label(id)}`}
                        onClick={() => setEditing({ id, v: valueOf(id) })}
                        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 text-brand-primary-text hover:bg-brand-secondary-bg"
                        data-testid={`edit-${id}`}
                      >
                        <Pencil />
                      </button>
                    )}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
