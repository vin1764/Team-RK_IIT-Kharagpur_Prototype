import { useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';

/**
 * The seller panel frame: dark sidebar (14rem) + main column (max 1216px, centred),
 * Pages start directly under the concept strip. The reference screenshots show a red
 * "Your E-Signature is missing!" banner on top; it is left out on purpose (team decision:
 * our makers have completed e-signature).
 * Pages render inside <Outlet />. Full-width flows (Add Single Catalog, Bulk upload)
 * use <BareShell> instead, as the live panel hides the sidebar there.
 */
export function PanelShell() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const top = 'var(--concept-strip-h)';
  return (
    <div className="flex min-h-[calc(100vh-var(--concept-strip-h))]">
      <aside
        className="sidebar w-56 shrink-0 z-app-bar"
        style={{ position: 'sticky', top, height: `calc(100vh - ${top})` }}
      >
        <Sidebar />
      </aside>

      {/* Below 1280px the panel swaps the sidebar for a hamburger drawer. */}
      <div className="xl:hidden fixed left-0 right-0 z-app-bar flex items-center gap-3 bg-primary-text px-3 h-12" style={{ top }}>
        <button type="button" className="bg-transparent border-0 p-0 cursor-pointer" onClick={() => setDrawer(true)} aria-label="Open menu">
          <img src="/brand/msa/merlin/lined/hamburger-menu.svg" alt="" width="24" height="24" className="invert" />
        </button>
        <img src="/brand/msa/merlin/filled/meesho-logo-lowercase-greymid.svg" alt="meesho" width="72" height="17" />
      </div>
      {drawer && (
        <div className="xl:hidden fixed inset-0 z-modal" style={{ top }} onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-overlay-bg" />
          <div className="relative w-56 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <main data-show-sidebar="true" className="grow min-w-0 layout-main-dt-responsive pt-12 xl:pt-0 pb-[var(--demo-controls-room)] max-[1023px]:overflow-x-auto" key={pathname}>
        <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** Full-width pages without the sidebar (catalog flows). */
export function BareShell({ children }: { children?: ReactNode }) {
  return <div className="min-h-[calc(100vh-var(--concept-strip-h))] bg-secondary-bg">{children ?? <Outlet />}</div>;
}
