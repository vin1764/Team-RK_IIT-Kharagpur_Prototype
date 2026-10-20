import type { ReactNode } from 'react';
import { CrystalTip, T } from '../manage-pricing/crystal';
import { cx } from '../../../components/ui';

export interface InvTab {
  id: string;
  label: string;
  count: number;
  /** (i) tooltip text; the live panel's copy wasn't captured. */
  info?: string;
}

const LABEL = (size: 'md' | 'sm') => (size === 'md' ? T.bodyMd : T.bodySm);

/** Inventory status tabs: Active / Activation Pending / Blocked / Paused (underline style). */
export function StatusTabs({ tabs, active, onChange, children }: { tabs: InvTab[]; active: string; onChange: (id: string) => void; children?: ReactNode }) {
  return (
    <div className="bg-neutral-base relative">
      <div
        role="tablist"
        className="flex max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-0 border-b border-solid border-b-neutral-light text-body-medium leading-5 gap-2 pl-4 pt-2"
        aria-orientation="horizontal"
      >
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              data-active={on}
              onClick={() => onChange(t.id)}
              className="py-2 px-3 cursor-pointer transition-all duration-200 ease-in-out text-neutral-primary bg-transparent border-0 border-solid whitespace-nowrap shrink-0 font-[inherit] hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border-b-2 border-b-transparent data-[active=true]:text-brand-primary data-[active=true]:border-b-brand-base"
            >
              <div className="flex items-center gap-1">
                <p className={cx(LABEL('md'), on ? 'text-brand-primary' : 'text-neutral-primary')}>
                  {t.label} ({t.count})
                </p>
                {t.info && (
                  <div className="h-4">
                    <CrystalTip text={t.info} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

/**
 * Inventory stock tabs: All Stock / Out of Stock / Low Stock (folder-tab style), with the
 * "Bulk Stock Update" action on the right. The page renders the active tab's content below it,
 * so a later phase can add cards for Low Stock there.
 */
export function StockTabs({ tabs, active, onChange, action }: { tabs: InvTab[]; active: string; onChange: (id: string) => void; action?: ReactNode }) {
  return (
    <div className="bg-neutral-base flex pt-3">
      <div className="border-0 border-b border-solid border-neutral-light w-4" />
      <div role="tablist" className="flex max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-body-small leading-4" aria-orientation="horizontal">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              data-active={on}
              onClick={() => onChange(t.id)}
              className="py-2 px-3 cursor-pointer transition-all duration-200 ease-in-out text-neutral-primary bg-transparent border-solid whitespace-nowrap shrink-0 font-[inherit] hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border border-transparent rounded-t-6 data-[active=true]:text-brand-primary data-[active=true]:bg-neutral-base data-[active=true]:border-neutral-light data-[active=false]:border-b-neutral-light data-[active=true]:border-b-transparent"
            >
              <div className="flex items-center gap-1">
                <p className={cx(LABEL('sm'), on ? 'text-brand-primary' : 'text-neutral-primary')}>
                  {t.label} ({t.count})
                </p>
                {t.info && (
                  <div className="h-4">
                    <CrystalTip text={t.info} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex-1 border-0 border-b border-solid border-neutral-light flex items-center justify-end">{action}</div>
    </div>
  );
}
