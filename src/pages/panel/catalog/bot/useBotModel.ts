// State of the three short "Create from photos" screens: the draft, the engine numbers derived from it
// (cost stack → list price → take-home → status; suggested lot) and the setters the screens share.
// Every number comes from src/engine/ui.ts or the seed JSON; B never enters here (status only).
import { useEffect } from 'react';
import { checkListingPrice, costStack, suggestedLot, typicalForType } from '../../../../engine/ui';
import { useDemo } from '../../../../store/demo';
import { useBotProductType } from '../../../../store/makerProduct';
import { useOnboarding, usePersona, usePickupPincode } from '../../../../store/onboarding';
import {
  BOT_STEPS,
  cleanNumberInput,
  clockTime,
  confirmReview,
  demoValues,
  describeListing,
  goLiveChecks,
  isReviewed,
  numberIn,
  NUMBER_IDS,
  packerFor,
  packPointOption,
  productShipMode,
  stackMode,
  stepDone,
  type BotStep,
  type ShipMode,
} from '../bot';
import { EMPTY_PRICE_ROW, useDraft, type PriceRow } from '../draftStore';
import { missingFields, PACKER_FROM_MANUFACTURER } from '../fields';
import { missingPrices, suggestWdrp } from '../pricing';

export function useBotModel() {
  const d = useDraft();
  const persona = usePersona();
  const fulfilmentChoice = useOnboarding((s) => s.fulfilment);
  const type = useBotProductType();
  const values = d.values;
  const size = values.size ?? '';
  const row: PriceRow = (size && d.prices[size]) || EMPTY_PRICE_ROW;
  const filled = new Set(d.botFilled);

  const day = useDemo((s) => s.day);

  // Fulfilment for THIS product: his Pickup Address default unless he switched it on the Price screen. Pack Point is
  // offered only when his pickup pincode is in a cluster (live: choosable; opening: shown disabled).
  const defaultMode = stackMode(fulfilmentChoice, persona);
  const pincode = usePickupPincode();
  const ppOption = packPointOption(pincode);
  const mode: ShipMode = type ? productShipMode(defaultMode, d.fulfilmentOverride, ppOption, type) : defaultMode;
  const makersPooled = mode === 'packPoint' && ppOption?.state === 'live' ? ppOption.makersPooled : undefined;
  const makingCost = numberIn(values.makingCost);
  const margin = numberIn(values.marginPct);
  const stack = type && makingCost !== null && makingCost > 0 && margin !== null && margin >= 0 ? costStack(type, makingCost, margin, mode, makersPooled) : null;
  const price = numberIn(row.meeshoPrice);
  const status = stack && type && price ? checkListingPrice(type, price, stack.breakEven) : null;
  const inventory = numberIn(row.inventory);
  const lot = type ? suggestedLot(type, makingCost ?? 0, numberIn(values.minRun)) : null;
  const typical = type ? typicalForType(type) : null;

  // Bot-owned cells follow the inputs until the maker edits them (same rule as the full form).
  useEffect(() => {
    if (!size) return;
    const patch: Partial<PriceRow> = {};
    if (filled.has('meeshoPrice')) {
      const v = stack ? String(stack.listPrice) : '';
      if (row.meeshoPrice !== v) patch.meeshoPrice = v;
    }
    // The first lot is the bot's suggestion (it follows the maker's minimum run) until the maker types a number.
    if (filled.has('inventory') && lot && row.inventory !== String(lot.units)) patch.inventory = String(lot.units);
    const p = Number(patch.meeshoPrice ?? row.meeshoPrice);
    if (filled.has('wdrp')) {
      const v = p ? String(suggestWdrp(p)) : '';
      if (row.wdrp !== v) patch.wdrp = v;
    }
    if (Object.keys(patch).length) d.setPrice(size, patch);
  }, [size, stack?.listPrice, row.meeshoPrice, row.wdrp, row.inventory, lot?.units, d.botFilled]); // eslint-disable-line react-hooks/exhaustive-deps
  // The description is regenerated from the filled attributes while it is still the bot's.
  useEffect(() => {
    if (!filled.has('description')) return;
    const desc = describeListing(values);
    if (values.description !== desc) d.setValue('description', desc);
  }, [values, d.botFilled]); // eslint-disable-line react-hooks/exhaustive-deps

  /** A maker edit: numbers cleaned, the field is no longer the bot's, packer follows manufacturer. */
  const setValue = (id: string, raw: string) => {
    const v = NUMBER_IDS.has(id) ? cleanNumberInput(id, raw) : raw;
    d.setValue(id, v);
    d.unmarkBot(id);
    if (id === 'netQuantity') d.setBot({ netQtyConfirmed: false });
    if (d.sameAsManufacturer) {
      const target = Object.entries(PACKER_FROM_MANUFACTURER).find(([, m]) => m === id)?.[0];
      if (target) d.setValue(target, v);
    }
  };
  const setPrice = (patch: Partial<PriceRow>) => {
    if (!size) return;
    const clean = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, NUMBER_IDS.has(k) ? cleanNumberInput(k, v ?? '') : v]));
    d.setPrice(size, clean);
    Object.keys(patch).forEach((k) => d.unmarkBot(k));
  };
  /** Gives a cell back to the bot (e.g. "Use ₹147" after changing the price). */
  const remarkBot = (id: string) => !filled.has(id) && d.setBot({ botFilled: [...d.botFilled, id] });

  /**
   * The Packer details follow the product's fulfilment (doc p.17 rule) while they are still the bot's. A changed value
   * puts the bot details back to "Needs your review" (isReviewed compares values, so an unchanged Packer doesn't).
   */
  const applyPacker = (m: ShipMode, retailPacked: boolean) => {
    const p = packerFor(m, retailPacked, persona);
    const own = Object.fromEntries(Object.entries(p.values).filter(([id]) => filled.has(id)));
    if (!Object.keys(own).length) return; // the maker typed his own Packer: it stays his
    d.setBot({ sameAsManufacturer: p.sameAsManufacturer });
    d.setValues(own);
  };
  /** [Self-ship] [Pack Point] on the Price screen: this product only; the onboarding default is untouched. */
  const setMode = (m: ShipMode) => {
    if (m === mode) return;
    d.setBot({ fulfilmentOverride: m });
    applyPacker(m, d.retailPacked);
  };
  const setRetailPacked = (on: boolean) => {
    d.setBot({ retailPacked: on });
    applyPacker(mode, on);
  };

  /** "Confirm details": the demo day's date and the real clock time of the click. */
  const confirm = () => d.setBot({ botReview: confirmReview(values, d.botFilled, day, clockTime(new Date())) });
  const reviewed = isReviewed(d.botReview, values, d.botFilled);

  /** All 14 maker values in one click; Net Quantity's "Yes" and the details review stay with the maker. */
  const fillDemo = () => {
    if (!type) return;
    const { mrp, ...v } = demoValues(type, persona, typical);
    d.setValues(v);
    if (mrp && size) d.setPrice(size, { mrp });
  };

  /** Without the review: how far the URL may go (a later Packer change mustn't throw him off the Price screen). */
  const stepState = { values, price: row, netQtyConfirmed: d.netQtyConfirmed };
  /** With the review: Next and the stepper tabs (Product's Next waits for "Confirm details"). */
  const reviewState = { ...stepState, reviewed };
  const done = Object.fromEntries(BOT_STEPS.map((s) => [s, stepDone(s, reviewState)])) as Record<BotStep, boolean>;
  /** Product's own questions answered and Pack of 1 confirmed (Next's tooltip says which is missing). */
  const productFieldsDone = stepDone('product', stepState);

  const checks = goLiveChecks({
    hasFrontImage: !!d.images[0],
    reviewed,
    missingFields: missingFields(values),
    missingPrices: size ? missingPrices(d.prices[size]) : ['meeshoPrice'],
    netQtyConfirmed: d.netQtyConfirmed,
    inputs: values,
    status,
    inventory,
  });

  return {
    d,
    persona,
    type,
    values,
    size,
    row,
    filled,
    mode,
    defaultMode,
    pincode,
    ppOption,
    setMode,
    setRetailPacked,
    makingCost,
    margin,
    stack,
    price,
    status,
    inventory,
    lot,
    typical,
    setValue,
    setPrice,
    remarkBot,
    fillDemo,
    reviewed,
    confirm,
    stepState,
    reviewState,
    productFieldsDone,
    done,
    checks,
  };
}

export type BotModel = ReturnType<typeof useBotModel>;
