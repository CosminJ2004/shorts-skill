"""Phone safe-zone sheet: shows what a phone actually displays of a 9:16 short.

Tall phones (19.5:9 - 20:9) play Shorts/TikTok/Reels zoomed to FILL the screen, so the sides of a 1080x1920 frame
are cut off (about 9-10 % each side), and the app's UI covers the top band, the bottom band (title, channel,
caption box) and the right-hand action column. This script grabs frames (first/middle/last of every shot) and
draws those zones so framing can be checked before a full render.

  python phone_safe.py <video.mp4> <out.jpg> [--shots shots.json] [--times 1.0,5.2,...] [--cols 6]

Zones (fractions of the 1080x1920 frame):
  red    : cropped away on a 20:9 phone in fill mode (x < 0.10 or x > 0.90)
  orange : covered by the platform UI (top 0-0.08, bottom 0.80-1.0, right column x > 0.84 for y 0.45-0.82)
  green  : the SAFE box. Faces, hands doing the gag and key props must sit inside it.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

SAFE = (0.10, 0.08, 0.84, 0.80)  # x0, y0, x1, y1 : where every face and key prop must sit
CROP_X = 0.10
UI = [(0.0, 0.0, 1.0, 0.08), (0.0, 0.80, 1.0, 1.0), (0.84, 0.45, 1.0, 0.82)]


def grab(video: str, t: float, out: Path, w: int) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1",
                    "-vf", f"scale={w}:-1", str(out)], check=True)


def overlay(im: Image.Image) -> Image.Image:
    W, H = im.size
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle([0, 0, int(W * CROP_X), H], fill=(220, 30, 30, 110))
    d.rectangle([int(W * (1 - CROP_X)), 0, W, H], fill=(220, 30, 30, 110))
    for x0, y0, x1, y1 in UI:
        d.rectangle([int(W * x0), int(H * y0), int(W * x1), int(H * y1)], fill=(255, 150, 0, 70))
    x0, y0, x1, y1 = SAFE
    d.rectangle([int(W * x0), int(H * y0), int(W * x1), int(H * y1)], outline=(40, 230, 90, 255), width=3)
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--shots")
    ap.add_argument("--times")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--w", type=int, default=270)
    a = ap.parse_args()
    times: list[float] = []
    if a.times:
        times = [float(x) for x in a.times.split(",")]
    elif a.shots:
        for s in json.loads(Path(a.shots).read_text())["shots"]:
            fa, fb = s["a"], s["b"] - 1
            times += [(fa + 3) / a.fps, (fa + fb) / 2 / a.fps, (fb - 3) / a.fps]
    tiles = []
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(times):
            p = Path(td) / f"{i:03d}.png"
            grab(a.video, t, p, a.w)
            tiles.append(overlay(Image.open(p)))
    w, h = tiles[0].size
    cols = a.cols
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + 6), rows * (h + 22)), (20, 20, 24))
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(zip(times, tiles)):
        x, y = (i % cols) * (w + 6), (i // cols) * (h + 22)
        sheet.paste(im, (x, y + 18))
        d.text((x + 4, y + 2), f"{t:.2f}s  f{round(t * a.fps)}", fill=(230, 230, 230))
    sheet.save(a.out, quality=88)
    print(a.out, len(tiles), "frames")


if __name__ == "__main__":
    main()
