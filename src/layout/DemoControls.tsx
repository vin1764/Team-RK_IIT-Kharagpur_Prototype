import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import calendar from '../data/calendar.json';
import { dayLabel } from '../engine/ui';
import { useDemo, withDemoParams, type Persona } from '../store/demo';
import { resetCatalog } from '../store/catalog';
import { resetDraft } from '../pages/panel/catalog/draftStore';
import { useOnboarding } from '../store/onboarding';
import { resetLaunch } from '../store/timeline';
import { resetPriceEdits } from '../store/priceEdits';

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
  const { persona, day, lang } = useDemo();
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const next = withDemoParams(loc.search, { persona, day, lang });
    if (next !== loc.search) navigate({ pathname: loc.pathname, search: next, hash: loc.hash }, { replace: true });
  }, [persona, day, lang, loc.pathname, loc.search, loc.hash, navigate]);
  return null;
}

/** Floating "Prototype controls" panel, bottom-right, clearly labelled and hideable. */
export function DemoControls() {
  const s = useDemo();
  if (!s.controlsOpen) {
    return (
      <button
        type="button"
        data-demo-controls
        onClick={() => s.setControlsOpen(true)}
        className="fixed bottom-4 right-4 z-snackbar rounded-full bg-black text-white text-base font-default px-3 py-1.5 border-0 cursor-pointer shadow-lg"
      >
        Prototype controls · D{s.day}
      </button>
    );
  }
  return (
    <div data-demo-controls className="fixed bottom-4 right-4 z-snackbar w-72 rounded-lg bg-black text-white font-default text-base shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-solid border-white/15 border-x-0 border-t-0">
        <span className="font-semibold tracking-wide uppercase text-sm text-white/70">Prototype controls</span>
        <button type="button" onClick={() => s.setControlsOpen(false)} className="bg-transparent border-0 text-white/70 cursor-pointer text-lg leading-none" aria-label="Hide controls">
          ×
        </button>
      </div>
      <div className="p-3 flex flex-col gap-3">
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
          <button type="button" onClick={() => { s.reset(); useOnboarding.getState().reset(); resetCatalog(); resetDraft(); resetLaunch(); resetPriceEdits(); }} className="rounded-sm border border-solid border-white/30 bg-transparent text-white px-2 py-0.5 text-sm cursor-pointer">
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}
