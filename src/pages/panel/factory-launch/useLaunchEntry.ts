// LW-6 entry points (Home banner, sidebar item, pinned notice) and the LW-4 eligibility drawer: who sees them and what
// they say. Factory Launch is open to every seller whose product is in the launch's category (no seller-type or
// GST/Udyam gate: those only give the "Factory verified" badge). Reads the same views as the Factory Launch tab
// (useLaunchView) and Manage Pricing (usePriceHold).
import { checkListingPrice, productTypeName, type PriceStatus, type ProductTypeId } from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { useMakerProductType, type MakerProduct } from '../../../store/makerProduct';
import { usePersona } from '../../../store/onboarding';
import { priceCheckKey, usePriceChecks } from '../../../store/priceChecks';
import type { PriceCheckEntry } from '../catalog/launchCheck';
import { usePriceHold } from '../manage-pricing/priceHold';
import { bannerModel, drawerModel } from './entry';
import { LAUNCH } from './launch';
import { useLaunchView } from './useLaunchView';

/**
 * The seller's product is in this launch's category: a live launch listing; else what he told us (its product type,
 * or the category he picked); before he tells us, the category we know him by (his seeded product's type, the one the
 * outreach invited him for). Pure.
 */
export function inLaunchCategory(listed: boolean, maker: Pick<MakerProduct, 'told' | 'type' | 'choice'>, seeded: ProductTypeId | null): boolean {
  if (listed) return true;
  if (maker.told) return maker.type ? LAUNCH.productTypes.includes(maker.type) : maker.choice?.categoryPath[0] === LAUNCH.category;
  return seeded !== null && LAUNCH.productTypes.includes(seeded);
}

/**
 * The maker's last "Check price" for a product (cost check on the finish screen, or the bot's Price screen: one
 * shared record per persona + type) and its Factory Launch status, from the engine (never B). Null without a check.
 */
export function lastCheckStatus(type: ProductTypeId | null, entry: PriceCheckEntry | undefined): { price: number; status: PriceStatus } | null {
  const last = entry?.last;
  if (!type || !last) return null;
  try {
    return { price: last.price, status: checkListingPrice(type, last.price, last.breakEven) };
  } catch {
    // a product type the launch has no price data for: no status
    return null;
  }
}

export function useLaunchEntry() {
  const record = usePersona();
  const v = useLaunchView();
  const hold = usePriceHold();
  const maker = useMakerProductType();
  const c2m = useDemo((s) => s.c2m);
  const row = v.rows.find((r) => r.typeId === v.ownType);
  const entry = usePriceChecks((s) => (v.ownType ? s.entries[priceCheckKey(v.persona, v.ownType)] : undefined));
  // Before listing, the price row follows his last "Check price"; once listed, the listing's price (as edited).
  const checked = v.listing ? null : lastCheckStatus(v.ownType, entry);
  const inLaunch = inLaunchCategory(!!v.listing, maker, record.product?.type ?? null);
  const input = {
    // a live listing tells us too (the bot recognised the product)
    told: maker.told || !!v.listing,
    hasBook: v.hasBook && !!row,
    phase: v.phase,
    listed: !!v.listing,
    priceStatus: hold?.status ?? v.priceStatus ?? checked?.status ?? null,
    committed: !!v.commit,
  };
  const model = bannerModel({ ...input, c2m, inLaunch, slotRemoved: !!v.commit && !!hold?.slotRemoved });
  const drawer = drawerModel(input);
  /** what the seller sells, for the copy: the type's name, or the category leaf they picked */
  const productName = v.ownType ? productTypeName(v.ownType) : (maker.choice?.categoryPath.at(-1) ?? null);
  return { model, drawer, checked, inLaunch: c2m && inLaunch, view: v, row, hold, productName };
}

/** Sidebar item, pinned notice and the drawer: C2M on and the seller's product in the launch's category. */
export function useFlVisible(): boolean {
  return useLaunchEntry().inLaunch;
}
