"""Save every Meesho image referenced in reference/html into public/brand/, keeping its path.
Writes scripts/brand-manifest.json (remote URL -> local /brand/... path). Run: python3 -I scripts/fetch-brand.py"""
import re, os, json, subprocess, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, 'reference', 'html'); OUT = os.path.join(ROOT, 'public', 'brand')
IMG = ('.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif')
HOST = {'images.meeshosupplyassets.com': 'msa', 'images.meesho.com': 'mimg', 'static.meeshosupply.com': 'ms', 'static-assets.meesho.com': 'msta'}
urls = set()
for f in os.listdir(REF):
    t = html.unescape(open(os.path.join(REF, f), encoding='utf-8').read())
    for u in re.findall(r'''(?:src|poster)=["'](https?://[^"']+)["']''', t) + re.findall(r'''url\(["']?(https?://[^)"']+)''', t):
        u = html.unescape(u)
        if u.split('/')[2] in HOST and u.split('?')[0].lower().endswith(IMG): urls.add(u)
manifest, failed = {}, []
for u in sorted(urls):
    host, path = u.split('/')[2], u.split('?')[0].split('/', 3)[3]
    local = f'/brand/{HOST[host]}/{path}'
    dst = os.path.join(ROOT, 'public', local.lstrip('/'))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst):
        r = subprocess.run(['curl', '-sSfL', '--max-time', '60', '-o', dst, u])
        if r.returncode: failed.append(u); continue
    manifest[u] = local
json.dump(manifest, open(os.path.join(ROOT, 'scripts', 'brand-manifest.json'), 'w'), indent=1, sort_keys=True)
print(len(manifest), 'saved;', len(failed), 'failed', failed)
