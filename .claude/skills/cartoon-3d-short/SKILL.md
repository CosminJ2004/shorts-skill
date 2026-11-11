---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- Burn in viral word-by-word captions. This rule changed with user feedback on 2026-11-10; see "Captions" below.
  No other labels or text in the video.
- English only.
- Voice: one steady tone.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export: 1080x1920. `--scale 1.3333` fails in Remotion 4.0.542, because 1920 x 1.3333 is not a whole number of pixels. For 2K, register the composition at 1440x2560 instead.
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Iteration loop (how this skill gets better)
Every video is one iteration. Before starting, read `FEEDBACK.md`, the log of the user's feedback and what each piece
changed.
1. **Measure the render, don't judge it by eye.** Run:
   ```bash
   python templates/scripts/look_score.py <final.mp4> out/<name>/score --shots shots.json --words voice/words.json
   ```
   - It compares the render with the reference numbers on colour per light, ink on edges, lens blur share, camera
     motion (hold/drift/move, glides, push-ins, still holds, cuts), voice pace, hook, pivot and loudness.
   - It writes `scorecard.md` with the biggest gaps first.
   - `shots.json` lists `light` per shot plus `xfade`, `flash` and `cuts` (where the story cuts on purpose).
2. **Fix the colour with the fitter, not by hand.**
   - Render pre-grade stills with `PROPS='{"post":{"grade":false}}'`.
   - Run `python templates/scripts/fit_grade.py <stills> shots.json src/videos/<name>/grade.ts`. It fits one
     GradeEffect preset per light to the reference medians.
   - Whatever still misses after the fit belongs to the lights or the albedos.
3. **Deliver** the video together with the scorecard summary.
4. **Feedback.** Turn every point the user makes into a skill change (a rule here, a script, or a template value) and
   add an entry to `FEEDBACK.md`. A fix that lives only in that one video is not done.

## Measured lessons (from look_score on our own renders; see FEEDBACK.md)
- **Grade.**
  - Re-fit it (fit_grade.py) whenever lights or albedos change. A grade fitted to older, duller renders doubled the
    saturation of the relit world: S .69 against the reference .44.
  - Give every light its own preset (day, golden, interior/tunnel).
- **Camera.**
  - Push-ins alone measure as a still camera.
  - Every shot also orbits its subject (`ARC` in story.ts: w deg/s around a pivot d m ahead; ~2 deg/s ≈ 2 px/f at
    720p). The pivot is the cast in close shots and the monument in wides, so the subject holds while the background
    slides with parallax.
  - Target: 65 % of frames moving, 10 % dead still.
- **Cuts.**
  - About 1-3 hard cuts per minute.
  - Place or time changes are 6-8 f dissolves (`XFADE`).
  - Reframes within the same place are glides (`dur` keys). Keep the same cast through a glide: a cast switch in
    mid-glide pops.
- **Lens blur.**
  - Only on people's close beats, about a third of screen time.
  - Never blur what the current line is about.
  - A blur fade-out keeps the previous focus point (`dofAt`). Switching focus while the blur is still high softens the
    subject.

## Detail and framing (user feedback, iteration 4: standing quality bar)
The user liked v3 but asked for more care with details. Treat every point here as a check before rendering.
- **Shadows.**
  - Every character and prop casts a visible contact shadow (shadow map or blob), including under feet.
  - Each scene has real shade areas: overhangs, trees, walls, awnings. Open grass in flat light reads cheap. This
    also fixes the "darks too lifted" gap (day p5 .36 against .23).
- **More elements.**
  - Fill every shot in three depth layers: foreground props (blurred edge objects, rocks, plants), a midground with
    the subject, and a busy background (buildings, crowds, terrain).
  - No empty wall or empty sky behind a speaking character. v3 frame 1060 (friar against a blank wall) fails this.
- **Sharpness.**
  - Render at full 1080x1920 with antialiasing (MSAA or SMAA).
  - Texture filtering: anisotropic 8+ and mipmaps on every card.
  - Character cards at least 2x their on-screen size.
  - Lens blur only on the background, never on the subject (see Lens blur above).
- **Characters.**
  - Faces: brows, eyelids and a mouth shape that changes per beat (talk/smile/shock/smug), nose and cheek shading,
    hair or beard strands. No blank faces in a close-up. Keep the style rule "no blush, no eye highlights" (Look
    targets): the detail comes from shapes and shading, not shine.
  - Bodies: proportioned torso, arms and hands, with a pose per beat rather than one stiff pose.
  - Clothing: folds, seams, belts, trims, layered garments and a period-correct palette. Flat single-colour clothing
    is not allowed in close-ups.
  - Draw at close-up resolution even when the shot is wide; the camera pushes in.
- **Framing.**
  - Keep characters bigger in frame: in people shots the subject fills 40-60 % of the frame height.
  - Never crop a head or a key prop at the edge. v3 frame 1600 (digger cut off at the mural) fails this.
  - After adding drift or glides, check the first, middle and last frame of every shot.
- **Check:** a stills sheet (first, middle and last frame of every shot) reviewed against this list before the full
  render. Use `templates/scripts/stills_sheet.py`.

## Build lessons from the castle short (iteration 5)
- **Character kit** (`toon.ts`, all fields optional, so older shorts are unchanged):
  - Outfit fields: `beard`, `cape`, `collar` (ermine), `tabard` with `charge` (lions / lilies / cross) and `trim`,
    `mail`, `girdle`, `hood`, `nose`, `spear`.
  - Hats: `crown`, `crown_big`, `helm` (with a mail coif), `kettle`.
  - Poses: `cross`, `climb`, `cradle`, `hips`, `point`.
  - Expressions: `smug`, `queasy`, `proud`, `sneer`, `scared`.
  - Props: `torch`, `scroll`.
  - Check a new cast on a flat sheet composition first (`src/videos/castle/CastSheet.tsx`), before the 3D world
    exists.
- **Character shots zoom; they don't dolly.** `dolly()` moves the lens toward the look point. With a far look point
  (a castle 40 m away), an 8 % push moves the lens 3 m, straight past a character standing 4 m in front. When the look
  point is far, use `zoom()`; dolly only when the look point is on the subject.
- **Word punches:** `pushK(f, f0, rate, punch)` starts its punch at f0. To punch on a word inside a shot, multiply in
  a second factor: `pushK(f, a, rate) * pushK(f, wordFrame, 0, 0.009, 24)`.
- **Portrait width:** at 8 m and 44 degrees the frame is only 3.5 m wide. Size props to fit (the balance was 4 m wide
  and had to shrink to 2.6 m), or put people behind the props instead of beside them.
- **Cliffs and steep ground:** a terrain heightfield has a few vertices down a 45 m drop, so it reads as a grass or
  hay field. Build steep faces as their own high-resolution curtain mesh along the edge, with a painted texture
  (strata, flint, cracks, moss), and tuck the terrain behind it. Ripple the face with vertical gullies, not
  horizontal bands: horizontal ripples read as clouds at a distance.
- **Golden light that faces the walls:** a backlit golden sun leaves every wall facing the camera in violet shade.
  For shots of a wall, set the shot `az` near 130-140 (sun behind the lens). Keep backlight for silhouettes and sky
  shots.
- **Grade per light** stays the rule: re-fit with `fit_grade.py` on pre-grade stills of the new world. It now
  accepts `inside` as an interior light name.

## Life and pacing rules (from the GrowKaz Stickman plugin, adopted 2026-11-11; the code is ours)
- **Quoted lines are lip-synced. The narrator never is.**
  - When a character's quote is spoken (`"I'd take it..."`), pass `talk: talkAt(WORDS, t, ...quoteRange(WORDS, s))`
    (`src/lib/talk.ts`).
  - The mouth opens once per syllable, in 4 steps, so drawings are reused.
- **Nobody is frozen.**
  - Standing and seated cards breathe: the mesh scales about 1.2 % in y over a 3-4 s cycle, with a phase per
    character (`breath` in the castle world).
  - Expressions and poses change on the words, never at random.
- **The camera always moves.**
  - Every shot orbits (`ARC`) at ~4-7 deg/s on close shots, double the old rates (`ARC_GAIN = 2`). At the old rates
    only 19 % of frames moved, against the reference's 65 %.
  - Holds still push in.
- **Shot vocabulary per short.** Mix these, and never use the same framing more than 3 shots in a row:
  - establishing wide (~10 %), opening every new place;
  - medium two-shot (~25 %);
  - over-the-shoulder with a soft foreground figure (~10 %);
  - face close-up (10-15 %) for reactions and "you" moments;
  - insert or macro on objects (~10 %);
  - cutaway or diagram for the mechanism (the "You see," segment);
  - 1-3 signature moments per short (the butter swap, the toilet pop).
- **Pacing:** 15-25 shots per minute and a median of 2-3.5 s. Cut or reframe on phrase boundaries, 3-6 frames
  before the phrase.
- **Sound:**
  - Duck the music -9 dB under the voice (-4 was too little).
  - A continuous ambience bed under every shot.
  - A riser 1-2 s before each big reveal, with the impact on the reveal frame.
  - A pop or blip when something appears.
  - Never more than ~2 SFX on the same instant.

## Captions (user feedback, iteration 3)
- **Style:** `animation/src/lib/Captions.tsx`, driven by the short's `words.json`.
  - 1-2 words per page, heavy uppercase sans (Segoe UI Black), thick black outline and a hard shadow.
  - The spoken word turns yellow; numbers and names turn green.
  - Each page pops in over 5 frames, and each word shows 1 frame early.
- **Placement:** centre at 63 % of the height, inside the reference caption band.
  - Never cover a face. In close-ups whose heads sit in the band, add a `CaptionZone` [from, to, 0.36] that moves the
    line to the upper third.
  - Check one frame of every close-up.
- **Render the captions as their own transparent layer**, so changing them never re-renders the 3D picture (~3 min
  instead of ~15). Register a `<Name>Captions` composition with `CaptionsLayer`, then:
  ```bash
  npx remotion render src/index.ts <Name>Captions out/<name>/captions.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --concurrency=4
  ```
  ```bash
  ffmpeg -i final.mp4 -i captions.mov -filter_complex "[0:v][1:v]overlay=format=auto" -c:v libx264 -crf 16 -c:a copy final_captions.mp4
  ```

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, then make its word timings `words.json` (any speech-to-text with word times).
   - Put them in the project folder, e.g. `~/bridge-short/voice/`.
   - In the shorts-studio repo, run `uv run python scripts/make_voice.py <name>` and then
     `uv run python scripts/align_words.py <name>`. The second script aligns the script's exact words onto
     faster-whisper word times, using the base.en model.
   - The letter-count estimate was up to 1.5 s off: years like "1196" are read as three long words. Always align
     before timing shots, kicks and expressions to words. Everything is timed to words.json.
4. **Shot plan** in `story.ts`: copy `templates/bridge/` (the final bridge source, same as `src/videos/bridge/` of your Remotion project) to `src/videos/<name>/`, register a new composition next to `BridgeShort` in `src/Root.tsx`, and rename it.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (`~/bridge-short/audio/`: timeline.py, sfx_gen.py, sfx.py, music.py, instruments.py, dsp.py, mix.py).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333`
    - Mux with `-map 0:v:0 -map 1:a:0` (Remotion writes a silent audio track).
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds.
    - Run `look_score.py` (see the iteration loop) and close the biggest gaps.
    - Then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
Start every new short from `templates/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
