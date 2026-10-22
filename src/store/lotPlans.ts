// First lots the maker planned from Inventory → "What to make instead" → "Plan a lot" (GL-6), per persona and
// product type: how many units, which demo day production starts, his lead time (the ready day = start + lead).
// The suggestion's card then shows "Lot planned · 80 units · ready 26 Nov" with "Edit".
// Kept across reloads in localStorage (key LOT_PLAN_STORAGE_KEY); "Reset demo" and the showcase's clean prep clear it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductTypeId } from '../engine/ui';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const LOT_PLAN_STORAGE_KEY = 'rk-lot-plans-v1';

export interface StoredLot {
  units: number;
  startDay: number;
  leadTimeDays: number;
}

/** "jasmeet:steel-casserole-1-5l" */
export const lotKey = (persona: Persona, type: ProductTypeId) => `${persona}:${type}`;

interface LotPlanState {
  plans: Record<string, StoredLot>;
  /** saves (or replaces, on "Edit") the plan for one persona's product type */
  save: (key: string, lot: StoredLot) => void;
  reset: () => void;
}

export const useLotPlans = create<LotPlanState>()(
  persist(
    (set) => ({
      plans: {},
      save: (key, lot) => set((s) => ({ plans: { ...s.plans, [key]: lot } })),
      reset: () => set({ plans: {} }),
    }),
    {
      name: LOT_PLAN_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<LotPlanState, 'plans'>>(),
      partialize: (s) => ({ plans: s.plans }),
    },
  ),
);

/** The saved plan for a persona's product type, or null. */
export function useLotPlan(persona: Persona, type: ProductTypeId): StoredLot | null {
  return useLotPlans((s) => s.plans[lotKey(persona, type)] ?? null);
}

/** Empties the lot plans and removes their localStorage key ("Reset demo", the showcase's clean prep). */
export function resetLotPlans() {
  useLotPlans.getState().reset();
  useLotPlans.persist.clearStorage();
}
