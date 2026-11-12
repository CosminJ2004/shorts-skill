// "The War Australia Lost to Birds": timeline, story state and cameras, timed to shorts/emu/voice/words.json
// (faster-whisper word times, frames at 30 fps). The camera grammar is the cartoon-3d-short skill's:
// - holds always creep in; reframes are smootherstep glides of 18-40 f; impacts are 7-frame flip kicks;
// - every shot also orbits its subject (ARC, ARC_GAIN 2);
// - place changes dissolve over 6-8 f, with at most 1-3 hard cuts per minute.
// Iteration 6 brief (user): a viral idea, quality, VISIBLE CHARACTER MOVEMENT, something beautiful. So the shots are
// built around motion: walking and running emus, a bursting flock, a bouncing truck chased and overtaken by birds,
// pecking, marching, a windmill turning, marbles scattering; golden-hour wheat for the beauty.
export const FPS = 30;
export const TOTAL = 2010;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const easeIn = (u: number) => clamp01(u) ** 2.2;
/** overshooting ease for things that pop into place (0 -> ~1.08 -> 1) */
export const popIn = (u: number) => { const x = clamp01(u); return x < 1 ? 1 - Math.cos(x * Math.PI * 1.25) * (1 - x) ** 1.4 : 1; };
export const at = (f: number, f0: number, dur: number) => clamp01((f - f0) / dur);

// ---------------- the place (metres; the wheatbelt is flat at y = 0 near the farm) ----------------
/** the farmhouse (front porch toward +z), the windmill, the water tank */
export const HOUSE: V3 = [0, 0, 0];
export const MILL: V3 = [17, 0, -5];
export const TANK: V3 = [-11, 0, -3];
/** the road along z = ROAD_Z (red dirt), the gate track from the house to it */
export const ROAD_Z = 40;
/** the north fence the emus come over, the rise behind it */
export const NFENCE_Z = -60;
/** the dam (a water hole with an earth bank) where the ambush happens */
export const DAM: V3 = [90, 0, -40];
/** the lookout's granite rock */
export const ROCK: V3 = [-70, 0, -90];
export const ROCK_TOP = 3.4;
/** the stubble paddock of the "You see" diagram (pale, so the flock reads from above) */
export const STUB: V3 = [210, 0, 110];
/** the army camp (tents, campfire, the pile of cartridge cases) */
export const CAMP: V3 = [-60, 0, 72];
export const PILE: V3 = [-54.5, 0, 75.5];
/** the coat-of-arms monument in the wheat (last shot) */
export const MONU: V3 = [0, 0, -130];
/** the marbles set (an interior away from the world) */
export const MARB: V3 = [2000, 0, 0];

// ---------------- the truck (shots 12-14, 22): heading +x along the road, or away to -x ----------------
export const truckAt = (id: number, f: number): { x: number; z: number; yaw: number; bounce: number; v: number } => {
  const t = f / FPS;
  if (id === 13 || id === 14) {
    const x = -60 + 12 * (t - 785 / FPS), rough = id === 14 && f > 880 ? 1 : 0.3;
    const bounce = rough * (0.07 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29 + 1) + 0.09 * Math.max(0, Math.sin(t * 7.3)) ** 6);
    return { x, z: ROAD_Z, yaw: 0, bounce, v: 12 };
  }
  if (id === 22) {
    const u = Math.max(0, t - 1772 / FPS);
    return { x: -6 - 3 * u - 4.5 * u * u, z: ROAD_Z, yaw: Math.PI, bounce: 0.04 * Math.sin(t * 15), v: 9 };
  }
  return { x: 2, z: ROAD_Z, yaw: 0, bounce: 0, v: 0 };
};

// ---------------- shots ----------------
export type Light = "day" | "golden" | "inside";
/** az: optional per-shot sun azimuth (deg from the camera axis toward screen right; 180 = behind the lens) */
export type ShotDef = { id: number; a: number; b: number; light: Light; az?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 104, light: "golden", az: 24 }, // hook: emus walking through golden wheat, backlit; the gunner rises into frame
  { id: 2, a: 104, b: 139, light: "golden", az: 150 }, // "with machine guns": the Lewis gun fires
  { id: 3, a: 139, b: 165, light: "golden", az: 140 }, // "And the birds won": an emu in the gunner's hat
  { id: 4, a: 165, b: 302, light: "day", az: 110 }, // the farm: windmill, homestead, a farmer in his wheat
  { id: 5, a: 302, b: 376, light: "golden", az: 120 }, // twenty thousand emus over the rise; pecking the wheat
  { id: 6, a: 376, b: 429, light: "day", az: 130 }, // the farmers write to the army
  { id: 7, a: 429, b: 563, light: "day", az: 120 }, // the count: one major, two soldiers, two guns, ten thousand bullets
  { id: 8, a: 563, b: 592, light: "golden", az: 140 }, // day one: the major with field glasses
  { id: 9, a: 592, b: 620, light: "golden", az: 30 }, // ...the emus far away on the rise
  { id: 10, a: 620, b: 704, light: "golden", az: 130 }, // day three: the ambush at the dam
  { id: 11, a: 704, b: 734, light: "golden", az: 140 }, // the gun jammed
  { id: 12, a: 734, b: 785, light: "day", az: 120 }, // a machine gun on a truck
  { id: 13, a: 785, b: 826, light: "day", az: 115 }, // the truck was fast
  { id: 14, a: 826, b: 950, light: "day", az: 115 }, // the emus were faster; bumpy; nobody could aim
  { id: 15, a: 950, b: 1075, light: "golden", az: 130 }, // the lookout on the rock
  { id: 16, a: 1075, b: 1131, light: "day", az: 100 }, // You see: a flock is not one target
  { id: 17, a: 1131, b: 1276, light: "day", az: 110 }, // it bursts into little groups; one group at 50 km/h
  { id: 18, a: 1276, b: 1347, light: "inside" }, // spilled marbles, one hand
  { id: 19, a: 1347, b: 1535, light: "golden", az: 140 }, // December: the pile of cases, the tally
  { id: 20, a: 1535, b: 1586, light: "golden", az: 140 }, // ten bullets per bird
  { id: 21, a: 1586, b: 1768, light: "golden", az: 130 }, // the major's quote; the emu division marches behind him
  { id: 22, a: 1768, b: 1865, light: "golden", az: 18 }, // the army drives home into the sunset; backfires: no, no, no
  { id: 23, a: 1865, b: TOTAL, light: "golden", az: 140 }, // the emu on the coat of arms
];
// dissolves at place/time changes; the truck shots 12 -> 13 -> 14 and the burst 16 -> 17 are continuous; 3 hard cuts
export const XFADE: Record<number, number> = {
  2: 6, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 6, 10: 8, 11: 6, 12: 8, 13: 6, 15: 8, 16: 8, 18: 8, 19: 8, 20: 6, 21: 8, 22: 8, 23: 8,
};
export const FLASH_AT = 165;

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
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const tr = (id: number, f: number, d: V3): V3 => { const T = truckAt(id, f); return [T.x + d[0], d[1] + T.bounce * 0.25, T.z + d[2]]; };

// people and props the cameras frame (world.ts reads the same constants)
export const GUN1: V3 = [7.4, 0, -20.5]; // the hook's gun nest in the wheat
export const EMU3: V3 = [9.5, 0, 10.5]; // the emu in the hat (shot 3), in the farmyard
export const FARMER4 = (f: number): V3 => [5.6, 0, 16 + 2.2 * smooth(at(f, 170, 120))];
export const PORCH: V3 = [0, 0, 8.2]; // shot 6 farmers in front of the porch
export const LINE: V3 = [-2, 0, 38.6]; // shot 7 line-up along the road verge (x grows to the right)
export const MAJ8: V3 = [-40, 0, -46]; // shot 8 the major with field glasses
export const NEST: V3 = [97, 0, -26]; // shots 10-11 the ambush nest at the dam
export const LOOKOUT: V3 = [ROCK[0], ROCK_TOP, ROCK[2] + 0.4];
export const MAJ21: V3 = [-61.5, 0, 69.5];
export const TALLY: V3 = [-59.4, 0, 75.6]; // shot 19 the gunner with the tally by the fire
export const BIRD20: V3 = [-40, 0, 80]; // shot 20 the emu and its ten bullets

const S1a = (f: number) => zoom([7.6, 1.15, -17.5], [10, 1.9, -40], 36, pushK(f, 0, 0.0016));
const S1b = (f: number) => zoom(add(GUN1, [-1.3, 1.3, 3.6]), add(GUN1, [2.6, 1.15, -6.5]), 40, pushK(f, 58, 0.0018, 0.004, 30));
const S2a = (f: number) => dolly(add(GUN1, [1.3, 1.05, 3.1]), add(GUN1, [0.3, 0.85, 0]), pushK(f, 104, 0.003, 0.009, 22), { fov: 44, roll: 0.03 });
const S3a = (f: number) => dolly(add(EMU3, [0.4, 1.55, 3.6]), add(EMU3, [0, 1.45, 0]), pushK(f, 139, 0.003, 0.007, 20), { fov: 42 });
const S4a = (f: number) => dolly([34, 21, 46], [4, 2, 2], pushK(f, 165, 0.0016), { fov: 44 });
const S4b = (f: number): Shot => { const F = FARMER4(f); return dolly(add(F, [1.4, 1.5, 5.2]), add(F, [-0.2, 1.35, 0]), pushK(f, 215, 0.0012), { fov: 42 }); };
const S5a = (f: number) => zoom([-4, 1.9, -46], [6, 4.2, -130], 34, pushK(f, 302, 0.0018));
const S5b = (f: number) => dolly([4.4, 0.95, -52.6], [1.6, 0.7, -57.6], pushK(f, 350, 0.0025, 0.006, 22), { fov: 46 });
const S6a = (f: number) => dolly(add(PORCH, [0.5, 1.5, 6.9]), add(PORCH, [0.2, 1.3, 0]), pushK(f, 376, 0.0022, 0.006, 24), { fov: 42 });
const S7a = (f: number) => dolly(add(LINE, [0.9, 1.5, 6.4]), add(LINE, [1.0, 1.25, 0]), pushK(f, 429, 0.0012), { fov: 44 });
const S7b = (f: number) => dolly(add(LINE, [7.6, 1.45, 6.2]), add(LINE, [7.4, 1.0, 0]), pushK(f, 520, 0.0012), { fov: 44 });
const S8a = (f: number) => dolly(add(MAJ8, [0.6, 1.62, 3.4]), add(MAJ8, [0, 1.55, 0]), pushK(f, 563, 0.003, 0.007, 22), { fov: 42 });
const S9a = (f: number) => zoom([-40, 1.6, -52], [-34, 6.2, -158], 24, pushK(f, 592, 0.0025));
const S10a = (f: number) => zoom(add(NEST, [1.0, 1.45, 3.7]), add(NEST, [-3.4, 0.75, -9.0]), 40, pushK(f, 620, 0.0016));
const S11a = (f: number) => dolly(add(NEST, [0.9, 1.2, 2.5]), add(NEST, [-0.35, 0.95, 0]), pushK(f, 704, 0.003, 0.012, 20), { fov: 44, roll: -0.03 });
const S12a = (f: number) => dolly([7.5, 2.4, 47.5], [1.6, 1.6, 40], pushK(f, 734, 0.0022, 0.006, 22), { fov: 42 });
const S13a = (f: number) => ({ pos: tr(13, f, [-6.5, 1.5, 7.2]), look: tr(13, f, [0.6, 1.4, 0]), fov: 44 });
const S14a = (f: number) => ({ pos: tr(14, f, [-3.4, 1.35, 8.6]), look: tr(14, f, [1.4, 1.25, 0]), fov: 46 });
const S14b = (f: number) => ({ pos: tr(14, f, [-0.2, 2.45, 3.4]), look: tr(14, f, [-1.25, 2.25, 0]), fov: 44, roll: 0.03 * Math.sin(f * 0.9) });
const S15a = (f: number) => zoom(add(ROCK, [7.5, 1.0, 15.5]), add(ROCK, [0, 4.6, 0]), 40, pushK(f, 950, 0.0018));
const S15b = (f: number) => dolly(add(LOOKOUT, [0.9, 1.55, 3.4]), add(LOOKOUT, [0, 1.5, 0]), pushK(f, 1000, 0.0022, 0.006, 26), { fov: 42 });
const S16a = (f: number) => dolly(add(STUB, [0, 30, 21]), add(STUB, [0, 0, 0]), pushK(f, 1075, 0.0022, 0.006, 28), { fov: 40 });
const S17a = (f: number) => dolly(add(STUB, [0, 34, 24]), add(STUB, [0, 0, 1]), pushK(f, 1131, 0.0008), { fov: 44 });
/** shot 17b: tracking one group of three running emus (they run +x at 13 m/s from STUB) */
export const RUN17 = (f: number): V3 => [STUB[0] + 6 + 13 * Math.max(0, (f - 1190) / FPS), 0, STUB[2] + 9];
const S17b = (f: number) => { const p = RUN17(f); return { pos: add(p, [-1.8, 1.0, 7.2]), look: add(p, [0.6, 1.0, 0]), fov: 46 }; };
const S18a = (f: number) => dolly(add(MARB, [0.2, 3.4, 2.6]), add(MARB, [0, 0, -0.2]), pushK(f, 1276, 0.0025, 0.007, 26), { fov: 44 });
const S19a = (f: number) => dolly(add(PILE, [2.6, 1.5, 4.8]), add(PILE, [0, 0.9, 0]), pushK(f, 1347, 0.0016, 0.005, 30), { fov: 44 });
const S19b = (f: number) => dolly(add(TALLY, [1.2, 1.15, 3.9]), add(TALLY, [0, 1.0, 0]), pushK(f, 1460, 0.0018, 0.006, 26), { fov: 42 });
const S20a = (f: number) => dolly(add(BIRD20, [-0.6, 1.3, 6.2]), add(BIRD20, [-0.75, 0.95, 0]), pushK(f, 1535, 0.0022, 0.006, 24), { fov: 44 });
const S21a = (f: number) => dolly(add(MAJ21, [0.9, 1.6, 4.2]), add(MAJ21, [0, 1.55, 0]), pushK(f, 1586, 0.0016), { fov: 42 });
const S21b = (f: number) => dolly(add(MAJ21, [1.9, 1.15, 5.0]), add(MAJ21, [-0.5, 1.9, -2]), pushK(f, 1700, 0.0018, 0.006, 30), { fov: 44 });
const S22a = (f: number) => zoom([7, 1.6, ROAD_Z + 1.6], [-40, 1.9, ROAD_Z - 0.4], 36, pushK(f, 1768, 0.0018));
const S23a = (f: number) => dolly(add(MONU, [1.6, 3.05, 3.2]), add(MONU, [1.4, 2.95, 0.2]), pushK(f, 1865, 0.002), { fov: 40 });
const S23b = (f: number) => zoom(add(MONU, [0.6, 1.9, 12.6]), add(MONU, [0, 2.7, 0]), 40, pushK(f, 1930, 0.0016));

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 58, dur: 40, s: S1b }], // "declared war" (54-64): the gunner and his gun rise into the frame
  2: [{ f: 104, s: S2a }],
  3: [{ f: 139, s: S3a }],
  4: [{ f: 165, s: S4a }, { f: 215, dur: 40, s: S4b }], // aerial over the farm, down to the farmer ("farms" 238)
  5: [{ f: 302, s: S5a }, { f: 348, dur: 22, s: S5b }], // the horde; "ate it" (361) in close
  6: [{ f: 376, s: S6a }],
  7: [{ f: 429, s: S7a }, { f: 494, dur: 36, s: S7b }], // pan along the line-up: major, soldiers -> guns, bullets
  8: [{ f: 563, s: S8a }],
  9: [{ f: 592, s: S9a }],
  10: [{ f: 620, s: S10a }],
  11: [{ f: 704, s: S11a }],
  12: [{ f: 734, s: S12a }],
  13: [{ f: 785, s: S13a }],
  14: [{ f: 826, s: S14a }, { f: 892, dur: 22, s: S14b }], // "bumpy" (902): in on the gunner
  15: [{ f: 950, s: S15a }, { f: 994, dur: 30, s: S15b }], // "a tall black emu" (1001-1019)
  16: [{ f: 1075, s: S16a }],
  17: [{ f: 1131, s: S17a }, { f: 1194, cut: true, s: S17b }], // cut on "each running" (1198): the one hard cut in the middle
  18: [{ f: 1276, s: S18a }],
  19: [{ f: 1347, s: S19a }, { f: 1458, dur: 30, s: S19b }], // "and counted" (1451-1469)
  20: [{ f: 1535, s: S20a }],
  21: [{ f: 1586, s: S21a }, { f: 1700, dur: 36, s: S21b }], // "it would face any army" (1702): the emu division behind him
  22: [{ f: 1768, s: S22a }],
  23: [{ f: 1865, s: S23a }, { f: 1900, dur: 40, s: S23b }], // "holds up Australia's coat of arms" (1918-1958): pull back
};

// impact kicks: the gun fires (112, 118), it jams (713), the cases land (1394), backfires (1830, 1838, 1844), the flock bursts (1157)
const KICKS: [number, number][] = [[112, 0.5], [119, 0.4], [713, 0.7], [1157, 0.5], [1394, 0.6], [1830, 0.35], [1838, 0.35], [1844, 0.35], [1959, 0.3]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor((t - f0 / FPS) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

// ---------------- drift: every shot orbits a pivot d metres ahead of the lens at w deg/s ----------------
type Arc = { w: number; d: [number, number][]; ramp?: number };
const ARC: Record<number, Arc> = {
  1: { w: -1.6, d: [[0, 30], [58, 13]], ramp: 40 },
  2: { w: 3.0, d: [[104, 2.6]] },
  3: { w: -3.2, d: [[139, 3.6]] },
  4: { w: 2.0, d: [[165, 50], [215, 5.4]], ramp: 40 },
  5: { w: -1.6, d: [[302, 84], [348, 5.6]], ramp: 22 },
  6: { w: 3.0, d: [[376, 5.9]] },
  7: { w: -1.5, d: [[429, 6.4]] },
  8: { w: 3.2, d: [[563, 3.4]] },
  9: { w: -1.0, d: [[592, 160]] },
  10: { w: 1.0, d: [[620, 4.5]] },
  11: { w: 3.2, d: [[704, 2.6]] },
  12: { w: -2.6, d: [[734, 9.6]] },
  13: { w: 0.8, d: [[785, 7]] },
  14: { w: -0.8, d: [[826, 8.6], [892, 3.4]], ramp: 22 },
  15: { w: 2.0, d: [[950, 17], [994, 3.5]], ramp: 30 },
  16: { w: 3.0, d: [[1075, 36]] },
  17: { w: 3.2, d: [[1131, 41], [1194, 7.4]], ramp: 1 },
  18: { w: 3.6, d: [[1276, 4.2]] },
  19: { w: -2.4, d: [[1347, 5.4], [1458, 4.1]], ramp: 30 },
  20: { w: 2.2, d: [[1535, 6.2]] },
  21: { w: -2.2, d: [[1586, 4.3], [1700, 5.6]], ramp: 36 },
  22: { w: 0.6, d: [[1768, 30]] },
  23: { w: 1.2, d: [[1865, 3.0], [1900, 12.6]], ramp: 40 },
};
const arcDist = (a: Arc, f: number) => {
  let v = a.d[0][1];
  for (let i = 1; i < a.d.length; i++) if (f >= a.d[i][0]) v += (a.d[i][1] - v) * glide((f - a.d[i][0]) / (a.ramp ?? 24));
  return v;
};
/** global orbit gain (castle lesson: 19 % moving frames at the base rates, reference 65 %) */
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

// ---------------- lens: blur only on people's close beats, never on what the line is about ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (p: V3, h = 1.55) => (): V3 => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // the field and the birds are the point
  { f: 104, cInf: 8, focus: eyes(GUN1, 0.8) }, // the gun
  { f: 139, cInf: 12, focus: eyes(EMU3, 1.5) }, // the emu in the hat
  { f: 165, cInf: 0 },
  { f: 215, dur: 30, cInf: 9, focus: (f) => add(FARMER4(f), [0, 1.55, 0]) }, // the farmer
  { f: 302, cInf: 0 },
  { f: 376, cInf: 8, focus: eyes(PORCH, 1.5) },
  { f: 429, cInf: 0 }, // the count is the joke: everything sharp
  { f: 563, cInf: 12, focus: eyes(MAJ8, 1.6) },
  { f: 592, cInf: 0 },
  { f: 704, cInf: 10, focus: eyes(NEST, 1.0) },
  { f: 734, cInf: 0 },
  { f: 892, dur: 20, cInf: 7, focus: (f) => tr(14, f, [-1.25, 2.3, 0]) }, // the bouncing gunner
  { f: 950, cInf: 0 },
  { f: 994, dur: 30, cInf: 11, focus: eyes(LOOKOUT, 1.55) }, // the lookout's face
  { f: 1075, cInf: 0 },
  { f: 1194, cInf: 6, focus: (f) => add(RUN17(f), [0, 1.2, 0]) }, // the runners (background streaks)
  { f: 1276, cInf: 0 },
  { f: 1458, dur: 30, cInf: 9, focus: eyes(TALLY, 1.0) },
  { f: 1535, cInf: 0 }, // the ten bullets are the joke
  { f: 1586, cInf: 10, focus: eyes(MAJ21, 1.6) },
  { f: 1700, dur: 30, cInf: 0 }, // the emu division behind him must read
  { f: 1865, cInf: 9, focus: () => add(MONU, [1.4, 3.0, 0.4]) },
  { f: 1900, dur: 30, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? (k < 1 ? p.focus : undefined) };
};
