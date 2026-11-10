# CLAUDE.md

Cartoon 3D story shorts: 2D characters in an ink-outlined 3D world, rendered with three.js inside Remotion.
Before any work, read:
1. `README.md`.
2. `.claude/skills/cartoon-3d-short/SKILL.md`.
3. Its `FEEDBACK.md`.

Rules:
- The user writes in Romanian; reply in Romanian. Code, comments and docs are in English.
- Every video is an iteration:
  - Turn each piece of user feedback into a skill change (a SKILL.md rule, a script or a template value).
  - Log it in `FEEDBACK.md`.
  - Measure every render with `look_score.py` before and after a change.
- The skill's reference frames (`references/frames`, `references/sheets`) are third-party material for private study
  only. Never commit, upload, publish or send them.
- Run Python through uv (`uv run python ...`).
- Run renders and other long jobs in the background, one GPU job at a time.
- Ask before downloading anything new. Use free tools only.
- Never commit `models/`, `out/`, `.env` or secrets.
