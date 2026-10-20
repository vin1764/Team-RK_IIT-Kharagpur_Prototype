"""Convert part of a reference/html snapshot into JSX, keeping the panel's own Tailwind classes.

Usage:
  python3 -I scripts/html2jsx.py <snapshot-name> [--from TEXT] [--tag main] [--strip-prefix growth-] > out.jsx

  --tag   the element to export (default: main). With --from, the export starts at the
          innermost element of that tag containing TEXT, e.g. --tag div --from "Quality Score".
  Micro-frontend class prefixes (growth-, cataloging-, fulfillment-, services-, lcom-, payouts-,
  promotions-, insights-) are stripped automatically. When a prefixed class and a plain one set the
  same property, the prefixed one wins (its stylesheet loads later in the live panel).

What it does: class→className, style strings→objects, SVG/ARIA attrs→camelCase, value/checked→
defaultValue/defaultChecked, Meesho image URLs→/brand/... (scripts/brand-manifest.json),
JSX-escapes text, drops script/noscript/comments. The result is a starting point: review it,
replace repeated blocks with components, and wire state.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = json.load(open(os.path.join(ROOT, 'scripts', 'brand-manifest.json')))
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
SKIP = {'script', 'noscript', 'style', 'template'}
ATTR = {
    'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'readonly': 'readOnly', 'maxlength': 'maxLength',
    'minlength': 'minLength', 'colspan': 'colSpan', 'rowspan': 'rowSpan', 'autocomplete': 'autoComplete',
    'autofocus': 'autoFocus', 'srcset': 'srcSet', 'crossorigin': 'crossOrigin', 'enctype': 'encType',
    'contenteditable': 'contentEditable', 'spellcheck': 'spellCheck', 'playsinline': 'playsInline',
    'value': 'defaultValue', 'checked': 'defaultChecked', 'selected': 'defaultValue', 'xlink:href': 'xlinkHref',
    'xmlns:xlink': 'xmlnsXlink', 'viewbox': 'viewBox', 'datetime': 'dateTime', 'inputmode': 'inputMode',
}
BOOL = {'disabled', 'readonly', 'required', 'checked', 'autofocus', 'multiple', 'hidden', 'muted', 'autoplay', 'loop', 'playsinline', 'controls'}


PREFIXES = ('growth-', 'cataloging-', 'fulfillment-', 'services-', 'lcom-', 'payouts-', 'promotions-', 'insights-')
SIZE = r'(xs|sm|base|lg|xl|[2-9]xl)'


def group(cls):
    """Rough 'which CSS property does this utility set' key, used to resolve clashes."""
    *variants, base = cls.split(':')
    base = base.lstrip('!').lstrip('-')
    v = ':'.join(variants)
    rules = [
        (rf'^text-{SIZE}$', 'font-size'), (r'^text-(left|right|center|justify|start|end)$', 'text-align'), (r'^text-', 'color'),
        (r'^font-(thin|light|normal|medium|semibold|semi-bold|bold|extrabold|black|\[)', 'font-weight'), (r'^font-', 'font-family'),
        (r'^bg-', 'bg'), (r'^(rounded(-[trbl]{1,2}|-[se][se]?)?)(-|$)', None), (r'^border-(solid|dashed|dotted|none)$', 'border-style'),
        (r'^border(-[xytrblse])?(-[0-9]+|-\[[^\]]*\])?$', lambda m: 'border-width' + (m.group(1) or '')),
        (r'^border(-[xytrblse])?-', lambda m: 'border-color' + (m.group(1) or '')),
        (r'^(p[xytrblse]?|m[xytrblse]?|w|h|min-w|min-h|max-w|max-h|gap(-[xy])?|leading|tracking|top|left|right|bottom|inset(-[xy])?|z|size|basis|order|opacity|shadow|whitespace|shrink|grow|overflow(-[xy])?|items|justify|self|content|cursor)-', None),
        (r'^(flex|grid|block|inline-block|inline-flex|inline|hidden|table|contents)$', 'display'), (r'^(absolute|relative|fixed|sticky|static)$', 'position'),
        (r'^flex-(row|col|row-reverse|col-reverse)$', 'flex-direction'), (r'^flex-(wrap|nowrap|wrap-reverse)$', 'flex-wrap'),
    ]
    for pat, name in rules:
        m = re.match(pat, base)
        if m:
            return v + '|' + (name(m) if callable(name) else name or m.group(1))
    return v + '|' + base


def clean_classes(value):
    out = []  # (class, from_prefixed)
    for c in value.split():
        *variants, base = c.split(':')
        bang = base.startswith('!')
        b = base[1:] if bang else base
        pref = next((x for x in PREFIXES if b.startswith(x)), None)
        if pref:
            b = b[len(pref):]
        out.append((':'.join([*variants, ('!' if bang else '') + b]), bool(pref)))
    winners = {group(c) for c, pf in out if pf}
    keep = []
    for c, pf in out:
        if not pf and group(c) in winners:
            continue
        if c not in keep:
            keep.append(c)
    return ' '.join(keep)


def camel(s):
    return re.sub(r'[-:]([a-z])', lambda m: m.group(1).upper(), s)


def fix_url(u):
    u = html.unescape(u)
    return MANIFEST.get(u, u)


def style_obj(s):
    out = []
    for decl in s.split(';'):
        if ':' not in decl:
            continue
        k, v = decl.split(':', 1)
        k, v = k.strip(), v.strip()
        if not k:
            continue
        v = re.sub(r'''url\(["']?(https?://[^)"']+)["']?\)''', lambda m: f'url({fix_url(m.group(1))})', v)
        key = k if k.startswith('--') else camel(k)
        out.append(f'{json.dumps(key) if key.startswith("--") else key}: {json.dumps(v)}')
    return '{{ ' + ', '.join(out) + ' }}'


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, attrs, parent, []


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', [], None)
        self.cur = self.root
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if self.skip or tag in SKIP:
            if tag in SKIP:
                self.skip += 1
            return
        n = Node(tag, attrs, self.cur)
        self.cur.kids.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        if not self.skip and tag not in SKIP:
            self.cur.kids.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip or tag in VOID:
            return
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, d):
        if not self.skip:
            self.cur.kids.append(d)


def text_of(n):
    return ''.join(k if isinstance(k, str) else text_of(k) for k in n.kids)


def find(n, tag, needle):
    best = None
    for k in n.kids:
        if isinstance(k, Node):
            r = find(k, tag, needle)
            if r:
                return r
    if isinstance(n, Node) and n.tag == tag and (needle is None or needle in text_of(n)):
        best = n
    return best


def esc(t):
    t = re.sub(r'\s+', ' ', t)
    if not t.strip():
        return t if t == ' ' else ''
    return t.replace('{', "{'{'}").replace('}', "{'}'}").replace('<', '&lt;').replace('>', '&gt;')


def emit(n, prefix, depth=0):
    pad = '  ' * depth
    if isinstance(n, str):
        t = esc(n)
        return [pad + t.strip()] if t.strip() else []
    attrs = []
    for k, v in n.attrs:
        k = k.lower()
        if k.startswith('on') or k in ('jsaction',):
            continue
        name = ATTR.get(k, k if (k.startswith('data-') or k.startswith('aria-')) else camel(k))
        if k == 'class':
            v = clean_classes(v or '')
            if not v:
                continue
        if k == 'style':
            attrs.append(f'style={style_obj(v or "")}')
            continue
        if k in ('src', 'href', 'poster') and v:
            v = fix_url(v)
        if v is None or (k in BOOL and v in ('', k)):
            attrs.append(name)
        else:
            attrs.append(f'{name}={json.dumps(v)}')
    open_ = f'<{n.tag}' + (' ' + ' '.join(attrs) if attrs else '')
    if n.tag in VOID or not n.kids:
        return [pad + open_ + ' />']
    body = [line for k in n.kids for line in emit(k, prefix, depth + 1)]
    if not body:
        return [pad + open_ + ' />']
    return [pad + open_ + '>', *body, pad + f'</{n.tag}>']


def main():
    a = sys.argv[1:]
    name = a[0]
    opt = lambda f, d=None: a[a.index(f) + 1] if f in a else d
    p = P()
    p.feed(open(os.path.join(ROOT, 'reference', 'html', name.removesuffix('.html') + '.html'), encoding='utf-8').read())
    node = find(p.root, opt('--tag', 'main'), opt('--from'))
    if not node:
        sys.exit('element not found')
    print('\n'.join(emit(node, '')))


if __name__ == '__main__':
    main()
