// Product-type search/select for the cost check (FO-5). Only types with a fee card in the
// engine are selectable; the rest are listed greyed out.
import { useMemo, useState } from 'react';
import data from '../../../data/productTypes.json';
import { productTypeName, typeFees, type ProductTypeId } from '../../../engine/ui';
import { cx } from '../../../components/ui';
import { Field } from './Field';

const hasFeeCard = (t: ProductTypeId) => {
  try {
    typeFees(t);
    return true;
  } catch {
    return false;
  }
};

const TYPES = (Object.keys(data).filter((k) => !k.startsWith('_')) as ProductTypeId[]).map((id) => ({
  id,
  name: productTypeName(id),
  selectable: hasFeeCard(id),
}));

export function ProductTypeSelect({ value, onChange, className }: { value: ProductTypeId | null; onChange: (t: ProductTypeId) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const selectedName = value ? productTypeName(value) : '';
  const shown = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase();
    return TYPES.filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className={cx('relative', className)}>
      <Field
        label="Product type"
        placeholder="Search product type"
        value={query ?? selectedName}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // let an option's mousedown land first
          setTimeout(() => {
            setOpen(false);
            setQuery(null);
          }, 120);
        }}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
      />
      <img src="/brand/msa/merlin/lined/chevron-down-grey.svg" alt="" width="16" height="16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" />
      {open && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-app-bar m-0 mt-1 list-none rounded-sm border border-solid border-secondary-border bg-white p-0 py-1">
          {shown.length === 0 && <li className="px-4 py-2 text-lg text-tertiary-text">No matching product type</li>}
          {shown.map((t) => (
            <li
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              aria-disabled={!t.selectable}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!t.selectable) return;
                onChange(t.id);
                setQuery(null);
                setOpen(false);
                (document.activeElement as HTMLElement | null)?.blur();
              }}
              className={cx(
                'flex items-center justify-between px-4 py-2 text-lg leading-5',
                t.selectable ? 'cursor-pointer text-primary-text hover:bg-secondary-bg' : 'cursor-not-allowed text-tertiary-text',
                t.id === value && 'bg-brand-secondary-bg',
              )}
            >
              <span>{t.name}</span>
              {!t.selectable && <span className="text-base">Fee card not in this prototype</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
