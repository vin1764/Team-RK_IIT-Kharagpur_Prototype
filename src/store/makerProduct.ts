// What the maker makes (FO-4, FO-5 on the onboarding finish screen). We can't trust Udyam or IndiaMART
// data to know a maker's exact product, so the maker tells us: a category leaf picked from Meesho's own
// tree / search, or a product type recognised from one photo. The chosen type drives the demand teaser,
// the cost check, the Home banner's slot line, "Create from photos" and the order-book row.
//
// Scripted path (like the scripted D5 commit): once the presenter is past the onboarding day (day ≥
// SCRIPTED_FROM_DAY) without having chosen, the persona's seeded product (personas.json product.type)
// counts as chosen, so the D3 … D50 demos run unchanged. An interactive choice always wins.
// Kept across reloads in localStorage (key PRODUCT_STORAGE_KEY); "Reset demo" clears it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import calendar from '../data/calendar.json';
import type { ProductTypeId } from '../engine/ui';
import { safeJSONStorage } from './catalog';
import { useDemo, type Persona } from './demo';
import { PERSONAS } from './onboarding';

export const PRODUCT_STORAGE_KEY = 'rk-product-v1';

/** The day after onboarding (D1): from here the seeded product counts as told. */
export const SCRIPTED_FROM_DAY = calendar.jumps.onboarding + 1;

export interface ProductChoice {
  /** Meesho category path the maker picked (or the recognised type's path) */
  categoryPath: string[];
  /** the product type behind that leaf; null when the prototype has no product type for it */
  type: ProductTypeId | null;
  via: 'category' | 'photo';
}

interface MakerProductState {
  chosen: Partial<Record<Persona, ProductChoice>>;
  choose: (persona: Persona, c: ProductChoice) => void;
  clear: (persona: Persona) => void;
  reset: () => void;
}

export const useMakerProduct = create<MakerProductState>()(
  persist(
    (set) => ({
      chosen: {},
      choose: (persona, c) => set((s) => ({ chosen: { ...s.chosen, [persona]: c } })),
      clear: (persona) =>
        set((s) => {
          const next = { ...s.chosen };
          delete next[persona];
          return { chosen: next };
        }),
      reset: () => set({ chosen: {} }),
    }),
    {
      name: PRODUCT_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<MakerProductState, 'chosen'>>(),
      partialize: (s) => ({ chosen: s.chosen }),
    },
  ),
);

/** Empties the choices and removes their localStorage key ("Reset demo"). */
export function resetMakerProduct() {
  useMakerProduct.getState().reset();
  useMakerProduct.persist.clearStorage();
}

export interface MakerProduct {
  /** the product type that counts on this day: chosen, or (past onboarding) the seeded one */
  type: ProductTypeId | null;
  /** the maker has told us what they make (or the scripted story says so) */
  told: boolean;
  source: 'chosen' | 'scripted' | null;
  /** the leaf the maker picked, when chosen */
  choice: ProductChoice | null;
}

/** Pure: the maker's product on `day` from the interactive choice and the persona's seed. */
export function makerProduct(persona: Persona, day: number, choice: ProductChoice | undefined): MakerProduct {
  if (choice) return { type: choice.type, told: true, source: 'chosen', choice };
  const seeded = PERSONAS[persona].product?.type ?? null;
  if (seeded && day >= SCRIPTED_FROM_DAY) return { type: seeded, told: true, source: 'scripted', choice: null };
  return { type: null, told: false, source: null, choice: null };
}

/** The current persona's product (chosen-or-scripted) on the demo day. */
export function useMakerProductType(): MakerProduct {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const choice = useMakerProduct((s) => s.chosen[persona]);
  return makerProduct(persona, day, choice);
}

/**
 * The type "Create from photos" works on: the maker's product, or else what the bot recognises from the
 * photos (the persona's own product). Photo recognition is itself a way of telling us the product.
 */
export function useBotProductType(): ProductTypeId | null {
  const persona = useDemo((s) => s.persona);
  const m = useMakerProductType();
  return m.type ?? PERSONAS[persona].product?.type ?? null;
}
