// Pack Point choices a maker makes after onboarding (FO-8 drawer, PP-3 Warehouse card), per persona:
//  - switches: Warehouse "Switch to Pack Point · <city>" / "Switch back to self-ship" (which node, which listings);
//  - listings: an overlay on his live listings, keyed `${persona}:${listing key}` — the products a switch touched:
//    their fulfilment follows the switch, the Packer details change, and they go back to "Needs your review"
//    (Catalog Uploads reads it). Kept apart from src/store/catalog.ts so the go-live listings stay as saved;
//  - waitlist: "Join waitlist" on an opening Pack Point, `${persona}:${city}`;
//  - firstLots: "Plan first lot" after a switch (units per product, send day).
// Kept across reloads in localStorage (key SHIP_SWITCH_STORAGE_KEY); "Reset demo" (and the showcase's clean prep) clears it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductTypeId } from '../engine/ui';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const SHIP_SWITCH_STORAGE_KEY = 'rk-ship-switch-v1';

export type ShipMode = 'selfShip' | 'packPoint';

export interface ShipSwitch {
  mode: ShipMode;
  /** the Pack Point city (null when switched back to self-ship) */
  node: string | null;
  /** listing keys the switch applied to */
  listings: string[];
  /** demo day of the switch */
  day: number;
}

export interface ListingShipOverlay {
  fulfilment: ShipMode;
  node: string | null;
  packerChanged: true;
  needsReview: true;
}

export interface FirstLotLine {
  listing: string;
  type: ProductTypeId;
  units: number;
}

export interface FirstLot {
  node: string;
  sendDay: number;
  lines: FirstLotLine[];
}

interface ShipSwitchState {
  switches: Partial<Record<Persona, ShipSwitch>>;
  listings: Record<string, ListingShipOverlay>;
  waitlist: Record<string, true>;
  firstLots: Partial<Record<Persona, FirstLot>>;
  /** Confirm switch: the persona's mode and node, and the listings it touched (Packer changed, needs review). */
  applySwitch: (persona: Persona, s: ShipSwitch) => void;
  joinWaitlist: (persona: Persona, city: string) => void;
  saveFirstLot: (persona: Persona, lot: FirstLot) => void;
  reset: () => void;
}

export const listingOverlayKey = (persona: Persona, listingKey: string) => `${persona}:${listingKey}`;
export const waitlistKey = (persona: Persona, city: string) => `${persona}:${city}`;

export const useShipSwitch = create<ShipSwitchState>()(
  persist(
    (set) => ({
      switches: {},
      listings: {},
      waitlist: {},
      firstLots: {},
      applySwitch: (persona, s) =>
        set((st) => {
          const listings = { ...st.listings };
          for (const k of s.listings) listings[listingOverlayKey(persona, k)] = { fulfilment: s.mode, node: s.node, packerChanged: true, needsReview: true };
          // A new switch starts the first lot over (switching back drops it; a new node needs a new plan).
          const firstLots = { ...st.firstLots };
          delete firstLots[persona];
          return { switches: { ...st.switches, [persona]: s }, listings, firstLots };
        }),
      joinWaitlist: (persona, city) => set((st) => ({ waitlist: { ...st.waitlist, [waitlistKey(persona, city)]: true } })),
      saveFirstLot: (persona, lot) => set((st) => ({ firstLots: { ...st.firstLots, [persona]: lot } })),
      reset: () => set({ switches: {}, listings: {}, waitlist: {}, firstLots: {} }),
    }),
    {
      name: SHIP_SWITCH_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<ShipSwitchState, 'switches' | 'listings' | 'waitlist' | 'firstLots'>>(),
      partialize: (s) => ({ switches: s.switches, listings: s.listings, waitlist: s.waitlist, firstLots: s.firstLots }),
    },
  ),
);

/** Empties the switches, listing overlays, waitlist and first-lot plans and removes their localStorage key ("Reset demo", clean prep). */
export function resetShipSwitch() {
  useShipSwitch.getState().reset();
  useShipSwitch.persist.clearStorage();
}

/** The persona joined the waitlist of this Pack Point. */
export function useOnWaitlist(persona: Persona, city: string): boolean {
  return useShipSwitch((s) => !!s.waitlist[waitlistKey(persona, city)]);
}
