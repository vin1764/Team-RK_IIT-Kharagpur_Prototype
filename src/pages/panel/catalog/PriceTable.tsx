// Size | Meesho Price* (i) | Wrong/Defective Returns Price (i) | MRP* (i) | Inventory* | SKU
// (catalog-price-table.png, catalog-price-table-errors.png). Horizontally scrollable, one row per size.
import { EMPTY_PRICE_ROW, type PriceRow } from './draftStore';
import { mandatoryMessage } from './fields';
import { borderFor, ErrorText, Info, INPUT_BOX } from './FormBits';
import { PRICE_COLUMNS, suggestWdrp } from './pricing';

const digits = (v: string) => v.replace(/[^\d]/g, '');

export function PriceTable({
  sizes,
  prices,
  onChange,
  showErrors,
}: {
  sizes: string[];
  prices: Record<string, PriceRow>;
  onChange: (size: string, patch: Partial<PriceRow>) => void;
  showErrors: boolean;
}) {
  return (
    <div className="mt-3 overflow-x-auto border border-solid border-tertiary-border" data-testid="priceTable">
      <table className="w-max border-collapse font-body text-lg leading-5 text-primary-text">
        <thead>
          <tr className="h-16 bg-tertiary-bg text-left align-bottom text-base leading-4">
            <th className="w-28 px-3 pb-2.5 font-normal">Size</th>
            {PRICE_COLUMNS.map((c) => (
              <th key={c.key} className="w-40 border-0 border-l border-solid border-white px-3 pb-2.5 font-normal">
                {c.label}
                {c.mandatory && '*'}
                {c.info && (
                  <span className="ml-1.5 inline-flex align-[-3px]">
                    <Info text={c.info} />
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => {
            const row = prices[size] ?? EMPTY_PRICE_ROW;
            const price = Number(row.meeshoPrice);
            const suggested = row.meeshoPrice && !row.wdrp ? String(suggestWdrp(price)) : '';
            return (
              <tr key={size} className="align-top">
                <td className="px-3 pt-9.5 pb-9.5">
                  <span className="flex h-10 items-center text-base">{size}</span>
                </td>
                {PRICE_COLUMNS.map((c) => {
                  const value = c.key === 'wdrp' ? row.wdrp || suggested : row[c.key];
                  const error = showErrors && c.mandatory && !row[c.key].trim();
                  return (
                    <td key={c.key} className="border-0 border-l border-solid border-tertiary-border px-2.5 pt-9.5 pb-9.5">
                      <div className="relative w-35">
                        <input
                          type="text"
                          inputMode={c.key === 'sku' ? 'text' : 'numeric'}
                          aria-label={c.label}
                          value={value}
                          onChange={(e) => onChange(size, { [c.key]: c.key === 'sku' ? e.target.value : digits(e.target.value) })}
                          className={`${INPUT_BOX} ${borderFor(error)} h-10 px-4`}
                        />
                        {c.key === 'wdrp' && suggested && (
                          <span className="pointer-events-none absolute top-1/2 left-11.5 w-23 -translate-y-1/2 font-body text-sm leading-3.5 text-tertiary-text">
                            Suggested based on return savings
                          </span>
                        )}
                      </div>
                      {error && <ErrorText>{mandatoryMessage(c.label)}</ErrorText>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
