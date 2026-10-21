// Listings the maker has put live in the demo (LB-8 Go live). Later phases read this:
// Factory Launch commit (D5), restock (D31), price edit (D40).
import { create } from 'zustand';
import type { ProductTypeId } from '../engine/ui';

export interface Listing {
  /** Fake catalog id, deterministic (no Math.random / Date.now). */
  id: string;
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

/** Fake catalog ids count up from here (the seeded single upload is 123456789). */
const FIRST_ID = 900000001;

export const useCatalog = create<CatalogState>((set, get) => ({
  listings: [],
  addListing: (l) => {
    const listing: Listing = { ...l, id: String(FIRST_ID + get().listings.length), status: 'live' };
    set((s) => ({ listings: [...s.listings, listing] }));
    return listing;
  },
  reset: () => set({ listings: [] }),
}));
