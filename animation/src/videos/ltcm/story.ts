// "The Nickel Trap" (LTCM, 1998): timeline, cameras and lens, keyed to the directed narration's real word times
// (shorts/ltcm/voice/words.json). Word clock (skill, iteration 7): shots start a few frames before their line (LS), events
// land on words (wfw: the frame of a named word). Phone safe zone: faces and gags stay in the central ~74 % of the width.
// BRIGHT look (user feedback 2026-11-15, "videos are too dark"): only daylight and a coloured cyclorama, no night or candle.
import wordsJson from "../../../shorts/ltcm/voice/words.json";

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
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** frame of the k-th word of line i (negative k counts from the end) */
export const wf = (i: number, k: number) => { const ws = lineWords(i); return Math.round(ws[(k + ws.length) % ws.length].start * FPS); };
/** frame of the n-th (default first) word of line i that reads `txt` (falls back to the line start) */
export const wfw = (i: number, txt: string, n = 0) => {
  const ws = lineWords(i).filter((w) => norm(w.word) === norm(txt));
  return Math.round((ws[n] ?? lineWords(i)[0]).start * FPS);
};
export const TOTAL = LE[NL - 1] + 45;
export const L = 3; // visuals lead their word by ~3 frames

// ---------------- places (all far apart) ----------------
export const STU: V3 = [0, 0, 0]; // the colour cyclorama (gag beats)
export const OFF: V3 = [1000, 0, 0]; // the LTCM trading room
export const HALL: V3 = [2000, 0, 0]; // the bank hall (the rescue)

// ---------------- shots ----------------
export type Light = "day" | "stage";
export type SetName = "studio" | "office" | "hall";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; az?: number };
const pre = (i: number) => LS[i] - 4;
const S: [Light, SetName, number?][] = [
  ["stage", "studio"], // 0 hook: the fund, the money pile, the Nobel medals
  ["day", "office"], // 1 LTCM: professors, a bond trader, a formula
  ["stage", "studio"], // 2 two almost identical bonds, a tiny gap
  ["day", "office"], // 3 nickels, they borrowed
  ["stage", "studio"], // 4 one dollar owned, twenty-five borrowed
  ["day", "office"], // 5 it worked, banks begged
  ["stage", "studio"], // 6 Russia defaulted
  ["stage", "studio"], // 7 safe bonds, the gap widens
  ["day", "office"], // 8 almost two billion lost
  ["stage", "studio"], // 9 every loss hits 25 times harder
  ["day", "office"], // 10 almost everything gone
  ["day", "hall"], // 11 the Fed, fourteen banks
  ["stage", "studio"], // 12 Thorp sized every bet
  ["stage", "studio"], // 13 being right is not enough
  ["stage", "studio"], // 14 nickels and the steamroller
];
export const SHOTS: ShotDef[] = S.map(([light, set, az], i) => ({ id: i + 1, a: i ? pre(i) : 0, b: i < NL - 1 ? pre(i + 1) : TOTAL, light, set, az }));
export const XFADE: Record<number, number> = {};
SHOTS.forEach((s, i) => { if (i && SHOTS[i - 1].set !== s.set) XFADE[s.id] = 6; });
/** white flashes: the pile vanishing on the hook, the steamroller thud on the last line */
export const FLASHES = [wfw(0, "months") + 2, wf(14, -1) + 2];

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
const PUSH = 0.65;
const pushK = (f: number, f0: number, rate0: number, punch0 = 0, n = 35) => {
  const x = Math.max(0, f - f0), rate = rate0 * PUSH, punch = punch0 * PUSH;
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const BACK = 1.18;
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const kk = k * BACK;
  return { pos: [look[0] + (pos[0] - look[0]) * kk, look[1] + (pos[1] - look[1]) * kk, look[2] + (pos[2] - look[2]) * kk], look, ...rest };
};

const lk = (i: number, f: number, k = 0.0022, punch = 0) => pushK(f, LS[i], k, punch, 28);
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly(add(STU, [0.2, 1.5, 5.4]), add(STU, [0, 1.15, 0]), lk(0, f, 0.0016) * pushK(f, wfw(0, "lost") - L, 0, 0.005, 24)) }],
  2: [{ f: 0, s: (f) => dolly(add(OFF, [0.1, 1.5, 4.8]), add(OFF, [0, 1.25, -0.4]), lk(1, f, 0.0018) * pushK(f, wfw(1, "formula") - L, 0, 0.008, 20)) }],
  3: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 4.8]), add(STU, [0, 1.25, 0]), lk(2, f, 0.0022) * pushK(f, wfw(2, "closes") - L, 0, 0.01, 20)) }],
  4: [{ f: 0, s: (f) => dolly(add(OFF, [0.2, 1.7, 4.6]), add(OFF, [0, 0.95, 0]), lk(3, f, 0.002) * pushK(f, wfw(3, "borrowed") - L, 0, 0.01, 20)) }],
  5: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.6, 5.6]), add(STU, [0, 1.35, 0]), lk(4, f, 0.0016) * pushK(f, wfw(4, "twentyfive") - L, 0, 0.008, 22)) }],
  6: [{ f: 0, s: (f) => dolly(add(OFF, [0, 1.5, 5.0]), add(OFF, [0, 1.25, -0.2]), lk(5, f, 0.002) * pushK(f, wfw(5, "begged") - L, 0, 0.008, 20)) }],
  7: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.6, 5.4]), add(STU, [0, 1.4, -0.2]), lk(6, f, 0.0018) * pushK(f, wfw(6, "defaulted") - L, 0, 0.01, 18)) }],
  8: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 5.2]), add(STU, [0, 1.2, 0]), lk(7, f, 0.002) * pushK(f, wfw(7, "wider") - L, 0, 0.008, 20)) }],
  9: [{ f: 0, s: (f) => dolly(add(OFF, [0.1, 1.5, 4.8]), add(OFF, [0, 1.2, -0.2]), lk(8, f, 0.0022) * pushK(f, wfw(8, "billion") - L, 0, 0.01, 20)) }],
  10: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.6, 5.4]), add(STU, [0, 1.35, 0]), lk(9, f, 0.002) * pushK(f, wfw(9, "harder") - L, 0, 0.01, 20)) }],
  11: [{ f: 0, s: (f) => dolly(add(OFF, [0, 1.4, 4.6]), add(OFF, [0, 1.1, -0.2]), lk(10, f, 0.0022) * pushK(f, wfw(10, "gone") - L, 0, 0.01, 22)) }],
  12: [{ f: 0, s: (f) => dolly(add(HALL, [0, 1.6, 5.4]), add(HALL, [0, 1.3, -0.4]), lk(11, f, 0.0018) * pushK(f, wfw(11, "crash") - L, 0, 0.01, 22)) }],
  13: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 4.8]), add(STU, [0, 1.2, 0]), lk(12, f, 0.0022) * pushK(f, wfw(12, "wipe") - L, 0, 0.01, 20)) }],
  14: [{ f: 0, s: (f) => dolly(add(STU, [0, 1.5, 5.0]), add(STU, [0, 1.25, 0]), lk(13, f, 0.002) * pushK(f, wfw(13, "survive") - L, 0, 0.01, 20)) }],
  15: [{ f: 0, s: (f) => dolly(add(STU, [0.1, 1.4, 5.4]), add(STU, [0, 1.0, 0]), lk(14, f, 0.0018), { fov: 40 }) }],
};

export const KICKS: [number, number][] = [
  [wfw(0, "months"), 0.7], [wfw(3, "lot"), 0.5], [wfw(4, "twentyfive"), 0.7], [wfw(6, "defaulted"), 0.9], [wfw(8, "billion"), 0.6], [wfw(9, "harder"), 0.8],
  [wfw(10, "gone"), 0.6], [wfw(11, "crash"), 0.6], [wf(14, -1), 0.9],
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
  1: { w: 0.7, d: 5.4 }, 2: { w: -0.9, d: 4.8 }, 3: { w: 1.4, d: 4.8 }, 4: { w: -1.2, d: 4.6 }, 5: { w: 0.8, d: 5.6 }, 6: { w: -0.9, d: 5.0 },
  7: { w: 1.2, d: 5.4 }, 8: { w: -1.2, d: 5.2 }, 9: { w: 1.2, d: 4.8 }, 10: { w: -0.8, d: 5.4 }, 11: { w: 1.2, d: 4.6 }, 12: { w: -0.9, d: 5.4 },
  13: { w: 1.4, d: 4.8 }, 14: { w: -1.2, d: 5.0 }, 15: { w: 1.0, d: 5.4 },
};
const ARC_GAIN = 2.0;
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a || !a.w) return c;
  const th = ((ARC_GAIN * a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
  const P: V3 = [c.look[0], 0, c.look[2]];
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
  { f: 0, cInf: 0 },
  { f: SHOTS[1].a, cInf: 7, focus: () => add(OFF, [0, 1.25, -0.2]) },
  { f: SHOTS[2].a, cInf: 0 },
  { f: SHOTS[3].a, cInf: 6, focus: () => add(OFF, [0, 1.0, 0]) },
  { f: SHOTS[4].a, cInf: 0 },
  { f: SHOTS[5].a, cInf: 6, focus: () => add(OFF, [0, 1.2, -0.1]) },
  { f: SHOTS[6].a, cInf: 0 },
  { f: SHOTS[8].a, cInf: 7, focus: () => add(OFF, [0, 1.2, -0.1]) },
  { f: SHOTS[9].a, cInf: 0 },
  { f: SHOTS[10].a, cInf: 8, focus: () => add(OFF, [0, 1.1, -0.1]) },
  { f: SHOTS[11].a, cInf: 6, focus: () => add(HALL, [0, 1.3, -0.3]) },
  { f: SHOTS[12].a, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
