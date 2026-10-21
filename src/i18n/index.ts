// Maker-facing C2M copy (LB-10). Bot screens follow the demo language; everything else stays English.
// Hindi lives only in hi.json (a draft for the team to review); a key missing there falls back to English.
import { useDemo, type Lang } from '../store/demo';
import en from './en.json';
import hi from './hi.json';

const DICT: Record<Lang, Record<string, string>> = { en, hi };

export type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;

/** Looks a key up in `lang` (falling back to English, then to the key) and fills {placeholders}. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const s = DICT[lang][key] ?? DICT.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Translator for the demo's current language. */
export function useT(): T {
  const lang = useDemo((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}

/** English-only translator, for C2M inserts on pages that stay in English (Home, Catalog Uploads). */
export const tEn: T = (key, vars) => translate('en', key, vars);

/** Rupee / count formatting used by the bot screens: Indian grouping, at most 2 decimals. */
export const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
