Vendored from https://github.com/mromidev/claude-animated-shorts @ e3b817b6afc6cd413466d43f11ba31209e034bbf (MIT), reviewed 2026-11-10:
code only calls ffmpeg (no network, no shell beyond that).
references/frames/ and references/sheets/ (frames from the third-party reference channel) are copied in for the
look-match loop (side-by-side sheets), but kept out of git (.gitignore): the skill says they are private study
material, never to be uploaded, published or sent. Re-copy them from the upstream repo if this folder is cloned.
Project adaptation: the Remotion project lives in ../../../animation/ (see animation/README.md).

Local changes since vendoring (this copy is now our own, evolving skill; upstream is only the starting point):
- 2026-11-10: iteration loop + FEEDBACK.md; templates/scripts/look_score.py (measure a render against the reference
  numbers) and fit_grade.py (fit the grade per light); "Measured lessons" section in SKILL.md.
