// Size | Meesho Price* (i) | Wrong/Defective Returns Price (i) | MRP* (i) | Inventory* | SKU
// (catalog-price-table.png, catalog-price-table-errors.png). Horizontally scrollable, one row per size.
// "Create from photos" (LB-5/LB-6, doc p.15 mock-up) keeps every column and adds Making cost, Take-home and
// Status, in the mock-up's order: Size | Making cost | Meesho Price | Take-home | Inventory | Status | WDRP | MRP | SKU.
import type { ReactNode } from 'react';
import { EMPTY_PRICE_ROW, type PriceRow } from './draftStore';
import { BotTag, YouTag } from './DetailsForm';
import { mandatoryMessage } from './fields';
import { borderFor, ErrorText, Info, INPUT_BOX } from './FormBits';
import { PRICE_COLUMNS, suggestWdrp, type PriceColumn } from './pricing';

const digits = (v: string) => v.replace(/[^\d]/g, '');

/** Bot-mode additions; every value is computed by the page from the engine. */
export interface BotPriceView {
  label: (key: string, fallback: string) => string;
  info: (c: PriceColumn) => string | true | undefined;
  makingCost: ReactNode;
  takeHome: (row: PriceRow) => ReactNode;
  status: (row: PriceRow) => ReactNode;
  filled: Set<string>;
  youEnter: Set<string>;
  tagBot: string;
  tagYou: string;
  pricePlaceholder: string;
  invSuffix: string;
  wdrpSuggested: string;
}

type Display = { key: 'makingCost' | 'takeHome' | 'status'; width: string };
const BOT_ORDER: Array<keyof PriceRow | Display['key']> = ['makingCost', 'meeshoPrice', 'takeHome', 'inventory', 'status', 'wdrp', 'mrp', 'sku'];
const DISPLAY_WIDTH: Record<Display['key'], string> = { makingCost: 'w-24', takeHome: 'w-28', status: 'w-32' };

export function PriceTable({
  sizes,
  prices,
  onChange,
  showErrors,
  bot,
}: {
  sizes: string[];
  prices: Record<string, PriceRow>;
  onChange: (size: string, patch: Partial<PriceRow>) => void;
  showErrors: boolean;
  bot?: BotPriceView;
}) {
  const byKey = Object.fromEntries(PRICE_COLUMNS.map((c) => [c.key, c])) as Record<keyof PriceRow, PriceColumn>;
  const order = bot ? BOT_ORDER : PRICE_COLUMNS.map((c) => c.key);
  const isDisplay = (k: string): k is Display['key'] => k in DISPLAY_WIDTH;

  return (
    <div className="mt-3 overflow-x-auto border border-solid border-tertiary-border" data-testid="priceTable" data-c2m={bot ? 'LB-6' : undefined}>
      <table className="w-max border-collapse font-body text-lg leading-5 text-primary-text">
        <thead>
          <tr className="h-16 bg-tertiary-bg text-left align-bottom text-base leading-4">
            <th className={`${bot ? 'w-24' : 'w-28'} px-3 pb-2.5 font-normal`}>{bot ? bot.label('size', 'Size') : 'Size'}</th>
            {order.map((k) => {
              if (isDisplay(k))
                return (
                  <th key={k} className={`${DISPLAY_WIDTH[k]} border-0 border-l border-solid border-white px-3 pb-2.5 font-normal`} data-c2m="LB-6">
                    {bot!.label(k, k)}
                  </th>
                );
              const c = byKey[k];
              const info = bot ? bot.info(c) : c.info;
              return (
                <th key={c.key} className="w-40 border-0 border-l border-solid border-white px-3 pb-2.5 font-normal">
                  {bot ? bot.label(c.key, c.label) : c.label}
                  {c.mandatory && '*'}
                  {info && (
                    <span className="ml-1.5 inline-flex align-[-3px]">
                      <Info text={info} />
                    </span>
                  )}
                </th>
              );
            })}
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
                {order.map((k) => {
                  if (isDisplay(k))
                    return (
                      <td key={k} className="border-0 border-l border-solid border-tertiary-border px-3 pt-9.5 pb-9.5" data-cell={k} data-c2m="LB-6">
                        <div className="flex min-h-10 items-center">{k === 'makingCost' ? bot!.makingCost : k === 'takeHome' ? bot!.takeHome(row) : bot!.status(row)}</div>
                      </td>
                    );
                  const c = byKey[k];
                  const value = c.key === 'wdrp' ? row.wdrp || suggested : row[c.key];
                  const error = showErrors && c.mandatory && !row[c.key].trim();
                  const isBot = !!bot?.filled.has(c.key);
                  const isYou = !!bot?.youEnter.has(c.key);
                  return (
                    <td
                      key={c.key}
                      className="border-0 border-l border-solid border-tertiary-border px-2.5 pt-9.5 pb-9.5"
                      data-field={bot ? c.key : undefined}
                      data-bot-filled={isBot ? 'true' : undefined}
                      data-you-enter={isYou ? 'true' : undefined}
                    >
                      <div className="relative w-35">
                        <input
                          type="text"
                          inputMode={c.key === 'sku' ? 'text' : 'numeric'}
                          aria-label={bot ? bot.label(c.key, c.label) : c.label}
                          value={value}
                          placeholder={bot && c.key === 'meeshoPrice' && isBot ? bot.pricePlaceholder : undefined}
                          onChange={(e) => onChange(size, { [c.key]: c.key === 'sku' ? e.target.value : digits(e.target.value) })}
                          className={`${INPUT_BOX} ${isBot ? 'border-brand-secondary-border bg-brand-secondary-bg' : borderFor(error)} h-10 px-4`}
                        />
                        {c.key === 'wdrp' && suggested && (
                          <span className="pointer-events-none absolute top-1/2 left-11.5 w-23 -translate-y-1/2 font-body text-sm leading-3.5 text-tertiary-text">
                            {bot ? bot.wdrpSuggested : 'Suggested based on return savings'}
                          </span>
                        )}
                        {bot && c.key === 'inventory' && isBot && value && (
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-body text-lg leading-5 text-secondary-text">{bot.invSuffix}</span>
                        )}
                      </div>
                      {bot && (isBot || isYou) && <div className="mt-1.5">{isBot ? <BotTag>{bot.tagBot}</BotTag> : <YouTag>{bot.tagYou}</YouTag>}</div>}
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
