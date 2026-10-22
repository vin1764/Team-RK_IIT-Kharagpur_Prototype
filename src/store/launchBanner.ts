// Home Factory Launch banner (LW-6): which banner state the maker dismissed with ×, per persona. The × only
// appears once the maker has committed or the commitment window has closed; a later state (live, slot
// removed…) shows again. Kept in localStorage with a memory fallback (safeJSONStorage); "Reset demo" clears it.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './catalog';
import type { Persona } from './demo';

export const LAUNCH_BANNER_STORAGE_KEY = 'rk-fl-banner-v1';

interface LaunchBannerState {
  dismissed: Partial<Record<Persona, string>>;
  dismiss: (persona: Persona, state: string) => void;
  reset: () => void;
}

export const useLaunchBanner = create<LaunchBannerState>()(
  persist(
    (set) => ({
      dismissed: {},
      dismiss: (persona, state) => set((s) => ({ dismissed: { ...s.dismissed, [persona]: state } })),
      reset: () => set({ dismissed: {} }),
    }),
    {
      name: LAUNCH_BANNER_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<Pick<LaunchBannerState, 'dismissed'>>(),
      partialize: (s) => ({ dismissed: s.dismissed }),
    },
  ),
);

/** Forgets every dismissal and removes the localStorage key ("Reset demo"). */
export function resetLaunchBanner() {
  useLaunchBanner.getState().reset();
  useLaunchBanner.persist.clearStorage();
}
