// LW-4 · the one eligibility drawer every "Check my eligibility" opens (finish screen, Home banner, pinned notice;
// also ?fl=open). UI state only: open or closed, never persisted. The host that renders it is mounted once, in
// App.tsx (pages/panel/factory-launch/EligibilityDrawer.tsx). Opening it never changes the route; only the buttons
// inside the drawer move the maker to another page.
import { create } from 'zustand';

/** Query param that opens the drawer on load (showcase jumps, old links); the host drops it once open. */
export const FL_OPEN_PARAM = 'fl';

interface EligibilityDrawerState {
  open: boolean;
  show: () => void;
  hide: () => void;
}

export const useEligibilityDrawer = create<EligibilityDrawerState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

/** Opens the drawer (for buttons outside React's render, e.g. a click handler that only has the store). */
export const openEligibility = () => useEligibilityDrawer.getState().show();
