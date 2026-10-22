// Which product type "Create from photos" lists. Normally the maker's own (useBotProductType); a listing started from
// Inventory → "What to make instead" → "List it with photos" carries its own type in the draft (typeOverride), so the
// bot pre-selects that type for this one listing only (the maker's product choice is untouched).
import type { ProductTypeId } from '../../../engine/ui';
import { useBotProductType } from '../../../store/makerProduct';
import { botTypeFor } from './bot';
import { useDraft } from './draftStore';

/** Query param on Add Single Catalog ?mode=photos that starts a listing for this product type. */
export const TYPE_PARAM = 'type';

/** A product type the bot has data for, from a URL param or a saved draft; null otherwise. */
export function listableType(v: string | null | undefined): ProductTypeId | null {
  return v && botTypeFor(v as ProductTypeId) ? (v as ProductTypeId) : null;
}

/** A fresh draft for a listing of `type` (the photo modal then starts with that type's photo). */
export function startListingFor(type: ProductTypeId) {
  const d = useDraft.getState();
  d.reset();
  d.setBot({ typeOverride: type });
}

/** The type this draft lists: its own type (from "What to make instead"), else the maker's product. */
export function useListingType(): ProductTypeId | null {
  const own = useBotProductType();
  const override = listableType(useDraft((s) => s.typeOverride));
  return override ?? own;
}
