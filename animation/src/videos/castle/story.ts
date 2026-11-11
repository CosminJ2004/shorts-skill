// "The Castle That Fell Through Its Toilet": timeline, story state and cameras, timed to shorts/castle/voice/words.json.
// The camera grammar comes from the cartoon-3d-short skill:
// - holds always creep in;
// - reframes are smootherstep glides of 18-40 f;
// - impacts are 7-frame flip kicks;
// - every shot also orbits its subject (ARC);
// - place changes dissolve over 6-8 f, with at most 1-3 hard cuts per minute.
// Iteration 4 quality bar: characters fill 40-60 % of the frame height in people shots, there are three depth layers,
// and no blank wall sits behind a speaker.
export const FPS = 30;
export const TOTAL = 2034;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const easeIn = (u: number) => clamp01(u) ** 2.2;
/** overshooting ease for things that pop into place (0 -> ~1.08 -> 1) */
export const popIn = (u: number) => { const x = clamp01(u); return x < 1 ? 1 - Math.cos(x * Math.PI * 1.25) * (1 - x) ** 1.4 : 1; };
export const at = (f: number, f0: number, dur: number) => clamp01((f - f0) / dur);

// ---------------- the place (metres; the plateau is y = 0, the Seine valley floor y = LOW) ----------------
export const LOW = -45;
/** outer ward (apex to the plateau, +z): its apex is the great "advanced tower" the French undermined */
export const OUTER: [number, number][] = [[-26, 36], [-18, 62], [0, 74], [18, 62], [26, 36]];
export const ADV: V3 = [0, 0, 74];
/** middle ward: a rectangle; the chapel sits inside its west wall, the garderobe juts out of that wall */
export const MID = { x0: -32, x1: 32, z0: -12, z1: 22, h: 12, t: 2.4 };
export const CHAPEL = { x0: -25.5, x1: -18.5, z0: -2, z1: 10, h: 6 };
/** the garderobe box (outside the west wall) and the chute slot down the outer face to the ledge */
export const WALL_W = MID.x0 - MID.t / 2; // outer face of the west wall
export const GARDE = { x0: WALL_W - 2.4, x1: WALL_W, y0: 6.5, y1: 9.8, z0: -3.4, z1: -0.6 };
export const CHUTE = { x: WALL_W, z0: -2.6, z1: -1.4, y1: 6.5, depth: 0.8 };
/** inner ward (a corrugated ring) and the keep */
export const INNER = { cx: 0, cz: -46, rx: 19, rz: 17, h: 14 };
export const KEEP: V3 = [6, 0, -52];
/** ditches cut into the chalk between the wards */
export const DITCHES: [number, number][] = [[25, 34], [-24, -14]];
/** sets away from the castle: chapel interior, bank vault, the cutaway wall */
export const CH: V3 = [1000, 0, 0];
export const BANK: V3 = [2000, 0, 0];
export const SEC: V3 = [3000, 0, 0];
export const SEAT: V3 = [CH[0] + 4.0, 0, CH[2] + 3.0]; // chapel toilet seat
export const SCALE: V3 = [-6, 0, 100]; // the treasurer's balance (shot 4)
export const PHILIP_AT: V3 = [-245, LOW, 45];

// ---------------- shots ----------------
export type Light = "day" | "golden" | "inside";
/** az: optional per-shot sun azimuth (deg from the camera axis toward screen right; 180 = behind the lens) */
export type ShotDef = { id: number; a: number; b: number; light: Light; az?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 124, light: "golden", az: 140 }, // hook: the castle on its cliff, then a soldier climbing the chute
  { id: 2, a: 124, b: 269, light: "day" }, // 1196: Richard and the building site, then the cliff above the Seine
  { id: 3, a: 269, b: 367, light: "day", az: 110 }, // three rings of walls rise
  { id: 4, a: 367, b: 482, light: "day" }, // twelve thousand pounds on the balance
  { id: 5, a: 482, b: 571, light: "golden", az: 70 }, // his one-year-old daughter
  { id: 6, a: 571, b: 683, light: "day", az: 100 }, // Philip across the river: iron
  { id: 7, a: 683, b: 770, light: "day" }, // Richard: butter
  { id: 8, a: 770, b: 855, light: "golden", az: 60 }, // Richard dies, John gets the crown
  { id: 9, a: 855, b: 929, light: "day" }, // John's addition: a chapel, with a toilet
  { id: 10, a: 929, b: 1077, light: "golden", az: 110 }, // 1203: the French camp, the miners, the tower falls
  { id: 11, a: 1077, b: 1114, light: "golden", az: 120 }, // the second wall held
  { id: 12, a: 1114, b: 1200, light: "golden", az: 140 }, // one soldier looks up
  { id: 13, a: 1200, b: 1226, light: "golden", az: 140 }, // the toilet chute
  { id: 14, a: 1226, b: 1282, light: "golden", az: 140 }, // he climbs
  { id: 15, a: 1282, b: 1368, light: "inside" }, // ...straight into the chapel; nobody guarded it
  { id: 16, a: 1368, b: 1472, light: "inside" }, // six months
  { id: 17, a: 1472, b: 1613, light: "day", az: 120 }, // You see: the cutaway wall
  { id: 18, a: 1613, b: 1711, light: "inside" }, // a bank vault with a doggy door
  { id: 19, a: 1711, b: 1755, light: "inside" }, // his friends followed, set fires
  { id: 20, a: 1755, b: 1790, light: "golden", az: 120 }, // and opened the gates
  { id: 21, a: 1790, b: 1840, light: "day", az: 110 }, // the last wall fell: the flag on the keep
  { id: 22, a: 1840, b: 1880, light: "inside" }, // John lost Normandy
  { id: 23, a: 1880, b: 1966, light: "golden", az: 140 }, // callback: walls of butter
  { id: 24, a: 1966, b: TOTAL, light: "golden", az: 140 }, // the walls were fine. It was the toilet.
];
// dissolves at every shot change except the pop into the chapel (15), which is the one hard cut
export const XFADE: Record<number, number> = {
  2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8, 11: 6, 12: 6, 13: 6, 14: 6, 16: 6, 17: 8, 18: 8, 19: 6, 20: 6, 21: 8, 22: 8, 23: 8, 24: 6,
};
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
  rise: [number, number, number, number]; // outer, middle, inner, keep: 0..1 built height
  site: boolean; // scaffolding, cranes and stone piles
  garde: number; // 0..1 the garderobe (John's addition)
  adv: number; // 0..1 the advanced tower's collapse
  butter: number; // 0 stone, 1 butter
  gate: number; // 0..1 middle ward gate open
  camp: boolean; // the French siege camp on the plateau
  flag: "en" | "fr";
  chuteFlag: boolean; // the French flag out of the garderobe (last shot)
};
export const stateAt = (id: number, f: number): State => {
  const s: State = { rise: [1, 1, 1, 1], site: false, garde: 1, adv: 0, butter: 0, gate: 0, camp: false, flag: "en", chuteFlag: false };
  const before = id >= 2 && id <= 8;
  if (before) { s.garde = 0; }
  if (id >= 10 || id === 1) s.camp = true;
  if (id >= 11 || id === 1) s.adv = 1;
  if (id === 2) { s.rise = [0.45, 0.3, 0.2, 0.15]; s.site = true; }
  if (id === 3) {
    // "Three rings of walls" (279 / 288 / 293), the keep on "two years" (348)
    s.rise = [0.45 + 0.55 * popIn(at(f, 279, 14)), 0.3 + 0.7 * popIn(at(f, 287, 14)), 0.2 + 0.8 * popIn(at(f, 294, 14)), 0.15 + 0.85 * popIn(at(f, 345, 18))];
    s.site = f < 330;
  }
  if (id === 9) s.garde = popIn(at(f, 913, 12)); // pops on "toilet" (917)
  if (id === 10) s.adv = easeIn(at(f, 1050, 22)); // "collapsed" (1056)
  if (id === 7) s.butter = at(f, 754, 4); // "butter" (756)
  if (id === 23) s.butter = at(f, 1951, 4); // "butter" (1953)
  if (id === 24) { s.butter = 1 - at(f, 1969, 4); s.chuteFlag = f >= 1994; } // "walls" (1971) back to stone; "toilet" (2010)
  if (id === 20) s.gate = smooth(at(f, 1760, 18)); // "opened the gates" (1762-1778)
  if (id >= 20) s.gate = id === 20 ? s.gate : 1;
  if (id === 21) s.flag = f < 1828 ? "en" : "fr"; // "fell" (1831)
  if (id > 21) s.flag = "fr";
  return s;
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
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** quadratic crane from shot a (at its frame fa) through control C to shot b, over [f0, f0 + dur] */
const crane = (a: (f: number) => Shot, fa: number, C: V3, b: (f: number) => Shot, f0: number, dur: number) => (f: number): Shot => {
  const A = a(fa), B = b(f), s = glide((f - f0) / dur), r = 1 - s;
  return { pos: [0, 1, 2].map((i) => r * r * A.pos[i] + 2 * s * r * C[i] + s * s * B.pos[i]) as V3,
    look: [0, 1, 2].map((i) => A.look[i] + (B.look[i] - A.look[i]) * s) as V3, fov: (A.fov ?? 40) + ((B.fov ?? 40) - (A.fov ?? 40)) * s, roll: 0 };
};

const S1a = (f: number) => zoom([-262, -37, 34], [-32, -9, -2], 23, pushK(f, 0, 0.0024));
const S1b = (f: number) => dolly([-36.4, 1.9, 0.5], [-32.9, 2.6, -2.0], pushK(f, 88, 0.003, 0.007, 30), { fov: 44, roll: 0.04 });
const S2a = (f: number) => zoom([4.6, 1.55, 107], [-0.6, 3.6, 68], 42, pushK(f, 124, 0.0016));
const S2b = (f: number) => zoom([-112, -22, 74], [-16, 0, 20], 40, pushK(f, 226, 0.0016));
const S3a = (f: number) => dolly([58, 64, 132], [0, 2, 4], pushK(f, 269, 0.0018), { fov: 44 });
const S4a = (f: number) => dolly([-5.4, 2.0, 108.4], [-5.9, 1.65, 100.0], pushK(f, 367, 0.002, 0.005, 30), { fov: 44 });
const S5a = (f: number) => zoom([2.4, 1.55, 113.5], [-1.4, 2.4, 70], 40, pushK(f, 482, 0.0025, 0.006, 30));
const S6a = (f: number) => zoom([PHILIP_AT[0] - 4.4, LOW + 1.5, PHILIP_AT[2] + 3.3], [-30, -14, 24], 40, pushK(f, 571, 0.0018));
const R7: V3 = [23.0, 0, 66.3]; // Richard leans by the outer ward's east tower (sky and roof behind him)
const S7a = (f: number) => dolly([27.0, 1.25, 69.0], [22.4, 2.2, 65.4], pushK(f, 683, 0.002) * pushK(f, 752, 0, 0.009, 24), { fov: 46, roll: f > 750 ? -0.04 : 0 });
const S8a = (f: number) => zoom([-3.2, 0.95, 112], [0.4, 2.6, 80], 44, pushK(f, 770, 0.002));
const S9a = (f: number) => zoom([-8.0, 1.45, 13.6], [-20.5, 2.6, 3.2], 46, pushK(f, 855, 0.002));
const S9b = (f: number) => dolly([-44.5, 4.8, 5.6], [-33.6, 6.2, -2.0], pushK(f, 920, 0.003, 0.008, 25), { fov: 44, roll: 0.04 });
const S10a = (f: number) => zoom([3.5, 1.7, 192], [0, 9, 78], 42, pushK(f, 929, 0.0016));
const S10b = (f: number) => zoom([6.0, 1.7, 91.5], [0.6, 3.2, 79], 46, pushK(f, 1006, 0.0016));
const S10c = (f: number) => zoom([4, 2.6, 104.5], [0, 8.5, 74], 46, pushK(f, 1036, 0.0016));
const S11a = (f: number) => dolly([2.6, 11.2, 27.6], [0.0, 13.1, 21.6], pushK(f, 1077, 0.003), { fov: 44 });
const S12a = (f: number) => dolly([-40.6, 0.9, 1.6], [-36.4, 1.45, -1.2], pushK(f, 1114, 0.002), { fov: 42 });
const S12b = (f: number) => dolly([-40.9, 0.8, 1.9], [-33.4, 7.6, -2.0], pushK(f, 1150, 0.0015), { fov: 46 });
const S13a = (f: number) => dolly([-34.9, 0.55, -1.75], [-33.1, 7.0, -2.0], pushK(f, 1200, 0.004, 0.012, 20), { fov: 54 });
const S14a = (f: number): Shot => { const y = 0.2 + 3.8 * smooth(at(f, 1228, 52)); return dolly([-36.5, 0.9 + 0.75 * y, -0.4], [-32.9, 1.25 + y, -2.0], pushK(f, 1226, 0.002), { fov: 46, roll: -0.03 }); };
const S15a = (f: number) => dolly(add(SEAT, [-2.9, 1.0, 0.35]), add(SEAT, [0, 0.75, 0]), pushK(f, 1282, 0.0025, 0.006, 25), { fov: 44 });
const S15b = (f: number) => dolly(add(SEAT, [-2.2, 1.45, 3.6]), add(CH, [-1.0, 1.4, -4.5]), pushK(f, 1324, 0.0015), { fov: 50 });
const S16a = (f: number) => dolly(add(SEAT, [-1.55, 0.95, 0.25]), add(SEAT, [0, 0.9, 0]), pushK(f, 1368, 0.0025, 0.006, 30), { fov: 42 });
const S17a = (f: number) => dolly(add(SEC, [0.4, 11.6, 7.4]), add(SEC, [0, 11.0, 0.6]), pushK(f, 1472, 0.002), { fov: 46 });
const S17b = (f: number) => dolly(add(SEC, [0.5, 3.4, 9.5]), add(SEC, [0, 2.6, 0.6]), pushK(f, 1550, 0.0015), { fov: 50 });
const S18a = (f: number) => dolly(add(BANK, [1.8, 1.7, 8.2]), add(BANK, [0, 1.9, 2.5]), pushK(f, 1613, 0.0022), { fov: 44 });
/** orbit around the vault to its back (the doggy door) */
const S18b = (f: number): Shot => {
  const u = glide((f - 1662) / 34), a = 0.22 + u * (Math.PI - 0.62), r = 8.4 - 1.4 * u;
  return { pos: add(BANK, [r * Math.sin(a), 1.7 - 0.75 * u, r * Math.cos(a)]), look: add(BANK, [0.6 * u, 1.9 - 1.35 * u, 2.5 - 5.0 * u]), fov: 44 };
};
const S19a = (f: number) => dolly(add(SEAT, [-4.6, 1.5, 1.6]), add(SEAT, [-0.9, 0.95, 0]), pushK(f, 1711, 0.002), { fov: 48 });
const S20a = (f: number) => zoom([2.4, 1.6, 13.0], [0.0, 2.6, 22], 46, pushK(f, 1755, 0.0025, 0.006, 25), { roll: 0.035 });
const S21a = (f: number) => zoom([52, 20, 8], [6, 36, -52], 26, pushK(f, 1790, 0.002, 0.005, 30));
const S22a = (f: number) => dolly(add(CH, [0.6, 1.5, 9.6]), add(CH, [-2.1, 1.25, 5.0]), pushK(f, 1840, 0.0025, 0.007, 25), { fov: 42 });
const S23a = (f: number) => zoom([-262, -37, -30], [-30, -9, -4], 23, pushK(f, 1880, 0.0018));
const S24a = (f: number) => zoom([-262, -37, -30], [-30, -9, -4], 23, pushK(f, 1880, 0.0018));
const S24b = (f: number) => dolly([-43.5, 6.4, 3.4], [-34.6, 8.0, -2.0], pushK(f, 2010, 0.003, 0.007, 22), { fov: 44, roll: -0.04 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 88, cut: true, s: S1b }], // cut on "climbed" (88): the one cut inside the hook
  2: [{ f: 124, s: S2a }, { f: 226, dur: 40, s: S2b }], // glide out to the cliff over the Seine ("cliff" 211, "Seine" 254)
  3: [{ f: 269, s: S3a }],
  4: [{ f: 367, s: S4a }],
  5: [{ f: 482, s: S5a }],
  6: [{ f: 571, s: S6a }],
  7: [{ f: 683, s: S7a }],
  8: [{ f: 770, s: S8a }],
  9: [{ f: 855, s: S9a }, { f: 893, s: crane(S9a, 893, [-31, 17, 6], S9b, 893, 26) }], // crane over the wall: "A chapel. With a toilet."
  10: [{ f: 929, s: S10a }, { f: 1006, dur: 26, s: S10b }, { f: 1034, dur: 20, s: S10c }], // "dug under" (989): the miners; pull back for the fall (1056)
  11: [{ f: 1077, s: S11a }],
  12: [{ f: 1114, s: S12a }, { f: 1148, dur: 36, s: S12b }], // "looked up" (1138-1148): tilt up the wall to the chute
  13: [{ f: 1200, s: S13a }],
  14: [{ f: 1226, s: S14a }],
  15: [{ f: 1282, s: S15a }, { f: 1322, dur: 30, s: S15b }], // "nobody" (1326): pull back to the empty chapel
  16: [{ f: 1368, s: S16a }],
  17: [{ f: 1472, s: S17a }, { f: 1548, dur: 48, s: S17b }], // "over a chute, straight down" (1552-1577): down the chute
  18: [{ f: 1613, s: S18a }, { f: 1662, s: S18b }], // "and a doggy door in the back" (1668-1701): orbit to the back
  19: [{ f: 1711, s: S19a }],
  20: [{ f: 1755, s: S20a }],
  21: [{ f: 1790, s: S21a }],
  22: [{ f: 1840, s: S22a }],
  23: [{ f: 1880, s: S23a }],
  24: [{ f: 1966, s: S24a }, { f: 1988, dur: 22, s: S24b }], // "It was the toilet" (1996): glide in to the chute
};

// impact kicks: the tower falls (1060), butter lands (757, 1954), the walls snap back (1972), the gate bangs (1778)
const KICKS: [number, number][] = [[1062 / FPS, 1], [757 / FPS, 0.5], [1954 / FPS, 0.5], [1972 / FPS, 0.4], [1778 / FPS, 0.5], [1289 / FPS, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

// ---------------- drift: every shot orbits a pivot d metres ahead of the lens at w deg/s (look pass 3) ----------------
type Arc = { w: number; d: [number, number][]; ramp?: number };
const ARC: Record<number, Arc> = {
  1: { w: 1.2, d: [[0, 230], [88, 4.2]], ramp: 1 },
  2: { w: -2.4, d: [[124, 4.6], [226, 95]], ramp: 40 },
  3: { w: 3.0, d: [[269, 120]] },
  4: { w: -3.0, d: [[367, 8.4]] },
  5: { w: 3.2, d: [[482, 3.2]] },
  6: { w: -2.4, d: [[571, 3.8]] },
  7: { w: 3.0, d: [[683, 5.0]] },
  8: { w: -3.0, d: [[770, 4.6]] },
  9: { w: 3.0, d: [[855, 7.6], [893, 11.6]], ramp: 26 },
  10: { w: -2.0, d: [[929, 100], [1006, 6], [1034, 30]], ramp: 24 },
  11: { w: 3.0, d: [[1077, 6.4]] },
  12: { w: -3.0, d: [[1114, 4.6], [1148, 9.5]], ramp: 36 },
  13: { w: 2.0, d: [[1200, 2]] },
  14: { w: -3.0, d: [[1226, 4]] },
  15: { w: 3.0, d: [[1282, 2.9], [1322, 6]], ramp: 30 },
  16: { w: -3.4, d: [[1368, 1.55]] },
  17: { w: 2.6, d: [[1472, 5.6], [1548, 9]], ramp: 48 },
  18: { w: 0, d: [[1613, 6]] },
  19: { w: -3.0, d: [[1711, 3.8]] },
  20: { w: 3.0, d: [[1755, 8]] },
  21: { w: -2.6, d: [[1790, 70]] },
  22: { w: 3.2, d: [[1840, 5.3]] },
  23: { w: 1.2, d: [[1880, 230]] },
  24: { w: 1.2, d: [[1966, 230], [1988, 9.5]], ramp: 22 },
};
const arcDist = (a: Arc, f: number) => {
  let v = a.d[0][1];
  for (let i = 1; i < a.d.length; i++) if (f >= a.d[i][0]) v += (a.d[i][1] - v) * glide((f - a.d[i][0]) / (a.ramp ?? 24));
  return v;
};
/** global orbit gain: v1 measured 19 % moving frames (reference 65 %) at the base rates above */
const ARC_GAIN = 2.0;
const drift = (id: number, c: Cam, f: number): Cam => {
  const a = ARC[id];
  if (!a || !a.w) return c;
  const th = ((ARC_GAIN * a.w * Math.PI) / 180) * ((f - SHOTS[id - 1].a) / FPS), co = Math.cos(th), si = Math.sin(th);
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
export const ahead = (id: number, fk: number, dist: number, side: number, y = 0): V3 => {
  const c = run(CAMS[id], fk), dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], n = Math.hypot(dx, dz) || 1;
  const fx = dx / n, fz = dz / n;
  return [c.pos[0] + fx * dist - fz * side, y, c.pos[2] + fz * dist + fx * side];
};
const eyes = (p: V3, h = 1.55) => (): V3 => [p[0], p[1] + h, p[2]];
export { R7 };

// ---------------- lens: blur only on people's close beats, never on what the line is about ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // castle wide
  { f: 88, cInf: 7, focus: () => [-32.9, 2.4, -2.0] }, // the climber in the chute
  { f: 124, cInf: 9, focus: eyes(ahead(2, 124, 4.6, -0.55)) }, // Richard at the site
  { f: 222, dur: 26, cInf: 0 }, // out to the cliff
  { f: 367, cInf: 0 }, // the balance is the point
  { f: 482, cInf: 11, focus: eyes(ahead(5, 482, 3.2, -0.25), 1.45) }, // Richard and his "daughter"
  { f: 571, cInf: 5, focus: eyes(ahead(6, 571, 4.8, -0.5, LOW), 1.5) }, // Philip (the castle stays readable)
  { f: 683, cInf: 0 }, // the butter wall is the joke
  { f: 770, cInf: 6, focus: eyes(ahead(8, 770, 4.6, 0.35), 1.2) }, // John
  { f: 855, cInf: 0 },
  { f: 1114, cInf: 7, focus: () => [-36.4, 1.6, -1.2] }, // the soldier looking up
  { f: 1148, dur: 30, cInf: 0 },
  { f: 1282, cInf: 0 },
  { f: 1368, cInf: 10, focus: () => [SEAT[0], 0.7, SEAT[2]] }, // CU: queasy
  { f: 1472, cInf: 0 },
  { f: 1711, cInf: 5, focus: () => [SEAT[0] - 0.4, 0.9, SEAT[2]] },
  { f: 1755, cInf: 0 },
  { f: 1840, cInf: 8, focus: () => [CH[0] - 1.6, 1.4, CH[2] + 5.2] }, // John and the map
  { f: 1880, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
