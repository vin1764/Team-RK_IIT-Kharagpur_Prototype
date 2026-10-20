// Price table helpers for Add Product Details.
import type { PriceRow } from './draftStore';

/**
 * Suggested Wrong/Defective Returns Price (WDRP) for a Meesho Price.
 *
 * ASSUMPTION — to confirm with the team: the only data point captured is
 * catalog-price-table-errors.png, where Meesho Price 350 shows "332 · Suggested based on return
 * savings". floor(350 × 0.95) = 332 reproduces it, so we use a flat 5 % below Meesho Price, rounded
 * down. The real rule may differ by category or price band.
 */
export function suggestWdrp(meeshoPrice: number): number {
  return Math.floor(meeshoPrice * 0.95);
}

export interface PriceColumn {
  key: keyof PriceRow;
  label: string;
  mandatory: boolean;
  /** (i) icon; string = tooltip text, true = icon only (tooltip copy not captured). */
  info?: string | true;
}

export const PRICE_COLUMNS: PriceColumn[] = [
  {
    key: 'meeshoPrice',
    label: 'Meesho Price',
    mandatory: true,
    // Verbatim from catalog-price-table.png.
    info: 'This is the normal/regular price at which you sell on Meesho. This price shall be lower than the Maximum Retail Price (MRP) of the Product.',
  },
  { key: 'wdrp', label: 'Wrong/Defective Returns Price', mandatory: false, info: true },
  { key: 'mrp', label: 'MRP', mandatory: true, info: true },
  { key: 'inventory', label: 'Inventory', mandatory: true },
  // Only "SK…" is visible at the cut edge of the screenshots.
  { key: 'sku', label: 'SKU', mandatory: false },
];

/** Keys of mandatory price cells left empty in a row. */
export function missingPrices(row: PriceRow | undefined): (keyof PriceRow)[] {
  return PRICE_COLUMNS.filter((c) => c.mandatory && !(row?.[c.key] ?? '').trim()).map((c) => c.key);
}
