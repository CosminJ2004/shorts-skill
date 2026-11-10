# shorts-studio

Shorts-studio makes 55-70 s vertical cartoon story shorts for YouTube:
- 2D characters in a colourful 3D world, with black ink outlines and painted textures;
- gliding cameras;
- a fast, steady narrator and a synthesized score.

Everything renders locally with code: three.js inside Remotion, a Kokoro voice, and numpy sound. No AI video
generator is used. Claude Code writes, builds and checks each short by following the skill in
`.claude/skills/cartoon-3d-short/`.

The skill improves one video at a time:
1. Make a short.
2. Measure it against the reference numbers.
3. Get the user's feedback.
4. Write that feedback back into the skill (rules, scripts, template values) and log it in `FEEDBACK.md`.

## Layout
| Path | What |
|---|---|
| `.claude/skills/cartoon-3d-short/` | The skill. `SKILL.md` covers the workflow, look values and lessons; `FEEDBACK.md` is the iteration log; `references/` holds the measured style reports; `templates/` holds the bridge template, audio and scripts |
| `.claude/skills/cartoon-3d-short/templates/scripts/look_score.py` | Measures a render against the reference: colour per light, ink, lens blur, camera motion, cuts, voice pace, hook, pivot and loudness |
| `.claude/skills/cartoon-3d-short/templates/scripts/fit_grade.py` | Fits the colour grade per light to the reference numbers |
| `.claude/skills/remotion-best-practices/` | Remotion's own skill (vendored) |
| `animation/` | The Remotion project: shared look modules (`src/videos/bridge/`), one folder per short (`src/videos/<name>/`, `shorts/<name>/`) and scripts. See `animation/README.md` |
| `models/kokoro/` | The Kokoro voice model (not in git) |

## Setup (Windows, free tools)
1. Install the tools:
   - Node 20+, ffmpeg and Chrome;
   - `uv` for Python 3.12.
2. Install the packages:
   ```bash
   cd animation && npm install
   ```
   ```bash
   uv sync
   ```
3. Put the Kokoro voice in `models/kokoro/`: `kokoro-v1.0.onnx` and `voices-v1.0.bin`, from
   github.com/thewh1teagle/kokoro-onnx releases (Apache-2.0).
4. Optional, for look checks: put the skill's reference frames in `references/frames` and `references/sheets`. They
   are third-party, private study material and are never committed.

## Make a short
Follow `animation/README.md` ("Make a new short"):
1. Write the script.
2. Make the voice:
   ```bash
   uv run python animation/scripts/make_voice.py <name>
   ```
3. Time the shots.
4. Build the world.
5. Make the sound.
6. Render.
7. Score the render:
   ```bash
   look_score.py
   ```
8. Deliver it, then write the user's feedback into the skill.

## Licences
- The skill is based on github.com/mromidev/claude-animated-shorts (MIT); see `VENDORED.md`.
- Kokoro is Apache-2.0.
- Remotion is free for individuals and small teams.
