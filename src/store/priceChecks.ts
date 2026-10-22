// "Check price" on the bot's Price screen and the full form (LB-6): how many Factory Launch checks each product has
// used on the demo day, and the last price checked. Per persona + product type ("jasmeet:steel-bottle-1l"), so a
// new listing of the same product shares the day's checks. The rules are pure, in pages/panel/catalog/launchCheck.ts.
// Kept across reloads in localStorage (key PRICE_CHECK_STORAGE_KEY); "Reset demo" and the showcase's 'clean'
// prep clear it.
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductTypeId } from '../engine/ui';
import { applyCheck, type PriceCheckEntry } from '../pages/panel/catalog/launchCheck';
import { safeJSONStorage } from './catalog';
import { useDemo, type Persona } from './demo';

export const PRICE_CHECK_STORAGE_KEY = 'rk-price-checks-v1';

export const priceCheckKey = (persona: Persona, type: ProductTypeId) => `${persona}:${type}`;

interface PriceCheckState {
  entries: Record<string, PriceCheckEntry>;
  /** Uses one of today's checks on `price`; false (nothing changes) when none is left. */
  check: (key: string, day: number, price: number, breakEven: number) => boolean;
  reset: () => void;
}

export const usePriceChecks = create<PriceCheckState>()(
  persist(
    (set, get) => ({
      entries: {},
      check: (key, day, price, breakEven) => {
        const next = applyCheck(get().entries[key], day, price, breakEven);
        if (!next) return false;
        set((s) => ({ entries: { ...s.entries, [key]: next } }));
        return true;
      },
      reset: () => set({ entries: {} }),
    }),
    {
      name: PRICE_CHECK_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<PriceCheckState, 'entries'>>(),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

/** Empties the check records and removes their localStorage key ("Reset demo", showcase 'clean'). */
export function resetPriceChecks() {
  usePriceChecks.getState().reset();
  usePriceChecks.persist.clearStorage();
}

/** The current persona's record for a product type, and a "Check price" bound to it and the demo day. */
export function usePriceCheckEntry(type: ProductTypeId | null) {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const key = type ? priceCheckKey(persona, type) : null;
  const entry = usePriceChecks((s) => (key ? s.entries[key] : undefined));
  const check = usePriceChecks((s) => s.check);
  return useMemo(
    () => ({ entry, day, check: (price: number, breakEven: number) => (key ? check(key, day, price, breakEven) : false) }),
    [entry, day, key, check],
  );
}
