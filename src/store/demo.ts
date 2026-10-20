import { create } from 'zustand';
import calendar from '../data/calendar.json';

export type Persona = 'jasmeet' | 'samar' | 'reseller';
export type Lang = 'en' | 'hi';

export interface DemoState {
  persona: Persona;
  day: number;
  lang: Lang;
  controlsOpen: boolean;
  setPersona: (p: Persona) => void;
  setDay: (d: number) => void;
  setLang: (l: Lang) => void;
  setControlsOpen: (o: boolean) => void;
  reset: () => void;
}

const DEFAULTS = { persona: 'jasmeet' as Persona, day: calendar.jumps.onboarding, lang: 'en' as Lang };
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
  };
}

/** Writes the demo params onto a URL search string, keeping any other params (e.g. ?tab=). */
export function withDemoParams(search: string, s: Pick<DemoState, 'persona' | 'day' | 'lang'>) {
  const q = new URLSearchParams(search);
  q.set('persona', s.persona);
  q.set('day', String(s.day));
  q.set('lang', s.lang);
  return `?${q.toString()}`;
}

export const useDemo = create<DemoState>((set) => ({
  ...fromUrl(),
  controlsOpen: false,
  setPersona: (persona) => set({ persona }),
  setDay: (day) => set({ day: Math.max(0, Math.min(calendar.maxDay, Math.round(day))) }),
  setLang: (lang) => set({ lang }),
  setControlsOpen: (controlsOpen) => set({ controlsOpen }),
  reset: () => set({ ...DEFAULTS }),
}));
