// "The Pyramid Wearing a Church": timeline, story state and cameras, timed to shorts/pyramid/voice/words.json.
// Camera grammar from the cartoon-3d-short skill (motion.md): holds always creep in, smootherstep glides of 18-40 f,
// big reframes are cuts, impacts are 7-frame flip kicks, rolls of 4-5 degrees on emphasis beats.
export const FPS = 30;
export const TOTAL = 1806;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** overshooting ease for things that pop into place (0 -> ~1.08 -> 1) */
export const popIn = (u: number) => { const x = clamp01(u); return x < 1 ? 1 - Math.cos(x * Math.PI * 1.25) * (1 - x) ** 1.4 * 1.0 : 1; };

// ---------------- the place ----------------
/** stepped pyramid stages: base half-width (m), height (m), tiers. Each new one swallows the last. */
export const STAGES = [
  { a: 13, h: 6, n: 3, col: "#d9a066" },
  { a: 24, h: 10, n: 4, col: "#c98b5a" },
  { a: 36, h: 14.5, n: 5, col: "#e0b27a" },
  { a: 50, h: 19, n: 6, col: "#b97a52" },
  { a: 64, h: 23, n: 7, col: "#d6a873" },
];
export const HILL_R = 110, HILL_H = 27; // the overgrown mound that hides the last stage
export const CHURCH_Y = HILL_H; // the church sits on the flattened summit
export const GIZA: V3 = [-38, 0, -135]; // comparison pyramid (shot 5): behind-left, taller but much smaller
export const TUNNEL: V3 = [600, 0, 0]; // the tunnel set, far from the outside world
export const MURAL: V3 = [620, 0, 0]; // a parallel corridor with the drinking-party mural on its right wall

// ---------------- shots ----------------
export type Light = "day" | "golden" | "tunnel";
/** az: optional per-shot sun azimuth (deg from the camera axis toward screen right; 180 = behind the lens) */
export type ShotDef = { id: number; a: number; b: number; light: Light; az?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, az: 115, a: 0, b: 124, light: "day" }, // hook: the hill with the church
  { id: 2, a: 124, b: 251, light: "golden" }, // 2,000 years ago: builders and the first temple
  { id: 3, a: 251, b: 428, light: "golden" }, // too small -> a bigger pyramid on top
  { id: 4, a: 428, b: 551, light: "golden" }, // grandkids, again and again
  { id: 5, az: 115, a: 551, b: 661, light: "day" }, // twice Giza
  { id: 6, a: 661, b: 834, light: "golden" }, // the city shrinks, rain, seeds, trees
  { id: 7, az: 115, a: 834, b: 931, light: "day" }, // it looks exactly like a hill
  { id: 8, a: 931, b: 1048, light: "day" }, // 1594: the church on top
  { id: 9, a: 1048, b: 1179, light: "day" }, // luckily / unluckily
  { id: 10, az: 115, a: 1179, b: 1312, light: "day" }, // nesting dolls
  { id: 11, a: 1312, b: 1487, light: "tunnel" }, // 1931: tunnels, 8 km
  { id: 12, a: 1487, b: 1630, light: "tunnel" }, // stairs inside stairs, the drinking-party mural
  { id: 13, az: 115, a: 1630, b: TOTAL, light: "day" }, // still mostly a hill, wearing a church as a hat
];
// Look pass 3 (look_score.py): the reference has ~1 hard cut per video and dissolves 6-8 f where place or time
// changes; v2 measured 13 cuts/min. Every shot change is now an 8 f dissolve, in-shot reframes glide where they can.
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8, 11: 8, 12: 8, 13: 8 };
export const FLASH_AT = 124;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story state per frame ----------------
export type State = {
  grow: number[]; // 0..1 per stage (how far each pyramid stage has risen)
  lift: number[]; // metres each shell is lifted (nesting-doll shot)
  hill: number; // 0..1 overgrowth mound (vertical scale)
  trees: number; // 0..1 how many trees have sprouted
  church: number; // 0..1 church pop-in
  giza: boolean; town: boolean; builders: boolean;
};
const at = (f: number, f0: number, dur: number) => clamp01((f - f0) / dur);
export const stateAt = (id: number, f: number): State => {
  const g = [0, 0, 0, 0, 0];
  const s: State = { grow: g, lift: [0, 0, 0, 0, 0, 0], hill: 0, trees: 0, church: 0, giza: false, town: false, builders: false };
  const done = () => { for (let i = 0; i < 5; i++) g[i] = 1; };
  switch (id) {
    case 1: case 13: done(); s.hill = 1; s.trees = 1; s.church = 1; s.town = true; break;
    case 2: g[0] = 1; s.builders = true; break;
    case 3: g[0] = 1; g[1] = popIn(at(f, 384, 22)); s.builders = true; break; // "a bigger pyramid" (word ~384)
    case 4: g[0] = g[1] = 1; g[2] = popIn(at(f, 440, 18)); g[3] = popIn(at(f, 478, 18)); g[4] = popIn(at(f, 508, 20)); s.builders = true; break;
    case 5: done(); s.giza = true; s.builders = true; break;
    case 6: done(); s.hill = 0.15 + 0.85 * smooth(at(f, 724, 110)); s.trees = smooth(at(f, 790, 44)); break;
    case 7: done(); s.hill = 1; s.trees = 1; break;
    case 8: done(); s.hill = 1; s.trees = 1; s.church = popIn(at(f, 1012, 20)); s.town = true; break; // "church on top"
    case 9: done(); s.hill = 1; s.trees = 1; s.church = 1; s.town = true; break;
    case 10: {
      // nesting dolls: the hill lifts off ("nesting dolls" ~1228), then stage 5 ("Open one" 1252), then stage 4 ("older one" 1290)
      done(); s.hill = 1; s.trees = 1; s.church = 1;
      const up = (f0: number) => 42 * easeOut(at(f, f0, 26));
      s.lift[5] = up(1226); s.lift[4] = up(1254); s.lift[3] = up(1290);
      break;
    }
    default: break;
  }
  return s;
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
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
/** zoom push (camera stays put; for far subjects, where a dolly would drive the lens past the cast) */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const T = TUNNEL;

// people stand on the plain in front (+z) of the pyramid; the stairway faces +z
const S1a = (f: number) => zoom([28, 1.75, 150], [0, 22, 0], 40, pushK(f, 0, 0.0022));
const S1b = (f: number) => dolly([14, 22, 105], [0, 31, 0], pushK(f, 60, 0.0025, 0.006, 30), { fov: 38, roll: -0.04 });
const S2a = (f: number) => dolly([10, 3.2, 40], [0, 3.4, 0], pushK(f, 120, 0.0025), { fov: 42 });
const S2b = (f: number) => dolly([4.5, 2.2, 27], [1.5, 2.6, 18], pushK(f, 190, 0.002), { fov: 40, roll: 0.03 });
const S3a = (f: number) => dolly([-3.5, 1.9, 30.5], [-1.6, 1.75, 25.5], pushK(f, 251, 0.0025), { fov: 38 }); // builders unhappy
const S3b = (f: number) => dolly([22, 9, 72], [0, 6, 0], pushK(f, 360, 0.002), { fov: 42 }); // the bigger one rises
const S4a = (f: number) => zoom([34, 1.9, 132], [0, 13, 0], 44, pushK(f, 428, 0.0016));
const S4b = (f: number) => zoom([46, 2.4, 176], [0, 15, 0], 46, pushK(f, 500, 0.0018), { roll: -0.035 });
const S5a = (f: number) => zoom([5, 1.8, 215], [-8, 24, 0], 52, pushK(f, 551, 0.0015));
const S6a = (f: number) => zoom([52, 1.9, 150], [0, 15, 0], 42, pushK(f, 655, 0.0015));
const S6b = (f: number) => zoom([45, 22, 135], [0, 16, 0], 40, pushK(f, 785, 0.0015, 0.004, 30), { roll: 0.03 });
const S7a = (f: number) => zoom([-48, 1.8, 140], [0, 19, 0], 40, pushK(f, 828, 0.0025, 0.006, 30));
const S8a = (f: number) => dolly([18, 32, 62], [0, 33, 0], pushK(f, 931, 0.0018), { fov: 40 });
const S8b = (f: number) => dolly([10, 35, 44], [0, 34, 0], pushK(f, 1005, 0.002, 0.006, 30), { fov: 40, roll: -0.04 });
const S9a = (f: number) => dolly([2.8, 28.75, 26.6], [0, 28.55, 21], pushK(f, 1048, 0.0025), { fov: 38 }); // friar at the church door
const S9b = (f: number) => dolly([4.2, 2.0, 112], [1.2, 3.2, 104], pushK(f, 1100, 0.0025, 0.006, 30), { fov: 40, roll: 0.04 }); // archaeologist below
const S10a = (f: number) => zoom([95, 42, 150], [0, 25, 0], 44, pushK(f, 1179, 0.0012));
const S11a = (f: number) => dolly([T[0] + 0.5, 1.6, T[2] + 3.2], [T[0], 1.45, T[2] - 6], pushK(f, 1312, 0.003), { fov: 46 });
const S11b = (f: number): Shot => { const u = glide((f - 1400) / 80); return { pos: [T[0] - 0.3, 1.5, T[2] - 2 - 22 * u], look: [T[0], 1.3, T[2] - 12 - 22 * u], fov: 46 }; };
const S12a = (f: number) => dolly([T[0] + 0.7, 1.55, T[2] - 35.5], [T[0] - 0.1, 1.5, T[2] - 45], pushK(f, 1487, 0.0025), { fov: 44 }); // the buried stair
const S12b = (f: number) => dolly([MURAL[0] - 0.75, 1.55, MURAL[2] - 9], [MURAL[0] + 1.3, 1.45, MURAL[2] - 13.5], pushK(f, 1560, 0.002), { fov: 50, roll: 0.03 }); // along the mural wall
const S13a = (f: number) => zoom([2, 1.7, 127], [0, 9, 95], 44, pushK(f, 1626, 0.002));
const CRANE: V3[] = [[30, 40, 170], [60, 70, 260], [0, 22, 0]];
const S13b = (f: number): Shot => {
  const a = S13a(1700), s = glide((f - 1700) / 100), r = 1 - s, [C, B, L] = CRANE;
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 40) + (44 - (a.fov ?? 40)) * s, roll: 0 };
};
const S13c = (f: number) => dolly(S13b(1800).pos, [0, 26, 0], pushK(f, 1800, 0.002), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 60, dur: 30, s: S1b }], // glide up to the church on "hiding under this church"
  2: [{ f: 120, s: S2a }, { f: 190, dur: 30, s: S2b }],
  3: [{ f: 251, s: S3a }, { f: 358, dur: 26, s: S3b }], // pull back and up: lands as the bigger pyramid pops (384)
  4: [{ f: 428, s: S4a }, { f: 500, cut: true, s: S4b }],
  5: [{ f: 551, s: S5a }],
  6: [{ f: 655, s: S6a }, { f: 785, dur: 30, s: S6b }],
  7: [{ f: 828, s: S7a }],
  8: [{ f: 931, s: S8a }, { f: 1005, dur: 24, s: S8b }],
  9: [{ f: 1048, s: S9a }, { f: 1100, cut: true, s: S9b }, { f: 1104, dur: 20, s: rolled(S9b, -0.03) }],
  10: [{ f: 1179, s: S10a }],
  11: [{ f: 1312, s: S11a }, { f: 1396, dur: 22, s: S11b }], // glide into the forward travel down the tunnel
  12: [{ f: 1487, s: S12a }, { f: 1560, cut: true, s: S12b }],
  13: [{ f: 1626, s: S13a }, { f: 1700, cut: true, s: S13b }, { f: 1800, cut: true, s: S13c }],
};

const KICKS: [number, number][] = [[(384 + 14) / FPS, 1], [(478 + 10) / FPS, 0.6], [(508 + 12) / FPS, 0.8], [(1012 + 12) / FPS, 1]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
// ---------------- drift (look pass 3) ----------------
// v2 measured 47 % dead-still frames and 13 % moving ones; the reference has 10 % and 65 % (median 3.6 px/f at
// 720p). Push-ins alone read as a still camera. So every shot also orbits a pivot d metres ahead of the lens at
// w deg/s; 2 deg/s slides a far background about 2 px/f at 720p. The pivot sits on the subject (the cast in close
// shots, the monument in wides), so the subject holds its place while the background slides with parallax.
// d is a list of [frame, metres] stops, glided over `ramp` frames, so the pivot can follow a glide from cast to monument.
type Arc = { w: number; d: [number, number][]; ramp?: number };
const ARC: Record<number, Arc> = {
  1: { w: 1.8, d: [[0, 4.6], [60, 106]], ramp: 30 },
  2: { w: -2.2, d: [[124, 23.6], [190, 9.5]], ramp: 30 },
  3: { w: 2.0, d: [[251, 5.3], [358, 75]], ramp: 26 },
  4: { w: -2.2, d: [[428, 6.0]] },
  5: { w: 2.0, d: [[551, 5.4]] },
  6: { w: -2.0, d: [[655, 5.4], [785, 140]], ramp: 30 },
  7: { w: 2.2, d: [[828, 5.2]] },
  8: { w: -2.0, d: [[931, 64], [1005, 45]], ramp: 24 },
  9: { w: 2.2, d: [[1048, 6.3], [1100, 8.6]], ramp: 1 },
  10: { w: -1.5, d: [[1179, 178]] },
  11: { w: 0.8, d: [[1312, 6]] },
  12: { w: -0.8, d: [[1487, 6]] },
  13: { w: 1.6, d: [[1626, 6.4], [1700, 120]], ramp: 60 },
};
const arcDist = (a: Arc, f: number) => {
  let v = a.d[0][1];
  for (let i = 1; i < a.d.length; i++) if (f >= a.d[i][0]) v += (a.d[i][1] - v) * glide((f - a.d[i][0]) / (a.ramp ?? 24));
  return v;
};
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a) return c;
  const th = ((a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
  const v: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...v) || 1, d = arcDist(a, f);
  const P: V3 = [c.pos[0] + (v[0] / n) * d, 0, c.pos[2] + (v[2] / n) * d];
  const rot = (p: V3): V3 => { const x = p[0] - P[0], z = p[2] - P[2]; return [P[0] + x * co - z * si, p[1], P[2] + x * si + z * co]; };
  return { ...c, pos: rot(c.pos), look: rot(c.look) };
};

export const camAt = (id: number, f: number): Cam => {
  const c = drift(id, run(CAMS[id], f), f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

/** ground point `dist` m ahead of shot id's camera at key frame fk and `side` m to screen right (foreground cast) */
export const ahead = (id: number, fk: number, dist: number, side: number): V3 => {
  const c = run(CAMS[id], fk), dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], n = Math.hypot(dx, dz) || 1;
  const fx = dx / n, fz = dz / n;
  return [c.pos[0] + fx * dist - fz * side, 0, c.pos[2] + fz * dist + fx * side];
};
const eyesAt = (id: number, fk: number, dist: number, side: number, h = 1.6) => (): V3 => { const p = ahead(id, fk, dist, side); return [p[0], h, p[2]]; };

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
// Look pass 3: v2 had the lens blur on in 44 % of frames (reference: about a third of screen time, close beats only)
// and blurred the very thing a line talks about (the growing pyramids, Giza, the hill). Blur now stays on close-ups
// of people only, and a fade-out keeps the old focus (v2 jumped focus to the church at frame 60 while the blur was
// still at 12 px, so the hook's tourist went soft).
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: eyesAt(1, 0, 4.6, -0.35) }, // hook: the tourist sharp, the hill a little soft
  { f: 60, dur: 30, cInf: 0 }, // glide up to the church
  { f: 124, cInf: 0 }, // builders and the first temple (the temple is the point)
  { f: 251, cInf: 12, focus: () => [-1.6, 1.7, 25.5] }, // unhappy builders CU
  { f: 358, dur: 20, cInf: 0 }, // pull back: the bigger pyramid rises
  { f: 428, cInf: 0 }, // grandpa and the kid, pyramids growing behind them
  { f: 551, cInf: 0 }, // builder pointing at Giza
  { f: 661, cInf: 7, focus: eyesAt(6, 655, 5.4, -0.4) }, // the last caretaker
  { f: 720, dur: 24, cInf: 0 }, // the hill starts growing behind him
  { f: 834, cInf: 6, focus: eyesAt(7, 828, 5.2, 0.38) }, // villager: "just a hill" (the hill stays readable)
  { f: 931, cInf: 0 }, // church lands
  { f: 1048, cInf: 12, focus: () => [0, 28.6, 21] }, // friar at the church
  { f: 1100, cInf: 10, focus: () => [1.2, 3.3, 104] }, // archaeologist below the hill
  { f: 1179, cInf: 0 }, // nesting dolls wide
  { f: 1312, cInf: 4 }, // tunnels (focus = look)
  { f: 1487, cInf: 5, focus: () => [599.5, 1.6, -41.2] }, // digger at the buried stair
  { f: 1560, cInf: 0 }, // the mural is the joke: keep it sharp
  { f: 1630, cInf: 10, focus: eyesAt(13, 1626, 6.4, 0) }, // tourists on the path
  { f: 1700, cInf: 0 }, // crane out
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  // while a blur fades out, keep focusing where it was focused
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
