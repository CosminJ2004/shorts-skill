# animation: cartoon 3D story shorts (three.js inside Remotion)

This folder holds the second production line of shorts-studio. It makes 55-70 s vertical cartoon stories with
**2D characters in a colourful 3D world**:
- ink outlines and painted textures;
- lens blur and gliding cameras;
- a synthesized score and sound effects.

Everything renders locally with no AI video model. It follows the vendored skill in
`../.claude/skills/cartoon-3d-short/` (MIT, from github.com/mromidev/claude-animated-shorts; see `VENDORED.md`).

## Layout
| Path | What |
|---|---|
| `src/videos/bridge/` | The skill's template, the "bridge" short. Its look modules are shared: ink, lens blur, grade, two-tone shading, card shading, painted textures, character drawing |
| `src/videos/pyramid/` | **The Pyramid Wearing a Church**, our first short. `story.ts` holds the shots, story state, cameras and DOF. `world.ts` builds the pyramid stages, hill, trees, church, town, tunnels and mural, plus the cast and effects. `Pyramid.tsx` is the composition |
| `src/lib/PostKick.tsx` | Fix for empty frames with post-processing (see below) |
| `shorts/pyramid/` | `SCRIPT.md` (facts and sources, script), `shots.json` (shot ranges, lights, cuts for `look_score.py`), `audio.py` (score, SFX, mix) |
| `scripts/make_voice.py` | Kokoro narration and `words.json` for any short: `uv run python scripts/make_voice.py <name>` |
| `scripts/stills.mjs` | Look checks: `COMP=PyramidShort node scripts/stills.mjs out/pyramid/x_ 40,300,1500 0.5` |

## Make a new short
1. Copy `src/videos/pyramid/` and `shorts/pyramid/` to a new name.
2. Write `SCRIPT.md`. Use the skill's beat formula; every joke must be a researched fact.
3. Make the voice and word timings:
   ```bash
   uv run python scripts/make_voice.py <name> --voice am_michael --speed 1.32
   ```
   It prints the frame where each sentence starts.
4. Time the `SHOTS`, `stateAt` and `CAMS` in `story.ts` to those frames.
5. Build the set in `world.ts`, then check stills.
6. Make the sound:
   ```bash
   python shorts/<name>/audio.py
   ```
7. Render and mux. Use the `-map` options because Remotion writes a silent audio track:
   ```bash
   npx remotion render src/index.ts <Comp> out/<name>/video_silent.mp4 --codec=h264 --crf=16 --gl=angle \
     --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe" --concurrency=2
   ffmpeg -i out/<name>/video_silent.mp4 -i shorts/<name>/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
     -af loudnorm=I=-14:TP=-1.5:LRA=7 -c:a aac -b:a 192k -shortest out/<name>/final.mp4
   ```

## Measure every iteration
Each video is one iteration; the user's feedback goes into `../.claude/skills/cartoon-3d-short/FEEDBACK.md` and into the
skill itself. Score a render against the reference numbers and fit the grade with the skill's tools:
```bash
S=../.claude/skills/cartoon-3d-short/templates/scripts
python $S/look_score.py out/pyramid/final.mp4 out/pyramid/score --shots shorts/pyramid/shots.json --words shorts/pyramid/voice/words.json
PROPS='{"post":{"grade":false}}' node scripts/stills.mjs out/pyramid/pregrade/x_ 40,300,880,1340 0.5
python $S/fit_grade.py out/pyramid/pregrade shorts/pyramid/shots.json src/videos/pyramid/grade.ts
```

## Notes from this machine (Radeon 860M iGPU, ANGLE)
- **Empty frames with post-processing.** Remotion advances R3F once per frame, before `@react-three/postprocessing`
  has built its composer, so frames came out blank (only the CSS background). `PostKick` waits one animation frame,
  advances again and only then releases the frame. It must sit inside every `<ThreeCanvas>` that uses a composer.
- **Speed.**
  - A 1080x1920 frame renders in ~0.3 s with `--concurrency=2`.
  - The 60 s short takes ~10-15 min.
  - Stills at `--scale 0.5` take 3-5 s each after a ~15 s bundle.
- **Temp folder.** Remotion bundles go to the temp folder. Set `TEMP`/`TMP` (or `REMOTION_TMP` for `stills.mjs`) to
  `C:/Users/Cosmin/remotion-tmp`, and empty it when nothing is rendering.
- **No Kenney models.** The bridge template loads Kenney CC0 models when present. Kenney's site only serves its
  zips through a browser download flow, so the pyramid short builds its trees procedurally. You can download a kit
  by hand into `public/<name>/kenney/` if you need one.
- **Reference frames stay local.** The skill's reference frames (a third-party channel) live in
  `references/frames` and `references/sheets` on this machine for side-by-sides and `look_score.py` calibration, and
  are gitignored. Never commit or send them.
