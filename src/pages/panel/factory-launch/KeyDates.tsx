// Key dates row of a Factory Launch event (LW-3): commitments close · stock ready · live, with a
// "Today" marker from the demo day.
import { Fragment } from 'react';
import { dayLabel } from '../../../engine/ui';
import { cx } from '../../../components/ui';
import { FL } from './copy';
import { LAUNCH, dateRange } from './launch';
import { T } from './parts';

interface KeyDate {
  id: string;
  label: string;
  from: number;
  to: number;
}

export const KEY_DATES: KeyDate[] = [
  { id: 'close', label: FL.commitmentsClose, from: LAUNCH.commitmentsCloseDay, to: LAUNCH.commitmentsCloseDay },
  { id: 'stock', label: FL.stockReady, from: LAUNCH.stockAtNodeDay, to: LAUNCH.stockAtNodeDay },
  { id: 'live', label: FL.live, from: LAUNCH.liveFromDay, to: LAUNCH.liveToDay },
];

/** Index at which the Today marker sits: the date it falls on, or the gap before the next date. */
export function todaySlot(day: number): { index: number; on: boolean } {
  const on = KEY_DATES.findIndex((k) => day >= k.from && day <= k.to);
  if (on >= 0) return { index: on, on: true };
  const next = KEY_DATES.findIndex((k) => day < k.from);
  return { index: next < 0 ? KEY_DATES.length : next, on: false };
}

function TodayChip({ day }: { day: number }) {
  return (
    <div className="flex flex-col items-start gap-1 shrink-0" data-today={day}>
      <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-body-xsmall leading-4 font-medium text-brand-primary">{FL.today}</span>
      <p className={cx(T.bodySm, 'text-neutral-secondary')}>{dayLabel(day)}</p>
    </div>
  );
}

export function KeyDates({ day }: { day: number }) {
  const t = todaySlot(day);
  return (
    <div className="flex items-start gap-4 flex-wrap" data-c2m="LW-3" aria-label={FL.keyDates}>
      {KEY_DATES.map((k, i) => {
        const passed = day > k.to;
        const current = t.on && t.index === i;
        return (
          <Fragment key={k.id}>
            {!t.on && t.index === i && <TodayChip day={day} />}
            <div className="flex items-start gap-2 min-w-0" data-key-date={k.id}>
              <span
                aria-hidden="true"
                className={cx(
                  'mt-1 size-2.5 shrink-0 rounded-full border-2 border-solid',
                  current ? 'bg-brand-base border-brand-base' : passed ? 'bg-neutral-disabled border-neutral-dark' : 'bg-neutral-base border-brand-base',
                )}
              />
              <div className="flex flex-col gap-0.5">
                <p className={cx(T.bodySm, 'text-neutral-secondary')}>{k.label}</p>
                <p className={cx(T.bodyMd, 'font-medium', passed ? 'text-neutral-secondary' : 'text-neutral-primary')}>
                  {k.from === k.to ? dayLabel(k.from) : dateRange(k.from, k.to)}
                </p>
                {current && (
                  <span className="w-fit inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-body-xsmall leading-4 font-medium text-brand-primary">{FL.today}</span>
                )}
              </div>
            </div>
            {i < KEY_DATES.length - 1 && <div aria-hidden="true" className="mt-2 h-px w-8 shrink-0 bg-neutral-hover" />}
          </Fragment>
        );
      })}
      {!t.on && t.index === KEY_DATES.length && <TodayChip day={day} />}
    </div>
  );
}
