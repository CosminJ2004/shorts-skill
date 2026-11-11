# Feedback log: every video is an iteration

Each delivered video is one iteration. The user watches it and gives feedback, and every point becomes a durable
change. That change can be a rule in SKILL.md, a script in templates/scripts, or a template or look value. A fix made
only to that one video does not count.

Each entry has:
- the iteration and the video;
- what the user said, in their words;
- the measured scorecard gaps (`look_score.py`);
- what changed in the skill, and where.

Read this file before starting a new short.

## Standing direction (2026-11-10)
- 100% focus on this style of short.
- Iterate until making one is both fast and high quality.
- Target: the skill author's workflow (youtube.com/watch?v=OtbLL6OBNE4):
  - 2D cards in an ink-outlined 3D world;
  - a paradox hook and a "You see," pivot;
  - gliding cameras;
  - measure, don't opine.

## Iteration 1: The Pyramid Wearing a Church, v1 and v2 (2026-11-09/10)
- **User:** take the skill's reference frames ("they are there for a reason"). They are now copied in, gitignored and
  private, and used for side-by-sides and calibration.
- **v2 look pass:** done by eye against the reference frames.
- **Measured afterwards** (look_score.py, first run):

  | Area | v2 | Reference |
  |---|---|---|
  | Day saturation S | 0.69 | 0.44 |
  | Colourfulness | 125 | 83 |
  | Golden shadows | olive (a* -19, b* +34) | violet (a* +19, b* -6) |
  | Tunnel brightness | dark (Y' .27) | .46 |
  | Tunnel saturation | very saturated | lower |
  | Lens blur | on in 44 % of frames | about a third, close beats only |
  | Dead-still camera frames | 47 % | 10 % |
  | Camera frames moving | 13 % | 65 % |
  | Hard cuts per minute | 13 | about 1 per video |

- **Lessons, now rules in SKILL.md ("Measured lessons"):**
  1. A grade fitted to older, duller renders over-saturates the relit world. Re-fit it with fit_grade.py on pre-grade
     stills every time lights or albedos change.
  2. Every light needs its own grade. The tunnel was being graded with the golden preset.
  3. Push-ins alone measure as a still camera. Add an orbit drift around the subject in every shot (story.ts `ARC`).
  4. Use dissolves of 6-8 frames for place or time changes, and glides for reframes within the same place. Keep hard
     cuts to 1-3 per minute.
  5. Lens blur goes on people's close beats only. Never blur what the line is about. A blur fade-out must keep the old
     focus point: v2 jumped focus to the church while the blur was still 12 px, so the hook's tourist went soft.

## Iteration 2: The Pyramid Wearing a Church, v3 (2026-11-10)
- **What changed:**
  - grade fitted per light with fit_grade.py (non-clipping curve);
  - orbit drift (`ARC`);
  - dissolves at every shot change;
  - glides at 358 and 1396;
  - lens blur only on close beats, with the focus fade fixed;
  - a tunnel light and grade of its own.
- **Scorecard:** 20 of 58 metrics out of range, down from 36.

  | Metric | v2 | v3 | Reference |
  |---|---|---|---|
  | Day S | .69 | .49 | .44 |
  | Day colourfulness | 125 | 79 | 83 |
  | Golden S | .74 | .51 | .46 |
  | Lens blur on | 44 % of frames | 17 % | — |
  | Dead-still camera | 47 % of frames | 6 % | 10 % |
  | Tunnel S | .84 | .48 | — |
  | Tunnel shadows | brown | violet | — |

- **Still open:**
  - Camera moving ≥2 px/f only 19 % of frames (reference 65 %). The drift is too slow: about double the `ARC`
    rates, or add glides between beats.
  - Darks are not deep enough: day and golden p5 are .36 and .32 against .23 and .21. Scenes are mostly sky and grass
    with little in shade, so this is a world fix (more shadowed props, cast shadows), not a grade fix.
  - Tunnel too dark (p50 .37 against .46). The grade can't lift it without clipping; it needs stronger lantern light.
  - Ink fraction on day scenes is low (.010 against .026). Open grass gets no lines; we need more objects with edges.
  - Hook sentence is 8 words (reference 10-16).
  - `look_score.py` flags false "cuts" in the dark tunnel travel and on the nesting-doll pop-ins. The real cuts are
    3 (500, 1100, 1560).
- **Seen in stills:**
  - Frame 1060: the drift turned the friar's background into a blank church wall.
  - Frame 1600: the digger is half cut off at the mural.
  - Rule for SKILL.md: after adding drift, check the first and last frame of every shot for framing.

## Iteration 3: The Pyramid Wearing a Church, v3 + captions (2026-11-10)
- **User:** "I like it", but it needs cool, viral captions.
- **Changed in the skill:**
  - The upstream "no captions" rule is replaced: viral word-by-word captions are now standard.
  - Shared component `animation/src/lib/Captions.tsx`: 1-2 words per page, uppercase heavy font, thick outline,
    yellow for the spoken word, green for numbers and names, pop-in.
  - The captions render as a separate transparent ProRes layer and are composited with ffmpeg, about 3 minutes
    instead of re-rendering the picture.
- **Found on the first render:** the captions covered the friar's face. Added per-short `CaptionZone`s that move the
  line to the upper third during close-ups, plus the rule "check one frame of every close-up".

## Iteration 4: feedback on v3 (2026-11-10)
- **User:** v3 is very good. Next, be more careful with details:
  - shadows;
  - more elements in each scene;
  - better sharpness and graphics;
  - detail on faces, bodies and clothing;
  - characters bigger in frame.
  The caption style question was parked.
- **Changed in the skill:** new SKILL.md section "Detail and framing", a standing checklist. It requires:
  - contact shadows and shade areas;
  - three depth layers per shot;
  - full-resolution antialiased renders;
  - face, body and clothing detail at close-up resolution;
  - a subject at 40-60 % of the frame height;
  - a stills check of the first, middle and last frame of every shot.
- **Next video:** a viral English "Did you know" short, built against this checklist.

## Iteration 5: The Castle That Fell Through Its Toilet (2026-11-11)
- **User:**
  - Make a viral English "did you know" short, like the ones with huge views this week.
  - Focus on quality and on a script with exactly the reference format: hook, punchline, something funny.
- **Research:** the week's Shorts chart was mostly DIY, Diwali, pets and MrBeast. The one fact-explainer in the top 16
  was "How the First Combat Submarine Actually Worked" (24 M views in 5 days). That gives the formula: a real
  historical object, how it actually worked, and the mechanism shown.
- **Script:**
  - hook of 14 words;
  - the "iron or butter" boast set up and paid off as the callback;
  - a Luckily / Unluckily joke built on real facts;
  - a "You see," pivot with an everyday analogy (a bank vault with a doggy door).
  - Facts and sources are in `shorts/castle/SCRIPT.md`.
- **Quality bar applied** (iteration 4 feedback):
  - the medieval character kit: crowns, helms and coifs, heraldic tabards, capes, beards, noses, folds;
  - poses per beat;
  - 24 shots, each with foreground props and contact shadows;
  - chalk cliff faces, crenels, arrow slits, a corbelled keep;
  - interiors with candles, stained glass, a tapestry and a hay basket by the seat.
- **Lessons:** see SKILL.md, "Build lessons from the castle short".
- **Scorecard:**
  - Passing: voice, script and sound (hook 14 words, "You see," at 49.1 s, -14.7 LUFS), day colour, ink fraction,
    and lens blur on 9 % of frames.
  - Still open:
    - The camera moves (2 px/f or more) in only 19 % of frames, against 65 % in the reference. The orbits are too
      slow; this is the same gap as the pyramid's.
    - The vignette is too strong in golden scenes (0.54 against 0.75).
    - Golden darks are lifted (p5 .29 against .21) and lean brown (b* +4).
    - Hard cuts run at 6.2 per minute: the flash, the butter swaps and the toilet pop.

## Iteration 5b: ideas taken from the GrowKaz Stickman plugin (2026-11-11)
- **User:** "toate 5": take all five ideas into our skill.
- **Not installed:** the plugin itself. It has a different look (black stick figures with rim light on dark sets).
  Only the ideas were rewritten as our code and rules.
- **Changes:**
  1. `scripts/align_words.py` gives real word times with faster-whisper. On the castle, 96 % of words matched, and
     the largest error in the old estimate was 1.5 s.
  2. `src/lib/talk.ts` lip-syncs quoted lines (Philip's "iron", Richard's "butter").
  3. Idle breathing on standing and seated cards.
  4. `ARC_GAIN = 2` doubles the orbit rate (it was 19 % moving frames, against 65 % in the reference).
  5. SKILL.md "Life and pacing rules": shot vocabulary, pacing, a -9 dB duck, ambience, risers.
- **Castle v2:** re-rendered with all five changes.
- **Castle v2 measured:**
  - Camera moving frames rose from 19 % to 37 % (reference 34-94 %); dead-still frames fell from 18 % to 8 %.
  - Median speed is still low: 1.2 px/f against 3.6.
  - Still open: the golden vignette is too strong (0.52 against 0.75).
