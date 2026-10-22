// Restock batches the maker confirmed on Inventory → Low Stock ("Plan this batch", GL-2), per persona and SKU.
// growthAt() applies them (src/engine/restockPlan.ts): from a batch's landing day the bottle's on-hand adds its
// units and its verdict is recomputed. The last batch in a list is the one the restock card shows ("Edit plan"
// replaces it; a new plan after it has landed is added after it).
// Kept across reloads in localStorage (key RESTOCK_PLAN_STORAGE_KEY); "Reset demo" clears it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlannedBatch } from '../engine/ui';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const RESTOCK_PLAN_STORAGE_KEY = 'rk-restock-v1';

export type ShipFrom = 'selfShip' | 'packPoint';

export interface StoredBatch extends PlannedBatch {
  /** where the batch is sent when it's ready: his own unit (self-ship) or his cluster's Pack Point */
  shipFrom: ShipFrom;
}

/** "jasmeet:bottle" */
export const planKey = (persona: Persona, sku: string) => `${persona}:${sku}`;

interface RestockPlanState {
  plans: Record<string, StoredBatch[]>;
  /** confirms a batch: replaces the last one (`replaceLast`, "Edit plan") or adds it after the others */
  confirm: (key: string, batch: StoredBatch, replaceLast: boolean) => void;
  reset: () => void;
}

export const useRestockPlans = create<RestockPlanState>()(
  persist(
    (set) => ({
      plans: {},
      confirm: (key, batch, replaceLast) =>
        set((s) => {
          const list = s.plans[key] ?? [];
          return { plans: { ...s.plans, [key]: [...(replaceLast ? list.slice(0, -1) : list), batch] } };
        }),
      reset: () => set({ plans: {} }),
    }),
    {
      name: RESTOCK_PLAN_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<RestockPlanState, 'plans'>>(),
      partialize: (s) => ({ plans: s.plans }),
    },
  ),
);

const NONE: StoredBatch[] = [];

/** The confirmed batches for a persona's SKU (a stable empty list when there are none). */
export function useRestockBatches(persona: Persona, sku: string): StoredBatch[] {
  return useRestockPlans((s) => s.plans[planKey(persona, sku)] ?? NONE);
}

/** Empties the restock plans and removes their localStorage key ("Reset demo", the showcase's clean prep). */
export function resetRestockPlans() {
  useRestockPlans.getState().reset();
  useRestockPlans.persist.clearStorage();
}
