// Factory Launch demo timeline. The presenter may jump straight to D23 without clicking through
// D3 (listing) and D5 (commit), so later days fall back to the scripted story for Jasmeet:
//   useScriptedListing() — her real go-live listing, or from D3 the listing the engine computes
//                          for her product (cost stack + suggested lot);
//   useScriptedCommit()  — her real commit, or after commitments close (D7) the scripted
//                          commit from launch.json (150 units at D5).
// Interactive actions always win. Samar and the reseller never get scripted data.
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkListingPrice, costStack, productTypeName, suggestedLot, typicalForType } from '../engine/ui';
import { botTypeFor, SCRIPTED_REVIEW_TIME } from '../pages/panel/catalog/bot';
import { LAUNCH, effectiveCommit, type Commit } from '../pages/panel/factory-launch/launch';
import { listingsFor, safeJSONStorage, useCatalog, useListingsForPersona, type Listing } from './catalog';
import { useDemo, type Persona } from './demo';
import { useMakerProduct, type ProductChoice } from './makerProduct';
import { PERSONAS } from './onboarding';

export const LAUNCH_STORAGE_KEY = 'rk-launch-v1';

/** The persona whose launch story is scripted (team answers, launch.json `commit`). */
const SCRIPTED_PERSONA: Persona = 'jasmeet';

interface LaunchState {
  commits: Partial<Record<Persona, Commit>>;
  commit: (persona: Persona, c: Commit) => void;
  reset: () => void;
}

export const useLaunch = create<LaunchState>()(
  persist(
    (set) => ({
      commits: {},
      commit: (persona, c) => set((s) => ({ commits: { ...s.commits, [persona]: c } })),
      reset: () => set({ commits: {} }),
    }),
    {
      name: LAUNCH_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<LaunchState, 'commits'>>(),
      partialize: (s) => ({ commits: s.commits }),
    },
  ),
);

/** Empties the commits and removes their localStorage key ("Reset demo"). */
export function resetLaunch() {
  useLaunch.getState().reset();
  useLaunch.persist.clearStorage();
}

export type ScriptedListing = Omit<Listing, 'id'> & { id: string; scripted: boolean };

/**
 * The listing the engine computes for a persona's own product (what Go live would have saved). None when
 * the maker told us (finish screen) they make something else: the scripted story is for her own product.
 */
export function scriptedListingFor(persona: Persona, choice?: ProductChoice): ScriptedListing | null {
  const p = PERSONAS[persona];
  if (persona !== SCRIPTED_PERSONA || !p.product) return null;
  if (choice && choice.type !== p.product.type) return null;
  const { type, makingCost, marginPct } = p.product;
  const mode = p.fulfilment;
  const stack = costStack(type, makingCost, marginPct, mode);
  const typical = typicalForType(type);
  return {
    id: '',
    persona,
    typeId: type,
    name: botTypeFor(type)?.bot.productName ?? productTypeName(type),
    price: stack.listPrice,
    breakEven: stack.breakEven,
    takeHome: stack.takeHome,
    inventory: suggestedLot(type, makingCost).units,
    minRun: typical?.minRun ?? 0,
    leadTimeDays: typical?.leadTimeDays ?? 0,
    makingCost,
    marginPct,
    fulfilment: mode,
    createdDay: LAUNCH.listingDay,
    // She confirmed the bot's details on the listing day (fixed time: the presenter skipped the click).
    reviewedAt: { day: LAUNCH.listingDay, time: SCRIPTED_REVIEW_TIME },
    status: 'live',
    scripted: true,
  };
}

/**
 * The persona's launch listing on `day`: a real listing of a launch product type first; else (Jasmeet, from the
 * listing day) the scripted one, so a later listing of another type (a casserole from "What to make instead") doesn't
 * replace her launched bottle; else her latest real listing.
 */
export function launchListing(listings: Listing[], persona: Persona, day: number, choice?: ProductChoice): ScriptedListing | null {
  const launch = listings.find((l) => LAUNCH.productTypes.includes(l.typeId));
  if (launch) return { ...launch, scripted: false };
  const scripted = day >= LAUNCH.listingDay ? scriptedListingFor(persona, choice) : null;
  if (scripted) return scripted;
  const latest = listings[listings.length - 1];
  return latest ? { ...latest, scripted: false } : null;
}

/** The current persona's live listing: real, or (Jasmeet, from D3) the scripted one. */
export function useScriptedListing(): ScriptedListing | null {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const listings = useListingsForPersona();
  const choice = useMakerProduct((s) => s.chosen[persona]);
  return useMemo(() => launchListing(listings, persona, day, choice), [listings, persona, day, choice]);
}

/** What a scripted commit would hold: the persona's launch listing, only if its price qualifies. */
function scriptedPrice(persona: Persona, listing: Pick<Listing, 'typeId' | 'price' | 'breakEven'> | null) {
  if (persona !== SCRIPTED_PERSONA || !listing || !LAUNCH.productTypes.includes(listing.typeId)) return null;
  if (checkListingPrice(listing.typeId, listing.price, listing.breakEven) !== 'qualifies') return null;
  return { typeId: listing.typeId, price: listing.price };
}

/** The current persona's commit on the demo day: real, or (Jasmeet, after D7) the scripted one. */
export function useScriptedCommit() {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const real = useLaunch((s) => s.commits[persona]);
  const listing = useScriptedListing();
  return useMemo(() => effectiveCommit(real, day, scriptedPrice(persona, listing)), [real, day, persona, listing]);
}

/**
 * Commits that hold a slot on the demo day, across personas (the order book shows them in
 * aggregate only). The scripted persona's listing counts even when another persona is viewing.
 */
export function useAllCommits(): Partial<Record<Persona, Commit & { scripted: boolean }>> {
  const day = useDemo((s) => s.day);
  const commits = useLaunch((s) => s.commits);
  const listings = useCatalog((s) => s.listings);
  const chosen = useMakerProduct((s) => s.chosen);
  return useMemo(() => {
    const out: Partial<Record<Persona, Commit & { scripted: boolean }>> = {};
    for (const p of Object.keys(PERSONAS) as Persona[]) {
      const listing = launchListing(listingsFor(listings, p), p, day, chosen[p]);
      const c = effectiveCommit(commits[p], day, scriptedPrice(p, listing));
      if (c) out[p] = c;
    }
    return out;
  }, [commits, day, listings, chosen]);
}
