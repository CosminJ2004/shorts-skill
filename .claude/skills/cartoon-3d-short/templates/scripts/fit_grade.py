#!/usr/bin/env python3
"""Fit the colour grade (GradeEffect in grade.ts) to the reference numbers, per light.

Input: stills rendered with the grade OFF (inputProps {"post":{"grade":false}}), named <prefix><frame>.jpg, plus the
shots.json that gives each frame's light. The grade shader is replicated here in numpy (tone curve through 7 knots,
saturation per zone, split-tone tints, vignette), and its parameters are fitted so the graded stills hit the reference
medians of reports/grade.md (the same metrics as look_score.py: non-ink Y' p5/p50/p99, HSV S, colourfulness, lit
chroma, vignette, shadow a*/b*). A grade fixes tone, saturation, cast and vignette; it cannot fix wrong albedos or
missing ink, so read the "after" column: whatever still misses after the fit belongs to lights or materials.

Usage: python fit_grade.py STILLS_DIR shots.json GRADE_TS [--light day,golden,tunnel]
  GRADE_TS: a .ts file with the markers "// __FIT__" and "// __END__"; everything between them is replaced with
  `export const PYR_GRADES: Record<Light, GradeParams> = {...}` (rename with --name).
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import minimize

import look_score as LS

KX = np.array([0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0])
E_CB = np.array([0.0, -0.18733, 1.8556])
E_CR = np.array([1.5748, -0.46813, 0.0])
W = np.array([0.2126, 0.7152, 0.0722])
METRICS = ("p5", "p50", "p99", "S", "colourful", "C50", "C90", "vig", "sh_a", "sh_b")
WEIGHT = dict(p5=1.0, p50=2.0, p99=1.0, S=2.0, colourful=1.0, C50=1.0, C90=1.0, vig=0.5, sh_a=0.7, sh_b=0.7)
CLUSTER = {"day": "day", "golden": "golden", "tunnel": "interior", "interior": "interior", "night": "night"}


def mono_tangents(ky: np.ndarray) -> np.ndarray:
    h, d = np.diff(KX), np.diff(ky) / np.diff(KX)
    m = np.zeros(7)
    m[0], m[6] = d[0], d[5]
    for k in range(1, 6):
        if d[k - 1] * d[k] <= 0:
            continue
        w1, w2 = 2 * h[k] + h[k - 1], h[k] + 2 * h[k - 1]
        m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k])
    return m


def curve(v: np.ndarray, ky: np.ndarray) -> np.ndarray:
    km = mono_tangents(ky)
    v = np.clip(v, 0, 1)
    seg = np.clip(np.searchsorted(KX, v, side="right") - 1, 0, 5)
    x0, x1, y0, y1, m0, m1 = KX[seg], KX[seg + 1], ky[seg], ky[seg + 1], km[seg], km[seg + 1]
    h = x1 - x0
    t = (v - x0) / h
    t2, t3 = t * t, t * t * t
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def grade(src: np.ndarray, r: np.ndarray, p: dict) -> np.ndarray:
    """src: N x 3 sRGB-encoded 0..1, r: N elliptical radius (as the shader). Same maths as GradeEffect's GLSL."""
    c = curve(src, p["ky"])
    y = c @ W
    wS, wH = 1 - smoothstep(0, 0.55, y), smoothstep(0.45, 1, y)
    wM = 1 - wS - wH
    s = p["sat"][1] + (p["sat"][0] - p["sat"][1]) * wS + (p["sat"][2] - p["sat"][1]) * wH
    c = y[:, None] + s[:, None] * (c - y[:, None])
    tint = lambda cb, cr: cb * E_CB + cr * E_CR  # noqa: E731
    c = c + wS[:, None] * tint(*p["tintS"]) + wM[:, None] * tint(*p["tintM"]) + wH[:, None] * tint(*p["tintH"])
    c = c * (1 - p["vig"][0] * smoothstep(p["vig"][1], 1, r))[:, None]
    return np.clip(c, 0, 1)


class Sample:
    """A fixed random subset of one still's pixels with the masks the metrics need (computed before grading)."""

    def __init__(self, path: Path, n: int = 24000, seed: int = 0):
        rgb = np.asarray(Image.open(path).convert("RGB").resize((LS.W, LS.H), Image.Resampling.BOX), np.float32) / 255
        y = rgb @ W.astype(np.float32)
        closed = ndi.grey_closing(y, size=(7, 7))
        ink = ((closed - y) > 0.12) & (y < 0.30) & LS.VALID
        nonink = LS.VALID & ~ndi.binary_dilation(ink, iterations=1)
        yy, xx = np.mgrid[0:LS.H, 0:LS.W]
        # the shader's vignette radius: length(uv*2-1)/sqrt(2) on the unit square
        rr = np.hypot((xx + 0.5) / LS.W * 2 - 1, (yy + 0.5) / LS.H * 2 - 1) / np.sqrt(2)
        idx = np.flatnonzero(LS.VALID.ravel())
        pick = np.random.default_rng(seed).choice(idx, size=min(n, idx.size), replace=False)
        self.rgb = rgb.reshape(-1, 3)[pick].astype(np.float64)
        self.nonink = nonink.ravel()[pick]
        self.r = rr.ravel()[pick]
        self.r_stat = LS._R.ravel()[pick]  # look_score's corner/centre radius


def metrics(s: Sample, p: dict) -> dict[str, float]:
    f = grade(s.rgb, s.r, p)
    y = f @ W
    yn = y[s.nonink]
    mx, mn = f.max(1), f.min(1)
    S = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    L, a, b = LS.lab(f.astype(np.float32))
    lit = s.nonink & (L >= 40) & (L <= 85)
    C = np.hypot(a, b)
    rg, yb = (f[:, 0] - f[:, 1]) * 255, (0.5 * (f[:, 0] + f[:, 1]) - f[:, 2]) * 255
    sh = s.nonink & (y < 0.3)
    corner, centre = y[s.r_stat >= 0.9], y[s.r_stat < 0.3]
    return dict(
        p5=np.percentile(yn, 5), p50=np.percentile(yn, 50), p99=np.percentile(yn, 99), S=S[mx > 0.15].mean(),
        colourful=np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean()),
        C50=np.percentile(C[lit], 50) if lit.any() else 0, C90=np.percentile(C[lit], 90) if lit.any() else 0,
        vig=corner.mean() / max(centre.mean(), 1e-6) if len(corner) and len(centre) else 1.0,
        sh_a=a[sh].mean() if sh.any() else 0, sh_b=b[sh].mean() if sh.any() else 0,
    )


def unpack(x: np.ndarray) -> dict:
    ky = np.concatenate([[x[0]], x[0] + np.cumsum(np.abs(x[1:6])), [1.0]])  # monotone by construction
    ky = np.minimum(ky, 1.0)
    return dict(ky=ky, sat=x[6:9], tintS=x[9:11], tintM=x[11:13], tintH=x[13:15], vig=x[15:17])


def pack(p: dict) -> np.ndarray:
    ky = np.asarray(p["ky"], float)
    return np.concatenate([[ky[0]], np.diff(ky)[:5], p["sat"], p["tintS"], p["tintM"], p["tintH"], p["vig"]])


START = dict(ky=[0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], sat=[1.0, 1.0, 1.0], tintS=[0.01, 0.0], tintM=[0, 0],
             tintH=[0, 0], vig=[0.12, 0.45])
LO = np.array([0, .02, .05, .1, .1, .05, .5, .5, .5, -.06, -.06, -.04, -.04, -.04, -.04, 0, .2])
HI = np.array([.08, .2, .3, .45, .4, .2, 1.4, 1.4, 1.4, .06, .06, .04, .04, .04, .04, .5, .8])


def loss(x: np.ndarray, samples: list[Sample], T: dict) -> float:
    p = unpack(np.clip(x, LO, HI))
    ms = [metrics(s, p) for s in samples]
    e = 0.0
    for k in METRICS:
        t, lo, hi = T[k]
        v = float(np.mean([m[k] for m in ms]))
        e += WEIGHT[k] * ((v - t) / max((hi - lo) / 2, 1e-6)) ** 2
    e += 0.5 * float(np.sum((x[9:15] / 0.03) ** 2)) * 0.02  # small pull toward no tint
    return e + 1e3 * float(np.sum(np.maximum(LO - x, 0) + np.maximum(x - HI, 0)))


def fit(samples: list[Sample], cluster: str) -> tuple[dict, dict, dict]:
    T = LS.GRADE_T[cluster]
    x0 = pack(START)
    before = {k: float(np.mean([metrics(s, unpack(x0))[k] for s in samples])) for k in METRICS}
    res = minimize(loss, x0, args=(samples, T), method="Powell", options=dict(maxiter=6000, xtol=1e-3, ftol=1e-4))
    p = unpack(np.clip(res.x, LO, HI))
    after = {k: float(np.mean([metrics(s, p)[k] for s in samples])) for k in METRICS}
    return p, before, after


def ts_params(p: dict) -> str:
    r = lambda v: ", ".join(f"{float(x):.4f}" for x in v)  # noqa: E731
    return (f"{{\n    ky: [{r(p['ky'])}],\n    sat: [{r(p['sat'])}],\n    tintS: [{r(p['tintS'])}], tintM: [{r(p['tintM'])}], "
            f"tintH: [{r(p['tintH'])}],\n    vig: [{r(p['vig'])}],\n  }}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stills", type=Path)
    ap.add_argument("shots", type=Path)
    ap.add_argument("grade_ts", type=Path)
    ap.add_argument("--name", default="PYR_GRADES")
    args = ap.parse_args()
    shots = json.loads(args.shots.read_text())["shots"]
    groups: dict[str, list[Path]] = {}
    for pth in sorted(args.stills.glob("*.jpg")):
        m = re.search(r"(\d+)\.jpg$", pth.name)
        if not m:
            continue
        fr = int(m.group(1))
        s = next((s for s in shots if s["a"] <= fr < s["b"]), None)
        if s:
            groups.setdefault(s.get("light", "day"), []).append(pth)
    out, report = {}, ["| light | metric | before | after | reference (range) |", "|---|---|---|---|---|"]
    for light, paths in groups.items():
        cl = CLUSTER.get(light, "day")
        samples = [Sample(pth, seed=i) for i, pth in enumerate(paths)]
        p, before, after = fit(samples, cl)
        out[light] = p
        T = LS.GRADE_T[cl]
        for k in METRICS:
            t, lo, hi = T[k]
            ok = "OK" if lo <= after[k] <= hi else "miss"
            report.append(f"| {light} ({len(paths)} stills, ref {cl}) | {k} | {before[k]:.3f} | {after[k]:.3f} {ok} | {t} ({lo}-{hi}) |")
        print(f"fitted {light}: {ts_params(p)}", flush=True)
    body = "\n".join(f"  {k}: {ts_params(v)}," for k, v in out.items())
    block = f"// __FIT__ (fit_grade.py replaces everything up to __END__)\nexport const {args.name}: Record<Light, GradeParams> = {{\n{body}\n}};\n// __END__"
    src = args.grade_ts.read_text(encoding="utf-8")
    src = re.sub(r"// __FIT__.*?// __END__", lambda _: block, src, flags=re.S)
    args.grade_ts.write_text(src, encoding="utf-8")
    print("\n".join(report))
    (args.stills / "fit_report.md").write_text("\n".join(report) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
