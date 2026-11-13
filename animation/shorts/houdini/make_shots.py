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
S = [("inside", "seance"), ("inside", "seance"), ("stage", "theatre"), ("stage", "theatre"), ("inside", "seance"), ("inside", "room"),
     ("inside", "room"), ("stage", "theatre"), ("inside", "studio"), ("stage", "studio"), ("stage", "studio"), ("inside", "room"),
     ("golden", "roof"), ("golden", "roof"), ("inside", "seance")]
shots = []
for i, (light, st) in enumerate(S):
    a = 0 if i == 0 else LS[i] - 4
    b = LS[i + 1] - 4 if i < NL - 1 else TOTAL
    shots.append({"id": i + 1, "a": a, "b": b, "light": light, "set": st})
xf = [[s["a"] - 3, s["a"] + 3] for i, s in enumerate(shots) if i and (shots[i - 1]["set"] != s["set"] or i in (4, 14))]
cuts = [s["a"] for s in shots[1:]] + [wf(6, 6) - 3, wf(2, 7) - 8, wf(14, -4) - 6]
flash = [wf(6, 6), wf(6, 6) + 4]
(HERE / "shots.json").write_text(json.dumps({"shots": shots, "flash": flash, "flashes": [[wf(6, 6), wf(6, 6) + 4], [wf(14, -1) + 2, wf(14, -1) + 6]], "xfade": xf, "cuts": sorted(cuts)}))
print("TOTAL", TOTAL, "frames", TOTAL / FPS, "s;", len(shots), "shots")
