import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import personas from '../../../data/personas.json';
import { typicalForType } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';
import {
  BOT_FILLED_COUNT,
  BOT_FORM_FIELDS,
  BOT_STEPS,
  FILLED_CARD_IDS,
  MAKER_COUNT,
  makerFieldsOn,
  reachableStep,
  STEP_ROWS,
  stepDone,
  toggleAddOn,
  TODAY_IMAGE_SLOTS,
  BOT_PRICE_FIELDS,
  botPrefill,
  botTypeFor,
  countBotMandatory,
  demoValues,
  describeListing,
  goLiveChecks,
  MAKER_FIELDS,
  MANDATORY_IDS,
  packerFor,
  PACK_POINT_PARTNER,
} from './bot';
import { FIELDS, missingFields } from './fields';

const P = personas as unknown as Record<string, PersonaRecord>;
const jasmeet = P.jasmeet!;

describe('who fills what (doc pp.15-18, plan §7)', () => {
  it('today’s Water Bottles form has 31 mandatory fields', () => {
    expect(MANDATORY_IDS).toHaveLength(31);
  });
  it('the bot pre-fills 21 of them', () => {
    expect(countBotMandatory([...BOT_FORM_FIELDS, ...BOT_PRICE_FIELDS])).toBe(21);
  });
  it('the maker types exactly 14 values: 10 of today’s mandatory fields + 4 new inputs', () => {
    expect(MAKER_FIELDS).toHaveLength(14);
    expect(MAKER_FIELDS.filter((id) => MANDATORY_IDS.includes(id))).toHaveLength(10);
  });
  it('bot + maker cover every mandatory field, with no overlap', () => {
    const bot = new Set<string>([...BOT_FORM_FIELDS, ...BOT_PRICE_FIELDS]);
    const maker = new Set<string>(MAKER_FIELDS);
    expect(MANDATORY_IDS.every((id) => bot.has(id) !== maker.has(id))).toBe(true);
  });
});

describe('botPrefill', () => {
  const pf = botPrefill('steel-bottle-1l', jasmeet, 'selfShip', true);
  it('fills the category and every bot form field, leaving only the maker’s', () => {
    expect(pf.categoryPath.at(-1)).toBe('Water Bottles');
    expect(missingFields(pf.values).sort()).toEqual(
      ['addOns', 'breadth', 'capacity', 'height', 'leakProof', 'length', 'material', 'netWeight', 'productWeight'].sort(),
    );
  });
  it('reads Navy Blue from the photo, an option of the Color select', () => {
    expect(pf.values.color).toBe('Navy Blue');
    expect(FIELDS.find((f) => f.id === 'color')?.options).toContain('Navy Blue');
  });
  it('takes the manufacturer from the GST record and India as origin', () => {
    expect(pf.values.manufacturerName).toBe(jasmeet.legalName);
    expect(pf.values.manufacturerPincode).toBe(jasmeet.address.pincode);
    expect(pf.values.countryOfOrigin).toBe('India');
  });
  it('suggests 150 units of inventory', () => {
    expect(pf.price.inventory).toBe('150');
  });
  it('self-ship packer = manufacturer, box ticked', () => {
    expect(pf.sameAsManufacturer).toBe(true);
    expect(pf.values.packerName).toBe(jasmeet.legalName);
  });
});

describe('packer rule', () => {
  it('Pack Point, retail-packed → manufacturer', () => {
    expect(packerFor('packPoint', true, jasmeet).values.packerName).toBe(jasmeet.legalName);
  });
  it('Pack Point, node packs → Pack Point partner', () => {
    const p = packerFor('packPoint', false, jasmeet);
    expect(p.sameAsManufacturer).toBe(false);
    expect(p.values.packerName).toBe(PACK_POINT_PARTNER.name);
  });
});

describe('describeListing', () => {
  it('writes the description from the filled attributes only', () => {
    const d = describeListing({ productName: 'Bottle 1 L', material: 'Stainless Steel', capacity: '1', volumeUnit: 'L', netQuantity: '1' });
    expect(d).toBe('Bottle 1 L. Material: Stainless Steel. Capacity: 1 L. Pack of 1.');
  });
  it('is empty when nothing is filled', () => {
    expect(describeListing({})).toBe('');
  });
});

describe('demoValues', () => {
  const v = demoValues('steel-bottle-1l', jasmeet, typicalForType('steel-bottle-1l'));
  it('uses the team / persona / typical values for every maker field', () => {
    expect(v).toEqual({
      capacity: '1', material: 'Stainless Steel', leakProof: 'Yes',
      length: '7.5', breadth: '7.5', height: '27', productWeight: '360', netWeight: '320', addOns: 'Lid', mrp: '299',
      makingCost: '80', marginPct: '17.5', minRun: '100', leadTimeDays: '5',
    });
  });
  it('covers all 14 maker fields', () => {
    expect(Object.keys(v).sort()).toEqual([...MAKER_FIELDS].sort());
  });
  it('every select value is one of that field’s options', () => {
    for (const f of FIELDS.filter((x) => x.kind === 'select' && v[x.id] !== undefined)) expect(f.options).toContain(v[f.id]);
  });
  it('after bot pre-fill + demo values no mandatory form field is missing', () => {
    const pf = botPrefill('steel-bottle-1l', jasmeet, 'selfShip', true);
    expect(missingFields({ ...pf.values, ...v })).toEqual([]);
  });
  it('no bot data for personas without a product type', () => {
    expect(botTypeFor(P.samar!.product?.type)).toBeNull();
  });
});

describe('goLiveChecks', () => {
  const ok = {
    hasFrontImage: true,
    missingFields: [],
    missingPrices: [],
    netQtyConfirmed: true,
    inputs: { makingCost: '80', marginPct: '17.5', minRun: '100', leadTimeDays: '5' },
    status: 'qualifies' as const,
    inventory: 150,
  };
  it('all pass', () => expect(goLiveChecks(ok).all).toBe(true));
  it('Net Quantity must be confirmed', () => expect(goLiveChecks({ ...ok, netQtyConfirmed: false }).details).toBe(false));
  it('price must qualify', () => expect(goLiveChecks({ ...ok, status: 'aboveCap' }).price).toBe(false));
  it('any lot above zero passes, even below the minimum run', () => expect(goLiveChecks({ ...ok, inventory: 20 }).lot).toBe(true));
});

describe('three short screens (redesign)', () => {
  const pf = botPrefill('steel-bottle-1l', jasmeet, 'selfShip', true);
  const demo = demoValues('steel-bottle-1l', jasmeet, typicalForType('steel-bottle-1l'));
  const { mrp, ...demoForm } = demo;
  const filledState = (netQtyConfirmed: boolean) => ({ values: { ...pf.values, ...demoForm }, price: { ...pf.price, mrp }, netQtyConfirmed });

  it('the progress line still reads 21 filled · 14 to add, and the card lists the 21', () => {
    expect(BOT_FILLED_COUNT).toBe(21);
    expect(MAKER_COUNT).toBe(14);
    expect(FILLED_CARD_IDS).toHaveLength(21);
    expect(FILLED_CARD_IDS).toContain('netQuantity');
    expect(FILLED_CARD_IDS).toEqual(expect.arrayContaining(['meeshoPrice', 'inventory']));
  });
  it('today’s form = 31 mandatory fields + 4 images = 35', () => {
    expect(MANDATORY_IDS.length + TODAY_IMAGE_SLOTS).toBe(35);
  });
  it('each screen has at most 5 maker rows', () => {
    for (const s of BOT_STEPS) expect(STEP_ROWS[s].length).toBeLessThanOrEqual(5);
    expect(STEP_ROWS.product).toHaveLength(5);
  });
  it('every maker field is asked on exactly one screen', () => {
    const asked = BOT_STEPS.flatMap(makerFieldsOn);
    expect(asked.sort()).toEqual([...MAKER_FIELDS].sort());
    expect(makerFieldsOn('product')).toHaveLength(9);
    expect(makerFieldsOn('quantity')).toEqual(['minRun', 'leadTimeDays']);
    expect(makerFieldsOn('price')).toEqual(['makingCost', 'marginPct', 'mrp']);
  });
  it('right after pre-fill no screen is done and only Product opens', () => {
    const st = { values: pf.values, price: pf.price, netQtyConfirmed: false };
    for (const s of BOT_STEPS) expect(stepDone(s, st)).toBe(false);
    expect(reachableStep(st)).toBe('product');
  });
  it('Fill demo values completes all 14; only “Pack of 1 — Yes” is left', () => {
    expect(stepDone('product', filledState(false))).toBe(false);
    expect(stepDone('quantity', filledState(false))).toBe(true);
    expect(stepDone('price', filledState(false))).toBe(true);
    expect(stepDone('product', filledState(true))).toBe(true);
    expect(reachableStep(filledState(true))).toBe('price');
  });
  it('Product needs every one of its answers', () => {
    for (const id of makerFieldsOn('product')) {
      const st = filledState(true);
      expect(stepDone('product', { ...st, values: { ...st.values, [id]: '' } })).toBe(false);
    }
  });
  it('Quantity needs minimum run, lead time and a lot above zero', () => {
    const st = filledState(true);
    expect(stepDone('quantity', { ...st, values: { ...st.values, minRun: '' } })).toBe(false);
    expect(stepDone('quantity', { ...st, values: { ...st.values, leadTimeDays: '0' } })).toBe(false);
    expect(stepDone('quantity', { ...st, price: { ...st.price, inventory: '' } })).toBe(false);
    expect(stepDone('quantity', { ...st, price: { ...st.price, inventory: '20' } })).toBe(true);
  });
  it('Price needs making cost, a margin ≥ 0 and the MRP', () => {
    const st = filledState(true);
    expect(stepDone('price', { ...st, values: { ...st.values, makingCost: '' } })).toBe(false);
    expect(stepDone('price', { ...st, values: { ...st.values, marginPct: '0' } })).toBe(true);
    expect(stepDone('price', { ...st, price: { ...st.price, mrp: '' } })).toBe(false);
  });
  it('add-on chips: multi-select, None clears the others', () => {
    expect(toggleAddOn('', 'Lid')).toBe('Lid');
    expect(toggleAddOn('Lid', 'Strap')).toBe('Lid, Strap');
    expect(toggleAddOn('Lid, Strap', 'None')).toBe('None');
    expect(toggleAddOn('None', 'Cover')).toBe('Cover');
    expect(toggleAddOn('Lid, Cover', 'Lid')).toBe('Cover');
  });
});

// B guard for the bot screens: no catalog/home/uploads UI file may read the benchmark seed directly.
describe('B stays out of the listing-bot UI', () => {
  const ROOT = fileURLToPath(new URL('../', import.meta.url));
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) && !n.endsWith('.test.ts') ? [p] : [];
    });
  // Built from parts so this test file itself doesn't match the engine-wide guard.
  const pattern = new RegExp(['productTypes\\.json', 'engine/bench' + 'mark', 'bench' + 'markB'].join('|'));
  it('no panel file imports productTypes.json or the benchmark', () => {
    const offenders = files(ROOT).filter((f) => pattern.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
