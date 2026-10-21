// "Create from photos" (LB-3 … LB-10): which fields the listing bot fills, which the maker enters,
// the pre-fill itself, the generated description and the go-live checks. Pure functions only.
// Who fills what = doc pp.15-18 / plan §7. Numbers come from the engine (src/engine/ui.ts) or seed JSON.
import data from '../../../data/botListing.json';
import { suggestedLot, type ProductTypeId, type PriceStatus } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';
import type { DraftImage, PriceRow } from './draftStore';
import { FIELDS, PACKER_FROM_MANUFACTURER, type FieldDef } from './fields';
import { PRICE_COLUMNS } from './pricing';

export interface BotType {
  categoryPath: string[];
  bot: Record<string, string>;
  demo: Record<string, string>;
}

const TYPES = data.types as Record<string, BotType>;

/** Bot data for a product type, or null when the bot has nothing for it (Samar, reseller). */
export function botTypeFor(type: ProductTypeId | null | undefined): BotType | null {
  return (type && TYPES[type]) || null;
}

/** Query string that puts Add Single Catalog in "Create from photos" mode. */
export const BOT_QUERY = 'mode=photos';

export const PACK_POINT_PARTNER = data.packPointPartner;
export const MAX_PHOTOS = data.maxPhotos;

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
 * "Fill demo values": every maker field in one click (team, Phase 3 review) so the demo never stalls. `mrp` is a
 * price-table cell; the rest are form values. The Net Quantity confirmation stays with the maker.
 */
export function demoValues(type: ProductTypeId, persona: PersonaRecord, typical: { minRun: number; leadTimeDays: number } | null): Record<string, string> {
  const t = botTypeFor(type);
  const out: Record<string, string> = { ...(t?.demo ?? {}) };
  if (persona.product) {
    out.makingCost = String(persona.product.makingCost);
    out.marginPct = String(persona.product.marginPct);
  }
  if (typical) {
    out.minRun = String(typical.minRun);
    out.leadTimeDays = String(typical.leadTimeDays);
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
  price: boolean;
  lot: boolean;
  all: boolean;
}

/**
 * Go-live checklist (LB-8):
 *  Images  — a Front Image is present (the bot's cleaned cover counts as the Front Image);
 *  Details — every mandatory field and price cell filled, the 4 new inputs filled, Net Quantity confirmed;
 *  Price   — status is "qualifies";
 *  Lot     — inventory > 0 (any number: no cap, no floor, Q19).
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
  return { images, details, price, lot, all: images && details && price && lot };
}
