// Renders a reference/html snapshot to PNG at 125% (the screenshots' zoom).
// Usage: node scripts/snap-ref.mjs <name> <out.png> [width=1536] [height=864] [fullPage=0]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const [name, out, w = '1536', h = '864', full = '0'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1.25 });
await p.goto(pathToFileURL(resolve('reference/html', name + '.html')).href, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
