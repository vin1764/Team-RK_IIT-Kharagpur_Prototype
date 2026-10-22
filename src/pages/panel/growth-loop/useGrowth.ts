// Make-to-Demand Growth Loop (GL-2 … GL-6): the D28 snapshot for the current persona and demo day.
// The maker inputs come from the persona's launch listing and commit, exactly as the Factory Launch
// screens derive them (src/store/timeline.ts): lot = committed units, lead time / minimum run /
// making cost from the listing, list price = the listing's Meesho price. Every number the growth
// inserts show comes from growthAt() (src/engine/growth.ts) through src/engine/ui.ts; B never does.
import { useMemo } from 'react';
import { formatDate, growthAt, type GrowthView, type MakerInputs } from '../../../engine/ui';
import { useDemo, type Persona } from '../../../store/demo';
import { useCoachFix } from '../../../store/coachFix';
import { useRestockBatches } from '../../../store/restockPlan';
import { useScriptedCommit, useScriptedListing } from '../../../store/timeline';

/** The seeded growth-loop SKUs (src/data/growth.json) are Jasmeet's. */
const GROWTH_PERSONA: Persona = 'jasmeet';

/** The SKU with tracked stock in the demo (the launched bottle): the restock card and its plans are for it. */
export const STOCKED_SKU = 'bottle';

/** Pure: the maker inputs for growthAt from a listing and a commit, or null when either is missing. */
export function makerInputs(
  listing: { typeId: string; leadTimeDays: number; minRun: number; makingCost: number; price: number } | null,
  commit: { typeId: string; units: number } | null,
): MakerInputs | null {
  if (!listing || !commit || listing.typeId !== commit.typeId) return null;
  return { lot: commit.units, leadTimeDays: listing.leadTimeDays, minRun: listing.minRun, makingCost: listing.makingCost, listPrice: listing.price };
}

/**
 * The growth-loop view on the demo day: null before D28, for other personas, without a launch commit, or in
 * plain mode ("Today vs ours", c2m off), where Inventory, Business Dashboard and Home show their captured state.
 * Restock batches the maker confirmed ("Plan this batch", src/store/restockPlan.ts) are applied from the day they land;
 * a coach fix he applied counts from its day (moving the demo day back before it shows the fix again).
 */
export function useGrowth(): GrowthView | null {
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const c2m = useDemo((s) => s.c2m);
  const listing = useScriptedListing();
  const commit = useScriptedCommit();
  const batches = useRestockBatches(persona, STOCKED_SKU);
  // The coach fix he applied ("Change main photo"): its check a week later (src/store/coachFix.ts).
  const fix = useCoachFix((s) => s.applied[persona]);
  const appliedSku = fix?.sku;
  const appliedDay = fix && fix.day <= day ? fix.day : undefined;
  return useMemo(() => {
    if (!c2m || persona !== GROWTH_PERSONA) return null;
    const maker = makerInputs(listing, commit);
    const applied = appliedSku && appliedDay !== undefined ? { sku: appliedSku, day: appliedDay } : null;
    return maker ? growthAt(day, maker, batches, applied) : null;
  }, [c2m, day, persona, listing, commit, batches, appliedSku, appliedDay]);
}

/** "2026-11-21" → "21 Nov" (the year is implied on these cards). */
export const shortDate = (iso: string) => formatDate(iso).split(' ').slice(0, 2).join(' ');
