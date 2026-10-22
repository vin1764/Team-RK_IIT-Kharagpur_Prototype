// "We filled 21 details for you" review (LB-4), the Quantity (i) tooltip (LB-5) and the per-product fulfilment toggle
// on the Price screen (LB-6/LB-8). Every number is recomputed from the engine / seed JSON.
import { describe, expect, it } from 'vitest';
import personas from '../../../data/personas.json';
import { suggestedLot, typicalForType } from '../../../engine/ui';
import { fmt, tEn } from '../../../i18n';
import type { PersonaRecord } from '../../../store/onboarding';
import { scriptedListingFor } from '../../../store/timeline';
import { listingRows } from '../catalog-uploads/data';
import {
  BOT_FILLED_COUNT,
  botPrefill,
  changedSinceReview,
  confirmReview,
  demoValues,
  FILLED_CARD_IDS,
  isReviewed,
  lotTip,
  packerFor,
  packPointExtra,
  packPointOption,
  productShipMode,
  REVIEW_GROUPS,
  REVIEW_IDS,
  SCRIPTED_REVIEW_TIME,
  selfShipPossible,
  shipQuote,
  takeHomeShown,
} from './bot';
import { sanitizeDraft } from './draftStore';

const P = personas as unknown as Record<string, PersonaRecord>;
const jasmeet = P.jasmeet!;
const BOTTLE = 'steel-bottle-1l' as const;
const SNEAKERS = 'sneakers-slip-on-men' as const;

describe('the 21 details and their groups', () => {
  it('the card counts the 21 from the bot split', () => {
    expect(BOT_FILLED_COUNT).toBe(21);
    expect(FILLED_CARD_IDS).toHaveLength(21);
  });
  it('the groups hold exactly the 21 (+ the bot description), each once', () => {
    const ids = REVIEW_GROUPS.flatMap((g) => g.ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id !== 'description').sort()).toEqual([...FILLED_CARD_IDS].sort());
    expect(REVIEW_GROUPS.map((g) => g.id)).toEqual(['product', 'size', 'origin', 'packer', 'description', 'later']);
  });
  it('the maker checks 19 on Product; Inventory and Meesho Price are set on Quantity / Price', () => {
    expect(REVIEW_IDS).toHaveLength(19);
    expect(REVIEW_GROUPS.find((g) => g.id === 'later')!.ids.sort()).toEqual(['inventory', 'meeshoPrice']);
  });
});

describe('review state: confirm → edit → needs review', () => {
  const pf = botPrefill(BOTTLE, jasmeet, 'selfShip', true);
  const bot = pf.botFilled;
  const r = confirmReview(pf.values, bot, 3, '14:05');

  it('nothing confirmed → needs review', () => {
    expect(isReviewed(null, pf.values, bot)).toBe(false);
  });
  it('"Confirm details" records the demo day and the clock time', () => {
    expect(r.day).toBe(3);
    expect(r.time).toBe('14:05');
    expect(isReviewed(r, pf.values, bot)).toBe(true);
  });
  it('"Fill demo values" neither confirms nor touches a checked detail', () => {
    const demo = demoValues(BOTTLE, jasmeet, typicalForType(BOTTLE));
    expect(Object.keys(demo).filter((k) => REVIEW_IDS.includes(k))).toEqual([]);
    expect(isReviewed(null, { ...pf.values, ...demo }, bot)).toBe(false);
    expect(isReviewed(r, { ...pf.values, ...demo }, bot)).toBe(true);
  });
  it('editing a detail after confirming → needs review, and names what changed', () => {
    const edited = { ...pf.values, color: 'Black' };
    const botAfter = bot.filter((id) => id !== 'color');
    expect(isReviewed(r, edited, botAfter)).toBe(false);
    expect(changedSinceReview(r, edited, botAfter)).toEqual(['color']);
    // confirmed again → reviewed
    expect(isReviewed(confirmReview(edited, botAfter, 3, '14:07'), edited, botAfter)).toBe(true);
  });
  it('the bot’s own description is regenerated freely; the maker’s edit of it counts', () => {
    expect(isReviewed(r, { ...pf.values, description: 'regenerated' }, bot)).toBe(true);
    const own = bot.filter((id) => id !== 'description');
    expect(isReviewed(r, { ...pf.values, description: 'my words' }, own)).toBe(false);
  });
  it('Packer: a fulfilment switch puts it back to needs review ONLY when the value changes', () => {
    // retail-packed units: Pack Point packer = manufacturer = the self-ship packer → unchanged
    const same = { ...pf.values, ...packerFor('packPoint', true, jasmeet).values };
    expect(isReviewed(r, same, bot)).toBe(true);
    // not retail-packed: the Pack Point partner packs → changed
    const partner = { ...pf.values, ...packerFor('packPoint', false, jasmeet).values };
    expect(isReviewed(r, partner, bot)).toBe(false);
    // (the demo partner sits in the same fake Rajkot pincode, so only name and address change)
    expect(changedSinceReview(r, partner, bot)).toEqual(['packerName', 'packerAddress']);
    // back to self-ship → the confirmed values again
    const back = { ...partner, ...packerFor('selfShip', false, jasmeet).values };
    expect(isReviewed(r, back, bot)).toBe(true);
  });
});

describe('saved drafts keep the review and the per-product fulfilment', () => {
  it('well-formed values are kept', () => {
    const d = sanitizeDraft({ botReview: { day: 3, time: '14:05', values: { color: 'Navy Blue' } }, fulfilmentOverride: 'packPoint' });
    expect(d.botReview).toEqual({ day: 3, time: '14:05', values: { color: 'Navy Blue' } });
    expect(d.fulfilmentOverride).toBe('packPoint');
  });
  it('a draft saved before them (or malformed) loads with null', () => {
    expect(sanitizeDraft({ values: {} }).botReview).toBeNull();
    expect(sanitizeDraft({ values: {} }).fulfilmentOverride).toBeNull();
    expect(sanitizeDraft({ botReview: { day: '3', time: 'x', values: {} }, fulfilmentOverride: 'waitlist' })).toMatchObject({ botReview: null, fulfilmentOverride: null });
  });
});

describe('Confirmed by maker · date, time', () => {
  it('scripted listing (presenter past D3) carries D3 at the fixed time', () => {
    expect(SCRIPTED_REVIEW_TIME).toBe('11:20');
    expect(scriptedListingFor('jasmeet')!.reviewedAt).toEqual({ day: 3, time: '11:20' });
  });
  it('Catalog Uploads row shows the record; older listings without it show none', () => {
    const line = (x: { day: number; time: string }) => tEn('filled.confirmedAt', { date: String(x.day), time: x.time });
    const [withIt, without] = listingRows(
      [
        { id: '1', typeId: BOTTLE, createdDay: 3, reviewedAt: { day: 3, time: '14:05' } },
        { id: '2', typeId: BOTTLE, createdDay: 3 },
      ],
      () => 'Water Bottles',
      String,
      line,
    );
    expect(withIt!.confirmed).toBe('Confirmed by maker · 3, 14:05');
    expect(without!.confirmed).toBeUndefined();
  });
});

describe('Quantity: the (i) next to "First lot · 150 suggested"', () => {
  const lot = suggestedLot(BOTTLE, 80);
  it('2 weeks of sales, with the ₹ at cost once the making cost is known', () => {
    expect(lot.units).toBe(150);
    expect(lotTip(tEn, lot, 80, fmt)).toBe("You'll likely sell 9–13 a day, so 150 is about 2 weeks of stock (≈ ₹12,000 at cost). You can enter any number.");
    expect(lotTip(tEn, lot, null, fmt)).toBe("You'll likely sell 9–13 a day, so 150 is about 2 weeks of stock. You can enter any number.");
  });
  it('raised to the maker’s minimum run', () => {
    const raised = suggestedLot(BOTTLE, 80, 200);
    expect(raised.raisedToMinRun).toBe(true);
    expect(lotTip(tEn, raised, 80, fmt)).toBe(
      "You'll likely sell 9–13 a day (about 2 weeks = 150), but your minimum run is 200, so we suggest 200 (≈ ₹16,000 at cost). You can enter any number.",
    );
  });
  it('no market totals, commitments or confidence in the tooltip copy', () => {
    for (const k of ['lotTip.basis', 'lotTip.minRun', 'qty.lotSuggested']) expect(tEn(k)).not.toMatch(/committed|confidence|unserved|week(s)? unserved/i);
  });
});

describe('Price: fulfilment per product', () => {
  it('Jasmeet self-ship: break-even ₹133 · list ₹147 · take-home ₹14 · Qualifies', () => {
    const q = shipQuote(BOTTLE, 80, 17.5, 'selfShip');
    expect([q.breakEven, q.listPrice, q.takeHome, q.status]).toEqual([133, 147, 14, 'qualifies']);
    expect(q.stack.fees.packaging).toBe(6);
  });
  it('Jasmeet Pack Point: break-even ₹158 · list ₹172 · take-home ₹14 · Doesn’t qualify', () => {
    const q = shipQuote(BOTTLE, 80, 17.5, 'packPoint', 40);
    expect([q.breakEven, q.listPrice, q.takeHome, q.status]).toEqual([158, 172, 14, 'aboveCap']);
    expect(tEn(`status.${q.status}`)).toBe("Doesn't qualify");
    expect(q.stack.fees.packPointFee).toBe(30);
    // his margin at the bot's list price; any other price → the engine's take-home there
    expect(takeHomeShown(172, q.stack)).toBe(14);
    expect(takeHomeShown(180, q.stack)).toBeCloseTo(180 / 1.05 - 150, 2);
  });
  it('Samar Pack Point: break-even ₹305 · list ₹336 · take-home ₹30 · Qualifies (Samar has no bot data: model test only)', () => {
    const q = shipQuote(SNEAKERS, 200, 15, 'packPoint', 40);
    expect([q.breakEven, q.listPrice, q.takeHome, q.status]).toEqual([305, 336, 30, 'qualifies']);
    expect(selfShipPossible(SNEAKERS)).toBe(false);
    expect(packPointExtra(SNEAKERS)).toBeNull();
  });
  it('"+₹24 per order" = Pack Point fee − packaging, from the two stacks', () => {
    expect(packPointExtra(BOTTLE)).toBe(24);
    expect(shipQuote(BOTTLE, 80, 17.5, 'packPoint').breakEven - shipQuote(BOTTLE, 80, 17.5, 'selfShip').breakEven).toBe(25); // 24 × 1.05, rounded up
  });
  it('the toggle shows by pickup pincode: live (Rajkot, Agra), opening at 40 (Moradabad), none elsewhere', () => {
    expect(packPointOption(jasmeet.address.pincode)).toEqual({ state: 'live', city: 'Rajkot', makersPooled: 40 });
    expect(packPointOption(P.samar!.address.pincode)).toMatchObject({ state: 'live', city: 'Agra' });
    expect(packPointOption('244000')).toEqual({ state: 'opening', city: 'Moradabad', opensAtMakers: 40 });
    expect(packPointOption('110000')).toBeNull();
  });
  it('the product’s mode: his switch if that option is open, else his Pickup Address default', () => {
    const live = packPointOption('360000');
    const opening = packPointOption('244000');
    expect(productShipMode('selfShip', null, live, BOTTLE)).toBe('selfShip');
    expect(productShipMode('selfShip', 'packPoint', live, BOTTLE)).toBe('packPoint');
    expect(productShipMode('selfShip', 'packPoint', opening, BOTTLE)).toBe('selfShip');
    expect(productShipMode('selfShip', 'packPoint', null, BOTTLE)).toBe('selfShip');
    expect(productShipMode('packPoint', 'selfShip', live, SNEAKERS)).toBe('packPoint');
  });
});
