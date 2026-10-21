import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';

export interface PricingTab {
  id: string;
  label: string;
  count?: number;
  /** Rendered after the label, e.g. a NEW pill for a later tab. */
  badge?: ReactNode;
  /** Doc ID for C2M inserts (data-c2m). */
  c2m?: string;
}

/** Manage Pricing's sticky underline tab bar (ported from data-testid="ipp-tabs-v2"). */
export function PricingTabs({ tabs, active, onChange }: { tabs: PricingTab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="w-full sticky bg-neutral-page z-5 pb-0 pt-0 mt-3 top-[calc(var(--concept-strip-h)+4.3125rem)]">
      <div className="bg-neutral-base px-0" data-testid="ipp-tabs-v2">
        <div className="flex justify-between items-center pt-2 border-0 border-b border-solid border-b-neutral-light mb-px px-4">
          <div
            role="tablist"
            className="flex max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-body-medium leading-5 md:tracking-[-0.1px] gap-2 overflow-visible"
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
                  data-c2m={t.c2m}
                  data-c2m-id={t.c2m}
                  onClick={() => onChange(t.id)}
                  className={cx(
                    'cursor-pointer transition-all duration-200 ease-in-out bg-transparent border-0 border-solid whitespace-nowrap shrink-0 font-[inherit] text-neutral-primary hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border-b-2 border-b-transparent data-[active=true]:text-brand-primary data-[active=true]:border-b-brand-base px-3 text-body-medium font-normal data-[active=true]:font-medium leading-5 py-2 mt-1 border-x border-x-transparent',
                    t.badge != null && 'inline-flex items-center gap-1',
                  )}
                >
                  {t.label}
                  {t.count != null && ` (${t.count})`}
                  {t.badge}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
