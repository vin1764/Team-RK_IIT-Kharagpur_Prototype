// LW-6 entry points (Home banner, sidebar item, pinned notice): who sees them and what the banner says.
// Reads the same views as the Factory Launch tab (useLaunchView) and Manage Pricing (usePriceHold).
import { eligibility, productTypeName } from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { useMakerProductType } from '../../../store/makerProduct';
import { usePersona } from '../../../store/onboarding';
import { usePriceHold } from '../manage-pricing/priceHold';
import { bannerModel } from './entry';
import { useLaunchView } from './useLaunchView';

/** Sidebar item and pinned notice: C2M on and the maker passed the seller-type + GST/Udyam checks. */
export function useFlEligible(): boolean {
  const record = usePersona();
  const c2m = useDemo((s) => s.c2m);
  const e = eligibility({
    taxId: record.taxId,
    businessType: record.businessType,
    gstNatureOfBusiness: record.gstNatureOfBusiness,
    udyamMajorActivity: record.udyam?.majorActivity ?? null,
  });
  return c2m && e.status === 'eligible';
}

export function useLaunchEntry() {
  const v = useLaunchView();
  const hold = usePriceHold();
  const maker = useMakerProductType();
  const c2m = useDemo((s) => s.c2m);
  const row = v.rows.find((r) => r.typeId === v.ownType);
  const model = bannerModel({
    c2m,
    eligibility: v.eligibility,
    // a live listing tells us too (the bot recognised the product)
    told: maker.told || !!v.listing,
    hasBook: v.hasBook && !!row,
    phase: v.phase,
    listed: !!v.listing,
    priceStatus: hold?.status ?? v.priceStatus,
    committed: !!v.commit,
    slotRemoved: !!v.commit && !!hold?.slotRemoved,
  });
  /** what the maker makes, for the copy: the type's name, or the category leaf they picked */
  const productName = v.ownType ? productTypeName(v.ownType) : (maker.choice?.categoryPath.at(-1) ?? null);
  return { model, view: v, row, hold, productName };
}
