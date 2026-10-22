// State of the three short "Create from photos" screens: the draft, the engine numbers derived from it
// (cost stack → list price → take-home → status; suggested lot) and the setters the screens share.
// Every number comes from src/engine/ui.ts or the seed JSON; B never enters here (status only).
import { useEffect } from 'react';
import { checkListingPrice, costStack, suggestedLot, typicalForType } from '../../../../engine/ui';
import { useBotProductType } from '../../../../store/makerProduct';
import { useOnboarding, usePersona } from '../../../../store/onboarding';
import {
  BOT_STEPS,
  cleanNumberInput,
  demoValues,
  describeListing,
  goLiveChecks,
  numberIn,
  NUMBER_IDS,
  stackMode,
  stepDone,
  type BotStep,
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

  const mode = stackMode(fulfilmentChoice, persona);
  const makingCost = numberIn(values.makingCost);
  const margin = numberIn(values.marginPct);
  const stack = type && makingCost !== null && makingCost > 0 && margin !== null && margin >= 0 ? costStack(type, makingCost, margin, mode) : null;
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

  /** All 14 maker values in one click; Net Quantity's "Yes" stays with the maker. */
  const fillDemo = () => {
    if (!type) return;
    const { mrp, ...v } = demoValues(type, persona, typical);
    d.setValues(v);
    if (mrp && size) d.setPrice(size, { mrp });
  };

  const stepState = { values, price: row, netQtyConfirmed: d.netQtyConfirmed };
  const done = Object.fromEntries(BOT_STEPS.map((s) => [s, stepDone(s, stepState)])) as Record<BotStep, boolean>;

  const checks = goLiveChecks({
    hasFrontImage: !!d.images[0],
    missingFields: missingFields(values),
    missingPrices: size ? missingPrices(d.prices[size]) : ['meeshoPrice'],
    netQtyConfirmed: d.netQtyConfirmed,
    inputs: values,
    status,
    inventory,
  });

  return { d, persona, type, values, size, row, filled, mode, makingCost, margin, stack, price, status, inventory, lot, typical, setValue, setPrice, remarkBot, fillDemo, stepState, done, checks };
}

export type BotModel = ReturnType<typeof useBotModel>;
