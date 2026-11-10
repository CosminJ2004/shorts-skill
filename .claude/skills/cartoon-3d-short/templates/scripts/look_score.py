#!/usr/bin/env python3
"""Look scorecard: measure a rendered short the way the reference was measured, then compare.

"Don't ask what it looks like, measure it." The metrics follow the methods in references/reports/
(grade.md, outlines.md, depth.md, motion.md), so our numbers and the reference numbers are comparable:
  - colour/tone per light (day / golden / night / interior): non-ink Y' p5/p50/p99, HSV S, colourfulness,
    lit chroma C*ab, vignette, shadow a*/b*, black point;
  - ink: dark-stroke fraction and the share of strong colour edges that carry an ink line;
  - depth: share of frames whose contrasty tiles are soft (lens blur on);
  - camera (every frame): hold / drift / move shares, speeds, glide attack/release, push-ins in quiet frames,
    dead-still holds, hard cuts;
  - voice and script (words.json): words/s, dead air, first word, tail, hook length, the "You see," pivot;
  - loudness.
Targets are the reference medians quoted from the reports. The ink-edge and blur metrics are specific to this
code, so their target is this same code run on the private reference frames (references/frames/, if present).

Usage:
  python look_score.py VIDEO.mp4 OUTDIR [--shots shots.json] [--words words.json] [--ref FRAMES_DIR] [--every 15]
  shots.json: {"shots": [{"id": 1, "a": 0, "b": 124, "light": "day"}, ...], "flash": [a, b], "xfade": [[a, b], ...]}
              light is day | golden | night | interior | tunnel (tunnel is scored as interior)
  words.json: [{"word": "The", "start": 0.10, "end": 0.29, "sentence": 0}, ...]
Writes OUTDIR/scorecard.md and OUTDIR/scorecard.json and prints the scorecard.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

W, H = 540, 960  # measurement grid of grade.md (ours and the reference both go through it)
CAP = (650, 706)  # caption band rows at 540x960 in the reference; masked for both, so the areas match
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
VF = "scale={w}:{h}:in_color_matrix=bt709:in_range=tv:out_range=pc:flags=area+accurate_rnd+full_chroma_int"
EDGE_T = 0.05  # Sobel/8 gradient of the ink-free image that counts as a strong edge
SOFT_T = 0.22  # tile acutance below this = soft (about sigma > 2 px at 720p)
LIGHT_CLUSTER = {"day": "day", "golden": "golden", "night": "night", "interior": "interior", "tunnel": "interior"}

# Reference medians per light cluster (reports/grade.md section 2) and accepted range.
GRADE_T = {
    "day": dict(p5=(0.234, 0.17, 0.30), p50=(0.583, 0.52, 0.65), p99=(0.967, 0.92, 1.0), S=(0.439, 0.38, 0.50),
                colourful=(82.8, 70, 96), C50=(33.8, 29, 40), C90=(54.9, 48, 62), ink=(0.026, 0.017, 0.036),
                vig=(0.856, 0.78, 0.93), sh_a=(12.5, 5, 22), sh_b=(-2.5, -12, 2), bp=(35, 19, 20)),
    "golden": dict(p5=(0.211, 0.15, 0.28), p50=(0.526, 0.46, 0.60), p99=(0.912, 0.86, 1.0), S=(0.459, 0.40, 0.52),
                   colourful=(71.2, 60, 84), C50=(36.8, 31, 43), C90=(53.0, 46, 60), ink=(0.019, 0.012, 0.030),
                   vig=(0.754, 0.68, 0.85), sh_a=(19.1, 10, 28), sh_b=(-5.8, -16, 0), bp=(48, 16, 22)),
    "night": dict(p5=(0.088, 0.05, 0.13), p50=(0.243, 0.18, 0.31), p99=(0.817, 0.70, 0.92), S=(0.586, 0.50, 0.68),
                  colourful=(66.6, 55, 80), C50=(36.7, 30, 44), C90=(64.4, 55, 72), ink=(0.018, 0.010, 0.030),
                  vig=(0.461, 0.38, 0.62), sh_a=(19.7, 8, 30), sh_b=(-33.1, -45, -15), bp=(9, 10, 38)),
    "interior": dict(p5=(0.129, 0.08, 0.18), p50=(0.459, 0.38, 0.54), p99=(0.942, 0.88, 1.0), S=(0.436, 0.37, 0.50),
                     colourful=(68.0, 56, 80), C50=(28.4, 23, 34), C90=(54.9, 47, 62), ink=(0.025, 0.016, 0.036),
                     vig=(0.671, 0.58, 0.80), sh_a=(14.8, 6, 24), sh_b=(-2.5, -12, 3), bp=(23, 12, 20)),
}
# reports/motion.md: reference median and the range over the 20 videos
MOTION_T = dict(hold=(10, 1, 27), drift=(24, 4, 38), move=(65, 34, 94), speed50=(3.6, 1.3, 12.9),
                speed90=(16.9, 9.7, 29.4), peak=(13.7, 5.9, 25), attack=(10, 6, 18), release=(10, 6, 19),
                zoom_active=(70, 50, 95), push_share=(83, 65, 100), push_rate=(0.14, 0.05, 0.35))
# references/STYLE_BIBLE.md
VOICE_T = dict(wps=(3.7, 3.5, 4.1), dead=(0.5, 0.0, 1.0), first=(0.07, 0.0, 0.14), tail=(0.3, 0.0, 0.6),
               hook=(13, 10, 16), sent=(13.5, 9, 17), lufs=(-14, -15, -13), lra=(2.4, 0.5, 5.0))


# ------------------------------------------------------------------ decoding
def decode(video: Path, w: int, h: int, every: int = 1, gray: bool = False) -> np.ndarray:
    sel = f"select='not(mod(n\\,{every}))'," if every > 1 else ""
    cmd = ["ffmpeg", "-v", "error", "-i", str(video), "-vf", sel + VF.format(w=w, h=h), "-fps_mode", "passthrough",
           "-f", "rawvideo", "-pix_fmt", "gray" if gray else "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape((-1, h, w) if gray else (-1, h, w, 3))


def probe(video: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:"
                          "format=duration", "-of", "json", str(video)], capture_output=True, text=True).stdout
    return json.loads(out)


# ------------------------------------------------------------------ per-frame picture metrics
def lab(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]], np.float32)
    xyz = lin @ m.T / np.array([0.95047, 1.0, 1.08883], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return 116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])


_yy, _xx = np.mgrid[0:H, 0:W]
_R = np.hypot((_xx - W / 2) / (W / 2), (_yy - H / 2) / (H / 2)) / np.sqrt(2)  # 1 at the corners
VALID = np.ones((H, W), bool)
VALID[CAP[0]:CAP[1]] = False


def frame_stats(rgb8: np.ndarray) -> dict[str, float]:
    f = rgb8.astype(np.float32) / 255
    y = f @ LUMA
    closed = ndi.grey_closing(y, size=(7, 7))  # the frame with thin dark lines removed
    ink = ((closed - y) > 0.12) & (y < 0.30) & VALID  # black top-hat (grade.md)
    nonink = VALID & ~ndi.binary_dilation(ink, iterations=1)
    yn = y[nonink]
    mx, mn = f.max(-1), f.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    L, a, b = lab(f)
    lit = nonink & (L >= 40) & (L <= 85)
    C = np.hypot(a, b)
    r8, g8, b8 = (f[..., k][VALID] * 255 for k in range(3))
    rg, yb = r8 - g8, 0.5 * (r8 + g8) - b8
    yv = y[VALID]
    k = max(1, int(0.005 * yv.size))
    bp = f[VALID][np.argpartition(yv, k)[:k]].mean(0) * 255
    sh = nonink & (y < 0.3)
    # ink on strong edges: edges of the ink-free image, with an ink pixel within 2 px
    g = np.hypot(ndi.sobel(closed, 1), ndi.sobel(closed, 0)) / 8
    edges = VALID & (g > EDGE_T) & ~ink
    inked = edges & ndi.binary_dilation(ink, iterations=2)
    # softness: acutance of contrasty 40 px tiles (max gradient / local range)
    gy, gx = np.gradient(y)
    gm = np.hypot(gx, gy)
    acut = []
    for ty in range(0, H - 39, 40):
        if ty + 40 > CAP[0] and ty < CAP[1]:
            continue
        for tx in range(0, W - 39, 40):
            t = y[ty:ty + 40, tx:tx + 40]
            lo, hi = np.percentile(t, (2, 98))
            if hi - lo >= 0.12:
                acut.append(np.percentile(gm[ty:ty + 40, tx:tx + 40], 99) / (hi - lo))
    acut_a = np.array(acut) if acut else np.array([1.0])
    return dict(
        p5=float(np.percentile(yn, 5)), p50=float(np.percentile(yn, 50)), p99=float(np.percentile(yn, 99)),
        S=float(s[VALID & (mx > 0.15)].mean()),
        colourful=float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean())),
        C50=float(np.percentile(C[lit], 50)) if lit.any() else 0.0,
        C90=float(np.percentile(C[lit], 90)) if lit.any() else 0.0,
        ink=float(ink.sum() / VALID.sum()),
        edge_ink=float(inked.sum() / max(edges.sum(), 1)),
        vig=float(y[VALID & (_R >= 0.9)].mean() / max(y[VALID & (_R < 0.3)].mean(), 1e-6)),
        sh_a=float(a[sh].mean()) if sh.any() else 0.0, sh_b=float(b[sh].mean()) if sh.any() else 0.0,
        bp_r=float(bp[0]), bp_g=float(bp[1]), bp_b=float(bp[2]),
        soft=float((acut_a < SOFT_T).mean()), acut=float(np.median(acut_a)),
    )


# ------------------------------------------------------------------ camera motion (every frame)
def _phasecorr(a: np.ndarray, b: np.ndarray, win: np.ndarray) -> tuple[float, float, float]:
    """Shift (dx, dy) such that b(x) ~ a(x - d), with a parabolic sub-pixel peak, plus the peak height."""
    A = np.fft.rfft2((a - a.mean()) * win)
    B = np.fft.rfft2((b - b.mean()) * win)
    R = B * np.conj(A)
    R /= np.abs(R) + 1e-9
    h, w = a.shape
    # A Gaussian weight in frequency turns the peak into a Gaussian of sigma 1.5 px; a parabola through the log of
    # the three samples then finds its centre without the pull toward whole pixels of a plain parabolic fit.
    fy, fx = np.fft.fftfreq(h)[:, None], np.fft.rfftfreq(w)[None, :]
    r = np.fft.irfft2(R * np.exp(-2 * np.pi**2 * 1.5**2 * (fx**2 + fy**2)), s=a.shape)
    iy, ix = np.unravel_index(np.argmax(r), r.shape)

    def sub(c0: float, cm: float, cp: float) -> float:
        c0, cm, cp = (np.log(max(c, 1e-9)) for c in (c0, cm, cp))
        d = cm - 2 * c0 + cp
        return float(np.clip(0.5 * (cm - cp) / d, -1, 1)) if abs(d) > 1e-12 else 0.0

    dy = iy + sub(r[iy, ix], r[(iy - 1) % h, ix], r[(iy + 1) % h, ix])
    dx = ix + sub(r[iy, ix], r[iy, (ix - 1) % w], r[iy, (ix + 1) % w])
    dy = dy - h if dy > h / 2 else dy
    dx = dx - w if dx > w / 2 else dx
    return float(dx), float(dy), float(r[iy, ix])


def camera(video: Path) -> dict[str, np.ndarray]:
    """Per frame-pair similarity fit (translation, zoom, roll) from 9 phase-correlated tiles at 360x640.

    Tile bands skip the caption band (motion.md). Speeds are reported in 720p px/frame (x2).
    """
    G = decode(video, 360, 640, gray=True).astype(np.float32)
    n = len(G)
    tiles = []
    for y0, y1 in ((0.03, 0.29), (0.29, 0.56), (0.80, 0.97)):
        for x0, x1 in ((0.03, 0.35), (0.35, 0.65), (0.65, 0.97)):
            tiles.append((int(y0 * 640), int(y1 * 640), int(x0 * 360), int(x1 * 360)))
    wins = [np.outer(np.hanning(t[1] - t[0]), np.hanning(t[3] - t[2])).astype(np.float32) for t in tiles]
    cx = np.array([(t[2] + t[3]) / 2 - 180 for t in tiles])
    cy = np.array([(t[0] + t[1]) / 2 - 320 for t in tiles])
    tx, ty, zoom, roll, peak, diff = (np.zeros(n - 1) for _ in range(6))
    for i in range(n - 1):
        res = [_phasecorr(G[i, t[0]:t[1], t[2]:t[3]], G[i + 1, t[0]:t[1], t[2]:t[3]], w) for t, w in zip(tiles, wins)]
        dx, dy, pk = (np.array(v) for v in zip(*res))
        keep = pk > 0.04
        sol = np.array([np.median(dx), np.median(dy), 0.0, 0.0])  # fallback: too few reliable tiles
        M = np.concatenate([np.stack([np.ones(9), np.zeros(9), cx, -cy], 1),
                            np.stack([np.zeros(9), np.ones(9), cy, cx], 1)])
        v = np.concatenate([dx, dy])
        for _ in range(2):  # least-squares similarity fit, then drop outlier tiles (moving characters)
            if keep.sum() < 4:
                break
            kk = np.concatenate([keep, keep])
            sol, *_ = np.linalg.lstsq(M[kk], v[kk], rcond=None)
            resid = np.abs(M @ sol - v).reshape(2, 9).max(0)
            keep = keep & (resid < max(0.5, 3 * np.median(resid[keep])))
        tx[i], ty[i], zoom[i], roll[i] = sol
        peak[i] = float(np.median(pk))
        diff[i] = float(np.abs(G[i + 1] - G[i]).mean())
    return dict(speed=np.hypot(tx, ty) * 2, zoom=zoom * 100, roll=np.degrees(roll), peak=peak, diff=diff)


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    out, start = [], None
    for i, m in enumerate(list(mask) + [False]):
        if m and start is None:
            start = i
        elif not m and start is not None:
            out.append((start, i))
            start = None
    return out


def camera_summary(cam: dict[str, np.ndarray], fades: set[int], cut_plan: list[int]) -> dict[str, object]:
    """fades: frames of planned crossfades/flashes (not measured). cut_plan: frames where the story cuts on purpose."""
    sp, zm = cam["speed"], cam["zoom"]
    ok = np.array([i not in fades and (i + 1) not in fades for i in range(len(sp))])
    # A pair that will not correlate and changes a lot is a cut if it is isolated (1-2 pairs); longer runs are
    # shakes, flashes or effects the tracker cannot follow.
    bad = ok & (cam["peak"] < 0.03) & (cam["diff"] > 12)
    cuts, untrackable = [], []
    for a, b in _runs(bad):
        (cuts if b - a <= 2 else untrackable).append(a + 1 if b - a <= 2 else (a + 1, b - a))
        ok[max(0, a - 1):b + 1] = False  # cut and untrackable frames are not camera motion
    planned_cuts = [c for c in cuts if any(abs(c - p) <= 2 for p in cut_plan)]
    unplanned_cuts = [c for c in cuts if c not in planned_cuts]
    s, z = sp[ok], zm[ok]
    sm = ndi.uniform_filter1d(sp, 3)
    peaks, attacks, releases = [], [], []
    for i in range(1, len(sm) - 1):
        if ok[i] and sm[i] >= 6 and sm[i] >= sm[i - 1] and sm[i] > sm[i + 1]:
            lo = 0.1 * sm[i]
            a = i
            while a > 0 and sm[a - 1] > lo and i - a < 90:
                a -= 1
            b = i
            while b < len(sm) - 1 and sm[b + 1] > lo and b - i < 90:
                b += 1
            if not peaks or i - peaks[-1][0] > 8:
                peaks.append((i, sm[i]))
                attacks.append(i - a)
                releases.append(b - i)
    quiet = s < 2
    active = np.abs(z[quiet]) >= 0.05
    pushes = z[quiet][active]
    still = ok & (sp < 0.3) & (np.abs(zm) < 0.05) & (np.abs(cam["roll"]) < 0.02)
    holds = [r for r in _runs(still) if r[1] - r[0] >= 4]
    return dict(
        hold=float((s < 0.3).mean() * 100), drift=float(((s >= 0.3) & (s < 2)).mean() * 100),
        move=float((s >= 2).mean() * 100), speed50=float(np.median(s)), speed90=float(np.percentile(s, 90)),
        peak=float(np.median([p for _, p in peaks])) if peaks else 0.0,
        peak_max=float(max([p for _, p in peaks], default=0.0)),
        attack=float(np.median(attacks)) if attacks else 0.0, release=float(np.median(releases)) if releases else 0.0,
        bursts=len(peaks), fast_bursts=[(int(i), round(float(p), 1)) for i, p in peaks if p > 25],
        zoom_active=float(active.mean() * 100) if quiet.any() else 0.0,
        push_share=float((pushes > 0).mean() * 100) if len(pushes) else 0.0,
        push_rate=float(np.median(pushes[pushes > 0])) if (pushes > 0).any() else 0.0,
        static_holds=[(int(a), int(b - a)) for a, b in holds], hard_cuts=cuts, planned_cuts=planned_cuts,
        unplanned_cuts=unplanned_cuts, untrackable=untrackable,
    )


# ------------------------------------------------------------------ voice, script, loudness
def voice_summary(words: list[dict], duration: float) -> dict[str, object]:
    if not words:
        return {}
    t0, t1 = words[0]["start"], words[-1]["end"]
    gaps = [b["start"] - a["end"] for a, b in zip(words, words[1:])]
    sents: dict[int, list[str]] = {}
    for w in words:
        sents.setdefault(int(w.get("sentence", 0)), []).append(w["word"])
    toks = [re.sub(r"[^a-z']", "", w["word"].lower()) for w in words]
    pivot = next((words[i]["start"] for i in range(len(toks) - 1) if toks[i] == "you" and toks[i + 1] == "see"), None)
    return dict(wps=len(words) / max(t1 - t0, 1e-6), dead=sum(g for g in gaps if g > 0.25), first=t0,
                tail=duration - t1, hook=len(sents[min(sents)]), sent=float(np.median([len(v) for v in sents.values()])),
                pivot=pivot, words=len(words))


def loudness(video: Path) -> dict[str, float]:
    e = subprocess.run(["ffmpeg", "-nostats", "-i", str(video), "-map", "0:a:0", "-af", "ebur128=peak=true", "-f",
                        "null", "-"], capture_output=True, text=True).stderr
    tail = e[e.rfind("Summary:"):]
    out = {}
    for key, name in (("I:", "lufs"), ("LRA:", "lra"), ("Peak:", "tp")):
        m = re.search(re.escape(key) + r"\s+(-?[\d.]+)", tail)
        if m:
            out[name] = float(m.group(1))
    return out


# ------------------------------------------------------------------ scoring
def status(v: float, lo: float, hi: float) -> str:
    return "OK" if lo <= v <= hi else ("LOW" if v < lo else "HIGH")


def gap(v: float, t: float, lo: float, hi: float) -> float:
    """Distance outside the accepted range, in units of the range half-width (0 = inside)."""
    half = max((hi - lo) / 2, 1e-6)
    return max(lo - v, v - hi, 0) / half


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--shots", type=Path)
    ap.add_argument("--words", type=Path)
    ap.add_argument("--ref", type=Path, default=Path(__file__).resolve().parents[2] / "references" / "frames")
    ap.add_argument("--every", type=int, default=15, help="colour sample step in frames (grade.md used 15)")
    ap.add_argument("--no-camera", action="store_true", help="skip the per-frame camera pass (the slow part)")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    meta = json.loads(args.shots.read_text()) if args.shots else {}
    shots = meta.get("shots") or []
    # fades: crossfades and flashes (skipped by every measure); cut_plan: where the story cuts on purpose
    fades: set[int] = set()
    for a, b in meta.get("xfade", []) + ([meta["flash"]] if "flash" in meta else []):
        fades.update(range(a - 1, b + 2))
    cut_plan = sorted({s["a"] for s in shots} | {a for a, _ in meta.get("planned", [])} | set(meta.get("cuts", [])))
    planned = fades | {c + d for c in cut_plan for d in (-1, 0)}
    pr = probe(args.video)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    duration = float(pr["format"]["duration"])

    # reference calibration: the same picture code on the private reference frames
    ref_rows = [frame_stats(np.asarray(Image.open(p).convert("RGB").resize((W, H), Image.Resampling.BOX)))
                for p in sorted(args.ref.glob("*.jpg"))] if args.ref.exists() else []
    ref_med = {k: float(np.median([r[k] for r in ref_rows])) for k in ref_rows[0]} if ref_rows else {}

    frames = decode(args.video, W, H, every=args.every)
    idx = np.arange(len(frames)) * args.every
    rows = [frame_stats(fr) for fr in frames]

    def shot_of(fi: int) -> dict:
        return next((s for s in shots if s["a"] <= fi < s["b"]), {"id": 0, "light": "day"})

    lights = [LIGHT_CLUSTER.get(shot_of(int(fi)).get("light", "day"), "day") for fi in idx]
    keep = [int(fi) not in planned for fi in idx]
    lines: list[str] = []
    score: dict[str, object] = {"video": str(args.video), "duration": duration,
                                "size": f"{v['width']}x{v['height']}", "fps": v["r_frame_rate"], "rows": []}
    table: list[tuple[str, str, float, float, float, float, str]] = []

    def add(area: str, metric: str, val: float, tgt: tuple[float, float, float], fmt: str = "{:.3f}") -> None:
        t, lo, hi = tgt
        st = status(val, lo, hi)
        table.append((area, metric, val, t, lo, hi, st))
        score["rows"].append(dict(area=area, metric=metric, ours=val, target=t, lo=lo, hi=hi, status=st,
                                  gap=gap(val, t, lo, hi)))
        lines.append(f"| {area} | {metric} | {fmt.format(val)} | {fmt.format(t)} ({fmt.format(lo)}-{fmt.format(hi)}) "
                     f"| {'OK' if st == 'OK' else '**' + st + '**'} |")

    lines += [f"# Look scorecard: {args.video.name}", "",
              f"{v['width']}x{v['height']} @ {v['r_frame_rate']}, {duration:.2f} s; colour sampled every "
              f"{args.every} frames ({len(frames)} frames), camera measured on every frame.", "",
              "| area | metric | ours | reference (accepted range) | status |", "|---|---|---|---|---|"]

    # duration (format)
    add("format", "duration s", duration, (60, 31, 78), "{:.1f}")

    # colour per light cluster
    for cl in ("day", "golden", "night", "interior"):
        sel = [r for r, li, k in zip(rows, lights, keep) if li == cl and k]
        if not sel:
            continue
        med = {k: float(np.median([r[k] for r in sel])) for k in sel[0]}
        T = GRADE_T[cl]
        tag = f"colour {cl} ({len(sel)}f)"
        add(tag, "non-ink Y' p5 (lifted darks)", med["p5"], T["p5"])
        add(tag, "non-ink Y' p50", med["p50"], T["p50"])
        add(tag, "non-ink Y' p99 (near-whites)", med["p99"], T["p99"])
        add(tag, "HSV S mean", med["S"], T["S"])
        add(tag, "colourfulness (H-S)", med["colourful"], T["colourful"], "{:.1f}")
        add(tag, "lit chroma C* p50", med["C50"], T["C50"], "{:.1f}")
        add(tag, "lit chroma C* p90", med["C90"], T["C90"], "{:.1f}")
        add(tag, "ink fraction", med["ink"], T["ink"])
        add(tag, "vignette corner/centre", med["vig"], T["vig"])
        add(tag, "shadow a* (warm/violet)", med["sh_a"], T["sh_a"], "{:.1f}")
        add(tag, "shadow b* (<0 = violet-blue, >0 = brown)", med["sh_b"], T["sh_b"], "{:.1f}")
        bp = (med["bp_r"], med["bp_g"], med["bp_b"])
        lines.append(f"| {tag} | black point RGB (darkest 0.5 %) | {bp[0]:.0f},{bp[1]:.0f},{bp[2]:.0f} | "
                     f"{T['bp'][0]},{T['bp'][1]},{T['bp'][2]} | {'OK' if bp[0] >= 15 and bp[0] >= bp[2] - 8 else '**CHECK** (crushed or blue-black)'} |")

    # ink edges and lens blur, against the same code on the reference frames
    k_all = [r for r, k in zip(rows, keep) if k]
    edge_ink = float(np.median([r["edge_ink"] for r in k_all]))
    soft_share = float(np.mean([r["soft"] >= 0.4 for r in k_all]) * 100)
    if ref_med:
        ref_soft = float(np.mean([r["soft"] >= 0.4 for r in ref_rows]) * 100)
        e = ref_med["edge_ink"]
        add("ink", "strong edges with ink on them", edge_ink, (e, e * 0.8, min(1.0, e * 1.25)))
        add("depth", "% frames with lens blur on", soft_share, (ref_soft, max(0, ref_soft - 12), ref_soft + 15), "{:.0f}")
    else:
        add("ink", "strong edges with ink on them", edge_ink, (0.45, 0.35, 0.6))
        add("depth", "% frames with lens blur on", soft_share, (30, 18, 45), "{:.0f}")

    # camera
    cam_sum: dict[str, object] = {}
    if not args.no_camera:
        cache, stamp = args.out / "camera.npz", np.array(args.video.stat().st_mtime)
        cam = dict(np.load(cache)) if cache.exists() else {}
        if cam.get("stamp") is None or float(cam["stamp"]) != float(stamp):  # re-measure only when the video changed
            cam = camera(args.video)
            np.savez(cache, stamp=stamp, **cam)
        cam_sum = camera_summary(cam, fades, cut_plan)
        for key, label, fmt in (("hold", "% frames dead still (<0.3 px/f)", "{:.0f}"),
                                ("drift", "% frames drifting (0.3-2 px/f)", "{:.0f}"),
                                ("move", "% frames moving (>=2 px/f)", "{:.0f}"),
                                ("speed50", "median speed px/f @720p", "{:.1f}"),
                                ("speed90", "p90 speed px/f @720p", "{:.1f}"),
                                ("peak", "glide peak speed (median)", "{:.1f}"),
                                ("attack", "glide attack frames (median)", "{:.0f}"),
                                ("release", "glide release frames (median)", "{:.0f}"),
                                ("zoom_active", "% quiet frames with zoom", "{:.0f}"),
                                ("push_share", "% of zooming quiet frames pushing in", "{:.0f}"),
                                ("push_rate", "push-in rate %/f (median)", "{:.2f}")):
            add("camera", label, float(cam_sum[key]), MOTION_T[key], fmt)
        add("camera", "dead-still holds >= 4 f (count)", float(len(cam_sum["static_holds"])), (0, 0, 0), "{:.0f}")
        per_min = len(cam_sum["hard_cuts"]) / max(duration / 60, 1e-6)
        add("camera", "hard cuts per minute (planned + not)", per_min, (1, 0, 3), "{:.1f}")
        add("camera", "unplanned hard cuts", float(len(cam_sum["unplanned_cuts"])), (0, 0, 0), "{:.0f}")

    # voice and script
    voice: dict[str, object] = {}
    if args.words and args.words.exists():
        voice = voice_summary(json.loads(args.words.read_text(encoding="utf-8")), duration)
        add("voice", "words per second", float(voice["wps"]), VOICE_T["wps"], "{:.2f}")
        add("voice", "dead air (gaps > 0.25 s) s", float(voice["dead"]), VOICE_T["dead"], "{:.2f}")
        add("voice", "first word starts at s", float(voice["first"]), VOICE_T["first"], "{:.2f}")
        add("voice", "tail after last word s", float(voice["tail"]), VOICE_T["tail"], "{:.2f}")
        add("script", "hook sentence words", float(voice["hook"]), VOICE_T["hook"], "{:.0f}")
        add("script", "median sentence words", float(voice["sent"]), VOICE_T["sent"], "{:.1f}")
        piv = voice["pivot"]
        lines.append(f"| script | \"You see,\" pivot | {'at %.1f s' % piv if piv is not None else 'missing'} | "
                     f"14 of 20 reference shorts | {'OK' if piv is not None else '**CHECK**'} |")
    loud = loudness(args.video)
    if "lufs" in loud:
        add("sound", "integrated loudness LUFS", loud["lufs"], VOICE_T["lufs"], "{:.1f}")
    if "lra" in loud:
        add("sound", "loudness range LU", loud["lra"], VOICE_T["lra"], "{:.1f}")

    # per-shot table and the lighting arc
    lines += ["", "## Per shot", "",
              "| shot | light | Y' p50 | S | C* p90 | ink % | edges inked | soft tiles | cam px/f | zoom %/f | still f |",
              "|---|---|---|---|---|---|---|---|---|---|---|"]
    for s in shots:
        sel = [r for r, fi in zip(rows, idx) if s["a"] <= fi < s["b"]]
        if not sel:
            continue
        m = {k: float(np.median([r[k] for r in sel])) for k in sel[0]}
        cs = cz = still = 0.0
        if cam_sum:
            seg = slice(s["a"], max(s["a"] + 1, s["b"] - 1))
            cs, cz = float(np.median(cam["speed"][seg])), float(np.median(cam["zoom"][seg]))
            still = float(((cam["speed"][seg] < 0.3) & (np.abs(cam["zoom"][seg]) < 0.05)).sum())
        mark = " (pivot)" if voice.get("pivot") is not None and s["a"] <= voice["pivot"] * 30 < s["b"] else ""
        lines.append(f"| {s['id']}{mark} | {s.get('light', '?')} | {m['p50']:.2f} | {m['S']:.2f} | {m['C90']:.0f} | "
                     f"{m['ink'] * 100:.1f} | {m['edge_ink'] * 100:.0f} % | {m['soft'] * 100:.0f} % | {cs:.1f} | "
                     f"{cz:+.2f} | {still:.0f} |")
    if cam_sum:
        lines += ["", f"Dead-still holds (start frame, length): {cam_sum['static_holds'][:20]}",
                  f"Hard cuts: planned {cam_sum['planned_cuts'][:20]}, unplanned {cam_sum['unplanned_cuts'][:20]}",
                  f"Untrackable spans (start, frames; shakes, flashes, effects): {cam_sum['untrackable'][:20]}",
                  f"Glides faster than 25 px/f (frame, peak): {cam_sum['fast_bursts'][:20]}"]
    if ref_med:
        lines += ["", f"Calibration: this code on {len(ref_rows)} reference frames (mixed lights) gives Y' p50 "
                  f"{ref_med['p50']:.3f}, S {ref_med['S']:.3f}, C* p90 {ref_med['C90']:.1f}, ink {ref_med['ink']:.3f}, "
                  f"edges inked {ref_med['edge_ink'] * 100:.0f} %, soft tiles {ref_med['soft'] * 100:.0f} % "
                  f"(grade.md 'ref all': p50 0.463 non-ink, S 0.465, C* p90 56.6, ink 0.023)."]

    # top gaps, worst first
    worst = sorted((r for r in score["rows"] if r["status"] != "OK"), key=lambda r: -r["gap"])
    lines += ["", "## Biggest gaps (worst first)", ""]
    lines += [f"{i + 1}. {r['area']}: {r['metric']} is {r['ours']:.3g}, reference {r['target']:.3g} "
              f"({r['status'].lower()})" for i, r in enumerate(worst[:12])] or ["None: every metric is in range."]
    score.update(camera={k: v for k, v in cam_sum.items()}, voice=voice, loudness=loud, ref_calibration=ref_med)
    (args.out / "scorecard.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (args.out / "scorecard.json").write_text(json.dumps(score, indent=1, default=float), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
