// Four scrolling columns of categories (shared by Add Single Catalog and Bulk Catalog Upload).
// Row/notch classes are the snapshot's (reference/html/meesho-catalog-*-category.html).
import { toast } from '../../../components/Toast';
import { columnsFor, LEAF_DEPTH, type CategoryNode } from './categories';

const ROW =
  'gap-1 cursor-pointer transition-all duration-200 ease-in-out px-4 flex h-auto items-center justify-start rounded-none border-0 border-b border-solid border-b-tertiary-border p-3! text-left font-body text-xl leading-5 font-normal w-[calc(100%-1rem)]';
const ROW_ON = 'bg-brand-primary-bg text-brand-foreground-text hover:bg-brand-primary-bg';
const ROW_OFF = 'bg-primary-bg text-primary-text hover:bg-brand-secondary-bg';

function Notch() {
  return <div className="relative -right-4 -mt-1.25 -ml-4.5 size-0 border-0 border-solid border-y-12 border-l-13 border-y-transparent border-l-brand-primary-bg" />;
}

/** The bookmark differs between the two snapshots (inline SVG on single, lined icon on bulk). */
function YourCategoriesIcon({ variant }: { variant: 'single' | 'bulk' }) {
  return variant === 'single' ? (
    <div className="relative top-0.5 -ml-0.75 mr-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 5a1 1 0 011-1h12a1 1 0 011 1v15.913a.5.5 0 01-.825.38L12 16l-6.175 5.293a.5.5 0 01-.825-.38V5z" fill="#FFFFFF" />
      </svg>
    </div>
  ) : (
    <div className="relative top-0.5 -ml-0.75 mr-1">
      <img src="/brand/msa/merlin/lined/bookmark-white.svg" alt="" width="20" height="20" className="block" />
    </div>
  );
}

export function CategoryTree({
  path,
  onChange,
  variant,
  onSearchCategory,
}: {
  path: string[];
  onChange: (p: string[]) => void;
  variant: 'single' | 'bulk';
  onSearchCategory: () => void;
}) {
  const cols = columnsFor(path);

  const pick = (depth: number, node: CategoryNode) => {
    const next = [...path.slice(0, depth), node.name];
    onChange(next);
    if (next.length < LEAF_DEPTH && !node.children) toast("This category isn't populated in the prototype");
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr]" data-testid="categoryTree">
      {cols.map((nodes, depth) => (
        <div key={depth}>
          <div className="relative w-50">
            <div className={`block overflow-y-scroll ${depth === 0 ? 'max-h-100' : 'max-h-75'}`}>
              {/* Before anything is picked the panel highlights "Your Categories" (snapshot); the
                  screenshots taken after a pick no longer show the row. */}
              {depth === 0 && path.length === 0 && (
                <div className="flex items-center">
                  <button className={`${ROW} ${ROW_ON}`} type="button">
                    <div className="flex items-center">
                      <YourCategoriesIcon variant={variant} />
                      Your Categories
                    </div>
                  </button>
                  <Notch />
                </div>
              )}
              {nodes.map((n) => {
                const on = path[depth] === n.name;
                return (
                  <div className="flex items-center" key={n.name}>
                    <button className={`${ROW} ${on ? ROW_ON : ROW_OFF}`} type="button" onClick={() => pick(depth, n)}>
                      <div className="flex items-center">{n.name}</div>
                    </button>
                    {on && depth < LEAF_DEPTH - 1 && <Notch />}
                  </div>
                );
              })}
            </div>
          </div>
          {depth === 0 && (
            <div className="bg-primary-bg p-4 w-46">
              <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5">Can't find the category?</p>
              <button
                className="inline-flex items-center justify-center gap-1 rounded-sm font-button border-none cursor-pointer bg-transparent text-brand-primary-bg h-6 min-w-max px-0 text-lg leading-5 font-semibold"
                type="button"
                onClick={onSearchCategory}
              >
                <span>Search Category</span>
              </button>
            </div>
          )}
        </div>
      ))}
      {cols.length === 1 && <div className="h-85 w-83.5" />}
    </div>
  );
}
