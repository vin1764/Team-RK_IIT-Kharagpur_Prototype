// Listings the maker has put live in the demo (LB-8 Go live). Later phases read this:
// Factory Launch commit (D5), restock (D31), price edit (D40).
// Kept across reloads in localStorage (key CATALOG_STORAGE_KEY); "Reset demo" clears it.
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ProductTypeId } from '../engine/ui';
import { useDemo, type Persona } from './demo';

export interface Listing {
  /** Fake catalog id, deterministic (no Math.random / Date.now). */
  id: string;
  /** The demo persona who put it live: listings are per persona. */
  persona: Persona;
  typeId: ProductTypeId;
  name: string;
  price: number;
  breakEven: number;
  takeHome: number;
  inventory: number;
  minRun: number;
  leadTimeDays: number;
  makingCost: number;
  marginPct: number;
  fulfilment: 'selfShip' | 'packPoint';
  createdDay: number;
  status: 'live';
}

interface CatalogState {
  listings: Listing[];
  addListing: (l: Omit<Listing, 'id' | 'status'>) => Listing;
  reset: () => void;
}

/** Versioned localStorage keys of the persisted demo stores. */
export const CATALOG_STORAGE_KEY = 'rk-catalog-v1';
export const DRAFT_STORAGE_KEY = 'rk-draft-v1';

/**
 * localStorage when it works, else an in-memory map, so a blocked or absent storage
 * (private window, sandboxed iframe, tests) never crashes the demo.
 */
const memory = new Map<string, string>();
function local(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = '__rk_probe__';
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
export const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return local()?.getItem(k) ?? memory.get(k) ?? null;
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    memory.set(k, v);
    try {
      local()?.setItem(k, v);
    } catch {
      /* memory copy is enough */
    }
  },
  removeItem: (k) => {
    memory.delete(k);
    try {
      local()?.removeItem(k);
    } catch {
      /* nothing to remove */
    }
  },
};
export const safeJSONStorage = <S>() => createJSONStorage<S>(() => safeStorage);

/** Fake catalog ids count up from here (the seeded single upload is 123456789). */
const FIRST_ID = 900000001;

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      listings: [],
      addListing: (l) => {
        const listing: Listing = { ...l, id: String(FIRST_ID + get().listings.length), status: 'live' };
        set((s) => ({ listings: [...s.listings, listing] }));
        return listing;
      },
      reset: () => set({ listings: [] }),
    }),
    {
      name: CATALOG_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<CatalogState, 'listings'>>(),
      partialize: (s) => ({ listings: s.listings }),
    },
  ),
);

/** Empties the go-live listings and removes their localStorage key ("Reset demo"). */
export function resetCatalog() {
  useCatalog.getState().reset();
  useCatalog.persist.clearStorage();
}

/** The listings one persona put live. */
export const listingsFor = (listings: Listing[], persona: Persona) => listings.filter((l) => l.persona === persona);

/** The current demo persona's go-live listings (Catalog Uploads, Home step 2, later phases). */
export function useListingsForPersona(): Listing[] {
  const persona = useDemo((s) => s.persona);
  const listings = useCatalog((s) => s.listings);
  return useMemo(() => listingsFor(listings, persona), [listings, persona]);
}
