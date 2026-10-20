import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Non-negotiable: Benchmark B never reaches the maker UI.
// Only files inside src/engine may import ./benchmark; everything else goes through engine/ui.ts.
const SRC = fileURLToPath(new URL('..', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe('B stays inside the engine', () => {
  it('no file outside src/engine imports engine/benchmark or benchmarkB', () => {
    const offenders = files(SRC)
      .filter((f) => !relative(SRC, f).startsWith('engine'))
      .filter((f) => /engine\/benchmark|benchmarkB/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it('engine/ui.ts does not re-export benchmarkB', () => {
    const ui = readFileSync(join(SRC, 'engine', 'ui.ts'), 'utf8');
    expect(ui).not.toMatch(/export\s*\{[^}]*\bbenchmarkB\b[^}]*\}/);
    expect(ui).not.toMatch(/export\s*\*\s*from\s*['"]\.\/benchmark['"]/);
  });
});
