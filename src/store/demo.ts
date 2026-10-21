import { create } from 'zustand';
import calendar from '../data/calendar.json';

export type Persona = 'jasmeet' | 'samar' | 'reseller';
export type Lang = 'en' | 'hi';

export interface DemoState {
  persona: Persona;
  day: number;
  lang: Lang;
  /** false = "Today vs ours" plain Meesho mode (?c2m=off): every C2M addition hidden or reverted */
  c2m: boolean;
  controlsOpen: boolean;
  setPersona: (p: Persona) => void;
  setDay: (d: number) => void;
  setLang: (l: Lang) => void;
  setC2m: (on: boolean) => void;
  setControlsOpen: (o: boolean) => void;
  reset: () => void;
}

const DEFAULTS = { persona: 'jasmeet' as Persona, day: calendar.jumps.onboarding, lang: 'en' as Lang, c2m: true };
const PERSONAS: Persona[] = ['jasmeet', 'samar', 'reseller'];

// The demo state lives in the URL (?persona=&day=&lang=) so any moment of the demo is a shareable link.
function fromUrl() {
  if (typeof window === 'undefined') return DEFAULTS;
  const q = new URLSearchParams(window.location.search);
  const persona = q.get('persona') as Persona | null;
  const day = Number(q.get('day'));
  const lang = q.get('lang');
  return {
    persona: persona && PERSONAS.includes(persona) ? persona : DEFAULTS.persona,
    day: Number.isInteger(day) && day >= 0 && day <= calendar.maxDay && q.has('day') ? day : DEFAULTS.day,
    lang: lang === 'hi' || lang === 'en' ? lang : DEFAULTS.lang,
    c2m: q.get('c2m') !== 'off',
  };
}

/** Writes the demo params onto a URL search string, keeping any other params (e.g. ?tab=). */
export function withDemoParams(search: string, s: Pick<DemoState, 'persona' | 'day' | 'lang'> & { c2m?: boolean }) {
  const q = new URLSearchParams(search);
  q.set('persona', s.persona);
  q.set('day', String(s.day));
  q.set('lang', s.lang);
  if (s.c2m === false) q.set('c2m', 'off');
  else if (s.c2m === true) q.delete('c2m');
  return `?${q.toString()}`;
}

export const useDemo = create<DemoState>((set) => ({
  ...fromUrl(),
  controlsOpen: false,
  setPersona: (persona) => set({ persona }),
  setDay: (day) => set({ day: Math.max(0, Math.min(calendar.maxDay, Math.round(day))) }),
  setLang: (lang) => set({ lang }),
  setC2m: (c2m) => set({ c2m }),
  setControlsOpen: (controlsOpen) => set({ controlsOpen }),
  reset: () => set({ ...DEFAULTS }),
}));

/** True when the app runs inside the showcase frame (an iframe of the same origin). */
export const EMBEDDED = typeof window !== 'undefined' && window.self !== window.top;
