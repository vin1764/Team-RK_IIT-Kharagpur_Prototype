import { cx } from '../../../components/ui';

/** Crystal segmented tabs (date-range chips, Orders/Sales switch), ported from the snapshot. */
export function SegmentTabs<K extends string>({
  tabs,
  active,
  onChange,
  itemClass,
}: {
  tabs: Array<{ id: K; label: string }>;
  active: K;
  onChange: (id: K) => void;
  itemClass?: string;
}) {
  return (
    <div
      role="tablist"
      className="flex max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border border-solid border-neutral-light rounded-md text-body-small leading-4 overflow-hidden"
      aria-orientation="horizontal"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          data-active={t.id === active}
          onClick={() => onChange(t.id)}
          className={cx(
            'py-2 cursor-pointer transition-all duration-200 ease-in-out text-neutral-primary bg-transparent border-0 border-solid whitespace-nowrap shrink-0 font-[inherit] hover:text-brand-primary focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 px-4 not-last:border-r not-last:border-r-neutral-light hover:bg-transparent data-[active=true]:text-brand-primary data-[active=true]:bg-brand-light data-[active=true]:font-medium data-[active=true]:overflow-hidden',
            itemClass,
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
