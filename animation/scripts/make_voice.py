"""Narration + word timings for one short: Kokoro (local, CPU), one sentence at a time with short fixed gaps.

Reads the text under "## Script" in shorts/<name>/SCRIPT.md and writes shorts/<name>/voice/voice.wav (48 kHz) and
words.json (per-word times, proportional to letters inside each sentence; hand-fix if a word must land exactly).
Prints the frame (30 fps) where each sentence starts, for timing SHOTS / stateAt / CAMS in story.ts.

Usage: python scripts/make_voice.py <name> [--voice am_michael] [--speed 1.32]
Models: models/kokoro/kokoro-v1.0.onnx and voices-v1.0.bin at the repo root (see the README).
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ANIM = Path(__file__).resolve().parents[1]
MODELS = ANIM.parent / "models" / "kokoro"
SR, GAP, LEAD = 48000, 0.12, 0.10  # reference shorts: voice from frame 1-4, almost no pauses

ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("--voice", default="am_michael")
ap.add_argument("--speed", type=float, default=1.32)
args = ap.parse_args()

root = ANIM / "shorts" / args.name
(root / "voice").mkdir(exist_ok=True)
text = (root / "SCRIPT.md").read_text(encoding="utf-8").split("## Script", 1)[1].split("\n", 1)[1]
sentences = [s.strip() for line in text.strip().splitlines() for s in re.split(r"(?<=[.?!])\s+", line) if s.strip()]
tts = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
lang = "en-gb" if args.voice.startswith("b") else "en-us"

parts, words, t = [np.zeros(int(SR * LEAD), np.float32)], [], LEAD
for i, s in enumerate(sentences):
    samples, sr = tts.create(s, voice=args.voice, speed=args.speed, lang=lang)
    a = np.asarray(samples, np.float32)
    sf.write(root / "voice" / f"s{i:02d}.wav", a, sr, subtype="PCM_16")
    if sr != SR:
        a = np.interp(np.linspace(0, len(a) - 1, int(len(a) * SR / sr)), np.arange(len(a)), a).astype(np.float32)
    nz = np.flatnonzero(np.abs(a) > 0.01)  # trim the TTS's own silence so gaps stay tight
    a = a[max(0, nz[0] - 240): nz[-1] + 960] if len(nz) else a
    dur = len(a) / SR
    ws = s.split()
    wt = [len(re.sub(r"\W", "", w)) + 2 for w in ws]
    acc = t
    for w, k in zip(ws, wt, strict=True):
        d = dur * k / sum(wt)
        words.append({"word": w, "start": round(acc, 3), "end": round(acc + d, 3), "sentence": i})
        acc += d
    parts += [a, np.zeros(int(SR * GAP), np.float32)]
    t += dur + GAP

sf.write(root / "voice" / "voice.wav", np.concatenate(parts), SR, subtype="PCM_16")
(root / "voice" / "words.json").write_text(json.dumps(words, indent=1), encoding="utf-8")
print(f"{len(sentences)} sentences, {len(words)} words, {t:.2f} s, {len(words) / t:.2f} words/s")
for i, s in enumerate(sentences):
    w = [x for x in words if x["sentence"] == i]
    print(f"{i:2d} {w[0]['start']:6.2f}-{w[-1]['end']:6.2f}  f{round(w[0]['start'] * 30):4d}  {s}")
