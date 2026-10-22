// The maker's live listings as Catalog Uploads shows them (Single Uploads): his go-live listings, and after the
// listing day the scripted one (Jasmeet's bottle when the presenter jumped ahead) first, taking the first fake id.
// Shared by Catalog Uploads and the Warehouse Pack Point switch (PP-3), so both name the same catalog ids.
// `key` is stable across days (the display id shifts when the scripted listing joins): the real listing's id, or
// "scripted-<type>" for the scripted one. The Pack Point switch overlay (src/store/fulfilmentSwitch.ts) uses it.
import { useMemo } from 'react';
import { FIRST_ID, useListingsForPersona, type Listing } from '../../../store/catalog';
import { useDemo } from '../../../store/demo';
import { useScriptedListing, type ScriptedListing } from '../../../store/timeline';
import { LAUNCH } from '../factory-launch/launch';

export type LiveListing = Listing & { key: string; scripted: boolean };

export function liveListings(ours: Listing[], scripted: ScriptedListing | null, day: number): LiveListing[] {
  const own = (l: Listing): LiveListing => ({ ...l, key: l.id, scripted: false });
  if (!(scripted?.scripted && day > LAUNCH.listingDay)) return ours.map(own);
  return [
    { ...scripted, id: String(FIRST_ID), key: `scripted-${scripted.typeId}`, scripted: true },
    ...ours.map((l) => ({ ...own(l), id: String(Number(l.id) + 1) })),
  ];
}

const NONE: LiveListing[] = [];

/** The current persona's live listings (empty in plain mode, "Today vs ours"). */
export function useLiveListings(): LiveListing[] {
  const c2m = useDemo((s) => s.c2m);
  const day = useDemo((s) => s.day);
  const ours = useListingsForPersona();
  const scripted = useScriptedListing();
  return useMemo(() => (c2m ? liveListings(ours, scripted, day) : NONE), [c2m, ours, scripted, day]);
}
