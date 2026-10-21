// Make-to-Demand Growth Loop (GL-2 … GL-6): the D28 snapshot for the current persona and demo day.
// The maker inputs come from the persona's launch listing and commit, exactly as the Factory Launch
// screens derive them (src/store/timeline.ts): lot = committed units, lead time / minimum run /
// making cost from the listing, list price = the listing's Meesho price. Every number the growth
// inserts show comes from growthAt() (src/engine/growth.ts) through src/engine/ui.ts; B never does.
import { useMemo } from 'react';
import { formatDate, growthAt, type GrowthView, type MakerInputs } from '../../../engine/ui';
import { useDemo, type Persona } from '../../../store/demo';
import { useScriptedCommit, useScriptedListing } from '../../../store/timeline';

/** The seeded growth-loop SKUs (src/data/growth.json) are Jasmeet's. */
const GROWTH_PERSONA: Persona = 'jasmeet';

/** Pure: the maker inputs for growthAt from a listing and a commit, or null when either is missing. */
export function makerInputs(
  listing: { typeId: string; leadTimeDays: number; minRun: number; makingCost: number; price: number } | null,
  commit: { typeId: string; units: number } | null,
): MakerInputs | null {
  if (!listing || !commit || listing.typeId !== commit.typeId) return null;
  return { lot: commit.units, leadTimeDays: listing.leadTimeDays, minRun: listing.minRun, makingCost: listing.makingCost, listPrice: listing.price };
}

/** The growth-loop view on the demo day: null before D28, for other personas, or without a launch commit. */
export function useGrowth(): GrowthView | null {
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const listing = useScriptedListing();
  const commit = useScriptedCommit();
  return useMemo(() => {
    if (persona !== GROWTH_PERSONA) return null;
    const maker = makerInputs(listing, commit);
    return maker ? growthAt(day, maker) : null;
  }, [day, persona, listing, commit]);
}

/** "2026-11-21" → "21 Nov" (the year is implied on these cards). */
export const shortDate = (iso: string) => formatDate(iso).split(' ').slice(0, 2).join(' ');
