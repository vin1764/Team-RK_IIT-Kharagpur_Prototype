"""Side-by-side + diff heat-map for scripts/compare.mjs.
Usage: python3 -I scripts/compose.py ref.png ours.png out.png label   → prints % of differing pixels."""
import sys
from PIL import Image, ImageChops, ImageDraw

ref_p, ours_p, out_p, label = sys.argv[1:5]
ref, ours = Image.open(ref_p).convert('RGB'), Image.open(ours_p).convert('RGB')
w, h = max(ref.width, ours.width), max(ref.height, ours.height)
a = Image.new('RGB', (w, h), 'white'); a.paste(ref)
b = Image.new('RGB', (w, h), 'white'); b.paste(ours)

diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 40 else 0)
pct = 100 * sum(diff.histogram()[255:]) / (w * h)
heat = Image.composite(Image.new('RGB', (w, h), (244, 66, 64)), a.convert('L').convert('RGB').point(lambda v: 160 + v // 3), diff)

scale = 0.5
tw, th = int(w * scale), int(h * scale)
canvas = Image.new('RGB', (tw * 2 + 30, th * 2 + 70), (242, 245, 250))
d = ImageDraw.Draw(canvas)
d.text((10, 8), f'{label}: reference (left) · ours (right) · differing pixels in red (below) · {pct:.1f}%', fill=(39, 40, 41))
canvas.paste(a.resize((tw, th)), (10, 30))
canvas.paste(b.resize((tw, th)), (tw + 20, 30))
canvas.paste(heat.resize((tw, th)), (10, th + 50))
canvas.save(out_p)
print(f'{pct:.1f}')
