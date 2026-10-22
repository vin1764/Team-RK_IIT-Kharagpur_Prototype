// SKU Health Coach (GL-3): the fix the maker applied, per persona — "Change main photo" on the lunch box.
// The applied photo replaces the SKU's main image everywhere it shows (Inventory, the coach cards); nothing else
// about the listing changes, so its bot-details review is untouched. Kept across reloads in localStorage
// (COACH_FIX_STORAGE_KEY); "Reset demo" and the showcase's clean prep clear it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const COACH_FIX_STORAGE_KEY = 'rk-coach-fix-v1';

export interface AppliedCoachFix {
  /** growth SKU id, e.g. "lunchbox" */
  sku: string;
  /** demo day it was applied */
  day: number;
  /** the new main photo: the suggested one (a public path) or his upload, cleaned in the browser (a data URL) */
  image: string;
  source: 'suggested' | 'upload';
}

interface CoachFixState {
  applied: Partial<Record<Persona, AppliedCoachFix>>;
  apply: (persona: Persona, fix: AppliedCoachFix) => void;
  reset: () => void;
}

export const useCoachFix = create<CoachFixState>()(
  persist(
    (set) => ({
      applied: {},
      apply: (persona, fix) => set((s) => ({ applied: { ...s.applied, [persona]: fix } })),
      reset: () => set({ applied: {} }),
    }),
    {
      name: COACH_FIX_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<CoachFixState, 'applied'>>(),
      partialize: (s) => ({ applied: s.applied }),
    },
  ),
);

/** Empties the applied fixes and removes their localStorage key ("Reset demo", clean prep). */
export function resetCoachFix() {
  useCoachFix.getState().reset();
  useCoachFix.persist.clearStorage();
}
