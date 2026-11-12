"""Expressive narration, step 2 of 2: pick the cleanest take per line and assemble voice.wav with directed pauses.

Each take in shorts/<name>/voice/takes/sNN_k.wav is transcribed with faster-whisper and scored by word error against
the line (the "say" text when DIRECTION.json has one), plus a penalty for long internal silences and trailing noise
(Chatterbox sometimes adds a breath or mumble at the end). The winner is trimmed, faded and placed with the line's
directed pause after it. Writes voice.wav (48 kHz), words_est.json/words.json (letter-count estimate inside the exact
sentence spans; run align_words.py next for real word times) and picks.json (which take won, and why).

Usage: python scripts/pick_takes.py <name> [--model base.en] [--force 3=1,8=0]
"""

import argparse
import difflib
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

ANIM = Path(__file__).resolve().parents[1]
SR, LEAD = 48000, 0.12
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))  # noqa: E731

ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("--model", default="base.en")
ap.add_argument("--force", default="")
args = ap.parse_args()

root = ANIM / "shorts" / args.name
vdir = root / "voice"
text = (root / "SCRIPT.md").read_text(encoding="utf-8").split("## Script", 1)[1].split("\n", 1)[1]
sentences = [s.strip() for line in text.strip().splitlines() for s in re.split(r"(?<=[.?!])\s+(?=[A-Z\"])", line) if s.strip()]
dirn = json.loads((root / "DIRECTION.json").read_text(encoding="utf-8"))["lines"]
force = {int(a): int(b) for a, b in (x.split("=") for x in args.force.split(",") if x)}
model = WhisperModel(args.model, device="cpu", compute_type="int8")


def load(p):
    x, sr = sf.read(str(p), dtype="float32")
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x).astype(np.float32)
    return x


def trim(x):
    env = np.convolve(np.abs(x), np.ones(480) / 480, mode="same")
    nz = np.flatnonzero(env > 0.012)
    if not len(nz):
        return x
    return x[max(0, nz[0] - 480): nz[-1] + 2400]


def score(x, target):
    x16 = np.interp(np.arange(0, len(x), SR / 16000), np.arange(len(x)), x).astype(np.float32)
    segs, _ = model.transcribe(x16, language="en", word_timestamps=True, beam_size=5)
    words = [w for s in segs for w in (s.words or [])]
    heard = [norm(w.word) for w in words if norm(w.word)]
    want = [norm(w) for w in target.split() if norm(w)]
    ratio = difflib.SequenceMatcher(a=want, b=heard, autojunk=False).ratio()
    gaps = max([b.start - a.end for a, b in zip(words, words[1:])] + [0.0])
    tail = (len(x) / SR) - (words[-1].end if words else 0)
    pen = max(0, gaps - 0.7) * 0.5 + max(0, tail - 0.6) * 0.4
    return ratio - pen, " ".join(heard), gaps, tail


parts, est, picks, t = [np.zeros(int(SR * LEAD), np.float32)], [], [], LEAD
for i, (s, d) in enumerate(zip(sentences, dirn, strict=True)):
    takes = sorted((vdir / "takes").glob(f"s{i:02d}_*.wav"))
    assert takes, f"no takes for line {i}"
    scored = []
    for p in takes:
        x = trim(load(p))
        sc, heard, gap, tail = score(x, d.get("say", s))
        scored.append((sc, p, x, heard, gap, tail))
    best = next((c for c in scored if c[1].stem.endswith(f"_{force[i]}")), None) if i in force else max(scored, key=lambda c: c[0])
    sc, p, x, heard, gap, tail = best
    # cut a trailing mumble after the last recognised word
    x = x * np.minimum(1, np.minimum(np.arange(len(x)) / 240, (len(x) - np.arange(len(x))) / 1200))
    dur = len(x) / SR
    ws = s.split()
    wt = [len(re.sub(r"\W", "", w)) + 2 for w in ws]
    acc = t
    for w, k in zip(ws, wt, strict=True):
        dd = dur * k / sum(wt)
        est.append({"word": w, "start": round(acc, 3), "end": round(acc + dd, 3), "sentence": i})
        acc += dd
    parts += [x, np.zeros(int(SR * d["pause"]), np.float32)]
    picks.append({"line": i, "take": p.name, "score": round(sc, 3), "heard": heard, "dur": round(dur, 2), "start": round(t, 2)})
    print(f"{i:2d} {p.name} {sc:5.2f} {dur:5.2f}s @{t:6.2f}  {heard[:70]}")
    t += dur + d["pause"]

voice = np.concatenate(parts)
voice = voice / max(1e-6, np.abs(voice).max()) * 0.9
sf.write(vdir / "voice.wav", voice, SR, subtype="PCM_16")
(vdir / "words_est.json").write_text(json.dumps(est, indent=1), encoding="utf-8")
(vdir / "words.json").write_text(json.dumps(est, indent=1), encoding="utf-8")
(vdir / "picks.json").write_text(json.dumps(picks, indent=1), encoding="utf-8")
print(f"{len(sentences)} lines, {t:.2f} s, {len(est) / t:.2f} words/s")
