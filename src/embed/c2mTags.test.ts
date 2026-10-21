import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { c2mIds, scanC2mTags, sourceFiles, SRC } from './c2mIds';

// Showcase: every C2M addition carries data-c2m-id="<doc ID>" (the frame outlines and numbers them, plain mode
// hides them). The scan reads literal attributes and literal `c2m` props/fields that helpers write to data-c2m-id.

/** Doc IDs tagged "Exists" in the solution doc: Meesho's own capabilities we reuse, never outlined as ours. */
const EXISTS = ['FO-1', 'FO-2', 'LB-1', 'LB-2', 'LW-1', 'GL-1', 'PI-1', 'PP-1', 'PP-2'];

/** The doc IDs the app shows (registry: src/showcase/features.json reconciles against this list). */
const EXPECTED = [
  'FO-3', 'FO-4', 'FO-5', 'FO-6', 'FO-7', 'FO-8',
  'LB-3', 'LB-4', 'LB-5', 'LB-6', 'LB-8', 'LB-10',
  'LW-2', 'LW-3', 'LW-4', 'LW-5', 'LW-6', 'LW-7', 'LW-8',
  'GL-2', 'GL-3', 'GL-4', 'GL-5', 'GL-6',
  'PI-2', 'PI-3',
  'PP-3', 'PP-4', 'PP-5',
];

const files = sourceFiles();
const text = (f: string) => readFileSync(f, 'utf8');

describe('C2M elements carry data-c2m-id', () => {
  it('finds exactly the expected doc IDs', () => {
    expect(c2mIds()).toEqual(EXPECTED);
  });

  it('every doc ID has the doc format and none is an "Exists" element', () => {
    for (const s of scanC2mTags()) {
      expect(s.docId).toMatch(/^(FO|LB|LW|GL|PI|PP)-\d+$/);
      expect(EXISTS).not.toContain(s.docId);
    }
  });

  it('every data-c2m="…" is paired with the same data-c2m-id (except "Exists" reuse)', () => {
    const bad: string[] = [];
    for (const f of files) {
      for (const m of text(f).matchAll(/data-c2m="([A-Z]{2}-\d+)"(\s+data-c2m-id="([A-Z]{2}-\d+)")?/g)) {
        if (EXISTS.includes(m[1]!)) continue;
        if (m[3] !== m[1]) bad.push(`${relative(SRC, f)}: ${m[0]}`);
      }
      for (const m of text(f).matchAll(/data-c2m=\{([^{}]+)\}(\s+data-c2m-id=\{([^{}]+)\})?/g)) {
        if (m[3] !== m[1]) bad.push(`${relative(SRC, f)}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('no data-c2m-id without its data-c2m (the in-code convention, CLAUDE.md)', () => {
    const bad = files.flatMap((f) =>
      [...text(f).matchAll(/(\S+)\s+data-c2m-id=/g)].filter((m) => !m[1]!.startsWith('data-c2m=')).map((m) => `${relative(SRC, f)}: ${m[0]}`),
    );
    expect(bad).toEqual([]);
  });

  it('the plain-mode rule hides every tagged element', () => {
    expect(text(join(SRC, 'styles', 'index.css'))).toMatch(/html\[data-c2m='off'\] \[data-c2m-id\] \{ display: none !important; \}/);
  });
});
