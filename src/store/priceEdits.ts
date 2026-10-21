// Price edits on Manage Pricing → Price position (PI-2, PI-3). A separate store so the listing a
// maker put live (src/store/catalog.ts) and the launch history built on it stay as they were: the
// D21–D30 launch, its commit and the D28 growth snapshot keep the go-live price; only the price
// position, the price-hold and the "slot removed" state read the edited price.
// Kept across reloads in localStorage (key PRICE_EDIT_STORAGE_KEY); "Reset demo" clears it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const PRICE_EDIT_STORAGE_KEY = 'rk-price-edit-v1';

export interface PriceEdit {
  /** the new Meesho price, ₹ */
  price: number;
  /** demo day the maker saved it on */
  day: number;
}

interface PriceEditState {
  edits: Partial<Record<Persona, PriceEdit>>;
  setPrice: (persona: Persona, edit: PriceEdit) => void;
  reset: () => void;
}

export const usePriceEdits = create<PriceEditState>()(
  persist(
    (set) => ({
      edits: {},
      setPrice: (persona, edit) => set((s) => ({ edits: { ...s.edits, [persona]: edit } })),
      reset: () => set({ edits: {} }),
    }),
    {
      name: PRICE_EDIT_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<PriceEditState, 'edits'>>(),
      partialize: (s) => ({ edits: s.edits }),
    },
  ),
);

/** Empties the price edits and removes their localStorage key ("Reset demo"). */
export function resetPriceEdits() {
  usePriceEdits.getState().reset();
  usePriceEdits.persist.clearStorage();
}
