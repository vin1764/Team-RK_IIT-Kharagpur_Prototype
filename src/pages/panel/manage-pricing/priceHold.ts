// Manage Pricing → Price position (PI-2) and the auto price-hold (PI-3) for the current persona.
// Status and third come from src/engine/ui.ts (checkListingPrice, listingPricePosition); the
// benchmark itself never reaches this file. The go-live listing and the launch history keep their
// price; an edit lives in src/store/priceEdits.ts and only changes what these screens show, plus
// the "slot removed" state on the Factory Launch views.
import { useMemo } from 'react';
import calendar from '../../../data/calendar.json';
import launch from '../../../data/launch.json';
import { checkListingPrice, eligibility, listingPricePosition, type PricePosition, type PriceStatus, type ProductTypeId } from '../../../engine/ui';
import { useDemo, type Persona } from '../../../store/demo';
import { usePersona } from '../../../store/onboarding';
import { usePriceEdits, type PriceEdit } from '../../../store/priceEdits';
import { useScriptedCommit, useScriptedListing } from '../../../store/timeline';

/**
 * The scripted D40 price edit (plan §10 step 7: "D40 · Raises price to ₹165"; plan §8 priceCheck /
 * pricePosition: ₹165 doesn't qualify, sits in the middle third). Like the scripted D5 commit, an
 * interactive edit always wins. Seeded in src/data/launch.json (priceEdit).
 */
export const SCRIPTED_PRICE_EDIT: { persona: Persona; price: number; day: number } = {
  persona: launch.priceEdit.persona as Persona,
  price: launch.priceEdit.price,
  day: calendar.jumps.priceEdit,
};

export type EffectiveEdit = PriceEdit & { scripted: boolean };

/** The edit that counts on `day`: an interactive one saved on or before it, else (Jasmeet, from D40) the scripted one. */
export function effectivePriceEdit(real: PriceEdit | undefined, day: number, persona: Persona): EffectiveEdit | null {
  if (real && real.day <= day) return { ...real, scripted: false };
  if (persona === SCRIPTED_PRICE_EDIT.persona && day >= SCRIPTED_PRICE_EDIT.day) {
    return { price: SCRIPTED_PRICE_EDIT.price, day: SCRIPTED_PRICE_EDIT.day, scripted: true };
  }
  return null;
}

export interface PriceHoldView {
  typeId: ProductTypeId;
  name: string;
  listingId: string;
  breakEven: number;
  /** the go-live price */
  originalPrice: number;
  /** the price now (edited or not) */
  price: number;
  edit: EffectiveEdit | null;
  status: PriceStatus;
  position: PricePosition;
  /** the maker holds a Factory Launch slot for this listing (a commit) */
  hadSlot: boolean;
  /** PI-3: the edited price no longer qualifies, so the slot is removed */
  slotRemoved: boolean;
}

/** Pure: the price-position view from a listing, its commit and the edit. */
export function priceHoldView(
  listing: { id: string; typeId: ProductTypeId; name: string; price: number; breakEven: number },
  hasCommit: boolean,
  edit: EffectiveEdit | null,
): PriceHoldView {
  const price = edit?.price ?? listing.price;
  const status = checkListingPrice(listing.typeId, price, listing.breakEven);
  return {
    typeId: listing.typeId,
    name: listing.name,
    listingId: listing.id,
    breakEven: listing.breakEven,
    originalPrice: listing.price,
    price,
    edit,
    status,
    position: listingPricePosition(listing.typeId, price),
    hadSlot: hasCommit,
    slotRemoved: hasCommit && edit !== null && status !== 'qualifies',
  };
}

/**
 * The current persona's Factory Launch listing on Manage Pricing, or null when there is none or the
 * maker failed the seller-type / GST-Udyam checks (doc p.7: resellers don't see the tab).
 */
export function usePriceHold(): PriceHoldView | null {
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const record = usePersona();
  const listing = useScriptedListing();
  const commit = useScriptedCommit();
  const real = usePriceEdits((s) => s.edits[persona]);
  // Plain mode ("Today vs ours"): no Price position tab and no price-hold.
  const c2m = useDemo((s) => s.c2m);
  return useMemo(() => {
    if (!c2m || !listing) return null;
    const elig = eligibility({
      taxId: record.taxId,
      businessType: record.businessType,
      gstNatureOfBusiness: record.gstNatureOfBusiness,
      udyamMajorActivity: record.udyam?.majorActivity ?? null,
    });
    if (elig.status === 'notEligible') return null;
    try {
      checkListingPrice(listing.typeId, listing.price, listing.breakEven);
    } catch {
      return null; // no like-for-like comparables seeded for this type
    }
    const hasCommit = !!commit && commit.typeId === listing.typeId;
    return priceHoldView(listing, hasCommit, effectivePriceEdit(real, day, persona));
  }, [c2m, listing, commit, real, day, persona, record]);
}

/** The weekly limit (doc PI-2: "price changes allowed once a week"): after a change on day d, the next change is
 *  allowed from day d + 7. Null when the price can be changed today. */
export const PRICE_CHANGE_GAP_DAYS = 7;
export function nextPriceChangeDay(edit: { day: number } | null, day: number): number | null {
  if (!edit || edit.day > day) return null;
  const next = edit.day + PRICE_CHANGE_GAP_DAYS;
  return day < next ? next : null;
}
