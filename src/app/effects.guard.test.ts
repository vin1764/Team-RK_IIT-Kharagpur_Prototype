// React calls whatever an effect returns as its cleanup. Newer Chrome makes scroll methods
// (window.scrollTo, Element.scrollIntoView…) return a Promise, so `useEffect(() => window.scrollTo(0, 0))`
// hands React a Promise and the next step change crashes with "… is not a function" (the bot's
// Product → Quantity bug). Effects must use a block body, or return a cleanup arrow.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

describe('effects never return a value React would call as cleanup', () => {
  it('no expression-bodied useEffect / useLayoutEffect (except one returning a cleanup arrow)', () => {
    const bad: string[] = [];
    for (const f of files('src')) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/use(?:Layout|Insertion)?Effect\(\s*\(\)\s*=>(?!\s*\{)(?!\s*\(\)\s*=>)/g)) {
        bad.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
