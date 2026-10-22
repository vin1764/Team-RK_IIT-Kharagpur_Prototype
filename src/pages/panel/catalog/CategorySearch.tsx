// "Search Category" box. Typing lists matching leaves as "<b>Leaf</b> in Root" (the style of the
// "Home Temple in Home & Kitchen" suggestion in catalog-select-category.png); picking one selects
// its full path in the tree and shows the pick inside the box. `search` swaps the matcher (the onboarding
// finish screen also finds product types outside the captured tree).
import { forwardRef, useState } from 'react';
import { searchLeaves, type LeafHit } from './categories';

export const CategorySearch = forwardRef<HTMLInputElement, { onPick: (path: string[]) => void; search?: (q: string) => LeafHit[]; placeholder?: string }>(function CategorySearch(
  { onPick, search = searchLeaves, placeholder = 'Try Sarees, Toys, Charger, Mugs and more...' },
  ref,
) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<LeafHit | null>(null);
  const [focus, setFocus] = useState(false);
  const hits = search(q);

  const choose = (h: LeafHit) => {
    setPicked(h);
    setQ('');
    onPick(h.path);
  };

  return (
    <div data-testid="categorySearchContainer">
      <div className="relative w-119">
        <div className="flex flex-col h-11 gap-0 bg-primary-bg">
          <div className="group text-sm flex relative font-normal leading-5 items-center box-border w-full p-0 m-0 text-primary-text border border-solid border-secondary-border rounded-sm transition-[border-color] duration-200 ease-in-out focus-within:border-brand-primary-border hover:border-brand-primary-border h-11 gap-0 bg-primary-bg">
            <div className="ml-3 flex items-center">
              <img src="/brand/msa/merlin/lined/search-grey.svg" alt="" width="30" height="30" />
            </div>
            <input
              ref={ref}
              className="peer flex-1 bg-transparent border-none [font-family:inherit] rounded-sm outline-none px-4 z-1 placeholder:text-secondary-border min-h-0 p-2! text-lg text-primary-text"
              type="text"
              value={q}
              placeholder={picked ? '' : placeholder}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked(null);
              }}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              data-testid="categorySearchInputBox"
            />
            {picked && !q && (
              <div className="pointer-events-none absolute left-15 right-4 truncate text-xl leading-5 font-body text-primary-text">
                <span className="font-button">{picked.leaf}</span> in {picked.root}
              </div>
            )}
          </div>
        </div>
        {/* No-match copy wasn't captured, so an empty search simply shows no list. */}
        {focus && hits.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-75 overflow-y-auto rounded-sm bg-white shadow-[0_4px_20px_0_rgba(0,0,0,0.15)]">
            {hits.map((h) => (
                <button
                  key={h.path.join('/')}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(h)}
                  className="block w-full cursor-pointer border-0 border-b border-solid border-b-tertiary-border bg-white px-4 py-3 text-left text-xl leading-5 font-body text-primary-text hover:bg-brand-secondary-bg"
                >
                  <span className="font-button">{h.leaf}</span> in {h.root}
                </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
