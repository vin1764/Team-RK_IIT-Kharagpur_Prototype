// Panel pieces reused by the Factory Launch screens. The table classes are the panel's Merlin
// Table, as ported for the Warehouse fee tables (reference/html/meesho-warehouse.html).
import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';
import { T } from '../manage-pricing/crystal';

const TH =
  'text-start border-[0.03125rem] border-t-0 border-solid border-secondary-border data-[is-last-column=true]:border-r-0 data-[is-first-column=true]:border-l-0 text-sm leading-4 font-semibold font-button py-3 px-3 align-top';
const TD = 'border-[0.03125rem] border-tertiary-border border-solid py-3 px-3 align-top data-[is-last-column=true]:border-r-0 data-[is-first-column=true]:border-l-0';

export interface Col {
  key: string;
  header: ReactNode;
  width?: string;
}

export function MerlinTable({ cols, rows, label }: { cols: Col[]; rows: Array<Record<string, ReactNode> & { id: string }>; label: string }) {
  return (
    <table aria-label={label} className="w-full border-collapse border-spacing-0 table-fixed">
      <thead>
        <tr className="bg-tertiary-bg">
          {cols.map((c, i) => (
            <th key={c.key} className={TH} data-is-first-column={i === 0} data-is-last-column={i === cols.length - 1} style={{ width: c.width }}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} data-row={r.id}>
            {cols.map((c, i) => (
              <td key={c.key} className={TD} data-col={c.key} data-is-first-column={i === 0} data-is-last-column={i === cols.length - 1}>
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Cell text: value on top, secondary line under it. */
export function Cell({ value, sub }: { value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="m-0 p-0 text-primary-text font-body text-lg leading-5">{value}</p>
      {sub && <p className="m-0 p-0 text-secondary-text font-body text-base leading-4">{sub}</p>}
    </div>
  );
}

/** ✓ / ✗ row, as on Business Details (FO-7). */
export function CheckRow({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-lg leading-5 font-body text-primary-text" data-check={ok ? 'pass' : 'fail'}>
      <span aria-label={ok ? 'passed' : 'failed'} className={cx('w-3 shrink-0 font-heading', ok ? 'text-success-text' : 'text-error-text')}>
        {ok ? '✓' : '✗'}
      </span>
      {children}
    </li>
  );
}

/** Bordered white section with a crystal heading (the Promotions pages' card language). */
export function Section({ title, right, children, className, c2m }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; c2m?: string }) {
  return (
    <section className={cx('rounded-8 border border-solid border-neutral-light bg-neutral-base', className)} data-c2m={c2m}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          {title && <h3 className={T.h3}>{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export { T };
