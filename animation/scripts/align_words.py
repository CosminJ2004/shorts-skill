"""Real word timings for a short: align the script's exact words onto faster-whisper word timestamps.

make_voice.py writes words.json with times spread over each sentence by letter count (an estimate). This script runs
faster-whisper on voice.wav with word timestamps, matches the script words onto the recognised words (difflib, so
the script's spelling is kept), and fills unmatched words by interpolation. Each word stays inside its own sentence's
span from make_voice (the sentence boundaries there are exact: we generated them).

Usage: python scripts/align_words.py <name> [--model base.en]
Writes shorts/<name>/voice/words.json (the estimate is kept as words_est.json) and prints the match rate and the
largest shift. The model downloads once from Hugging Face (~75 MB for base.en).
Idea from the GrowKaz Stickman plugin's transcribe step; the code is ours.
"""

import argparse
import difflib
import json
import re
from pathlib import Path

ANIM = Path(__file__).resolve().parents[1]
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))  # noqa: E731

ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("--model", default="base.en")
args = ap.parse_args()

vdir = ANIM / "shorts" / args.name / "voice"
est_path = vdir / "words_est.json"
if not est_path.exists():
    est_path.write_text((vdir / "words.json").read_text(encoding="utf-8"), encoding="utf-8")
est = json.loads(est_path.read_text(encoding="utf-8"))

from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel(args.model, device="cpu", compute_type="int8")
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

x, sr = sf.read(str(vdir / "voice.wav"), dtype="float32")  # decode ourselves (PyAV in this env rejects faster-whisper's call)
if x.ndim > 1:
    x = x.mean(axis=1)
x16 = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
segs, _ = model.transcribe(x16, language="en", word_timestamps=True, beam_size=5)
heard = [{"w": norm(w.word), "s": w.start, "e": w.end} for s in segs for w in (s.words or []) if norm(w.word)]

a = [norm(w["word"]) for w in est]
b = [h["w"] for h in heard]
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
times: list = [None] * len(est)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        h = heard[blk.b + k]
        times[blk.a + k] = (h["s"], h["e"])
matched = sum(t is not None for t in times)

# sentence spans (exact, from make_voice)
span: dict = {}
for w in est:
    s = w.get("sentence", 0)
    lo, hi = span.get(s, (w["start"], w["end"]))
    span[s] = (min(lo, w["start"]), max(hi, w["end"]))

out, i, n, shift = [], 0, len(est), 0.0
while i < n:
    if times[i] is None:  # interpolate a run of unmatched words between known neighbours (or the sentence edges)
        j = i
        while j < n and times[j] is None:
            j += 1
        s = est[i].get("sentence", 0)
        t0 = times[i - 1][1] if i > 0 and times[i - 1] and est[i - 1].get("sentence") == s else span[s][0]
        t1 = times[j][0] if j < n and times[j] and est[j].get("sentence") == s else span[s][1]
        step = max(0.04, t1 - t0) / (j - i)
        for k in range(i, j):
            times[k] = (t0 + step * (k - i), t0 + step * (k - i + 1))
        i = j
    else:
        i += 1
for w, (s0, e0) in zip(est, times, strict=True):
    lo, hi = span[w.get("sentence", 0)]
    s0, e0 = min(max(s0, lo - 0.05), hi), min(max(e0, lo), hi + 0.05)
    shift = max(shift, abs(s0 - w["start"]))
    out.append({**w, "start": round(s0, 3), "end": round(max(e0, s0 + 0.04), 3)})

(vdir / "words.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
print(f"{matched}/{n} words matched ({100 * matched / n:.0f} %), largest shift vs the estimate {shift:.2f} s")
