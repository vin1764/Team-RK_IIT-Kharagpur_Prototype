// The showcase sidebar: demo controls, "Jump to what's new" + tour, "On this screen", toggles.
// Our own presenter UI (not Meesho's): calm white panel, small type, the panel's indigo as accent.
import { useEffect, useMemo, useRef, useState } from 'react';
import calendar from '../data/calendar.json';
import { dayLabel } from '../engine/ui';
import { DEMO_GUIDE, stepDayLabel, type GuideJump } from '../layout/demoGuide';
import type { Lang, Persona } from '../store/demo';
import { nearestMeeshoRoute } from './meeshoNearest';
import { BEHIND, REGISTRY, elementInfo, featureById, pageFor } from './source';
import type { Feature, PartId } from './types';
import type { FrameDemo } from './urlState';

// Mirrors the persona labels and day jumps of the prototype's own controls (src/layout/DemoControls.tsx).
const PERSONAS: { id: Persona; label: string }[] = [
  { id: 'jasmeet', label: 'Jasmeet Sharma · kitchenware, self-ship' },
  { id: 'samar', label: 'Samar Biswas · footwear, Pack Point' },
  { id: 'reseller', label: 'Reseller · fails checks' },
];
const JUMPS: { day: number; label: string }[] = [
  { day: calendar.jumps.onboarding, label: 'Onboarding' },
  { day: calendar.jumps.listing, label: 'Listing' },
  { day: calendar.jumps.commit, label: 'Commit' },
  { day: calendar.jumps.liveLaunch, label: 'Live launch' },
  { day: calendar.jumps.restock, label: 'Restock' },
  { day: calendar.jumps.priceEdit, label: 'Price edit' },
  { day: calendar.jumps.packPointLot, label: 'Pack Point lot' },
];
const PERSONA_SHORT: Record<Persona, string> = { jasmeet: 'Jasmeet', samar: 'Samar', reseller: 'Reseller' };

export interface SidebarApi {
  shown: FrameDemo;
  route: string;
  elements: string[];
  ready: boolean;
  hl: boolean;
  setHl: (on: boolean) => void;
  setC2m: (on: boolean) => void;
  demo: (d: { persona?: Persona; day?: number; lang?: Lang }) => void;
  reset: () => void;
  activeF?: string;
  jump: (f: Feature) => void;
  goRoute: (j: GuideJump) => void;
  pulse: (docId: string, focus?: boolean) => void;
  tour: number | null;
  setTour: (n: number | null) => void;
  fullScreen: () => void;
}

const Tag = ({ tag }: { tag: 'NEW' | 'EXTENDED' }) => <span className={`sc-tag sc-tag-${tag === 'NEW' ? 'new' : 'ext'}`}>{tag}</span>;
const Chip = ({ id }: { id: string }) => <span className="sc-chip">{id}</span>;

export function Sidebar({ api }: { api: SidebarApi }) {
  return (
    <>
      <Header api={api} />
      <JumpSection api={api} />
      <ScreenSection api={api} />
      <ToggleSection api={api} />
      <footer className="sc-foot">
        <button type="button" className="sc-btn sc-btn-wide" onClick={api.fullScreen}>
          Open full screen ↗
        </button>
        <p>Concept prototype by Team RK for Meesho DICE. Synthetic data; not affiliated with Meesho. The full-screen view is the plain prototype with its own controls.</p>
      </footer>
    </>
  );
}

function Header({ api }: { api: SidebarApi }) {
  const { shown } = api;
  return (
    <section className="sc-sec sc-head">
      <h1>Team RK · C2M on Meesho Supplier Hub</h1>
      <p className="sc-sub">Meesho’s seller panel as it is, with our Factory-to-Customer additions where they would live.</p>
      <div className="sc-controls">
        <label className="sc-field">
          <span>Persona</span>
          <select value={shown.persona} onChange={(e) => api.demo({ persona: e.target.value as Persona })}>
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="sc-field">
          <span>
            Day <b>D{shown.day}</b> · {dayLabel(shown.day)}
          </span>
          <input type="range" min={0} max={calendar.maxDay} value={shown.day} aria-label="Demo day" onChange={(e) => api.demo({ day: Number(e.target.value) })} />
          <div className="sc-chips">
            {JUMPS.map((j) => (
              <button key={j.day} type="button" aria-pressed={shown.day === j.day} className="sc-pill" onClick={() => api.demo({ day: j.day })}>
                D{j.day} {j.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sc-row">
          <div className="sc-seg" role="group" aria-label="Language">
            {(['en', 'hi'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={shown.lang === l} onClick={() => api.demo({ lang: l })}>
                {l === 'en' ? 'EN' : 'हिंदी'}
              </button>
            ))}
          </div>
          <button type="button" className="sc-btn" onClick={api.reset}>
            Reset demo
          </button>
        </div>
      </div>
    </section>
  );
}

function JumpSection({ api }: { api: SidebarApi }) {
  const features = REGISTRY.features;
  const groups = useMemo(() => REGISTRY.parts.map((p) => ({ part: p, items: features.filter((f) => f.part === p.id) })).filter((g) => g.items.length), [features]);
  const active = api.activeF ? featureById(api.activeF) : undefined;
  const [open, setOpen] = useState<Set<PartId>>(() => new Set([active?.part ?? groups[0]?.part.id].filter(Boolean) as PartId[]));
  useEffect(() => {
    if (active) setOpen((s) => (s.has(active.part) ? s : new Set(s).add(active.part)));
  }, [active]);
  const idx = active ? features.findIndex((f) => f.id === active.id) : -1;
  const prev = idx > 0 ? features[idx - 1] : undefined;
  const next = idx < 0 ? features[0] : features[idx + 1];
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => activeRef.current?.scrollIntoView({ block: 'nearest' }), [api.activeF]);

  return (
    <section className="sc-sec">
      <h2>Jump to what’s new</h2>
      <div className="sc-groups">
        {groups.map(({ part, items }) => {
          const isOpen = open.has(part.id);
          return (
            <div key={part.id} className="sc-group">
              <button
                type="button"
                className="sc-group-h"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(part.id)) n.delete(part.id);
                    else n.add(part.id);
                    return n;
                  })
                }
              >
                <span className="sc-caret" aria-hidden="true">
                  ▸
                </span>
                <span>{part.title}</span>
                <span className="sc-count">{items.length}</span>
              </button>
              {isOpen && (
                <ul className="sc-list">
                  {items.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        ref={f.id === api.activeF ? activeRef : undefined}
                        className="sc-item"
                        aria-current={f.id === api.activeF ? 'true' : undefined}
                        onClick={() => api.jump(f)}
                        onMouseEnter={() => api.pulse(f.docId)}
                        onFocus={() => api.pulse(f.docId)}
                      >
                        <span className="sc-item-t">{f.title}</span>
                        <Chip id={f.docId} />
                        <Tag tag={f.tag} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="sc-row sc-walk">
        <button type="button" className="sc-btn" disabled={!prev} onClick={() => prev && api.jump(prev)}>
          ◀ Prev
        </button>
        <button type="button" className="sc-btn sc-btn-accent" disabled={!next} onClick={() => next && api.jump(next)}>
          Next new feature ▶
        </button>
      </div>
      <Tour api={api} />
    </section>
  );
}

function Tour({ api }: { api: SidebarApi }) {
  const n = api.tour;
  if (n === null) {
    return (
      <button type="button" className="sc-btn sc-btn-wide sc-tour-start" onClick={() => api.setTour(1)}>
        Take the 5-min tour · {DEMO_GUIDE.length} steps
      </button>
    );
  }
  const st = DEMO_GUIDE[n - 1]!;
  return (
    <div className="sc-tour" data-sc-tour>
      <div className="sc-tour-h">
        <span>
          Tour · step {n} of {DEMO_GUIDE.length}
        </span>
        <button type="button" className="sc-x" aria-label="Exit tour" onClick={() => api.setTour(null)}>
          ×
        </button>
      </div>
      <div className="sc-steps" aria-hidden="true">
        {DEMO_GUIDE.map((s) => (
          <span key={s.n} className={s.n === n ? 'on' : s.n < n ? 'done' : ''} />
        ))}
      </div>
      <p className="sc-tour-meta">
        {stepDayLabel(st.day)} · {PERSONA_SHORT[st.persona]}
      </p>
      <h3>{st.title}</h3>
      <p className="sc-tour-body">{st.body}</p>
      {st.also.length > 0 && (
        <div className="sc-chips">
          <button type="button" className="sc-pill" onClick={() => api.goRoute(st.jump)}>
            {st.jump.label}
          </button>
          {st.also.map((a) => (
            <button key={a.label} type="button" className="sc-pill" onClick={() => api.goRoute(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}
      <div className="sc-row">
        <button type="button" className="sc-btn" disabled={n <= 1} onClick={() => api.setTour(n - 1)}>
          ◀ Prev
        </button>
        <button type="button" className="sc-btn sc-btn-accent" onClick={() => api.setTour(n < DEMO_GUIDE.length ? n + 1 : null)}>
          {n < DEMO_GUIDE.length ? 'Next step ▶' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

function ScreenSection({ api }: { api: SidebarApi }) {
  const page = pageFor(api.route);
  const ctx = { persona: api.shown.persona, day: api.shown.day, lang: api.shown.lang, route: api.route };
  const nearest = (page?.nearest && featureById(page.nearest)) || REGISTRY.features.find((f) => f.id !== api.activeF) || undefined;
  const behind = (key?: string): string[] => {
    const fn = key ? BEHIND[key] : undefined;
    if (!fn) return [];
    try {
      return fn(ctx);
    } catch {
      return [];
    }
  };

  return (
    <section className="sc-sec" data-sc-screen>
      <h2>On this screen</h2>
      {!page ? (
        <p className="sc-muted">{api.ready ? 'This screen isn’t in the showcase index yet. Pick a feature above to jump to one of our additions.' : 'Waiting for the prototype…'}</p>
      ) : (
        <>
          <p className="sc-page">
            <b>{page.title}</b>
            {page.onlyOurs && <span className="sc-tag sc-tag-new">ONLY IN OURS</span>}
          </p>
          <p className="sc-today">
            <span>Today on Meesho:</span> {page.today}
          </p>
          {!api.shown.c2m ? (
            <p className="sc-muted">Showing Meesho as it is today: our additions are hidden. Switch to “Ours” below to see them.</p>
          ) : api.elements.length === 0 ? (
            <div className="sc-empty">
              <p>
                <b>Unchanged Meesho page.</b> Nothing of ours on this screen.
              </p>
              {nearest && (
                <button type="button" className="sc-btn" onClick={() => api.jump(nearest)}>
                  See {nearest.title} ({nearest.docId}) →
                </button>
              )}
            </div>
          ) : (
            <>
              <h3 className="sc-h3">What we added</h3>
              <ol className="sc-els">
                {api.elements.map((id, i) => {
                  const el = elementInfo(id);
                  const lines = behind(el?.behind);
                  return (
                    <li key={id}>
                      <button type="button" className="sc-el" onMouseEnter={() => api.pulse(id)} onFocus={() => api.pulse(id)} onClick={() => api.pulse(id, true)}>
                        <span className="sc-num">{i + 1}</span>
                        <span className="sc-el-b">
                          <span className="sc-el-t">
                            <span>{el?.title ?? id}</span>
                            <Chip id={id} />
                            {el && <Tag tag={el.tag} />}
                          </span>
                          {el?.what && <span className="sc-el-w">{el.what}</span>}
                          {el?.why && (
                            <span className="sc-el-y">
                              <b>Why:</b> {el.why}
                            </span>
                          )}
                        </span>
                      </button>
                      {lines.length > 0 && (
                        <div className="sc-behind">
                          <span>Behind it</span>
                          <pre>{lines.join('\n')}</pre>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ToggleSection({ api }: { api: SidebarApi }) {
  return (
    <section className="sc-sec">
      <h2>View</h2>
      <label className="sc-switch">
        <input type="checkbox" role="switch" checked={api.hl} onChange={(e) => api.setHl(e.target.checked)} />
        <span className="sc-switch-ui" aria-hidden="true" />
        <span>Highlight changes</span>
      </label>
      <div className="sc-field">
        <span>Today vs ours</span>
        <div className="sc-seg sc-seg-wide" role="group" aria-label="Today vs ours">
          <button type="button" aria-pressed={api.shown.c2m} onClick={() => api.setC2m(true)}>
            Ours
          </button>
          <button type="button" aria-pressed={!api.shown.c2m} onClick={() => api.setC2m(false)}>
            Today on Meesho
          </button>
        </div>
      </div>
    </section>
  );
}

/** Over the frame in "Today on Meesho" when the screen exists only in ours. */
export function TodayOverlay({ route, onBack, onNearest }: { route: string; onBack: () => void; onNearest: (to: string) => void }) {
  const page = pageFor(route);
  const to = nearestMeeshoRoute(route);
  if (!page) return null;
  return (
    <div className="sc-overlay" role="dialog" aria-label="Not on Meesho today">
      <div className="sc-overlay-card">
        <h3>This screen doesn’t exist on Meesho today</h3>
        <p>{page.today}</p>
        <div className="sc-row">
          <button type="button" className="sc-btn sc-btn-accent" onClick={onBack}>
            Back to ours
          </button>
          {to && (
            <button type="button" className="sc-btn" onClick={() => onNearest(to)}>
              Go to the nearest Meesho page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
