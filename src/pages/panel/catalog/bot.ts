// "Create from photos" (LB-3 … LB-10): which fields the listing bot fills, which the maker enters,
// the pre-fill itself, the generated description and the go-live checks. Pure functions only.
// Who fills what = doc pp.15-18 / plan §7. Numbers come from the engine (src/engine/ui.ts) or seed JSON.
import data from '../../../data/botListing.json';
import nodesData from '../../../data/packPointNodes.json';
import { checkListingPrice, clusterForPincode, costStack, demoInputsForType, suggestedLot, takeHomeAt, typeFees, typicalForType, type CostStack, type ProductTypeId, type PriceStatus } from '../../../engine/ui';
import type { T } from '../../../i18n';
import type { PersonaRecord } from '../../../store/onboarding';
import { DEMO_IMAGE, type DraftImage, type DraftReview, type PriceRow } from './draftStore';
import { FIELDS, PACKER_FROM_MANUFACTURER, type FieldDef } from './fields';
import { PRICE_COLUMNS } from './pricing';

export interface BotType {
  categoryPath: string[];
  bot: Record<string, string>;
  demo: Record<string, string>;
  /** the photo offered in the photo modal (a placeholder illustration for the "What to make instead" types) */
  photo?: { id: string; url: string };
}

const TYPES = data.types as unknown as Record<string, BotType>;

/** Bot data for a product type, or null when the bot has nothing for it (Samar, reseller). */
export function botTypeFor(type: ProductTypeId | null | undefined): BotType | null {
  return (type && TYPES[type]) || null;
}

/** The photo the photo modal starts with for a type: its placeholder illustration, else the team's bottle photo. */
export function photoFor(type: ProductTypeId | null | undefined): DraftImage {
  const p = botTypeFor(type)?.photo;
  return p ? { id: p.id, url: p.url, name: DEMO_IMAGE.name } : DEMO_IMAGE;
}

/** Query string that puts Add Single Catalog in "Create from photos" mode. */
export const BOT_QUERY = 'mode=photos';

export const PACK_POINT_PARTNER = data.packPointPartner;
export const MAX_PHOTOS = data.maxPhotos;
/** Images today's form asks for, beside its 31 mandatory fields (the 35-field comparison). */
export const TODAY_IMAGE_SLOTS = data.todayImageSlots;

/** The cleaned (white-background) version of a photo, if one was prepared offline. */
export function cleanedFor(img: DraftImage | undefined): DraftImage | null {
  const url = img && (data.cleanedImages as Record<string, string>)[img.id];
  return img && url ? { ...img, url } : null;
}

/** The four inputs the price table needs that today's form doesn't have (doc p.18). */
export const BOT_INPUTS: FieldDef[] = [
  { id: 'makingCost', label: 'Making cost per unit (₹)', section: 'inventory', kind: 'text', mandatory: true },
  { id: 'marginPct', label: 'Expected margin (%)', section: 'inventory', kind: 'text', mandatory: true },
  { id: 'minRun', label: 'Minimum run (units)', section: 'inventory', kind: 'text', mandatory: true, info: true },
  { id: 'leadTimeDays', label: 'Lead time (days)', section: 'inventory', kind: 'text', mandatory: true, info: true },
];

/** Form fields the bot pre-fills (19 mandatory + Description). */
export const BOT_FORM_FIELDS = [
  'productName', 'genericName', 'type', 'color', 'size', 'netQuantity',
  'productUnit', 'volumeUnit', 'productWeightUnit', 'countryOfOrigin',
  'manufacturerName', 'manufacturerAddress', 'manufacturerPincode',
  'packerName', 'packerAddress', 'packerPincode',
  'importerName', 'importerAddress', 'importerPincode',
  'description',
] as const;
/** Price-table cells the bot pre-fills (Meesho Price and Inventory are mandatory; WDRP isn't). */
export const BOT_PRICE_FIELDS = ['meeshoPrice', 'inventory', 'wdrp'] as const;

/** The 14 values the maker types: 10 of today's fields + the 4 new inputs. */
export const MAKER_FIELDS = [
  'leakProof', 'capacity', 'material', 'addOns', 'length', 'breadth', 'height', 'productWeight', 'netWeight', 'mrp',
  'makingCost', 'marginPct', 'minRun', 'leadTimeDays',
] as const;

/** Today's mandatory fields: the form's plus the price table's (31 for Water Bottles). */
export const MANDATORY_IDS: string[] = [
  ...FIELDS.filter((f) => f.mandatory).map((f) => f.id),
  ...PRICE_COLUMNS.filter((c) => c.mandatory).map((c) => c.key),
];

/** How many of today's mandatory fields are currently bot-filled. */
export const countBotMandatory = (botFilled: Iterable<string>) => {
  const s = new Set(botFilled);
  return MANDATORY_IDS.filter((id) => s.has(id)).length;
};

export type FulfilmentChoice = 'selfShip' | 'packPoint' | 'waitlist' | null;
/** Fee stack mode: Pack Point only for makers who chose it; waitlist and self-ship ship themselves. */
export const stackMode = (choice: FulfilmentChoice, persona: PersonaRecord): 'selfShip' | 'packPoint' =>
  (choice ?? persona.fulfilment) === 'packPoint' ? 'packPoint' : 'selfShip';

export function manufacturerOf(p: PersonaRecord): Record<string, string> {
  const a = p.address;
  return {
    manufacturerName: p.legalName,
    manufacturerAddress: [a.building, a.street, a.city, a.state].join(', '),
    manufacturerPincode: a.pincode,
  };
}

/**
 * Packer rule (doc p.17): self-ship → same as manufacturer; Pack Point → manufacturer if units arrive
 * retail-packed, else the Pack Point partner.
 */
export function packerFor(mode: 'selfShip' | 'packPoint', retailPacked: boolean, p: PersonaRecord) {
  const sameAsManufacturer = mode === 'selfShip' || retailPacked;
  const mfr = manufacturerOf(p);
  const values = sameAsManufacturer
    ? Object.fromEntries(Object.entries(PACKER_FROM_MANUFACTURER).map(([packer, m]) => [packer, mfr[m]!]))
    : { packerName: PACK_POINT_PARTNER.name, packerAddress: PACK_POINT_PARTNER.address, packerPincode: PACK_POINT_PARTNER.pincode };
  return { sameAsManufacturer, values };
}

/** Description written from the filled attributes (doc p.17: "Generated from the filled attributes"). */
export function describeListing(v: Record<string, string>): string {
  const has = (k: string) => (v[k] ?? '').trim();
  const parts: string[] = [];
  if (has('productName')) parts.push(`${has('productName')}.`);
  const facts: string[] = [];
  if (has('material')) facts.push(`Material: ${has('material')}`);
  if (has('capacity')) facts.push(`Capacity: ${has('capacity')} ${has('volumeUnit') || 'L'}`);
  if (has('color')) facts.push(`Colour: ${has('color')}`);
  if (has('leakProof')) facts.push(`Leak proof: ${has('leakProof')}`);
  if (has('type')) facts.push(`Type: ${has('type')}`);
  if (has('addOns') && has('addOns') !== 'None') facts.push(`Comes with: ${has('addOns')}`);
  if (has('productWeight')) facts.push(`Weight: ${has('productWeight')} ${has('productWeightUnit') || 'g'}`);
  if (has('length') && has('breadth') && has('height'))
    facts.push(`Size: ${has('length')} × ${has('breadth')} × ${has('height')} ${has('productUnit') || 'cm'}`);
  if (has('netQuantity')) facts.push(`Pack of ${has('netQuantity')}`);
  if (facts.length) parts.push(`${facts.join('. ')}.`);
  if (has('countryOfOrigin') && has('manufacturerName')) parts.push(`Made in ${has('countryOfOrigin')} by ${has('manufacturerName')}.`);
  return parts.join(' ');
}

export interface Prefill {
  categoryPath: string[];
  values: Record<string, string>;
  botFilled: string[];
  price: Partial<PriceRow>;
  sameAsManufacturer: boolean;
}

/** Everything the bot fills once the photos are recognised. Meesho Price and WDRP follow the cost inputs. */
export function botPrefill(type: ProductTypeId, persona: PersonaRecord, mode: 'selfShip' | 'packPoint', retailPacked: boolean): Prefill {
  const t = botTypeFor(type);
  if (!t) throw new Error(`no bot data for ${type}`);
  const packer = packerFor(mode, retailPacked, persona);
  const values: Record<string, string> = {
    ...t.bot,
    ...manufacturerOf(persona),
    ...packer.values,
    importerName: data.importerNotApplicable.name,
    importerAddress: data.importerNotApplicable.address,
    importerPincode: data.importerNotApplicable.pincode,
  };
  values.description = describeListing(values);
  return {
    categoryPath: t.categoryPath,
    values,
    botFilled: [...BOT_FORM_FIELDS, ...BOT_PRICE_FIELDS],
    // units ≈ 14 days of expected sales; they don't depend on the making cost (only the ₹ at cost does).
    price: { inventory: String(suggestedLot(type, 0).units) },
    sameAsManufacturer: packer.sameAsManufacturer,
  };
}

/**
 * "Fill demo values": every maker field the team gave values for, in one click (team, Phase 3 review) so the demo never
 * stalls. `mrp` is a price-table cell; the rest are form values. The Net Quantity confirmation stays with the maker.
 * Making cost and margin: the persona's own product's, else the type's seeded demo values (casserole ₹220 / 15%).
 * Minimum run and lead time: the type's typical values, else the maker's own (his product's: Jasmeet 100, 5 days).
 * A type with fewer seeded values (casserole, flask) leaves the rest for the maker.
 */
export function demoValues(type: ProductTypeId, persona: PersonaRecord, typical: { minRun: number; leadTimeDays: number } | null): Record<string, string> {
  const t = botTypeFor(type);
  const out: Record<string, string> = { ...(t?.demo ?? {}) };
  const cost = persona.product?.type === type ? persona.product : demoInputsForType(type);
  if (cost) {
    out.makingCost = String(cost.makingCost);
    out.marginPct = String(cost.marginPct);
  }
  const factory = typical ?? (persona.product ? typicalForType(persona.product.type) : null);
  if (factory) {
    out.minRun = String(factory.minRun);
    out.leadTimeDays = String(factory.leadTimeDays);
  }
  return out;
}

/** A number typed in one of the bot inputs, or null when empty / not a number. */
export function numberIn(v: string | undefined): number | null {
  const s = (v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface GoLiveInput {
  hasFrontImage: boolean;
  /** The maker confirmed the bot's details (and none changed since): see isReviewed. */
  reviewed: boolean;
  missingFields: string[];
  missingPrices: string[];
  netQtyConfirmed: boolean;
  inputs: Record<string, string>;
  status: PriceStatus | null;
  inventory: number | null;
}

export interface GoLiveChecks {
  images: boolean;
  details: boolean;
  review: boolean;
  price: boolean;
  lot: boolean;
  all: boolean;
}

/**
 * Go-live checklist (LB-8):
 *  Images  — a Front Image is present (the bot's cleaned cover counts as the Front Image);
 *  Details — every mandatory field and price cell filled, the 4 new inputs filled, Net Quantity confirmed;
 *  Price   — status is "qualifies";
 *  Lot     — inventory > 0 (any number: no cap, no floor, Q19);
 *  Review  — the maker confirmed the bot's details ("Bot details reviewed").
 */
export function goLiveChecks(x: GoLiveInput): GoLiveChecks {
  const inputsOk = BOT_INPUTS.every((f) => {
    const n = numberIn(x.inputs[f.id]);
    return n !== null && (f.id === 'marginPct' ? n >= 0 : n > 0);
  });
  const images = x.hasFrontImage;
  const details = !x.missingFields.length && !x.missingPrices.length && x.netQtyConfirmed && inputsOk;
  const price = x.status === 'qualifies';
  const lot = (x.inventory ?? 0) > 0;
  const review = x.reviewed;
  return { images, details, review, price, lot, all: images && details && review && price && lot };
}

// ── Three short screens (team redesign spec, Phase 3 review 2) ───────────────────────────────────────────────

export type BotStep = 'product' | 'quantity' | 'price';
export const BOT_STEPS: BotStep[] = ['product', 'quantity', 'price'];
export const isBotStep = (s: string | null | undefined): s is BotStep => !!s && (BOT_STEPS as string[]).includes(s);

/** Mandatory fields the bot fills (21) and values the maker adds (14): the "Meesho filled … · you add …" line. */
export const BOT_FILLED_COUNT = countBotMandatory([...BOT_FORM_FIELDS, ...BOT_PRICE_FIELDS]);
export const MAKER_COUNT = MAKER_FIELDS.length;

/** The bot-filled mandatory fields, in today's form order (the collapsed "We filled … for you" card). */
export const FILLED_CARD_IDS: string[] = MANDATORY_IDS.filter((id) => (BOT_FORM_FIELDS as readonly string[]).includes(id) || (BOT_PRICE_FIELDS as readonly string[]).includes(id));

/** Bot values set on a later screen: shown in the card once known, else "set on Quantity / Price". */
export const SET_ON: Record<string, BotStep> = { inventory: 'quantity', meeshoPrice: 'price' };

/**
 * The questions on each screen, one inner array per row on screen (at most 5 rows). Ids are field ids; `inventory`
 * (First lot) is the bot's suggested lot, editable on Quantity. Every maker field sits on exactly one screen.
 */
export const STEP_ROWS: Record<BotStep, string[][]> = {
  product: [['material', 'capacity'], ['leakProof'], ['addOns'], ['length', 'breadth', 'height'], ['netWeight', 'productWeight']],
  quantity: [['minRun', 'leadTimeDays'], ['inventory']],
  price: [['makingCost', 'marginPct'], ['mrp']],
};
const MAKER_SET = new Set<string>(MAKER_FIELDS);
/** Maker fields asked on a screen. */
export const makerFieldsOn = (step: BotStep) => STEP_ROWS[step].flat().filter((id) => MAKER_SET.has(id));

/** Number fields of the short screens; these allow decimals. */
export const DECIMAL_IDS = new Set(['capacity', 'length', 'breadth', 'height', 'makingCost', 'marginPct']);
export const NUMBER_IDS = new Set([...DECIMAL_IDS, 'netWeight', 'productWeight', 'minRun', 'leadTimeDays', 'mrp', 'inventory', 'meeshoPrice']);
/** Keeps digits (and one dot where decimals are allowed). */
export const cleanNumberInput = (id: string, v: string) =>
  DECIMAL_IDS.has(id) ? v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') : v.replace(/[^\d]/g, '');

/** "What comes with it?" chips. None clears the others; picking another clears None. Stored comma-joined. */
export const ADD_ON_CHIPS = ['Lid', 'Strap', 'Cover', 'None'] as const;
export const addOnsOf = (v: string | undefined) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
export function toggleAddOn(current: string | undefined, chip: string): string {
  const on = addOnsOf(current);
  if (on.includes(chip)) return on.filter((c) => c !== chip).join(', ');
  if (chip === 'None') return 'None';
  return [...on.filter((c) => c !== 'None'), chip].sort((a, b) => ADD_ON_CHIPS.indexOf(a as never) - ADD_ON_CHIPS.indexOf(b as never)).join(', ');
}

export interface StepState {
  values: Record<string, string>;
  price: Partial<PriceRow>;
  netQtyConfirmed: boolean;
  /** The bot's details are confirmed (isReviewed). Omitted = not asked (only the fields count). */
  reviewed?: boolean;
}

const pos = (v: string | undefined) => (numberIn(v) ?? 0) > 0;
const has = (v: string | undefined) => !!(v ?? '').trim();

/** A screen's maker fields are done (Next is enabled). Price also needs the list price to exist. */
export function stepDone(step: BotStep, s: StepState): boolean {
  const v = s.values;
  if (step === 'product')
    return (
      ['material', 'leakProof', 'addOns', 'volumeUnit', 'productUnit', 'productWeightUnit', 'netQuantity'].every((k) => has(v[k])) &&
      ['capacity', 'length', 'breadth', 'height', 'netWeight', 'productWeight'].every((k) => pos(v[k])) &&
      s.netQtyConfirmed &&
      s.reviewed !== false
    );
  if (step === 'quantity') return pos(v.minRun) && pos(v.leadTimeDays) && pos(s.price.inventory);
  const margin = numberIn(v.marginPct);
  return pos(v.makingCost) && margin !== null && margin >= 0 && pos(s.price.mrp);
}

/** The furthest screen the maker may open: every screen before it is done. */
export function reachableStep(s: StepState): BotStep {
  return BOT_STEPS.find((step) => !stepDone(step, s)) ?? 'price';
}

// ── Reviewing the bot's details (LB-4: "We filled 21 details for you · please check them") ─────────────────────

/** The bot details the maker checks on Product: the 21 minus the two set on later screens (Inventory, Meesho Price). */
export const REVIEW_IDS: string[] = FILLED_CARD_IDS.filter((id) => !SET_ON[id]);

/** The review panel's groups, in order. Description is the bot's text (not one of the 21 mandatory fields). */
export const REVIEW_GROUPS: { id: 'product' | 'size' | 'origin' | 'packer' | 'description' | 'later'; ids: string[] }[] = [
  { id: 'product', ids: ['productName', 'genericName', 'type', 'color'] },
  { id: 'size', ids: ['size', 'netQuantity', 'productUnit', 'volumeUnit', 'productWeightUnit'] },
  { id: 'origin', ids: ['countryOfOrigin', 'manufacturerName', 'manufacturerAddress', 'manufacturerPincode', 'importerName', 'importerAddress', 'importerPincode'] },
  { id: 'packer', ids: ['packerName', 'packerAddress', 'packerPincode'] },
  { id: 'description', ids: ['description'] },
  { id: 'later', ids: FILLED_CARD_IDS.filter((id) => SET_ON[id]) },
];

/** What the maker confirmed: when (demo day + the real clock time of the click, "HH:MM") and the values he saw. */
export type BotReview = DraftReview;

/** The values a confirmation covers: the 19 details, plus the description once it is the maker's own text. */
function reviewedValues(values: Record<string, string>, botFilled: Iterable<string>): Record<string, string> {
  const ids = new Set(botFilled).has('description') ? REVIEW_IDS : [...REVIEW_IDS, 'description'];
  return Object.fromEntries(ids.map((id) => [id, values[id] ?? '']));
}

/** "Confirm details": records the values the maker checked. */
export function confirmReview(values: Record<string, string>, botFilled: Iterable<string>, day: number, time: string): BotReview {
  return { day, time, values: reviewedValues(values, botFilled) };
}

/**
 * Reviewed = confirmed, and no checked value has changed since. Any change (a pencil edit, a Packer that follows the
 * fulfilment toggle, Net Quantity) puts the card back to "Needs your review"; a change that leaves the value as it was
 * does not. The bot's own description is regenerated from the maker's answers, so it counts only once he edits it.
 */
export function isReviewed(review: BotReview | null | undefined, values: Record<string, string>, botFilled: Iterable<string>): boolean {
  return !!review && !changedSinceReview(review, values, botFilled).length;
}

/** The checked details whose value differs from what the maker confirmed (tagged "Changed since you confirmed"). */
export function changedSinceReview(review: BotReview | null | undefined, values: Record<string, string>, botFilled: Iterable<string>): string[] {
  if (!review) return [];
  return Object.entries(reviewedValues(values, botFilled))
    .filter(([id, v]) => (review.values[id] ?? '') !== v)
    .map(([id]) => id);
}

/** The click's local time of day, "HH:MM" (the one real clock value: user-action data, not content). */
export const clockTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Confirmation carried by scripted listings and the showcase's "botFilled" jump (presenter skipped the click). */
export const SCRIPTED_REVIEW_TIME = data.scriptedReview.time;

// ── First lot (Quantity): the reasoning behind the (i) next to "First lot · 150 suggested" ─────────────────────

type LotView = ReturnType<typeof suggestedLot>;
/** "You'll likely sell 9–13 a day, so 150 is about 2 weeks of stock (≈ ₹12,000 at cost). You can enter any number." */
export function lotTip(t: T, lot: LotView, makingCost: number | null, fmt: (n: number) => string): string {
  const weeks = fmt(lot.days / 7);
  const cost = makingCost && makingCost > 0 ? t('lotTip.atCost', { atCost: fmt(lot.units * makingCost) }) : '';
  const vars = { low: fmt(lot.perDay.low), high: fmt(lot.perDay.high), weeks, units: fmt(lot.units), twoWeeks: fmt(lot.twoWeeks), cost };
  return t(lot.raisedToMinRun ? 'lotTip.minRun' : 'lotTip.basis', vars);
}

// ── Fulfilment per product (Price screen: [Self-ship] [Pack Point]) ─────────────────────────────────────────────

export type ShipMode = 'selfShip' | 'packPoint';
interface PackPointNode {
  city: string;
  status: string;
  makersPooled?: number;
  opensAtMakers?: number;
  pincodePrefixes?: string[];
}
const NODES = nodesData.nodes as PackPointNode[];

/** Pack Point on this product: live cluster → choosable; opening → shown disabled; none → no toggle. */
export type PackPointOption = { state: 'live'; city: string; makersPooled: number } | { state: 'opening'; city: string; opensAtMakers: number } | null;

export function packPointOption(pincode: string): PackPointOption {
  const n = clusterForPincode(NODES, pincode);
  if (!n) return null;
  if (n.status === 'live') return { state: 'live', city: n.city, makersPooled: n.makersPooled ?? 40 };
  if (n.status === 'opening' && n.opensAtMakers) return { state: 'opening', city: n.city, opensAtMakers: n.opensAtMakers };
  return null;
}

/** Self-ship needs the type's packaging cost (Samar's sneakers have none: Pack Point only). */
export const selfShipPossible = (type: ProductTypeId) => typeFees(type).packaging !== null;

/** The mode this product's price is built on: the maker's choice for it if that option is open, else his default. */
export function productShipMode(defaultMode: ShipMode, override: ShipMode | null, option: PackPointOption, type: ProductTypeId): ShipMode {
  if (override === 'packPoint' && option?.state === 'live') return 'packPoint';
  if (override === 'selfShip' && selfShipPossible(type)) return 'selfShip';
  return defaultMode;
}

/** "+₹24 per order": Pack Point fee − self-ship packaging, from the two stacks' fees; null without both. */
export function packPointExtra(type: ProductTypeId, makersPooled = 40): number | null {
  if (!selfShipPossible(type)) return null;
  const pp = costStack(type, 0, 0, 'packPoint', makersPooled).fees.packPointFee;
  const ss = costStack(type, 0, 0, 'selfShip').fees.packaging;
  return pp !== undefined && ss !== undefined ? pp - ss : null;
}

/** Take-home shown at a price: the maker's margin at the bot's own list price (rounding up to the rupee is not his margin), else the engine's take-home at that price. */
export const takeHomeShown = (price: number, stack: CostStack) => (price === stack.listPrice ? stack.takeHome : takeHomeAt(price, stack));

/** Break-even, list price, take-home and status for one product in one mode (the Price screen's numbers). */
export function shipQuote(type: ProductTypeId, makingCost: number, marginPct: number, mode: ShipMode, makersPooled = 40) {
  const stack = costStack(type, makingCost, marginPct, mode, makersPooled);
  return {
    stack,
    breakEven: stack.breakEven,
    listPrice: stack.listPrice,
    takeHome: takeHomeShown(stack.listPrice, stack),
    status: checkListingPrice(type, stack.listPrice, stack.breakEven),
  };
}
