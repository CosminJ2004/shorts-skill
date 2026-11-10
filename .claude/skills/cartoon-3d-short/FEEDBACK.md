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
