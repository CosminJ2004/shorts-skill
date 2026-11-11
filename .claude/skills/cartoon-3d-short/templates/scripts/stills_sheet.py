"""Contact sheet of numbered stills (x_<frame>.jpg) for the stills check.
Usage: python stills_sheet.py STILLS_DIR OUT.jpg COLS THUMB_W [from:to]
"""
import sys, glob, re
from PIL import Image, ImageDraw
d, out, cols, w = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
fs = sorted(glob.glob(d + "/x_*.jpg"), key=lambda p: int(re.findall(r"(\d+)\.jpg", p)[0]))
if len(sys.argv) > 5: a, b = map(int, sys.argv[5].split(":")); fs = fs[a:b]
h = int(w * 16 / 9); rows = (len(fs) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * h), "black"); dr = ImageDraw.Draw(S)
for i, p in enumerate(fs):
    im = Image.open(p).resize((w, h)); x, y = (i % cols) * w, (i // cols) * h; S.paste(im, (x, y))
    dr.rectangle([x, y, x + 60, y + 22], fill="black"); dr.text((x + 4, y + 4), re.findall(r"(\d+)\.jpg", p)[0], fill="yellow")
S.save(out, quality=88)
