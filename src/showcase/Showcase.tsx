// The showcase page at "/": the prototype in a laptop frame (left) + the showcase sidebar (right).
// The frame is a same-origin iframe at a fixed 1366×768 scaled to fit; it talks to this page through
// the postMessage protocol in ./types.ts (src/embed/FrameBridge.tsx is the other end).
import './showcase.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { paths } from '../app/paths';
import type { GuideJump } from '../layout/demoGuide';
import { DEMO_GUIDE } from '../layout/demoGuide';
import { EMBEDDED, type Lang } from '../store/demo';
import { CHROME, FRAME_H, FRAME_W, fitScale } from './frameMath';
import { Sidebar, TodayOverlay, type SidebarApi } from './Sidebar';
import { featureById, featureHref, pageFor } from './source';
import type { Feature, ShowMsg } from './types';
import { demoFromRoute, initialFrameSrc, parseShowcaseUrl, routeWithDemo, serializeShowcaseUrl, type FrameDemo, type Zoom } from './urlState';
import { useFrameLink, type Outgoing } from './useFrameLink';

type NavMsg = Extract<ShowMsg, { type: 'navigate' }>;
type Nav = Omit<NavMsg, 'rk'>;

const URL_DEBOUNCE_MS = 300;

const navFor = (f: Feature, lang: Lang): Nav => ({
  type: 'navigate',
  to: f.route,
  persona: f.persona,
  day: f.day,
  lang,
  ...(f.prep?.length ? { prep: f.prep } : {}),
  focus: f.selector ?? f.docId,
});

export default function Showcase() {
  // Never nest the showcase inside its own frame.
  if (EMBEDDED) return <Navigate to={paths.home} replace />;
  return <ShowcasePage />;
}

function ShowcasePage() {
  const initial = useMemo(() => parseShowcaseUrl(window.location.search), []);
  const initialFeature = initial.f ? featureById(initial.f) : undefined;

  const iframe = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState(() =>
    initialFrameSrc(initial, (id) => {
      const f = featureById(id);
      return f && featureHref(f);
    }),
  );
  const [hl, setHlState] = useState(initial.hl);
  const [sb, setSb] = useState(initial.sb);
  const [zoom, setZoom] = useState<Zoom>(initial.zoom);
  const [activeF, setActiveF] = useState<string | undefined>(initialFeature?.id);
  const [tour, setTourState] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  // Messages that wait for the frame's 'ready' (a shared ?f= link jumps once the frame is up).
  const pending = useRef<Outgoing[]>(initialFeature && !initial.at ? [navFor(initialFeature, demoFromRoute(src).lang)] : []);
  const hlRef = useRef(hl);
  hlRef.current = hl;

  const link = useFrameLink(iframe, () => {
    link.send({ type: 'highlight', on: hlRef.current });
    const queued = pending.current;
    pending.current = [];
    queued.forEach((m) => link.send(m));
  });
  const { ready, stale, state, send } = link;

  // Displayed demo values follow the frame (the judge can click around inside it); a control change
  // shows at once and is confirmed by the next 'state'.
  const [optimistic, setOptimistic] = useState<Partial<FrameDemo>>({});
  useEffect(() => {
    setOptimistic({});
  }, [state]);
  const base: FrameDemo = state ? { persona: state.persona, day: state.day, lang: state.lang, c2m: state.c2m } : demoFromRoute(src);
  const shown: FrameDemo = { ...base, ...optimistic };
  const route = state?.route ?? src;

  /** Navigate the frame; before the bridge is up, (re)load the iframe at the route instead. */
  const go = useCallback(
    (m: Nav) => {
      if (send(m)) return;
      pending.current = [m];
      const href = routeWithDemo(m.to, { persona: m.persona, day: m.day, lang: m.lang ?? 'en', c2m: shown.c2m });
      if (href !== src) {
        link.loading();
        setSrc(href);
      }
    },
    [send, src, shown.c2m, link],
  );

  const api: SidebarApi = {
    shown,
    route,
    elements: shown.c2m ? (state?.elements ?? []) : [],
    ready,
    hl,
    setHl: (on) => {
      setHlState(on);
      send({ type: 'highlight', on });
    },
    setC2m: (on) => {
      setOptimistic((o) => ({ ...o, c2m: on }));
      if (!send({ type: 'c2m', on })) {
        const href = routeWithDemo(route, { ...shown, c2m: on });
        link.loading();
        setSrc(href);
      }
    },
    demo: (d) => {
      setOptimistic((o) => ({ ...o, ...d }));
      send({ type: 'demo', ...d });
    },
    reset: () => {
      setOptimistic({});
      setActiveF(undefined);
      setTourState(null);
      send({ type: 'demo', reset: true });
    },
    activeF,
    jump: (f) => {
      setActiveF(f.id);
      go(navFor(f, shown.lang));
    },
    goRoute: (j: GuideJump) => go({ type: 'navigate', to: j.path, persona: j.persona, day: j.day, lang: 'en' }),
    pulse: (docId, focus) => {
      send(focus ? { type: 'pulse', docId, focus: true } : { type: 'pulse', docId });
    },
    tour,
    setTour: (n) => {
      setTourState(n);
      const st = n ? DEMO_GUIDE[n - 1] : undefined;
      if (st) go({ type: 'navigate', to: st.jump.path, persona: st.jump.persona, day: st.jump.day, lang: 'en' });
    },
    fullScreen: () => {
      window.open(routeWithDemo(route, shown), '_blank', 'noopener');
    },
  };

  // Shareable URL: follow the frame (debounced) with history.replaceState.
  const at = state ? routeWithDemo(state.route, state) : initial.at;
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = `/${serializeShowcaseUrl({ f: activeF, at, hl, c2m: shown.c2m, sb, zoom })}`;
      if (`${window.location.pathname}${window.location.search}` !== next) window.history.replaceState(window.history.state, '', next);
    }, URL_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [activeF, at, hl, shown.c2m, sb, zoom]);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Team RK · C2M showcase';
    return () => {
      document.title = prev;
    };
  }, []);

  // Stage size → scale k.
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = zoom === '100' ? 1 : fitScale(stage.w, stage.h);
  const screenW = Math.round(FRAME_W * k);
  const screenH = Math.round(FRAME_H * k);

  const page = pageFor(route);
  const todayOverlay = !shown.c2m && !!page?.onlyOurs;

  return (
    <div className="sc-root" data-sb={sb ? 'open' : 'closed'} data-drawer={drawer ? 'open' : 'closed'} data-zoom={zoom}>
      <main className="sc-main">
        <div className="sc-toolbar">
          <div className="sc-seg" role="group" aria-label="Zoom">
            <button type="button" aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>
              Fit
            </button>
            <button type="button" aria-pressed={zoom === '100'} onClick={() => setZoom('100')}>
              100%
            </button>
          </div>
          <span className="sc-where" title={route}>
            {page?.title ?? 'Prototype'} · {shown.persona === 'jasmeet' ? 'Jasmeet' : shown.persona === 'samar' ? 'Samar' : 'Reseller'} · D{shown.day}
            {!shown.c2m && ' · Today on Meesho'}
          </span>
          <button type="button" className="sc-btn sc-btn-quiet" onClick={api.fullScreen}>
            Open full screen ↗
          </button>
          <button type="button" className="sc-btn sc-btn-quiet sc-sb-toggle" aria-expanded={sb} onClick={() => setSb((o) => !o)}>
            {sb ? 'Hide panel ⇥' : '⇤ Show panel'}
          </button>
        </div>
        <div className="sc-stage" ref={stageRef}>
          <div className="sc-laptop" style={{ ['--sc-k' as string]: k }}>
            <div className="sc-bezel" style={{ padding: `${CHROME.top}px ${CHROME.side}px ${CHROME.bottom}px` }}>
              <span className="sc-camera" aria-hidden="true" />
              <div className="sc-screen" style={{ width: screenW, height: screenH }}>
                <iframe
                  ref={iframe}
                  src={src}
                  title="Supplier Hub prototype"
                  width={FRAME_W}
                  height={FRAME_H}
                  style={{ transform: `scale(${k})` }}
                />
                {todayOverlay && (
                  <TodayOverlay
                    route={route}
                    onBack={() => api.setC2m(true)}
                    onNearest={(to) => go({ type: 'navigate', to, persona: shown.persona, day: shown.day, lang: shown.lang })}
                  />
                )}
                {stale && !ready && (
                  <div className="sc-stale" role="status">
                    Frame not responding ·{' '}
                    <button type="button" onClick={api.fullScreen}>
                      Open full screen
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="sc-base" style={{ height: CHROME.base }} aria-hidden="true" />
          </div>
        </div>
      </main>
      <aside className="sc-side" aria-label="Showcase controls">
        <button type="button" className="sc-handle" aria-expanded={drawer} onClick={() => setDrawer((o) => !o)}>
          Showcase controls {drawer ? '▼' : '▲'}
        </button>
        <div className="sc-side-scroll">
          <Sidebar api={api} />
        </div>
      </aside>
    </div>
  );
}
