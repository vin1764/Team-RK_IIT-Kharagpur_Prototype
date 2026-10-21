// Static scan of the doc IDs our C2M additions carry in source (data-c2m-id="…", or a literal passed to a helper's
// `c2m` prop / tab `c2m:` field that the helper writes to data-c2m-id). For tests and the showcase registry
// (reconcile features.json against it); Node only (node:fs), never imported by the app.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SRC = fileURLToPath(new URL('..', import.meta.url));

export interface C2mTagSite {
  docId: string;
  /** path relative to src/ */
  file: string;
  line: number;
  /** 'attr' = a literal data-c2m-id attribute; 'prop' = a literal handed to a helper that sets data-c2m-id */
  kind: 'attr' | 'prop';
}

const DOC_ID = String.raw`[A-Z]{2}-\d+`;
const ATTR = new RegExp(String.raw`data-c2m-id=(?:"(${DOC_ID})"|\{[^{}]*?'(${DOC_ID})'[^{}]*\})`, 'g');
// c2m="LB-3" (UploadOption, Section, StepCard, Box, Shell props), c2m: 'LW-2' (tab lists, RuledList rows),
// c2m = 'LW-6' (a helper's default)
const PROP = new RegExp(String.raw`(?<![\w-])c2m\s*[=:]\s*["'](${DOC_ID})["']`, 'g');

export function sourceFiles(dir = SRC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'showcase' || name === 'embed' ? [] : sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

export function scanC2mTags(files = sourceFiles()): C2mTagSite[] {
  const out: C2mTagSite[] = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    const lineAt = (i: number) => text.slice(0, i).split('\n').length;
    for (const [re, kind] of [
      [ATTR, 'attr'],
      [PROP, 'prop'],
    ] as const) {
      for (const m of text.matchAll(re)) out.push({ docId: (m[1] ?? m[2])!, file: relative(SRC, f), line: lineAt(m.index), kind });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

/** Unique doc IDs in source, sorted by part then number (FO, LB, LW, GL, PI, PP). */
export function c2mIds(sites = scanC2mTags()): string[] {
  const order = ['FO', 'LB', 'LW', 'GL', 'PI', 'PP'];
  const key = (id: string) => [order.indexOf(id.slice(0, 2)), Number(id.slice(3))] as const;
  return [...new Set(sites.map((s) => s.docId))].sort((a, b) => key(a)[0] - key(b)[0] || key(a)[1] - key(b)[1]);
}
