// "The Shoe Computer": timeline, cameras and lens, keyed to the directed narration's real word times
// (shorts/thorp/voice/words.json, from make_voice_cb -> pick_takes -> align_words). Word clock (skill, iteration 7):
// shots start a few frames before their line (LS), events land on words (wf). Phone safe zone (iteration 8): faces and
// gags sit in the central ~74 % of the width, so two-shots keep their people within +-0.16 x distance of the look point.
import wordsJson from "../../../shorts/thorp/voice/words.json";

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

// ---------------- places (all far apart) ----------------
export const CAS: V3 = [0, 0, 0]; // the casino floor
export const LAB: V3 = [1000, 0, 0]; // Shannon's basement lab
export const STU: V3 = [2000, 0, 0]; // the colour cyclorama (gag beats)
export const STRIP: V3 = [3000, 0, 0]; // the Las Vegas street at night
export const MUS: V3 = [4000, 0, 0]; // the MIT museum gallery
export const DESK: V3 = [5000, 0, 0]; // a 2026 trading desk

// ---------------- shots ----------------
export type Light = "candle" | "stage" | "inside" | "night";
export type SetName = "casino" | "lab" | "studio" | "strip" | "museum" | "desk";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; az?: number };
const pre = (i: number) => LS[i] - 4;
const S: [Light, SetName, number?][] = [
  ["candle", "casino"], // 0 hook: two geniuses at the roulette table, computers in their shoes
  ["inside", "lab"], // 1 Shannon invented information theory (the maths behind your phone)
  ["inside", "lab"], // 2 Thorp, casinos are physics problems (chalkboard, apple)
  ["candle", "casino"], // 3 time the ball and the wheel
  ["inside", "lab"], // 4 twelve transistors, switches in the shoes, big toes
  ["inside", "lab"], // 5 the basement test: forty-four percent
  ["stage", "studio"], // 6 forty-four vs five
  ["night", "strip"], // 7 they flew to Las Vegas
  ["candle", "casino"], // 8 it worked, nervous, quit
  ["stage", "studio"], // 9 the secret, five years, Guinness
  ["inside", "museum"], // 10 the MIT museum and the smartwatch
  ["stage", "studio"], // 11 wheels to markets
  ["stage", "studio"], // 12 small edge, size the bet
  ["stage", "desk"], // 13 trading firms and prediction markets
  ["candle", "casino"], // 14 check their shoes
];
export const SHOTS: ShotDef[] = S.map(([light, set, az], i) => ({ id: i + 1, a: i ? pre(i) : 0, b: i < NL - 1 ? pre(i + 1) : TOTAL, light, set, az }));
export const XFADE: Record<number, number> = {};
SHOTS.forEach((s, i) => { if (i && (SHOTS[i - 1].set !== s.set || i === 3 || i === 14)) XFADE[s.id] = 6; });
/** white flashes: the roulette on the hook, and the toe click of the last line */
export const FLASHES = [wf(0, -1) + 2, wf(14, -1) + 3];

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
/** pushes at 65 % of the doomsday rates, so faces stay inside the phone safe box to the end of a shot */
const PUSH = 0.65;
const pushK = (f: number, f0: number, rate0: number, punch0 = 0, n = 35) => {
  const x = Math.max(0, f - f0), rate = rate0 * PUSH, punch = punch0 * PUSH;
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** every camera sits 18 % further back than its nominal spot: the first stills had faces too big for the phone safe box */
const BACK = 1.18;
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const kk = k * BACK;
  return { pos: [look[0] + (pos[0] - look[0]) * kk, look[1] + (pos[1] - look[1]) * kk, look[2] + (pos[2] - look[2]) * kk], look, ...rest };
};

// staging points (world.ts reads the same constants)
export const RTAB: V3 = add(CAS, [0, 0, -0.4]); // the roulette table
export const BENCH: V3 = add(LAB, [0.2, 0, -1.7]); // the workbench with the box and the shoe
export const BOARD: V3 = add(LAB, [-1.1, 0, -2.6]); // the chalkboard
export const CASE: V3 = add(MUS, [-0.45, 0, -1.1]); // the museum display case

const lk = (i: number, f: number, k = 0.0022, punch = 0) => pushK(f, LS[i], k, punch, 28);
const CAMS: Record<number, Key[]> = {
  // 0: the hook, both men at the table; the camera punches in on "roulette"
  1: [{ f: 0, s: (f) => dolly(add(CAS, [0.25, 1.55, 5.4]), add(CAS, [0, 1.2, -0.5]), lk(0, f, 0.0016) * pushK(f, wf(0, -1) - L, 0, 0.005, 24)) }],
  // 1: Shannon (left), Thorp listening
  2: [{ f: 0, s: (f) => dolly(add(LAB, [0.2, 1.5, 4.4]), add(LAB, [0, 1.3, -0.6]), lk(1, f, 0.0026) * pushK(f, wf(1, -1) - L, 0, 0.01, 22)) }],
  // 2: Thorp at the chalkboard
  3: [{ f: 0, s: (f) => dolly(add(LAB, [-0.3, 1.5, 3.4]), add(LAB, [-0.65, 1.4, -1.2]), lk(2, f, 0.0022) * pushK(f, wf(2, 13) - L, 0, 0.012, 22)) }],
  // 3: the wheel from above-front, Thorp left, Shannon right
  4: [{ f: 0, s: (f) => dolly(add(CAS, [0.1, 2.0, 3.8]), add(CAS, [0, 0.95, -0.4]), lk(3, f, 0.0015) * pushK(f, wf(3, 17) - L, 0, 0.004, 20)) }],
  // 4: the bench: the shoe, the box, the toe
  5: [{ f: 0, s: (f) => dolly(add(LAB, [0.15, 1.4, 4.2]), add(LAB, [0.1, 1.0, -0.7]), lk(4, f, 0.0016) * pushK(f, wf(4, -1) - L, 0, 0.005, 20)) }],
  // 5: the basement test, the bar rises
  6: [{ f: 0, s: (f) => dolly(add(LAB, [0.05, 1.55, 4.6]), add(LAB, [0, 1.3, -0.9]), lk(5, f, 0.0022) * pushK(f, wf(5, 8) - L, 0, 0.012, 22)) }],
  // 6: big bar vs tiny bar
  7: [{ f: 0, s: (f) => dolly(add(STU, [0.1, 1.5, 4.8]), add(STU, [0.05, 1.15, -0.2]), lk(6, f, 0.0024) * pushK(f, wf(6, 7) - L, 0, 0.012, 18)) }],
  // 7: the street, the jet, the walk
  8: [{ f: 0, s: (f) => dolly(add(STRIP, [0.3, 1.5, 5.6]), add(STRIP, [0, 1.3, 0]), lk(7, f, 0.002)) }],
  // 8: the casino, nerves, the guard, the escape
  9: [{ f: 0, s: (f) => dolly(add(CAS, [0.1, 1.6, 4.8]), add(CAS, [0, 1.25, -0.4]), lk(8, f, 0.0022) * pushK(f, wf(8, 7) - L, 0, 0.012, 18)) }],
  // 9: the secret, five years, Guinness
  10: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 4.6]), add(STU, [0, 1.25, 0]), lk(9, f, 0.0022) * pushK(f, wf(9, 7) - L, 0, 0.012, 20)) }],
  // 10: the museum: the case, the shoe, the watch
  11: [{ f: 0, s: (f) => dolly(add(MUS, [-0.1, 1.5, 4.0]), add(MUS, [-0.2, 1.25, -0.7]), lk(10, f, 0.0024) * pushK(f, wf(10, -1) - L, 0, 0.01, 22)) }],
  // 11: wheel thrown away, markets appear
  12: [{ f: 0, s: (f) => dolly(add(STU, [0.1, 1.55, 4.8]), add(STU, [0, 1.25, -0.2]), lk(11, f, 0.0022) * pushK(f, wf(11, -1) - L, 0, 0.012, 20)) }],
  // 12: small stacks vs the tower
  13: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 4.8]), add(STU, [0, 1.15, 0]), lk(12, f, 0.002) * pushK(f, wf(12, 15) - L, 0, 0.012, 20)) }],
  // 13: the 2026 trading desk
  14: [{ f: 0, s: (f) => dolly(add(DESK, [0.2, 1.6, 5.2]), add(DESK, [0, 1.35, -0.8]), lk(13, f, 0.0022) * pushK(f, wf(13, 8) - L, 0, 0.01, 22)) }],
  // 14: the high roller at the table, then the camera drops to his shoes
  15: [{ f: 0, s: (f) => dolly(add(CAS, [0.2, 1.6, 3.8]), add(CAS, [0, 1.25, -0.5]), lk(14, f, 0.0024), { fov: 40 }) },
    { f: wf(14, 8) - 6, dur: 14, s: (f) => dolly(add(CAS, [0.15, 0.7, 2.7]), add(CAS, [0, 0.28, 0.5]), pushK(f, wf(14, 10) - L, 0.002, 0.012, 18)) }],
};

export const KICKS: [number, number][] = [
  [wf(0, -1), 0.7], [wf(1, -1), 0.4], [wf(2, -1), 0.7], [wf(4, -1), 0.6], [wf(5, 8), 0.6], [wf(8, 13), 0.6], [wf(9, 7), 0.5], [wf(12, 15), 0.9], [wf(14, -1), 0.8],
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
  1: { w: 0.7, d: 5.4 }, 2: { w: -1.8, d: 4.4 }, 3: { w: 1.6, d: 3.6 }, 4: { w: -0.7, d: 3.8 }, 5: { w: 0.7, d: 4.2 }, 6: { w: -1.8, d: 4.6 },
  7: { w: 1.6, d: 4.8 }, 8: { w: -1.6, d: 5.6 }, 9: { w: 1.8, d: 4.8 }, 10: { w: -1.8, d: 4.6 }, 11: { w: 1.6, d: 4.4 }, 12: { w: -1.6, d: 4.8 },
  13: { w: 1.6, d: 4.8 }, 14: { w: -1.6, d: 5.2 }, 15: { w: 1.6, d: 3.8 },
};
const ARC_GAIN = 2.0;
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a || !a.w) return c;
  const th = ((ARC_GAIN * a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
  const P: V3 = [c.look[0], 0, c.look[2]]; // pivot on the look point itself (iteration 8)
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
  { f: 0, cInf: 6, focus: () => add(CAS, [0, 1.2, -0.4]) },
  { f: SHOTS[1].a, cInf: 8, focus: () => add(LAB, [0, 1.3, -0.5]) },
  { f: SHOTS[2].a, cInf: 8, focus: () => add(LAB, [-0.8, 1.3, -1.3]) },
  { f: SHOTS[3].a, cInf: 6, focus: () => add(CAS, [0, 0.9, -0.4]) },
  { f: SHOTS[4].a, cInf: 0 },
  { f: SHOTS[6].a, cInf: 0 },
  { f: SHOTS[7].a, cInf: 8, focus: () => add(STRIP, [0, 1.2, 0]) },
  { f: SHOTS[8].a, cInf: 7, focus: () => add(CAS, [0, 1.2, -0.3]) },
  { f: SHOTS[9].a, cInf: 0 },
  { f: SHOTS[10].a, cInf: 9, focus: () => add(MUS, [0, 1.2, -0.7]) },
  { f: SHOTS[11].a, cInf: 0 },
  { f: SHOTS[13].a, cInf: 8, focus: () => add(DESK, [0, 1.3, -0.5]) },
  { f: SHOTS[14].a, cInf: 8, focus: () => add(CAS, [0, 1.2, -0.4]) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
