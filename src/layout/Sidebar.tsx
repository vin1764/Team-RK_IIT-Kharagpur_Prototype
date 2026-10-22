import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { paths, pathOnly } from '../app/paths';
import { notInPrototype } from '../components/Toast';
import { PinkTag } from '../pages/panel/catalog/BulkTemplatePanel';
import { FL } from '../pages/panel/factory-launch/copy';
import { useFlEligible } from '../pages/panel/factory-launch/useLaunchEntry';
import { isGroup, matches, SIDEBAR, type SidebarGroup, type SidebarLeaf } from './sidebarItems';

// Ported class-for-class from reference/html nav#app-sidebar.

function Leaf({ item, active, onNavigate, badge, c2m }: { item: SidebarLeaf; active: boolean; onNavigate?: () => void; badge?: ReactNode; c2m?: string }) {
  return (
    <div className="flex data-[active=true]:bg-[var(--color-secondary-text)]" data-active={active} data-c2m={c2m} data-c2m-id={c2m}>
      {active && <div className="bg-[var(--color-tertiary-text)] w-1 rounded-tr-sm rounded-br-sm" />}
      <Link
        to={item.to}
        onClick={onNavigate}
        className="cursor-pointer flex justify-between flex-1 py-2 pl-4 pr-1.5 hover:bg-[var(--color-secondary-text)] hover:text-white data-[active=true]:bg-[var(--color-secondary-text)] data-[active=true]:text-white data-[active=true]:pl-3 no-underline"
        data-active={active}
      >
        <div className="flex items-center gap-1.5">
          <img src={item.icon} alt="" width="24" height="24" className="size-5" />
          {active ? (
            <h5 className="m-0 p-0 text-lg leading-5 font-semibold font-button text-tertiary-border">{item.label}</h5>
          ) : (
            <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-tertiary-border">{item.label}</p>
          )}
          {badge}
        </div>
      </Link>
    </div>
  );
}

function Group({ item, pathname, onNavigate, inactive }: { item: SidebarGroup; pathname: string; onNavigate?: () => void; inactive?: boolean }) {
  const active = !inactive && matches(pathname, item.match[0]!, item.match);
  const [open, setOpen] = useState(active);
  return (
    <div className="cursor-pointer border-l-4 border-solid border-l-transparent data-[active=true]:border-l-secondary-text" data-active={active}>
      <div
        className="flex justify-between items-center relative pl-3 pr-4 py-2 hover:bg-secondary-text data-[active=true]:bg-secondary-text"
        data-active={active}
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-row gap-1.5">
          <img src={item.icon} alt="" width="24" height="24" className="size-5" />
          <p className={`m-0 p-0 font-body text-lg leading-5 text-tertiary-border ${active ? 'font-medium' : 'font-normal'}`}>{item.label}</p>
        </div>
        <div className="flex items-center justify-center" data-active={active}>
          <img
            src="/brand/msa/merlin/lined/chevron-up-grey-light02.svg"
            alt=""
            width="24"
            height="24"
            className="transition-transform duration-200 ease-in-out rotate-180 data-[open=true]:rotate-0 size-5"
            data-open={open}
          />
        </div>
      </div>
      <div className="relative overflow-hidden transition-[height] duration-200 ease-in-out" style={{ height: open ? `${item.children.length * 40}px` : '0px' }}>
        <div className="absolute pt-5 z-1 left-5 top-0 w-2.5 border-l border-b border-solid border-primary-border">
          {item.children.slice(1).map((c) => (
            <div key={c.label} className="w-2.5 border-t border-solid border-primary-border pb-10" />
          ))}
        </div>
        {item.children.map((c) => {
          const childActive = matches(pathname, c.to, c.match);
          return (
            <Link
              key={c.label}
              to={c.to}
              onClick={onNavigate}
              className="flex justify-between items-center relative h-10 ps-10 pe-5 border-t border-solid border-primary-text bg-primary-text data-[active=true]:bg-secondary-text hover:bg-secondary-text no-underline"
              data-active={childActive}
            >
              <p className={`m-0 p-0 text-base leading-4 text-tertiary-border truncate min-w-0 ${childActive ? 'font-normal font-semibold' : 'font-body font-medium'}`}>
                {c.label}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** C2M LW-6: "Factory Launch" under Boost Sales, for makers who passed the checks; Promotions → Factory Launch tab. */
const FL_LEAF: SidebarLeaf = { label: FL.sidebar, icon: '/brand/msa/merlin/filled/promotions-v2.svg', to: paths.factoryLaunch };

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, search } = useLocation();
  const noticesActive = matches(pathname, paths.notices);
  // LW-6: eligible makers also get the pinned Factory Launch notice, counted in "Notices (n)", and the sidebar item.
  const flEligible = useFlEligible();
  const noticeCount = 1 + (flEligible ? 1 : 0);
  const flActive =
    flEligible &&
    ((pathname === pathOnly(paths.factoryLaunch) && new URLSearchParams(search).get('tab') === 'FACTORY_LAUNCH') || matches(pathname, paths.factoryLaunchLive.replace(/\/flw-1\/live$/, '')));
  return (
    <div className="flex flex-col w-full relative h-full bg-primary-text">
      <div className="flex justify-between items-center py-5 min-h-20 box-border">
        <div className="flex justify-between items-center w-full pr-0.5">
          <div className="flex items-center px-2.5 box-border w-[calc(100%-2.5rem)]">
            <img alt="shop-profile" className="rounded-full" width="32" height="32" src="/brand/mimg/images/marketing/1629896997118.jpg" />
            <div className="pl-2.5 break-words">
              <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-secondary-bg">Team RK</span>
            </div>
          </div>
          <button type="button" className="cursor-pointer relative bg-transparent border-0 p-0" onClick={() => notInPrototype('Account menu')}>
            <img src="/brand/msa/merlin/lined/chevron-up-grey-light.svg" alt="Account menu" width="24" height="24" className="rotate-180" />
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-row text-center border-t border-b border-solid border-secondary-text">
          <div className="flex w-1/2 data-[active=true]:bg-secondary-text" data-active={noticesActive}>
            <Link
              to={paths.notices}
              onClick={onNavigate}
              className="flex items-center justify-center pt-3 pb-3 flex-1 cursor-pointer hover:bg-secondary-text border-r border-solid border-r-secondary-text gap-1.5 no-underline"
            >
              <img src="/brand/msa/merlin/filled/notification-active.svg" alt="" width="16" height="16" />
              <p className={`m-0 p-0 font-body text-lg leading-5 ${noticesActive ? 'font-semibold text-white' : 'font-normal text-secondary-border'}`}>Notices ({noticeCount})</p>
            </Link>
          </div>
          <div className="flex w-1/2">
            <button
              type="button"
              onClick={() => notInPrototype('Support')}
              className="flex items-center justify-center pt-3 pb-3 flex-1 cursor-pointer hover:bg-secondary-text gap-1.5 bg-transparent border-0"
            >
              <img src="/brand/msa/merlin/filled/support-grey.svg" alt="" width="16" height="16" />
              <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-border">Support</p>
            </button>
          </div>
        </div>
        <div className="flex-1 w-full overflow-y-auto">
          <div className="mt-3 bg-transparent">
            <nav className="list-none p-0">
              {SIDEBAR.map((section, i) => (
                <div key={section.title ?? i}>
                  {section.title && (
                    <p className="m-0 p-0 font-normal font-body text-base leading-4 mb-3 ml-3 mt-5 text-tertiary-text">{section.title}</p>
                  )}
                  <div>
                    {flEligible && section.title === 'Boost Sales' && (
                      <Leaf item={FL_LEAF} active={flActive} onNavigate={onNavigate} c2m="LW-6" badge={<span className="ml-1 inline-flex" data-fl-new><PinkTag>{FL.newTag}</PinkTag></span>} />
                    )}
                    {section.items.map((item) =>
                      isGroup(item) ? (
                        <Group key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} inactive={flActive} />
                      ) : (
                        <Leaf key={item.label} item={item} active={matches(pathname, item.to, item.match)} onNavigate={onNavigate} />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center h-10 text-center border-t border-solid border-secondary-text gap-1.5">
        <img src="/brand/msa/merlin/filled/meesho-logo-lowercase-greymid.svg" alt="meesho" width="72" height="17" />
        <span className="m-0 p-0 font-semibold font-button text-lg leading-5 mt-1.5 text-tertiary-text">Supplier Hub</span>
      </div>
    </div>
  );
}
