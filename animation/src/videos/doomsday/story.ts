// "Doomsday Is Today": timeline, cameras and lens, all keyed to the directed narration's real word times
// (shorts/doomsday/voice/words.json, from make_voice_cb -> pick_takes -> align_words). Nothing is a hand-typed frame:
// shots start a few frames before their line (LS), events land on words (wf), so a new voice take re-times everything.
// Camera grammar (cartoon-3d-short skill): creeping holds, smootherstep glides, flip kicks on impacts, an orbit on every
// shot (ARC_GAIN 2), dissolves between places, few hard cuts. Iteration 7 brief: a very catchy script and pro motion,
// so every line has a signature mover (see the shot table).
import wordsJson from "../../../shorts/doomsday/voice/words.json";

export const FPS = 30;
export type V3 = [number, number, number];
type W = { word: string; start: number; end: number; sentence: number };
const WORDS = wordsJson as W[];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const easeIn = (u: number) => clamp01(u) ** 2.2;
export const popIn = (u: number) => { const x = clamp01(u); return x < 1 ? 1 - Math.cos(x * Math.PI * 1.25) * (1 - x) ** 1.4 : 1; };
export const at = (f: number, f0: number, dur: number) => clamp01((f - f0) / dur);
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- word clock ----------------
const lineWords = (i: number) => WORDS.filter((w) => w.sentence === i);
/** frame where line i starts / ends */
export const LS = Array.from({ length: 17 }, (_, i) => Math.round(lineWords(i)[0].start * FPS));
export const LE = Array.from({ length: 17 }, (_, i) => Math.round(lineWords(i).slice(-1)[0].end * FPS));
/** frame of the k-th word of line i (negative k counts from the end) */
export const wf = (i: number, k: number) => { const ws = lineWords(i); return Math.round(ws[(k + ws.length) % ws.length].start * FPS); };
export const TOTAL = LE[16] + 40;
const L = 3; // visuals lead their word by ~3 frames

// ---------------- places ----------------
/** the 1960 office (interior set), the studio cyclorama (interior set), the town plaza, the hills with the curve and the cliff */
export const OFF: V3 = [1000, 0, 0];
export const STU: V3 = [2000, 0, 0];
export const PLAZA: V3 = [0, 0, 0];
export const STREET: V3 = [0, 0, -46]; // the squeezed street, north of the plaza
export const HILL: V3 = [0, 0, -260]; // the curve's foot
export const CLIFF: V3 = [180, 0, -260]; // the cliff edge (the drop is toward +x)
export const ASYM_X = 70; // the curve goes vertical at HILL.x + ASYM_X
/** the doomsday curve: height above the hill at distance s (m) along +x from its foot */
export const curveY = (s: number) => Math.min(400, 260 / Math.max(0.6, ASYM_X - s) - 260 / ASYM_X);

// ---------------- shots ----------------
export type Light = "day" | "golden" | "inside" | "stage";
export type ShotDef = { id: number; a: number; b: number; light: Light; az?: number; set: "office" | "studio" | "out" };
const pre = (i: number) => LS[i] - 4;
const S: [Light, ShotDef["set"], number?][] = [
  ["inside", "office"], // 0 hook: three scientists at the chalkboard, night
  ["stage", "studio"], // 1 Friday. November 13th. 2026: the calendar flips
  ["stage", "studio"], // 2 not a cult, not a psychic: the journal Science slams down
  ["inside", "office"], // 3 two thousand years of numbers: the calculator, the stacks; shocked faces
  ["day", "out", 120], // 4 every time humanity doubled: the plaza fills by doubling
  ["golden", "out", 30], // 5 follow that curve: the coaster up the hyperbola to infinity
  ["day", "out", 120], // 6 squeezed to death: the packed street
  ["inside", "office"], // 7 his birthday: the cake
  ["stage", "studio"], // 8 a stage magician: the rabbit
  ["inside", "office"], // 9 ridiculous: the experts laugh, letters rain
  ["day", "out", 110], // 10 thirty years: the town grows (time-lapse)
  ["inside", "office"], // 11 the math wasn't the problem: the chalkboard; people were
  ["stage", "studio"], // 12 fewer kids: the family portrait
  ["golden", "out", 130], // 13 a car at the cliff hits the brakes
  ["golden", "out", 140], // 14 about eight billion of us: the plaza at golden hour
  ["stage", "studio"], // 15 if you're watching this: the sofa
  ["inside", "office"], // 16 happy birthday, Heinz
];
export const SHOTS: ShotDef[] = S.map(([light, set, az], i) => ({ id: i + 1, a: i ? pre(i) : 0, b: i < 16 ? pre(i + 1) : TOTAL, light, set, az }));
// dissolves at place changes; within a set the change is a hard cut on the line (pattern-interrupt pace)
export const XFADE: Record<number, number> = {};
SHOTS.forEach((s, i) => { if (i && SHOTS[i - 1].set !== s.set) XFADE[s.id] = 6; });
/** white flash after the hook's date (line 1 end) and on "infinity" */
export const FLASHES = [wf(5, -1) + 2];

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
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// staging points the cameras frame (world.ts reads the same constants)
export const BOARD: V3 = add(OFF, [-3.2, 0, -2.6]); // the chalkboard's centre at the floor
export const DESK: V3 = add(OFF, [0.6, 0, -0.6]);
export const CAKE: V3 = add(DESK, [0.1, 0.82, 0.25]);
/** the coaster car's distance along the curve and its world position */
export const carS = (f: number) => 4 + 66 * easeIn(at(f, LS[5] + 6, LE[5] - LS[5] + 4)) ** 0.85;
export const coaster = (f: number): V3 => { const s = Math.min(69.2, carS(f)); return add(HILL, [s, curveY(s) + 0.25, 0]); };
/** the cliff car: races in from -x along z = CLIFF.z, brakes on "brakes", stops with its nose over the edge */
export const carX = (f: number) => {
  const tb = wf(13, -1) - 8, t = (f - LS[13]) / FPS, T = (tb - LS[13]) / FPS, v = 24, stop = CLIFF[0] - 0.9, D = (v * 0.9) / 2;
  if (t < T) return stop - D - v * (T - t);
  const u = Math.min(1, (t - T) / 0.9);
  return stop - D + D * (1 - (1 - u) ** 2);
};

const lk = (i: number, f: number, k = 0.0022, punch = 0) => pushK(f, LS[i], k, punch, 28);
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly(add(BOARD, [1.35, 1.6, 6.6]), add(BOARD, [0.85, 1.42, 0.95]), lk(0, f, 0.0026, 0.006), { fov: 42 }) }],
  2: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.7, 5.4]), add(STU, [0, 1.75, 0]), pushK(f, LS[1], 0.002) * pushK(f, wf(1, 0) - L, 0, 0.01, 18) * pushK(f, wf(1, 1) - L, 0, 0.01, 18) * pushK(f, wf(1, 3) - L, 0, 0.012, 18), { fov: 40 }) }],
  3: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.6, 6.2]), add(STU, [0, 1.4, 0]), lk(2, f, 0.002) * pushK(f, wf(2, 8) - L, 0, 0.012, 20), { fov: 42 }) }],
  4: [{ f: 0, s: (f) => dolly(add(DESK, [2.2, 1.6, 3.4]), add(DESK, [-0.2, 1.0, 0]), lk(3, f, 0.0016), { fov: 44 }) },
    { f: wf(3, -2) - 10, dur: 16, s: (f) => dolly(add(DESK, [0.6, 1.62, 2.4]), add(DESK, [-0.1, 1.55, -0.5]), pushK(f, wf(3, -2), 0.004, 0.012, 18), { fov: 42 }) }],
  5: [{ f: 0, s: (f) => dolly(add(PLAZA, [0, 9 + 4 * at(f, LS[4], LE[4] - LS[4]), 21]), add(PLAZA, [0, 0.5, 0]), lk(4, f, 0.0012), { fov: 44 }) }],
  6: [{ f: 0, s: (f) => { const c = coaster(f), u = at(f, LS[5] + 20, LE[5] - LS[5] - 20); return { pos: add(c, [-2.0 + 1.0 * u, 0.7 - 1.8 * u, 5.6 + 1.4 * u]), look: add(c, [1.6 - 1.0 * u, 1.0 + 2.5 * u, 0]), fov: 46, roll: -0.05 * u }; } }],
  7: [{ f: 0, s: (f) => dolly(add(STREET, [1.0, 1.7, 7.8]), add(STREET, [0, 1.5, 0]), lk(6, f, 0.002) * pushK(f, wf(6, -3) - L, 0, 0.012, 22), { fov: 44 }) }],
  8: [{ f: 0, s: (f) => dolly(add(CAKE, [0.5, 0.75, 2.6]), add(CAKE, [0.1, 0.55, 0]), lk(7, f, 0.0022) * pushK(f, wf(7, -2) - L, 0, 0.012, 22), { fov: 42 }) }],
  9: [{ f: 0, s: (f) => dolly(add(STU, [0.3, 1.6, 5.2]), add(STU, [0, 1.5, 0]), lk(8, f, 0.0024, 0.006), { fov: 42 }) }],
  10: [{ f: 0, s: (f) => dolly(add(OFF, [2.6, 1.7, 5.6]), add(OFF, [-0.4, 1.3, 0.6]), lk(9, f, 0.002), { fov: 44 }) }],
  11: [{ f: 0, s: (f) => { const u = at(f, LS[10], LE[10] - LS[10]); return dolly(add(PLAZA, [22 - 6 * u, 3 + 18 * u, 30 - 4 * u]), add(PLAZA, [0, 4 + 6 * u, -12]), 1, { fov: 44 }); } }],
  12: [{ f: 0, s: (f) => dolly(add(BOARD, [2.4, 1.6, 4.4]), add(BOARD, [0.2, 1.6, 0]), lk(11, f, 0.002) * pushK(f, wf(11, -2) - L, 0, 0.01, 20), { fov: 42 }) }],
  13: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 6.6]), add(STU, [0, 1.25, 0]), lk(12, f, 0.0018), { fov: 42 }) }],
  14: [{ f: 0, s: (f) => { const x = Math.min(carX(f), CLIFF[0] - 1.0); return { pos: [x - 9, 1.5, CLIFF[2] + 6.5], look: [x + 2, 1.0, CLIFF[2]], fov: 46 }; } },
    { f: wf(13, -1) - 10, dur: 14, s: (f) => dolly([CLIFF[0] + 4.2, 0.6, CLIFF[2] + 5.4], [CLIFF[0] - 0.6, 1.0, CLIFF[2]], pushK(f, wf(13, -1), 0.003, 0.01, 20), { fov: 42 }) }],
  15: [{ f: 0, s: (f) => zoom(add(PLAZA, [6, 2.2, 18]), add(PLAZA, [0, 2.2, 0]), 44, lk(14, f, 0.0016)) }],
  16: [{ f: 0, s: (f) => dolly(add(STU, [0.3, 1.45, 5.0]), add(STU, [0.05, 1.0, -0.2]), lk(15, f, 0.0026) * pushK(f, wf(15, 4) - L, 0, 0.01, 22), { fov: 42 }) }],
  17: [{ f: 0, s: (f) => dolly(add(CAKE, [0.6, 0.85, 3.0]), add(CAKE, [0.1, 0.6, 0]), lk(16, f, 0.0024, 0.006), { fov: 42 }) }],
};

// impact kicks: the date hammers, the journal slam, infinity, the squeeze, the brakes, the cake reveal
export const KICKS: [number, number][] = [[wf(1, 0), 0.5], [wf(1, 1), 0.5], [wf(1, 3), 0.7], [wf(2, 8), 0.8], [wf(5, -1), 0.8], [wf(6, -3), 0.6], [wf(13, -1), 0.7], [wf(7, -2), 0.4]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor((t - f0 / FPS) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

// ---------------- drift ----------------
type Arc = { w: number; d: number };
const ARC: Record<number, Arc> = {
  1: { w: 1.2, d: 5.7 }, 2: { w: -1.6, d: 5.4 }, 3: { w: 1.8, d: 6 }, 4: { w: -2.4, d: 3.6 }, 5: { w: 2.0, d: 22 }, 6: { w: 0, d: 7 },
  7: { w: -2.2, d: 7.8 }, 8: { w: 2.6, d: 2.6 }, 9: { w: -2.2, d: 5.2 }, 10: { w: 2.2, d: 5.6 }, 11: { w: 0, d: 30 }, 12: { w: -2.4, d: 4.6 },
  13: { w: 1.8, d: 6.6 }, 14: { w: 0, d: 10 }, 15: { w: -1.8, d: 19 }, 16: { w: 2.4, d: 4 }, 17: { w: -2.0, d: 3 },
};
const ARC_GAIN = 2.0;
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a || !a.w) return c;
  const th = ((ARC_GAIN * a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
  const v: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...v) || 1;
  const P: V3 = [c.pos[0] + (v[0] / n) * a.d, 0, c.pos[2] + (v[2] / n) * a.d];
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

// ---------------- lens: blur only on people's close beats ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 9, focus: () => add(BOARD, [0.6, 1.55, 1.0]) },
  { f: SHOTS[1].a, cInf: 0 },
  { f: SHOTS[3].a, cInf: 8, focus: () => add(DESK, [-0.2, 1.4, 0.2]) },
  { f: SHOTS[4].a, cInf: 0 },
  { f: SHOTS[7].a, cInf: 11, focus: () => add(CAKE, [0, 0.5, 0]) },
  { f: SHOTS[8].a, cInf: 0 },
  { f: SHOTS[9].a, cInf: 7, focus: () => add(OFF, [-0.4, 1.5, 0.6]) },
  { f: SHOTS[10].a, cInf: 0 },
  { f: SHOTS[11].a, cInf: 8, focus: () => add(BOARD, [0.8, 1.55, 0.9]) },
  { f: SHOTS[12].a, cInf: 0 },
  { f: SHOTS[16].a, cInf: 11, focus: () => add(CAKE, [0, 0.6, 0]) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
