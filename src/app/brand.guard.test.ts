import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Non-negotiable: Meesho images are saved under /public/brand, never hot-linked.
const SRC = fileURLToPath(new URL('..', import.meta.url));
const files = (d: string): string[] =>
  readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : /\.(tsx?|css|json)$/.test(n) ? [join(d, n)] : []));

describe('brand assets are local', () => {
  it('no source file links to a Meesho server', () => {
    const bad = files(SRC).filter((f) => /https?:\/\/[a-z.-]*(meesho|meeshosupply)[a-z.-]*\//i.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => relative(SRC, f))).toEqual([]);
  });
});
