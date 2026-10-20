// Tab + status config for Promotions / Sale Opt-in / Offer Opt-in.
// Tabs live in the URL (?tab=…&status=…) as on the live panel. To add a tab later
// (e.g. Phase 4's FACTORY_LAUNCH), append one entry to the list for that page.
import { useSearchParams } from 'react-router';

/** What the tab panel shows. 'events' = header image + status tabs + list; 'deals' = deals carousel + list. */
export type PromoTabKind = 'events' | 'deals';

export interface PromoTab {
  /** Value of the `tab` query param (and the button id, `tab-<value>`, as on the panel). */
  value: string;
  label: string;
  /** Pink "NEW" tag after the label. */
  isNew?: boolean;
  kind: PromoTabKind;
  /** Noun used by the empty state: "No upcoming <noun> events yet". */
  noun: string;
}

export const SALE_TAB: PromoTab = { value: 'SALE', label: 'Sale Events', kind: 'events', noun: 'sale' };
export const DEAL_TAB: PromoTab = { value: 'DEAL', label: 'Deals', isNew: true, kind: 'deals', noun: 'deal' };
export const FLASH_TAB: PromoTab = { value: 'FLASH', label: 'Flash Events', kind: 'events', noun: 'flash' };

export const PROMOTIONS_TABS: PromoTab[] = [SALE_TAB, DEAL_TAB, FLASH_TAB];
export const SALE_OPT_IN_TABS: PromoTab[] = [SALE_TAB, FLASH_TAB];
export const OFFER_OPT_IN_TABS: PromoTab[] = [DEAL_TAB];

/** Status sub-tabs. The panel's own ids are tab-UPCOMING / tab-LIVE / tab-COMPLETED. */
export const STATUSES = [
  { value: 'UPCOMING', label: 'Upcoming', word: 'upcoming' },
  { value: 'LIVE', label: 'Live', word: 'live' },
  { value: 'COMPLETED', label: 'Expired', word: 'expired' },
] as const;
export type Status = (typeof STATUSES)[number];

const STATUS_ALIASES: Record<string, string> = { EXPIRED: 'COMPLETED' };

/**
 * Reads/writes `tab` and `status` in the query string, keeping every other param
 * (persona, day, lang…) the demo adds.
 */
export function usePromoParams(tabs: PromoTab[]) {
  const [params, setParams] = useSearchParams();
  const tab = tabs.find((t) => t.value === params.get('tab')) ?? tabs[0]!;
  const rawStatus = (params.get('status') ?? '').toUpperCase();
  const status = STATUSES.find((s) => s.value === (STATUS_ALIASES[rawStatus] ?? rawStatus)) ?? STATUSES[0];

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );

  const setTab = (t: PromoTab) => update({ tab: t.value, status: t.kind === 'events' ? 'UPCOMING' : null });
  const setStatus = (s: Status) => update({ status: s.value });
  return { tab, status, setTab, setStatus };
}
