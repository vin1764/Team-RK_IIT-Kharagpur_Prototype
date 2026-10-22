// The price never blocks listing (team spec): the maker can list at any positive price and go live. The price check
// only decides Factory Launch eligibility, and that answer is rationed so the hidden price cap can't be found by
// typing prices one after another (anti-probing):
//   · the take-home and break-even maths follow the price live (they are the maker's own numbers);
//   · below break-even is known live too (break-even is his own number): a red "You'd lose ₹Z per order" warning,
//     and such a price never qualifies, so it needs no check;
//   · the bot's own list price (the cell still the bot's; also after the Self-ship / Pack Point switch) shows its
//     Factory Launch status free;
//   · any other price shows its status only after "Check price", at most MAX_PRICE_CHECKS times a day per product
//     (demo day; per persona + product type). A price on screen that differs from the last checked one says
//     "Price changed · Check price…" rather than showing a stale answer.
// Pure functions only: the status comes from the engine (checkListingPrice: Qualifies / not, never B).
import { checkListingPrice, takeHomeAt, type CostStack, type PriceStatus, type ProductTypeId } from '../../../engine/ui';

/** "Check price" clicks allowed per product per demo day (team spec). */
export const MAX_PRICE_CHECKS = 3;

/** One product's check record: how many checks were used on `day`, and the last price checked (with its break-even). */
export interface PriceCheckEntry {
  day: number;
  used: number;
  last: { price: number; breakEven: number } | null;
}

/** Checks used on `day` (a record from another demo day counts as none used). */
export const checksUsed = (e: PriceCheckEntry | undefined, day: number) => (e && e.day === day ? e.used : 0);
export const checksLeft = (e: PriceCheckEntry | undefined, day: number) => Math.max(0, MAX_PRICE_CHECKS - checksUsed(e, day));

/** A "Check price" click: the new record, or null when today's checks are used up (the 4th click is refused). */
export function applyCheck(e: PriceCheckEntry | undefined, day: number, price: number, breakEven: number): PriceCheckEntry | null {
  const used = checksUsed(e, day);
  if (used >= MAX_PRICE_CHECKS) return null;
  return { day, used: used + 1, last: { price, breakEven } };
}

/**
 * The loss per order at a price below break-even, in whole rupees: the engine's take-home at that price (negative),
 * rounded UP to the next rupee so the loss is never understated (the same direction as break-even, which rounds up).
 * ₹120 on Jasmeet's ₹133 break-even: take-home −₹11.71 → "You'd lose ₹12 per order". Null when nothing is lost.
 */
export function lossPerOrder(price: number, stack: CostStack): number | null {
  const take = takeHomeAt(price, stack);
  if (take >= 0) return null;
  return Math.max(1, Math.ceil(Math.round(-take * 100) / 100));
}

/**
 *   none       no list price yet (or no making cost / margin)
 *   belowCost  below break-even: red loss warning; never qualifies (known live, no check)
 *   qualifies  checked (or the bot's price): green "Qualifies for Factory Launch Week at this price"
 *   aboveCap   checked (or the bot's price): yellow "Lists normally on Meesho · not eligible for Factory Launch…"
 *   stale      a typed price not checked yet: "Price changed · Check price to see Factory Launch status"
 */
export type LaunchCheckState = 'none' | 'belowCost' | 'qualifies' | 'aboveCap' | 'stale';

/** What the go-live checklist's (non-blocking) Factory Launch line says. */
export type LaunchLine = 'qualifies' | 'notEligible' | 'unchecked';

export interface LaunchCheckView {
  state: LaunchCheckState;
  /** whole rupees lost per order (belowCost only) */
  loss: number | null;
  /** the price on screen is the bot's own list price (status shown free) */
  botPrice: boolean;
  /** the price on screen is the last one the maker checked */
  checked: boolean;
  checksLeft: number;
  /** "Check price" is offered (a typed price whose status isn't known) */
  needsCheck: boolean;
  /** …and a check is left today */
  canCheck: boolean;
  /** the go-live checklist line; null without a price */
  line: LaunchLine | null;
}

export interface LaunchCheckInput {
  type: ProductTypeId | null;
  price: number | null;
  stack: CostStack | null;
  entry: PriceCheckEntry | undefined;
  day: number;
  /** the price cell is still the bot's (not typed by the maker): its list price shows its status free */
  botOwned: boolean;
}

export function launchCheckView(i: LaunchCheckInput): LaunchCheckView {
  const left = checksLeft(i.entry, i.day);
  const base = { loss: null, botPrice: false, checked: false, checksLeft: left, needsCheck: false, canCheck: false };
  if (!i.type || !i.stack || !i.price || i.price <= 0) return { ...base, state: 'none', line: null };
  const { breakEven, listPrice } = i.stack;
  // The bot's own price: the cell is the bot's and holds its list price (also after the fulfilment switch). A price
  // the maker types needs a check, even when it equals the bot's (he types it; "Use ₹… again" hands it back free).
  const botPrice = i.botOwned && i.price === listPrice;
  const last = i.entry?.last;
  const checked = !!last && last.price === i.price && last.breakEven === breakEven;
  if (i.price < breakEven) return { ...base, botPrice, checked, state: 'belowCost', loss: lossPerOrder(i.price, i.stack), line: 'notEligible' };
  if (botPrice || checked) {
    const status: PriceStatus = checkListingPrice(i.type, i.price, breakEven);
    // At or above break-even the engine says qualifies or aboveCap.
    const state = status === 'qualifies' ? 'qualifies' : 'aboveCap';
    return { ...base, botPrice, checked, state, line: state === 'qualifies' ? 'qualifies' : 'notEligible' };
  }
  return { ...base, state: 'stale', needsCheck: true, canCheck: left > 0, line: 'unchecked' };
}

/** The status chip in the full form's price table, from the same view (never live for a typed price). */
export const chipStatus = (v: LaunchCheckView): PriceStatus | null =>
  v.state === 'qualifies' || v.state === 'aboveCap' || v.state === 'belowCost' ? v.state : null;
