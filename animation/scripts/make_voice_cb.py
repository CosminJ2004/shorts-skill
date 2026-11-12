"""Expressive narration with Chatterbox (Resemble AI, MIT), directed per line. Step 1 of 2: generate takes.

Reads the sentences under "## Script" in shorts/<name>/SCRIPT.md and the per-line direction in
shorts/<name>/DIRECTION.json (exag = emotion intensity, cfg = pacing, pause = silence after, optional "say" = the text
spoken when it differs from the caption text, e.g. numbers written out). Writes shorts/<name>/voice/takes/sNN_k.wav.
Step 2 (pick_takes.py, in the project env) transcribes the takes with faster-whisper, keeps the cleanest take per
line and assembles voice.wav with the directed pauses; then align_words.py gives the word times.

Runs in its own venv (tools/chatterbox-venv: torch CPU + chatterbox-tts):
  tools/chatterbox-venv/Scripts/python.exe animation/scripts/make_voice_cb.py <name> [--lines 0,5] [--takes 3] [--ref voice.wav]
"""

import argparse
import json
import re
from pathlib import Path

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

ANIM = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("--lines", default="")
ap.add_argument("--takes", type=int, default=0)
ap.add_argument("--ref", default="")
args = ap.parse_args()

root = ANIM / "shorts" / args.name
text = (root / "SCRIPT.md").read_text(encoding="utf-8").split("## Script", 1)[1].split("\n", 1)[1]
sentences = [s.strip() for line in text.strip().splitlines() for s in re.split(r"(?<=[.?!])\s+(?=[A-Z\"])", line) if s.strip()]
dirn = json.loads((root / "DIRECTION.json").read_text(encoding="utf-8"))
assert len(dirn["lines"]) == len(sentences), (len(dirn["lines"]), len(sentences))
takes = args.takes or dirn["voice"].get("takes", 2)
only = {int(x) for x in args.lines.split(",") if x != ""}
out = root / "voice" / "takes"
out.mkdir(parents=True, exist_ok=True)

torch.set_num_threads(max(1, torch.get_num_threads()))
model = ChatterboxTTS.from_pretrained(device="cpu")
if args.ref:
    model.prepare_conditionals(args.ref, exaggeration=0.5)
for i, (s, d) in enumerate(zip(sentences, dirn["lines"], strict=True)):
    if only and i not in only:
        continue
    for k in range(takes):
        torch.manual_seed(dirn["voice"].get("seed", 1) + 97 * i + k)
        wav = model.generate(d.get("say", s), exaggeration=d["exag"], cfg_weight=d["cfg"], temperature=d.get("temp", 0.8))
        ta.save(str(out / f"s{i:02d}_{k}.wav"), wav, model.sr)
        print(f"{i:2d}.{k} {wav.shape[-1] / model.sr:5.2f} s  {s[:60]}", flush=True)
