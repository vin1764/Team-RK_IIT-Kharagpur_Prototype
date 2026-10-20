// Phase 1 check: render each route beside its reference at 125% zoom.
//
//   npm run compare                 # every entry in scripts/compare/*.json
//   npm run compare -- home notices # just these
//
// Writes docs/compare/<name>.png (reference left, ours right, diff heat-map below)
// and prints a % of differing pixels. Reference = a screenshot (reference/screens) or an
// HTML snapshot (reference/html) rendered with Mier mapped to Figtree, so fonts match.
// The concept strip and demo controls are hidden in our render; the e-signature banner is
// hidden too when the reference is an HTML snapshot (the snapshots were captured without it).
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/compare');
const TMP = resolve(ROOT, 'node_modules/.compare');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

// One JSON array per page group in scripts/compare/*.json
const map = readdirSync(resolve(ROOT, 'scripts/compare'))
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(resolve(ROOT, 'scripts/compare', f), 'utf8')));
const only = process.argv.slice(2);
const entries = map.filter((e) => !only.length || only.includes(e.name));
if (!entries.length) throw new Error(`no entries match ${only.join(', ')}`);

const font = (w) => pathToFileURL(resolve(ROOT, `node_modules/@fontsource/figtree/files/figtree-latin-${w}-normal.woff2`)).href;
const MIER_AS_FIGTREE = ['Book', 400, 'Demi', 600, 'Bold', 700]
  .reduce((a, v, i, arr) => (i % 2 ? a : [...a, [v, arr[i + 1]]]), [])
  .map(([n, w]) => `@font-face{font-family:'Mier ${n}';src:url(${font(w)});font-weight:100 900}`)
  .join('');
// The snapshots load Meesho's DM Sans from their server; use the same local files we ship.
const dm = (w) => pathToFileURL(resolve(ROOT, `node_modules/@fontsource/dm-sans/files/dm-sans-latin-${w}-normal.woff2`)).href;
const DM_SANS_LOCAL = [[400, '400'], [500, '500 560'], [600, '600'], [700, '700']]
  .map(([w, range]) => `@font-face{font-family:'DM Sans';src:url(${dm(w)});font-weight:${range}}`)
  .join('');
const HIDE_OURS = ':root{--concept-strip-h:0px!important}[data-concept-strip],[data-demo-controls]{display:none!important}';

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const results = [];
try {
  for (const e of entries) {
    const isShot = e.ref.endsWith('.png');
    let width = e.width ?? 1536;
    let height = e.height ?? 864;
    if (isShot) {
      const dims = execFileSync('python3', ['-I', '-c', `from PIL import Image;im=Image.open(${JSON.stringify(resolve(ROOT, 'reference/screens', e.ref))});print(*im.size)`]).toString().trim().split(' ').map(Number);
      width = e.width ?? Math.round(dims[0] / 1.25);
      height = e.height ?? Math.round(dims[1] / 1.25);
    }
    const refPng = isShot ? resolve(ROOT, 'reference/screens', e.ref) : resolve(TMP, `${e.name}-ref.png`);
    if (!isShot) {
      const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.25 });
      await p.goto(pathToFileURL(resolve(ROOT, 'reference/html', e.ref)).href, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
      await p.addStyleTag({ content: MIER_AS_FIGTREE + DM_SANS_LOCAL + (e.refCss ?? '') });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(600);
      if (e.refScroll) await p.evaluate((y) => window.scrollTo(0, y), e.refScroll);
      await p.screenshot({ path: refPng, fullPage: !!e.fullPage });
      await p.close();
    }
    const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.25 });
    await p.goto(base + e.route, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: HIDE_OURS + (isShot ? '' : '[data-esign-banner]{display:none!important}') + (e.oursCss ?? '') });
    await p.evaluate(() => document.fonts.ready);
    for (const step of e.steps ?? []) {
      if (step.click) await p.getByText(step.click, { exact: step.exact ?? false }).first().click();
      if (step.wait) await p.waitForTimeout(step.wait);
    }
    await p.waitForTimeout(400);
    if (e.scroll) await p.evaluate((y) => { window.scrollTo(0, y); document.querySelector('main')?.scrollTo?.(0, y); }, e.scroll);
    const oursPng = resolve(TMP, `${e.name}-ours.png`);
    await p.screenshot({ path: oursPng, fullPage: !!e.fullPage });
    await p.close();
    const pct = execFileSync('python3', ['-I', resolve(ROOT, 'scripts/compose.py'), refPng, oursPng, resolve(OUT, `${e.name}.png`), e.name]).toString().trim();
    results.push([e.name, pct]);
    console.log(`${e.name.padEnd(28)} ${pct}% pixels differ  → docs/compare/${e.name}.png`);
  }
} finally {
  await browser.close();
  await server.close();
}
