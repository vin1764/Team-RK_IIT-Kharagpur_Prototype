// LW-6 · Promote the launch to sellers: the Home banner, the sidebar item and the pinned notice. Factory Launch is open
// to every seller whose product is in the launch's category: entry is by price (≤ the hidden cap, checked as
// Qualifies / not), a live listing and committed stock. The seller-type + GST/Udyam checks are not a gate; they only
// decide the "Factory verified" badge (eligibility() status 'eligible'). Pure model here; the hook reads the same data
// as the Factory Launch tab (useLaunchView) and the price-hold (usePriceHold), so the banner never disagrees with it.
// LW-4 · "Check my eligibility" (finish screen, Home banner, pinned notice) opens one drawer (EligibilityDrawer.tsx)
// built from the same three-step checklist (drawerModel), so the banner's "n of 3 done" and the drawer always agree.
import type { PriceStatus, ProductTypeId } from '../../../engine/ui';
import type { LaunchPhase } from './launch';

/**
 *   choose      in the launch's category, hasn't told us the product yet → category-level line, "Tell us what you sell"
 *   noBook      told us a product in the category with no open order book → slim note while commitments are open
 *   join        product has an order book, not committed, commitments open → checklist (0–2 of 3); when the
 *               listing is live at a price that doesn't qualify (priceNotEligible) → "Not eligible at this price ·
 *               lower your price to join" → Price position (the listing itself stays live: the price never blocks)
 *   closed      commitments closed and never committed → slim, dismissible
 *   in          committed, before the live week → "You're in … · stock ready by … · live …"
 *   live        committed, live week → "Live now · n orders today"
 *   ended       committed, after the live week → slim "Launch results" link
 *   slotRemoved committed, then a price edit that no longer qualifies (PI-3) → red
 */
export type BannerState = 'choose' | 'noBook' | 'join' | 'closed' | 'in' | 'live' | 'ended' | 'slotRemoved';

export type ItemKey = 'price' | 'listed' | 'stock';
/** Where an open item's button goes. */
export type ItemAction = 'tellUs' | 'createFromPhotos' | 'pricePosition' | 'orderBook' | null;

export interface ChecklistItem {
  key: ItemKey;
  done: boolean;
  action: ItemAction;
}

export interface BannerInput {
  c2m: boolean;
  /** the seller's product (or, before he tells us, his known category) is in this launch's category */
  inLaunch: boolean;
  /** the seller told us what he sells (or the scripted story says so) */
  told: boolean;
  /** the seller's product type has an order book in this launch */
  hasBook: boolean;
  phase: LaunchPhase;
  /** a live listing of the launch's product type */
  listed: boolean;
  /**
   * the price's Factory Launch status: a listing's (the edited price, if any), else the seller's last "Check price"
   * (cost check or the bot's Price screen); null when neither
   */
  priceStatus: PriceStatus | null;
  committed: boolean;
  slotRemoved: boolean;
}

export interface BannerModel {
  state: BannerState;
  items: ChecklistItem[];
  done: number;
  total: number;
  /** the next step (first open item with a button) */
  next: ChecklistItem | null;
  /** × allowed: only once the seller has committed or the window has closed */
  dismissible: boolean;
  /** a full banner whose "Check my eligibility" opens the eligibility drawer (the checklist) */
  hasChecklist: boolean;
  /** listed, not committed, and the listing's price (edited or not) doesn't qualify: no slot until it's lowered */
  priceNotEligible: boolean;
}

/**
 * The checklist, three steps for every seller: price qualifies (his listing's price, or his last "Check price"),
 * product listed ("Tell us what you sell" while the product is unknown, then "List this product"), stock committed
 * ("Go to order book" while commitments are open for his product type).
 */
export function checklist(i: Pick<BannerInput, 'told' | 'hasBook' | 'phase' | 'listed' | 'priceStatus' | 'committed'>): ChecklistItem[] {
  const priceOk = i.priceStatus === 'qualifies';
  return [
    // A listed price that doesn't qualify → Price position (lower it); before listing, the price is checked in the cost
    // check or on the bot's Price screen, so the row has no button of its own.
    { key: 'price', done: priceOk, action: !priceOk && i.listed ? 'pricePosition' : null },
    { key: 'listed', done: i.listed, action: i.listed ? null : i.told ? 'createFromPhotos' : 'tellUs' },
    { key: 'stock', done: i.committed, action: i.committed || i.phase !== 'open' || !i.hasBook ? null : 'orderBook' },
  ];
}

/** The next step: the first open item with a button (else the first open item). */
export const nextItem = (items: ChecklistItem[]) => items.find((x) => !x.done && x.action) ?? items.find((x) => !x.done) ?? null;

/** The eligibility drawer (LW-4), opened by every "Check my eligibility": the same three steps for every seller. */
export interface DrawerModel {
  items: ChecklistItem[];
  done: number;
  total: number;
  next: ChecklistItem | null;
}

export function drawerModel(i: Pick<BannerInput, 'told' | 'hasBook' | 'phase' | 'listed' | 'priceStatus' | 'committed'>): DrawerModel {
  const items = checklist(i);
  return { items, done: items.filter((x) => x.done).length, total: items.length, next: nextItem(items) };
}

/** The banner for this seller on this day, or null (product outside the launch, plain mode, or nothing left to say). */
export function bannerModel(i: BannerInput): BannerModel | null {
  if (!i.c2m || !i.inLaunch) return null;
  const items = checklist(i);
  const done = items.filter((x) => x.done).length;
  const priceNotEligible = i.listed && i.priceStatus !== null && i.priceStatus !== 'qualifies' && !i.committed;
  const base = { items, done, total: items.length, next: nextItem(items), priceNotEligible };
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
