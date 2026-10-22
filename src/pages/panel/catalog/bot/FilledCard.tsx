// "We filled 21 details for you" (LB-4): every bot-filled mandatory field in ONE card, and the maker must check them.
// Before review the card is the panel's yellow info style with "Needs your review" and a primary "Review 21 details";
// "Confirm details" (after the required tick) turns it green: "Reviewed ✓ · 21 of 21", "View again". The panel opens
// in place: the details grouped (Product info · Size & units · Origin & manufacturer · Packer · Description), each
// with a pencil that turns it into its input (select / text, as in fields.ts) with Save / Cancel. A saved edit is the
// maker's ("Edited by you"); any value that changes after confirming puts the card back to "Needs your review".
import { useState } from 'react';
import { Button, Pill } from '../../../../components/ui';
import { dayLabel } from '../../../../engine/ui';
import { fmt, useT } from '../../../../i18n';
import { BOT_FILLED_COUNT, changedSinceReview, REVIEW_GROUPS, SET_ON, type BotReview } from '../bot';
import type { PriceRow } from '../draftStore';
import { FIELDS } from '../fields';
import { Checkbox, INPUT_BOX, SelectInput, TextInput, borderFor } from '../FormBits';
import { GREEN_CHECK, Pencil } from './Bits';

const DEF = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
const PRICE_IDS = new Set(['meeshoPrice', 'inventory']);
const INFO_YELLOW = '/brand/local/info-yellow.svg';

/** "Confirmed by maker · 27 Oct 2026, 14:05" (demo day's date + the click's clock time). */
export const confirmedLine = (t: ReturnType<typeof useT>, r: { day: number; time: string }) => t('filled.confirmedAt', { date: dayLabel(r.day), time: r.time });

export function FilledCard({
  values,
  row,
  botFilled,
  review,
  reviewed,
  onSave,
  onConfirm,
  testId = 'filledCard',
}: {
  values: Record<string, string>;
  row: PriceRow;
  botFilled: string[];
  /** The last "Confirm details" (kept even after a change, to name what changed). */
  review: BotReview | null;
  reviewed: boolean;
  onSave: (id: string, v: string) => void;
  onConfirm: () => void;
  testId?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(false);
  const [editing, setEditing] = useState<{ id: string; v: string } | null>(null);
  const filled = new Set(botFilled);
  const changed = new Set(reviewed ? [] : changedSinceReview(review, values, botFilled));
  const n = BOT_FILLED_COUNT;

  const label = (id: string) => (PRICE_IDS.has(id) ? t(`col.${id}`) : t(`field.${id}`));
  const valueOf = (id: string) => (PRICE_IDS.has(id) ? row[id as keyof PriceRow] : values[id]) ?? '';
  const shown = (id: string) => {
    const v = valueOf(id);
    if (id === 'meeshoPrice' && v) return `₹${fmt(Number(v))}`;
    return v;
  };
  const toggle = () => {
    setOpen(!open);
    setEditing(null);
    setTick(false);
  };
  const confirm = () => {
    onConfirm();
    setOpen(false);
    setTick(false);
    setEditing(null);
  };

  const item = (id: string) => {
    const isBot = filled.has(id);
    const setOn = SET_ON[id];
    const v = shown(id);
    const canEdit = !setOn && id !== 'netQuantity';
    const ed = editing?.id === id ? editing : null;
    const f = DEF[id];
    const wide = id === 'description' || id.endsWith('Address');
    return (
      <div key={id} className={`min-w-0 border-0 border-b border-solid border-secondary-border py-2.5 ${wide ? 'col-span-2' : ''}`} data-filled-item={id} data-bot={isBot ? 'true' : 'false'}>
        <dt className="flex items-center justify-between gap-2 font-body text-base leading-4 text-secondary-text">
          <span className="truncate">{label(id)}</span>
          <span className="flex shrink-0 gap-1.5">
            {changed.has(id) && (
              <Pill tone="warning" className="px-2 text-sm">
                <span data-testid={`changed-${id}`}>{t('filled.changed')}</span>
              </Pill>
            )}
            {!isBot && !setOn && (
              <Pill tone="brand" className="px-2 text-sm">
                <span data-testid={`edited-${id}`}>{t('filled.edited')}</span>
              </Pill>
            )}
          </span>
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
            ) : f.kind === 'textarea' ? (
              <textarea
                value={ed.v}
                rows={4}
                maxLength={f.maxLength}
                onChange={(e) => setEditing({ id, v: e.target.value })}
                className={`${INPUT_BOX} ${borderFor(false)} block resize-y px-4 py-2.5 leading-5`}
                data-testid={`editInput-${id}`}
              />
            ) : (
              <TextInput value={ed.v} onChange={(x) => setEditing({ id, v: x })} />
            )}
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                disabled={!ed.v.trim()}
                data-testid={`save-${id}`}
                onClick={() => {
                  if (ed.v.trim() !== valueOf(id)) onSave(id, ed.v.trim());
                  setEditing(null);
                }}
              >
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
  };

  return (
    <section
      className={`mt-2.5 rounded border border-solid px-5 py-4 ${reviewed ? 'border-success-border bg-success-bg' : 'border-info-border bg-info-bg'}`}
      data-c2m="LB-4"
      data-c2m-id="LB-4"
      data-testid={testId}
      data-open={open ? 'true' : 'false'}
      data-review={reviewed ? 'reviewed' : 'needs'}
    >
      <div className="flex items-center gap-3">
        <img src={reviewed ? GREEN_CHECK : INFO_YELLOW} alt="" width="24" height="24" className="size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-button text-xl leading-5 text-primary-text" data-testid="filledCount">
            {reviewed ? t('filled.title', { n }) : t('filled.titleCheck', { n })}
          </p>
          <p className="m-0 mt-0.5 font-body text-base leading-4 text-secondary-text">
            {reviewed && review ? confirmedLine(t, review) : changed.size ? t('filled.changedSub') : t('filled.sub')}
          </p>
        </div>
        <span data-testid="reviewChip" className="shrink-0">
          {reviewed ? (
            <Pill tone="success" bordered className="px-3 text-base whitespace-nowrap">
              {t('filled.chipDone', { n })}
            </Pill>
          ) : (
            <Pill tone="warning" bordered className="px-3 text-base whitespace-nowrap">
              {t('filled.chipNeeds')}
            </Pill>
          )}
        </span>
        <Button variant={reviewed || open ? 'outline' : 'primary'} className="shrink-0" onClick={toggle} data-testid="filledReview" aria-expanded={open}>
          {open ? t('filled.hide') : reviewed ? t('filled.viewAgain') : t('filled.reviewButton', { n })}
        </Button>
      </div>

      {open && (
        <div className="mt-4 rounded-sm bg-white px-4 pt-1 pb-4" data-testid="filledList">
          {REVIEW_GROUPS.map((g) => (
            <div key={g.id} className="pt-3" data-review-group={g.id}>
              <p className="m-0 font-button text-lg leading-5 text-primary-text">{t(`filled.group.${g.id}`)}</p>
              <dl className="m-0 grid grid-cols-2 gap-x-6">{g.ids.map(item)}</dl>
            </div>
          ))}
          {reviewed ? (
            review && <p className="m-0 mt-4 font-body text-base leading-4 text-secondary-text">{confirmedLine(t, review)}</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3" data-testid="reviewConfirm">
              <Checkbox
                checked={tick}
                onChange={setTick}
                className="min-w-0 flex-1"
                label={<span className="ml-2.5 font-body text-lg leading-5 text-primary-text" data-testid="reviewTick">{t('filled.tick')}</span>}
              />
              <Button disabled={!tick || !!editing} onClick={confirm} data-testid="confirmDetails">
                {t('filled.confirm')}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
