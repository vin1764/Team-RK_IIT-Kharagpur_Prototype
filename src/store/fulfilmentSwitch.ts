// Pack Point choices a maker makes after onboarding (FO-8 drawer, PP-3 Warehouse card), per persona:
//  - switches: Warehouse "Switch to Pack Point · <city>" / "Switch back to self-ship" (which node, which listings);
//  - listings: an overlay on his live listings, keyed `${persona}:${listing key}` — the products a switch touched:
//    their fulfilment follows the switch, the Packer details change, and they go back to "Needs your review"
//    (Catalog Uploads reads it). Kept apart from src/store/catalog.ts so the go-live listings stay as saved;
//  - waitlist: "Join waitlist" on an opening Pack Point, `${persona}:${city}`;
//  - lots: lots he planned to send to his Pack Point ("Plan first lot" after a switch, "Plan a lot" on the Lots tab):
//    units per product and the send day, oldest first.
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

/** A lot he planned (Lots tab): the plan plus its id and the demo day it was planned on. */
export interface PlannedLot extends FirstLot {
  id: string;
  planDay: number;
}

interface ShipSwitchState {
  switches: Partial<Record<Persona, ShipSwitch>>;
  listings: Record<string, ListingShipOverlay>;
  waitlist: Record<string, true>;
  lots: Partial<Record<Persona, PlannedLot[]>>;
  /** Confirm switch: the persona's mode and node, and the listings it touched (Packer changed, needs review). */
  applySwitch: (persona: Persona, s: ShipSwitch) => void;
  joinWaitlist: (persona: Persona, city: string) => void;
  /** Adds a lot (no id) or replaces the lot with that id. */
  saveLot: (persona: Persona, lot: FirstLot, planDay: number, id?: string) => void;
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
      lots: {},
      applySwitch: (persona, s) =>
        set((st) => {
          const listings = { ...st.listings };
          for (const k of s.listings) listings[listingOverlayKey(persona, k)] = { fulfilment: s.mode, node: s.node, packerChanged: true, needsReview: true };
          // A new switch starts the lots over (switching back drops them; a new node needs a new plan).
          const lots = { ...st.lots };
          delete lots[persona];
          return { switches: { ...st.switches, [persona]: s }, listings, lots };
        }),
      joinWaitlist: (persona, city) => set((st) => ({ waitlist: { ...st.waitlist, [waitlistKey(persona, city)]: true } })),
      saveLot: (persona, lot, planDay, id) =>
        set((st) => {
          const mine = st.lots[persona] ?? [];
          const next = id ? mine.map((l) => (l.id === id ? { ...l, ...lot } : l)) : [...mine, { ...lot, id: `lot-${mine.length + 1}`, planDay }];
          return { lots: { ...st.lots, [persona]: next } };
        }),
      reset: () => set({ switches: {}, listings: {}, waitlist: {}, lots: {} }),
    }),
    {
      name: SHIP_SWITCH_STORAGE_KEY,
      version: 2,
      storage: safeJSONStorage<Pick<ShipSwitchState, 'switches' | 'listings' | 'waitlist' | 'lots'>>(),
      partialize: (s) => ({ switches: s.switches, listings: s.listings, waitlist: s.waitlist, lots: s.lots }),
      // v1 kept one first lot per persona: it becomes that persona's lot-1.
      migrate: (old, version) => {
        const o = (old ?? {}) as Record<string, unknown>;
        if (version >= 2) return o as unknown as ShipSwitchState;
        const first = (o.firstLots ?? {}) as Partial<Record<Persona, FirstLot>>;
        const lots: Partial<Record<Persona, PlannedLot[]>> = {};
        for (const [p, l] of Object.entries(first)) if (l) lots[p as Persona] = [{ ...l, id: 'lot-1', planDay: l.sendDay }];
        return { switches: o.switches ?? {}, listings: o.listings ?? {}, waitlist: o.waitlist ?? {}, lots } as unknown as ShipSwitchState;
      },
    },
  ),
);

/** Empties the switches, listing overlays, waitlist and planned lots and removes their localStorage key ("Reset demo", clean prep). */
export function resetShipSwitch() {
  useShipSwitch.getState().reset();
  useShipSwitch.persist.clearStorage();
}

/** The persona joined the waitlist of this Pack Point. */
export function useOnWaitlist(persona: Persona, city: string): boolean {
  return useShipSwitch((s) => !!s.waitlist[waitlistKey(persona, city)]);
}
