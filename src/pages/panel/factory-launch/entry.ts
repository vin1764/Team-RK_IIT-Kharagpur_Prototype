// LW-6 · Promote the launch to makers: the Home banner, the sidebar item and the pinned notice. Shown only
// to makers who passed the seller-type + GST/Udyam checks (eligibility status 'eligible'); resellers and
// non-factory sellers see Meesho exactly as today. Pure model here; the hook reads the same data as the
// Factory Launch tab (useLaunchView) and the price-hold (usePriceHold), so the banner never disagrees with it.
import type { Eligibility, PriceStatus, ProductTypeId } from '../../../engine/ui';
import type { LaunchPhase } from './launch';

/**
 *   choose      eligible, hasn't told us the product yet → category-level line, "Tell us what you make"
 *   noBook      told us a product with no open order book (Samar's sneakers) → slim note while commitments are open
 *   join        product has an order book, not committed, commitments open → checklist (2 or 3 of 4); when the
 *               listing is live at a price that doesn't qualify (priceNotEligible) → "Not eligible at this price ·
 *               lower your price to join" → Price position (the listing itself stays live: the price never blocks)
 *   closed      commitments closed and never committed → slim, dismissible
 *   in          committed, before the live week → "You're in … · stock ready by … · live …"
 *   live        committed, live week → "Live now · n orders today"
 *   ended       committed, after the live week → slim "Launch results" link
 *   slotRemoved committed, then a price edit that no longer qualifies (PI-3) → red
 */
export type BannerState = 'choose' | 'noBook' | 'join' | 'closed' | 'in' | 'live' | 'ended' | 'slotRemoved';

export type ItemKey = 'product' | 'manufacturer' | 'records' | 'price' | 'stock';
/** Where an open item's button goes. */
export type ItemAction = 'tellUs' | 'createFromPhotos' | 'pricePosition' | 'orderBook' | null;

export interface ChecklistItem {
  key: ItemKey;
  done: boolean;
  action: ItemAction;
}

export interface BannerInput {
  c2m: boolean;
  eligibility: Eligibility;
  /** the maker told us what they make (or the scripted story says so) */
  told: boolean;
  /** the maker's product type has an order book in this launch */
  hasBook: boolean;
  phase: LaunchPhase;
  /** a live listing of the launch's product type */
  listed: boolean;
  /** that listing's price check now (the edited price, if any) */
  priceStatus: PriceStatus | null;
  committed: boolean;
  slotRemoved: boolean;
}

export interface BannerModel {
  state: BannerState;
  items: ChecklistItem[];
  done: number;
  total: number;
  /** the first open item */
  next: ChecklistItem | null;
  /** × allowed: only once the maker has committed or the window has closed */
  dismissible: boolean;
  /** a full banner with the checklist behind "Check my eligibility" */
  hasChecklist: boolean;
  /** listed, not committed, and the listing's price (edited or not) doesn't qualify: no slot until it's lowered */
  priceNotEligible: boolean;
}

/** The checklist: "Tell us what you make" first while the product is unknown, then the four launch checks. */
export function checklist(i: Pick<BannerInput, 'eligibility' | 'told' | 'phase' | 'listed' | 'priceStatus' | 'committed'>): ChecklistItem[] {
  const failed = i.eligibility.failedChecks;
  const items: ChecklistItem[] = [];
  if (!i.told) items.push({ key: 'product', done: false, action: 'tellUs' });
  // Manufacturer = the records say manufacturing (GST nature of business + Udyam); records agree = the
  // business type the maker declared matches them (FO-7: "matched to seller type").
  items.push({ key: 'manufacturer', done: !failed.some((c) => c === 'gstin' || c === 'gstNature' || c === 'udyam'), action: null });
  items.push({ key: 'records', done: !failed.some((c) => c === 'gstin' || c === 'sellerType'), action: null });
  const priceOk = i.priceStatus === 'qualifies';
  items.push({ key: 'price', done: priceOk, action: priceOk ? null : i.listed ? 'pricePosition' : 'createFromPhotos' });
  items.push({ key: 'stock', done: i.committed, action: i.committed || i.phase !== 'open' ? null : 'orderBook' });
  return items;
}

/** The banner for this maker on this day, or null (not eligible, plain mode, or nothing left to say). */
export function bannerModel(i: BannerInput): BannerModel | null {
  if (!i.c2m || i.eligibility.status !== 'eligible') return null;
  const items = checklist(i);
  const done = items.filter((x) => x.done).length;
  const priceNotEligible = i.listed && i.priceStatus !== null && i.priceStatus !== 'qualifies' && !i.committed;
  const base = { items, done, total: items.length, next: items.find((x) => !x.done) ?? null, priceNotEligible };
  const open = i.phase === 'open';
  const make = (state: BannerState, hasChecklist: boolean): BannerModel => ({ ...base, state, hasChecklist, dismissible: i.committed || !open });

  if (!i.told) return open ? make('choose', true) : null;
  // Nothing to commit to for this type, so the note can always be dismissed.
  if (!i.hasBook) return open ? { ...make('noBook', false), dismissible: true } : null;
  if (i.committed && i.slotRemoved) return make('slotRemoved', false);
  if (i.committed && i.phase === 'live') return make('live', false);
  if (i.committed && i.phase === 'ended') return make('ended', false);
  if (i.committed) return make('in', true);
  if (!open) return make('closed', false);
  return make('join', true);
}

/** Whether a product type has an order book in the launch. */
export const inLaunch = (types: ProductTypeId[], type: ProductTypeId | null) => type !== null && types.includes(type);
