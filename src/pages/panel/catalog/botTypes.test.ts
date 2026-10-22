// Create from photos for the "What to make instead" types (GL-6 → LB-3 … LB-8): the casserole and the flask.
// The bot fills only what follows from the product type and the persona; dimensions, weights, MRP, add-ons and
// leak-proof stay with the maker. Price numbers come from the engine through the bot's own model (shipQuote).
import { describe, expect, it } from 'vitest';
import personas from '../../../data/personas.json';
import { costStack, suggestedLot, typicalForType, type ProductTypeId } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';
import { launchListing } from '../../../store/timeline';
import type { Listing } from '../../../store/catalog';
import {
  BOT_FILLED_COUNT,
  botPrefill,
  botTypeFor,
  countBotMandatory,
  demoValues,
  MAKER_FIELDS,
  packPointOption,
  photoFor,
  shipQuote,
  stepDone,
} from './bot';
import { isLeafPath, nodeAt } from './categories';
import { DEMO_IMAGE } from './draftStore';
import { FIELDS, missingFields } from './fields';

const jasmeet = (personas as unknown as Record<string, PersonaRecord>).jasmeet!;
const CASSEROLE: ProductTypeId = 'steel-casserole-1-5l';
const FLASK: ProductTypeId = 'steel-flask-500ml';
/** The maker's values that are not seeded for these types (asked of the team): he types them. */
const LEFT_TO_MAKER = ['addOns', 'breadth', 'height', 'leakProof', 'length', 'mrp', 'netWeight', 'productWeight'];

describe('bot data for the casserole and the flask', () => {
  it('flask → Kitchen Storage › Thermos & Vacuum Flasks (a captured leaf)', () => {
    expect(botTypeFor(FLASK)!.categoryPath).toEqual(['Home & Kitchen', 'Kitchen & Dining', 'Kitchen Storage', 'Thermos & Vacuum Flasks']);
    expect(isLeafPath(botTypeFor(FLASK)!.categoryPath)).toBe(true);
  });
  it('casserole → Kitchen & Dining › Cookware (deepest captured node; placeholder pending the team)', () => {
    expect(botTypeFor(CASSEROLE)!.categoryPath).toEqual(['Home & Kitchen', 'Kitchen & Dining', 'Cookware']);
    expect(nodeAt(botTypeFor(CASSEROLE)!.categoryPath)?.name).toBe('Cookware');
  });
  it('the photo modal starts with each type’s placeholder illustration (the bottle keeps the team photo)', () => {
    expect(photoFor(CASSEROLE).url).toBe('/brand/local/catalog/demo-product-casserole.svg');
    expect(photoFor(FLASK).url).toBe('/brand/local/catalog/demo-product-flask.svg');
    expect(photoFor('steel-bottle-1l')).toEqual(DEMO_IMAGE);
  });
});

describe.each([
  [CASSEROLE, 'Stainless Steel Casserole 1.5 L', 'Casserole', 'L', 80],
  [FLASK, 'Stainless Steel Flask 500 ml', 'Flask', 'L', 50],
] as const)('botPrefill — %s', (type, name, generic, volumeUnit, lot) => {
  const pf = botPrefill(type, jasmeet, 'selfShip', true);
  it('name, generic name, type, Silver, Free Size, pack of 1, units, India', () => {
    expect(pf.values).toMatchObject({ productName: name, genericName: generic, type: generic, color: 'Silver', size: 'Free Size', netQuantity: '1', volumeUnit, productUnit: 'cm', productWeightUnit: 'g', countryOfOrigin: 'India' });
  });
  it('manufacturer and packer from her GST record; importer not applicable', () => {
    expect(pf.values.manufacturerName).toBe(jasmeet.legalName);
    expect(pf.values.packerName).toBe(jasmeet.legalName);
    expect(pf.values.importerName).toMatch(/^Not applicable/);
  });
  it('the same 21 mandatory details are bot-filled (today’s form, the only one captured)', () => {
    expect(countBotMandatory(pf.botFilled)).toBe(21);
    expect(BOT_FILLED_COUNT).toBe(21);
  });
  it('every bot select value is one of that field’s options', () => {
    for (const f of FIELDS.filter((x) => x.kind === 'select' && pf.values[x.id] !== undefined)) expect(f.options).toContain(pf.values[f.id]);
  });
  it(`suggests ${lot} units (two weeks of likely orders) until his minimum run is entered`, () => {
    expect(pf.price.inventory).toBe(String(lot));
    expect(suggestedLot(type, 0, 100).units).toBe(100); // the bot's Quantity rule: never below his minimum run
  });
});

describe.each([
  [CASSEROLE, { capacity: '1.5', material: 'Stainless Steel', makingCost: '220', marginPct: '15', minRun: '100', leadTimeDays: '5' }],
  [FLASK, { capacity: '0.5', material: 'Stainless Steel', makingCost: '100', marginPct: '15', minRun: '100', leadTimeDays: '5' }],
] as const)('Fill demo values — %s', (type, expected) => {
  const v = demoValues(type, jasmeet, typicalForType(type));
  it('cost and margin from the type’s demo values; minimum run and lead time her own; capacity and material from the type', () => {
    expect(v).toEqual(expected);
  });
  it('dimensions, weights, MRP, add-ons and leak-proof are left to the maker', () => {
    expect(MAKER_FIELDS.filter((id) => !(id in v)).sort()).toEqual(LEFT_TO_MAKER);
    const pf = botPrefill(type, jasmeet, 'selfShip', true);
    expect(missingFields({ ...pf.values, ...v }).sort()).toEqual(LEFT_TO_MAKER.filter((id) => id !== 'mrp'));
  });
  it('Quantity is done after it; Product waits for his answers and Pack of 1; Price for the MRP', () => {
    const pf = botPrefill(type, jasmeet, 'selfShip', true);
    const st = { values: { ...pf.values, ...v }, price: pf.price, netQtyConfirmed: true };
    expect(stepDone('quantity', st)).toBe(true);
    expect(stepDone('product', st)).toBe(false);
    expect(stepDone('price', st)).toBe(false);
    const typed = { addOns: 'Lid', leakProof: 'Yes', length: '20', breadth: '20', height: '12', netWeight: '600', productWeight: '700' };
    expect(stepDone('product', { ...st, values: { ...st.values, ...typed } })).toBe(true);
    expect(stepDone('price', { ...st, price: { ...st.price, mrp: '499' } })).toBe(true);
  });
});

describe('Price step numbers through the bot model (engine)', () => {
  it('casserole self-ship at ₹220 / 15%: break-even ₹292, list ₹327, take-home ₹33, Qualifies', () => {
    const q = shipQuote(CASSEROLE, 220, 15, 'selfShip');
    expect([q.breakEven, q.listPrice, q.takeHome, q.status]).toEqual([292, 327, 33, 'qualifies']);
  });
  it('flask self-ship at ₹100 / 15%: break-even ₹154, list ₹169, take-home ₹15, Qualifies', () => {
    const q = shipQuote(FLASK, 100, 15, 'selfShip');
    expect([q.breakEven, q.listPrice, q.takeHome, q.status]).toEqual([154, 169, 15, 'qualifies']);
  });
  it('Rajkot is a live Pack Point: its stack is the engine’s (no typed numbers)', () => {
    const opt = packPointOption(jasmeet.address.pincode);
    expect(opt?.state).toBe('live');
    for (const type of [CASSEROLE, FLASK]) {
      const q = shipQuote(type, type === CASSEROLE ? 220 : 100, 15, 'packPoint', 40);
      expect(q.stack).toEqual(costStack(type, type === CASSEROLE ? 220 : 100, 15, 'packPoint', 40));
    }
  });
});

describe('launch listing: a casserole go-live doesn’t replace her launched bottle', () => {
  const casserole = { id: '900000001', persona: 'jasmeet', typeId: CASSEROLE, name: 'Stainless Steel Casserole 1.5 L', price: 327, breakEven: 292, takeHome: 33, inventory: 80, minRun: 100, leadTimeDays: 5, makingCost: 220, marginPct: 15, fulfilment: 'selfShip', createdDay: 28, status: 'live' } as Listing;
  it('D28: the scripted bottle stays her launch listing', () => {
    expect(launchListing([casserole], 'jasmeet', 28)).toMatchObject({ typeId: 'steel-bottle-1l', scripted: true });
  });
  it('a real bottle listing still wins; before the listing day the casserole is her latest', () => {
    const bottle = { ...casserole, id: '900000002', typeId: 'steel-bottle-1l' } as Listing;
    expect(launchListing([casserole, bottle], 'jasmeet', 28)).toMatchObject({ id: '900000002', scripted: false });
    expect(launchListing([casserole], 'jasmeet', 2)).toMatchObject({ typeId: CASSEROLE, scripted: false });
  });
});
