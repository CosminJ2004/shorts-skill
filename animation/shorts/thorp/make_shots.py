"""Write shots.json for short_qa.py / look_score.py / phone_safe.py from the word clock (mirrors story.ts)."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
FPS, NL = 30, 15
W = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
lines = [[w for w in W if w["sentence"] == i] for i in range(NL)]
LS = [round(ln[0]["start"] * FPS) for ln in lines]
LE = [round(ln[-1]["end"] * FPS) for ln in lines]
wf = lambda i, k: round(lines[i][k]["start"] * FPS)  # noqa: E731
TOTAL = LE[-1] + 45
S = [("candle", "casino"), ("inside", "lab"), ("inside", "lab"), ("candle", "casino"), ("inside", "lab"), ("inside", "lab"),
     ("stage", "studio"), ("night", "strip"), ("candle", "casino"), ("stage", "studio"), ("inside", "museum"), ("stage", "studio"),
     ("stage", "studio"), ("stage", "desk"), ("candle", "casino")]
shots = []
for i, (light, st) in enumerate(S):
    a = 0 if i == 0 else LS[i] - 4
    b = LS[i + 1] - 4 if i < NL - 1 else TOTAL
    shots.append({"id": i + 1, "a": a, "b": b, "light": light, "set": st})
xf = [[s["a"] - 3, s["a"] + 3] for i, s in enumerate(shots) if i and (shots[i - 1]["set"] != s["set"] or i in (3, 14))]
cuts = [s["a"] for s in shots[1:]]
flash = [wf(0, -1) + 2, wf(0, -1) + 6]
(HERE / "shots.json").write_text(json.dumps({"shots": shots, "flash": flash, "flashes": [[wf(0, -1) + 2, wf(0, -1) + 6], [wf(14, -1) + 3, wf(14, -1) + 7]], "xfade": xf, "cuts": sorted(cuts)}))
print("TOTAL", TOTAL, "frames", TOTAL / FPS, "s;", len(shots), "shots")
