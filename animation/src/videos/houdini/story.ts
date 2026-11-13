// "The Last Escape": timeline, cameras and lens, keyed to the directed narration's real word times
// (shorts/houdini/voice/words.json, from make_voice_cb -> pick_takes -> align_words). Word clock (skill, iteration 7):
// shots start a few frames before their line (LS), events land on words (wf). Iteration 8 adds the phone safe zone:
// faces and gags sit in the central ~74 % of the width (at vertical fov 42 the frame is 0.43 x distance wide), so
// two-shots keep their people within +-0.16 x distance of the look point.
import wordsJson from "../../../shorts/houdini/voice/words.json";

export const FPS = 30;
export type V3 = [number, number, number];
type W = { word: string; start: number; end: number; sentence: number };
export const WORDS = wordsJson as W[];
export const NL = 15;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const easeIn = (u: number) => clamp01(u) ** 2.2;
export const popIn = (u: number) => { const x = clamp01(u); return x < 1 ? 1 - Math.cos(x * Math.PI * 1.25) * (1 - x) ** 1.4 : 1; };
export const at = (f: number, f0: number, dur: number) => clamp01((f - f0) / dur);
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- word clock ----------------
const lineWords = (i: number) => WORDS.filter((w) => w.sentence === i);
export const LS = Array.from({ length: NL }, (_, i) => Math.round(lineWords(i)[0].start * FPS));
export const LE = Array.from({ length: NL }, (_, i) => Math.round(lineWords(i).slice(-1)[0].end * FPS));
/** frame of the k-th word of line i (negative k counts from the end) */
export const wf = (i: number, k: number) => { const ws = lineWords(i); return Math.round(ws[(k + ws.length) % ws.length].start * FPS); };
/** index in WORDS of the k-th word of line i (for lip-sync ranges) */
export const wi = (i: number, k: number) => { const ws = lineWords(i); return WORDS.indexOf(ws[(k + ws.length) % ws.length]); };
export const TOTAL = LE[NL - 1] + 45;
export const L = 3; // visuals lead their word by ~3 frames

// ---------------- places (all interior sets, far apart) ----------------
export const SEA: V3 = [0, 0, 0]; // the séance room (1920s and 2026)
export const THE: V3 = [1000, 0, 0]; // the theatre stage
export const ROOM: V3 = [2000, 0, 0]; // study / dressing room / parlour
export const STU: V3 = [3000, 0, 0]; // the colour cyclorama
export const ROOF: V3 = [4000, 0, 0]; // the Knickerbocker roof, Los Angeles, at night
export const WHALE: V3 = add(THE, [2.7, 0, -0.9]);
export const TANK: V3 = add(THE, [0, 0, -0.5]);

// ---------------- shots ----------------
export type Light = "candle" | "stage" | "inside" | "night";
export type SetName = "seance" | "theatre" | "room" | "studio" | "roof";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; az?: number };
const pre = (i: number) => LS[i] - 4;
const S: [Light, SetName, number?][] = [
  ["candle", "seance"], // 0 hook: a séance table, the portrait on the wall
  ["candle", "seance"], // 1 the ghost behind the medium, bored
  ["stage", "theatre"], // 2 handcuffs, jail cell, a dead whale
  ["stage", "theatre"], // 3 the water torture cell
  ["candle", "seance"], // 4 crashing a séance in disguise, with a cop
  ["inside", "room"], // 5 Conan Doyle: real magic powers
  ["inside", "room"], // 6 the punch in the dressing room
  ["stage", "theatre"], // 7 the show with a fever
  ["candle", "studio"], // 8 he died on Halloween
  ["stage", "studio"], // 9 the new book: sour cream
  ["stage", "studio"], // 10 you see: fake psychics
  ["inside", "room"], // 11 the secret password
  ["night", "roof"], // 12 ten years of séances on the roof
  ["night", "roof"], // 13 she blows out the candle
  ["candle", "seance"], // 14 today: Rosabelle, believe... the escape
];
export const SHOTS: ShotDef[] = S.map(([light, set, az], i) => ({ id: i + 1, a: i ? pre(i) : 0, b: i < NL - 1 ? pre(i + 1) : TOTAL, light, set, az }));
export const XFADE: Record<number, number> = {};
SHOTS.forEach((s, i) => { if (i && (SHOTS[i - 1].set !== s.set || i === 4 || i === 14)) XFADE[s.id] = 6; });
/** white flashes: the punch, and the final escape */
export const FLASHES = [wf(6, 6), wf(14, -1) + 2];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 42, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** iteration 8: pushes at 65 % of the doomsday rates, so faces stay inside the phone safe box to the end of a shot */
const PUSH = 0.65;
const pushK = (f: number, f0: number, rate0: number, punch0 = 0, n = 35) => {
  const x = Math.max(0, f - f0), rate = rate0 * PUSH, punch = punch0 * PUSH;
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

// staging points (world.ts reads the same constants)
export const TABLE: V3 = add(SEA, [0, 0, -0.4]);
export const PORTRAIT: V3 = add(SEA, [0, 2.35, -2.75]);
export const COUCH: V3 = add(ROOM, [0.35, 0, -0.9]);
export const RTABLE: V3 = add(ROOF, [0, 0, -0.3]);

const lk = (i: number, f: number, k = 0.0022, punch = 0) => pushK(f, LS[i], k, punch, 28);
const CAMS: Record<number, Key[]> = {
  // 0: the séance from the front; on "same dead man" the camera punches toward the portrait
  1: [{ f: 0, s: (f) => dolly(add(SEA, [0.25, 2.1, 6.2]), add(SEA, [0, 1.45, -1.0]), lk(0, f, 0.0024) * pushK(f, wf(0, -3) - L, 0, 0.012, 24)) }],
  // 1: the bored ghost behind the medium
  2: [{ f: 0, s: (f) => dolly(add(SEA, [0.45, 1.55, 2.8]), add(SEA, [0.28, 1.35, -1.25]), lk(1, f, 0.0026) * pushK(f, wf(1, -3) - L, 0, 0.01, 22), { fov: 40 }) }],
  // 2: cuffs, cage, then a glide right to the whale
  3: [{ f: 0, s: (f) => dolly(add(THE, [0.2, 1.5, 4.6]), add(THE, [0, 1.25, 0]), lk(2, f, 0.002) * pushK(f, wf(2, 4) - L, 0, 0.012, 20)) },
    { f: wf(2, 7) - 8, dur: 14, s: (f) => dolly(add(WHALE, [-0.45, 2.0, 5.0]), add(WHALE, [-0.55, 1.6, 0]), pushK(f, wf(2, 10) - L, 0.002, 0.012, 22)) }],
  // 3: the water cell
  4: [{ f: 0, s: (f) => dolly(add(TANK, [0.25, 1.45, 5.0]), add(TANK, [0.0, 1.25, 0]), lk(3, f, 0.0028) * pushK(f, wf(3, -2) - L, 0, 0.01, 22)) }],
  // 4: crashing the séance
  5: [{ f: 0, s: (f) => dolly(add(SEA, [0.35, 1.7, 4.6]), add(SEA, [0.05, 1.25, -0.4]), lk(4, f, 0.0022) * pushK(f, wf(4, 7) - L, 0, 0.01, 18) * pushK(f, wf(4, -1) - L, 0, 0.01, 18)) }],
  // 5: Conan Doyle and Houdini
  6: [{ f: 0, s: (f) => dolly(add(ROOM, [0.15, 1.55, 3.7]), add(ROOM, [0, 1.35, 0]), lk(5, f, 0.0024) * pushK(f, wf(5, -3) - L, 0, 0.01, 22)) }],
  // 6: the dressing room punch
  7: [{ f: 0, s: (f) => dolly(add(COUCH, [-0.45, 1.4, 4.0]), add(COUCH, [-0.4, 0.95, 0]), lk(6, f, 0.002)) },
    { f: wf(6, 6) - L, cut: true, s: (f) => dolly(add(COUCH, [-0.15, 1.4, 3.5]), add(COUCH, [-0.12, 1.2, 0]), pushK(f, wf(6, 6), 0.003), { fov: 40 }) }],
  // 7: the show with a fever
  8: [{ f: 0, s: (f) => dolly(add(THE, [0.3, 1.45, 4.6]), add(THE, [0.14, 1.2, 0]), lk(7, f, 0.0024) * pushK(f, wf(7, 2) - L, 0, 0.012, 18) * pushK(f, wf(7, -1) - L, 0, 0.012, 18)) }],
  // 8: he died on Halloween: a slow push on the empty chair
  9: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.35, 4.6]), add(STU, [0, 0.85, 0]), lk(8, f, 0.0035)) }],
  // 9: the new book, then the sour cream
  10: [{ f: 0, s: (f) => dolly(add(STU, [0.05, 1.55, 5.0]), add(STU, [0.05, 1.2, 0]), lk(9, f, 0.002) * pushK(f, wf(9, 3) - L, 0, 0.01, 18) * pushK(f, wf(9, -2) - L, 0, 0.014, 22)) }],
  // 10: the fake psychics
  11: [{ f: 0, s: (f) => dolly(add(STU, [0.1, 1.6, 5.6]), add(STU, [0, 1.25, -0.2]), lk(10, f, 0.0022)) }],
  // 11: the password
  12: [{ f: 0, s: (f) => dolly(add(ROOM, [0.1, 1.5, 3.7]), add(ROOM, [0, 1.35, -0.2]), lk(11, f, 0.0024) * pushK(f, wf(11, -2) - L, 0, 0.01, 24), { fov: 40 }) }],
  // 12: the roof, ten years in a few seconds
  13: [{ f: 0, s: (f) => dolly(add(RTABLE, [0.3, 1.75, 5.4]), add(RTABLE, [0, 1.5, -0.6]), lk(12, f, 0.0018)) }],
  // 13: Bess and the candle, close
  14: [{ f: 0, s: (f) => dolly(add(RTABLE, [0.15, 1.3, 2.9]), add(RTABLE, [0.04, 1.08, -0.1]), lk(13, f, 0.0026) * pushK(f, wf(13, -1) - L, 0, 0.012, 22), { fov: 40 }) }],
  // 14: today's séance; on "Or his greatest escape" the camera pulls back to reveal the ghost
  15: [{ f: 0, s: (f) => dolly(add(SEA, [0.2, 1.5, 2.9]), add(SEA, [0, 1.2, -1.0]), lk(14, f, 0.0026), { fov: 40 }) },
    { f: wf(14, -4) - 6, dur: 20, s: (f) => dolly(add(SEA, [0.3, 1.75, 4.6]), add(SEA, [0.15, 1.4, -1.2]), pushK(f, wf(14, -1) - L, 0.002, 0.012, 22)) }],
};

export const KICKS: [number, number][] = [
  [wf(2, 4), 0.4], [wf(2, -1), 0.6], [wf(4, -1), 0.5], [wf(6, 6), 0.9], [wf(7, 2), 0.6], [wf(7, -1), 0.5],
  [wf(9, 3), 0.6], [wf(9, -2), 0.8], [wf(13, -1), 0.5], [wf(14, -1), 0.6],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor((t - f0 / FPS) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

// ---------------- drift: every shot orbits its subject ----------------
type Arc = { w: number; d: number };
const ARC: Record<number, Arc> = {
  1: { w: 1.4, d: 6.2 }, 2: { w: -2.0, d: 3.9 }, 3: { w: 1.6, d: 4.6 }, 4: { w: -2.2, d: 6.0 }, 5: { w: 1.8, d: 4.4 }, 6: { w: -2.2, d: 3.7 },
  7: { w: 1.6, d: 4.0 }, 8: { w: -2.0, d: 4.5 }, 9: { w: 2.4, d: 4.6 }, 10: { w: -1.6, d: 4.8 }, 11: { w: 1.8, d: 5.6 }, 12: { w: -2.4, d: 3.1 },
  13: { w: 1.6, d: 6.4 }, 14: { w: -2.2, d: 2.7 }, 15: { w: 1.8, d: 3.9 },
};
const ARC_GAIN = 2.0;
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a || !a.w) return c;
  const th = ((ARC_GAIN * a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
  const v: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...v) || 1;
  // pivot on the look point itself (iteration 8): with push-ins a fixed pivot distance slid the subject off-centre
  void n; const P: V3 = [c.look[0], 0, c.look[2]];
  const rot = (p: V3): V3 => { const x = p[0] - P[0], z = p[2] - P[2]; return [P[0] + x * co - z * si, p[1], P[2] + x * si + z * co]; };
  return { ...c, pos: rot(c.pos), look: rot(c.look) };
};
export const camAt = (id: number, f: number): Cam => {
  const c = drift(id, run(CAMS[id], f), f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const Ln = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * Ln * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: blur only on people's close beats, never on the subject ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 6, focus: () => add(SEA, [0, 1.3, -0.6]) },
  { f: SHOTS[1].a, cInf: 10, focus: () => add(SEA, [0.3, 1.4, -1.1]) },
  { f: SHOTS[2].a, cInf: 0 },
  { f: SHOTS[4].a, cInf: 7, focus: () => add(SEA, [0, 1.2, -0.4]) },
  { f: SHOTS[5].a, cInf: 9, focus: () => add(ROOM, [0, 1.4, 0]) },
  { f: SHOTS[6].a, cInf: 9, focus: () => add(COUCH, [-0.3, 1.0, 0.1]) },
  { f: SHOTS[7].a, cInf: 0 },
  { f: SHOTS[11].a, cInf: 10, focus: () => add(ROOM, [0, 1.4, -0.2]) },
  { f: SHOTS[12].a, cInf: 0 },
  { f: SHOTS[13].a, cInf: 11, focus: () => add(RTABLE, [0, 1.1, 0]) },
  { f: SHOTS[14].a, cInf: 8, focus: () => add(SEA, [0, 1.3, -0.9]) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
