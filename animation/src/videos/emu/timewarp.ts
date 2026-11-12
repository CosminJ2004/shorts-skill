// Story time vs video time. The whole short (shots, cameras, cast, pops, kicks) is authored in STORY frames, timed to
// the first narration (Kokoro, shorts/emu/voice/words_kokoro.json). The delivered narration is the directed, expressive
// one (Chatterbox, words.json): different rhythm, longer dramatic pauses. Instead of re-timing ~300 constants by hand,
// the video plays story time through a warp built from the word starts of both takes (same 224 words, same order),
// smoothed over ~1 s so speed changes are gradual. Pauses become slow, breathing holds; every word-locked event still
// lands on its word. audio.py builds the same warp (keep the two in sync).
import oldJson from "../../../shorts/emu/voice/words_kokoro.json";
import newJson from "../../../shorts/emu/voice/words.json";
import { FPS, TOTAL } from "./story";

type W = { start: number; end: number };
const OLD = oldJson as W[], NEW = newJson as W[];
const SMOOTH = 15; // half-window in story frames

/** new-time (frames) of each story frame 0..TOTAL, piecewise linear between word starts, then smoothed */
const table = (() => {
  const A: [number, number][] = [[0, 0]];
  OLD.forEach((w, i) => A.push([w.start * FPS, NEW[i].start * FPS]));
  const lo = OLD[OLD.length - 1], ln = NEW[NEW.length - 1];
  A.push([lo.end * FPS, ln.end * FPS], [TOTAL + 60, ln.end * FPS + (TOTAL + 60 - lo.end * FPS)]);
  const raw: number[] = [];
  let j = 0;
  for (let o = 0; o <= TOTAL + 60; o++) {
    while (j + 1 < A.length - 1 && A[j + 1][0] <= o) j++;
    const [o0, n0] = A[j], [o1, n1] = A[j + 1];
    raw.push(n0 + ((n1 - n0) * (o - o0)) / Math.max(1e-6, o1 - o0));
  }
  const sm = raw.map((_, o) => { // symmetric window that shrinks at the ends (no edge pile-up)
    const h = Math.min(SMOOTH, o, raw.length - 1 - o);
    let s = 0;
    for (let k = -h; k <= h; k++) s += raw[o + k];
    return s / (2 * h + 1);
  });
  sm[0] = 0;
  for (let o = 1; o < sm.length; o++) sm[o] = Math.max(sm[o], sm[o - 1] + 0.15); // monotonic, never frozen
  return sm;
})();

/** video frames of the whole short (story end mapped, plus the same tail) */
export const VIDEO_TOTAL = Math.ceil(table[TOTAL]);

/** story frame (float) shown at video frame v */
export const storyAt = (v: number) => {
  let a = 0, b = table.length - 1;
  if (v <= 0) return 0;
  if (v >= table[b]) return b;
  while (b - a > 1) { const m = (a + b) >> 1; if (table[m] <= v) a = m; else b = m; }
  return a + (v - table[a]) / Math.max(1e-6, table[b] - table[a]);
};
/** video frame of story frame o */
export const videoAt = (o: number) => {
  const i = Math.max(0, Math.min(table.length - 2, Math.floor(o)));
  return table[i] + (table[i + 1] - table[i]) * (o - i);
};
