import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import calendar from '../data/calendar.json';
import { dayLabel } from '../engine/ui';
import { EMBEDDED, useDemo, withDemoParams, type Persona } from '../store/demo';
import { resetCatalog } from '../store/catalog';
import { resetDraft } from '../pages/panel/catalog/draftStore';
import { useOnboarding } from '../store/onboarding';
import { resetLaunch } from '../store/timeline';
import { resetPriceEdits } from '../store/priceEdits';
import { resetPriceChecks } from '../store/priceChecks';
import { resetLaunchBanner } from '../store/launchBanner';
import { resetRestockPlans } from '../store/restockPlan';
import { resetLotPlans } from '../store/lotPlans';
import { resetMakerProduct } from '../store/makerProduct';
import { DemoGuide, takePendingJump } from './DemoGuide';
import { DEMO_GUIDE } from './demoGuide';
import { FrameBridge } from '../embed/FrameBridge';

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

/** Keeps ?persona=&day=&lang= on the URL so every demo moment is a link. */
export function DemoUrlSync() {
  const { persona, day, lang, c2m, setPersona, setDay, setLang } = useDemo();
  const loc = useLocation();
  const navigate = useNavigate();
  // "Today vs ours": html[data-c2m="off"] hides every [data-c2m-id] addition (index.css).
  useEffect(() => {
    document.documentElement.dataset.c2m = c2m ? 'on' : 'off';
  }, [c2m]);
  useEffect(() => {
    // A Demo guide jump: its route carries the params; adopt them instead of overwriting them.
    const jump = takePendingJump(loc.pathname);
    if (jump === 'wait') return;
    if (jump) {
      setPersona(jump.persona);
      setDay(jump.day);
      setLang(jump.lang ?? 'en');
      return;
    }
    const next = withDemoParams(loc.search, { persona, day, lang, c2m });
    if (next !== loc.search) navigate({ pathname: loc.pathname, search: next, hash: loc.hash }, { replace: true });
  }, [persona, day, lang, c2m, loc.pathname, loc.search, loc.hash, navigate, setPersona, setDay, setLang]);
  return null;
}

/** "Prototype controls": a pill at the right end of the concept strip; the panel drops down from it. */
export function DemoControls() {
  // Inside the showcase frame the sidebar has these controls; the pill would only duplicate them.
  // The frame instead runs the bridge to the showcase page (postMessage, highlight overlay).
  return EMBEDDED ? <FrameBridge /> : <DemoControlsPanel />;
}

function DemoControlsPanel() {
  const s = useDemo();
  // The demo guide stays open across a jump: the controls fold to the pill so the page is clear,
  // and reopening them brings the guide back with the last step marked.
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  if (!s.controlsOpen) {
    return (
      <button
        type="button"
        data-demo-controls
        onClick={() => s.setControlsOpen(true)}
        className="fixed top-0 right-2 z-[1600] flex items-center border-0 bg-transparent p-0 cursor-pointer font-default"
        style={{ height: 'var(--concept-strip-h)' }}
      >
        <span className="rounded-full bg-white/20 hover:bg-white/30 text-white text-sm leading-none px-2.5 py-0.5 whitespace-nowrap">
          <span className="max-[767px]:hidden">Prototype controls</span>
          <span className="min-[768px]:hidden">Controls</span> · D{s.day}
          {activeStep !== null && ` · step ${activeStep}/${DEMO_GUIDE.length}`}
        </span>
      </button>
    );
  }
  return (
    <>
      {guideOpen && (
        <DemoGuide
          active={activeStep}
          onJump={(n) => {
            setActiveStep(n);
            s.setControlsOpen(false);
          }}
          onClose={() => setGuideOpen(false)}
        />
      )}
      <div data-demo-controls className="fixed right-2 z-snackbar w-72 rounded-lg bg-black text-white font-default text-base shadow-2xl overflow-y-auto" style={{ top: 'calc(var(--concept-strip-h) + 6px)', maxHeight: 'calc(100vh - var(--concept-strip-h) - 12px)' }}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-solid border-white/15 border-x-0 border-t-0">
          <span className="font-semibold tracking-wide uppercase text-sm text-white/70">Prototype controls</span>
          <button type="button" onClick={() => s.setControlsOpen(false)} className="bg-transparent border-0 text-white/70 cursor-pointer text-lg leading-none" aria-label="Hide controls">
            ×
          </button>
        </div>
        <div className="p-3 flex flex-col gap-3">
          <button
            type="button"
            data-demo-guide-toggle
            aria-expanded={guideOpen}
            onClick={() => setGuideOpen((o) => !o)}
            className={`rounded-sm border border-solid px-2 py-1 text-base cursor-pointer text-left flex items-center justify-between ${guideOpen ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30'}`}
          >
            <span>Demo guide · {DEMO_GUIDE.length} steps</span>
            <span aria-hidden="true">{guideOpen ? '›' : '‹'}</span>
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-white/60 text-sm">Persona</span>
            <select value={s.persona} onChange={(e) => s.setPersona(e.target.value as Persona)} className="bg-white/10 text-white border border-solid border-white/20 rounded-sm px-2 py-1 text-base">
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id} className="text-black">
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-white/60 text-sm">
              Day <b className="text-white">D{s.day}</b> · {dayLabel(s.day)}
            </span>
            <input type="range" min={0} max={calendar.maxDay} value={s.day} onChange={(e) => s.setDay(Number(e.target.value))} className="w-full accent-white" />
            <div className="flex flex-wrap gap-1">
              {JUMPS.map((j) => (
                <button
                  key={j.day}
                  type="button"
                  onClick={() => s.setDay(j.day)}
                  className={`rounded-sm border border-solid px-1.5 py-0.5 text-sm cursor-pointer ${s.day === j.day ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30'}`}
                >
                  D{j.day} {j.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['en', 'hi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => s.setLang(l)}
                  className={`rounded-sm border border-solid px-2 py-0.5 text-sm cursor-pointer ${s.lang === l ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30'}`}
                >
                  {l === 'en' ? 'EN' : 'हिंदी'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { s.reset(); useOnboarding.getState().reset(); resetCatalog(); resetDraft(); resetLaunch(); resetPriceEdits(); resetPriceChecks(); resetMakerProduct(); resetLaunchBanner(); resetRestockPlans(); resetLotPlans(); setActiveStep(null); }} className="rounded-sm border border-solid border-white/30 bg-transparent text-white px-2 py-0.5 text-sm cursor-pointer">
              Reset demo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
