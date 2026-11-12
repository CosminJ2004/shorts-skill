// The whole place for "The War Australia Lost to Birds" (Western Australian wheatbelt, November-December 1932):
// - outside: rolling golden wheat (vertex-coloured paddocks + thousands of alpha wheat tufts near the cameras), a red
//   dirt road with a fence line, gum trees, the homestead (weatherboards, corrugated iron, verandah), a turning
//   windmill, a water tank and a hay shed; the north rise the emus come over; a dam with an earth bank; a granite
//   rock; a pale stubble paddock; the army camp (bell tents, campfire, the pile of cartridge cases); the 1930s army
//   truck; Lewis guns; the coat-of-arms monument;
// - one interior set: the marbles on a wooden floor.
// Built from the cartoon-3d-short skill's look modules (two-tone shading, painted textures, ink pass, lit character
// cards); geometry, staging and the emus are ours. update(id, f, camera, scene) poses everything for shot id at f.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../bridge/build";
import { rep, cloudHD, planksHD, facadeHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxContact, Outfit, Expr, FrontOpts } from "../bridge/toon";
import { fxSpark, fxFlame } from "../castle/paintc";
import {
  FPS, SHOTS, HOUSE, MILL, TANK, ROAD_Z, NFENCE_Z, DAM, ROCK, ROCK_TOP, STUB, CAMP, PILE, MONU, MARB,
  GUN1, EMU3, FARMER4, PORCH, LINE, MAJ8, NEST, LOOKOUT, MAJ21, TALLY, BIRD20, RUN17,
  Light, ShotDef, V3, camAt, popIn, clamp01, at, smooth, easeOut, truckAt, add,
} from "./story";
import { MAJOR, gunner, farmer } from "./people";
import { emuCard, EmuOpts, roo, fxHand, fxSpeed, fxTarget, fxFlash, fxJam, fxDust } from "./birds";
import { talkAt, quoteRange } from "../../lib/talk";
import type { Word } from "../../lib/Captions";
import wordsJson from "../../../shorts/emu/voice/words.json";
import {
  fieldTex, tuftTex, dirtTex, ironTex, boardsTex, graniteTex, barkTex, canvasTex, crateTex, damTex, marbleTex, shieldTex, sandstoneTex,
} from "./painte";

const WORDS = wordsJson as Word[];
const QUOTE_MAJOR = quoteRange(WORDS, 18);

// ---------------- light presets (the castle's, warmer golden for the wheat) ----------------
const P: Record<Light, LightPreset> = {
  day: { ...LIGHTS.day, fogNear: 160, fogFar: 1500, actorShadow: true },
  golden: { ...LIGHTS.golden, az: 70, el: 16, lit: [1.6, 1.02, 0.6], shade: [0.34, 0.29, 0.46], lift: [0.07, 0.06, 0.15], fogNear: 140, fogFar: 1300, actorShadow: true },
  inside: {
    ...LIGHTS.golden, az: 140, el: 52,
    lit: [1.62, 1.34, 1.04], shade: [0.36, 0.31, 0.46], lift: [0.08, 0.07, 0.12], term: 0.3,
    charTint: [1.0, 0.9, 0.78], fog: "#5a4232", fogNear: 14, fogFar: 90, actorShadow: false,
  },
};
const LK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, inside: { ...LOOK.golden, sat: 0.95 } };
// golden: a warmer wheatbelt sunset than the castle's (peach-gold low, rose only near the top)
const SKYCOL: Record<Light, string[]> = { day: LOOK.day.sky.c, golden: ["#ffd48c", "#ffc27c", "#f8a876", "#e2947e", "#b08290"], inside: ["#5a4232", "#5a4232", "#5a4232", "#5a4232", "#5a4232"] };
const SKYE: Record<Light, number[]> = { day: LOOK.day.sky.e, golden: LOOK.golden.sky.e, inside: [0, 3, 8, 16, 40] };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RY = (yaw: number, x: number, y: number, z: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg).translate(0, h / 2, 0);
const L = 2; // expressions land ~2 frames before their word

// ---------------- terrain ----------------
/** ground height: flat near the farm, the north rise the horde comes over, rolling hills far out, the dam bowl */
export const groundY = (x: number, z: number) => {
  let y = 0;
  const r = Math.hypot(x - 20, z + 10);
  if (r > 160) y += 8 * smooth((r - 160) / 140) * (0.55 + 0.45 * Math.sin(x * 0.012 + z * 0.01));
  y += 5.5 * Math.exp(-(((z + 160) / 28) ** 2)) * smooth((150 - Math.abs(x - 5)) / 50);
  const dd = Math.hypot(x - DAM[0], z - DAM[2]);
  if (dd < 17) y += dd < 11 ? -1.4 * smooth((11 - dd) / 3) : 1.0 * Math.sin((Math.PI * (dd - 11)) / 6);
  return y;
};
const inRoad = (x: number, z: number) => Math.abs(z - ROAD_Z) < 3.4 || (Math.abs(x - 5.6) < 2.0 && z > 9 && z < ROAD_Z);
const inYard = (x: number, z: number) => Math.hypot(x - 2, z - 1) < 16;
const inStub = (x: number, z: number) => Math.abs(x - STUB[0]) < 48 && Math.abs(z - STUB[2]) < 42;
/** no wheat tufts here (paths, yard, sets, dam, rock, camp, the line-up, the monument plinth) */
const bare = (x: number, z: number) =>
  inRoad(x, z) || inYard(x, z) || inStub(x, z) || Math.hypot(x - DAM[0], z - DAM[2]) < 17 || Math.hypot(x - ROCK[0], z - ROCK[2]) < 8 ||
  Math.hypot(x - CAMP[0], z - CAMP[2]) < 21 || Math.hypot(x - MONU[0], z - MONU[2]) < 3.6 || (z > 33 && z < 48 && Math.abs(x - 4) < 20) ||
  Math.hypot(x - MILL[0], z - MILL[2]) < 4 || Math.hypot(x - BIRD20[0] + 0.8, z - BIRD20[2]) < 6;

// ---------------- the cast ----------------
type Who = { o: Outfit; seed: number; x: number; y: number; z: number; expr: Expr; mode?: FrontOpts["mode"]; phase?: number; wave?: number;
  prop?: FrontOpts["prop"]; look?: number; pose?: FrontOpts["pose"]; facing?: -1 | 0 | 1; tilt?: number; noBlob?: boolean; talk?: number; scale?: number };
type Bird = { b: EmuOpts; seed: number; x: number; y: number; z: number; vx?: number; vz?: number; noBlob?: boolean; dust?: boolean; roo?: boolean; scale?: number };
type FxP = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number; yaw?: number };

const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : d < 45 ? [240, 400, 0.4] : [120, 200, 0.2]);
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * h01(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = Math.floor(f - s); if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h01(i * 31 + n, 13)); }
  return 0;
};
const CAD = { walk: 1.5, run: 3.4, peck: 1.3, stand: 0.25, front: 0.25 } as const;
/** a walking/pecking/standing bird at a moving position */
const bird = (seed: number, x: number, z: number, mode: EmuOpts["mode"], t: number, extra: Partial<EmuOpts> = {}, vx = 0, vz = 0): Bird =>
  ({ b: { mode, phase: t * CAD[mode] + h01(seed, 7), expr: "calm", seed: seed % 7, ...extra }, seed, x, y: groundY(x, z), z, vx, vz });

/** a flock walking a straight line: n birds spread in a band, starting at a, heading (dx, dz) at speed v; some peck */
const flock = (n: number, s0: number, t: number, ax: number, az: number, w: number, d: number, dx: number, dz: number, v: number, peckK = 0.15, t0 = 0): Bird[] => {
  const out: Bird[] = [], l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
  for (let i = 0; i < n; i++) {
    const s = s0 + i, side = (h01(s, 1) - 0.5) * w, back = -h01(s, 2) * d, vv = v * (0.85 + 0.3 * h01(s, 3));
    const pk = h01(s, 4) < peckK, go = pk ? 0 : vv * (t - t0);
    const x = ax + ux * (back + go) - uz * side, z = az + uz * (back + go) + ux * side;
    out.push(bird(s, x, z, pk ? "peck" : "walk", t, {}, pk ? 0 : ux * vv, pk ? 0 : uz * vv));
  }
  return out;
};

type CastOut = { who: Who[]; birds: Bird[] };
const castFor = (id: number, f: number): CastOut => {
  const t = f / FPS, who: Who[] = [], birds: Bird[] = [];
  switch (id) {
    case 1: { // emus walking right-to-left through the wheat, backlit; the gunner rises out of the wheat (58-90)
      birds.push(...flock(16, 10, t, 12.5, -28, 7, 22, -1, 0.06, 1.25, 0.25));
      const up = smooth(at(f, 50, 34));
      who.push({ o: gunner(0), seed: 21, x: GUN1[0] + 0.75, y: -1.6 + 1.2 * up, z: GUN1[2] - 0.25, expr: f < 84 ? "stern" : "grin", pose: "aim", noBlob: up < 0.9 });
      who.push({ o: gunner(1), seed: 22, x: GUN1[0] + 1.9, y: -1.6 + 1.2 * smooth(at(f, 62, 30)), z: GUN1[2] - 1.1, expr: "stern", noBlob: true });
      break;
    }
    case 2: {
      who.push({ o: gunner(0), seed: 21, x: GUN1[0] + 0.75, y: -0.4, z: GUN1[2] - 0.25, expr: f < 111 - L ? "stern" : "grin", pose: "aim", tilt: f > 112 ? 2 * Math.sin(t * 40) : 0 });
      birds.push(...flock(12, 40, t, 6, -29, 7, 16, -1, 0.06, 1.2, 0.3));
      break;
    }
    case 3: birds.push({ b: { mode: "front", expr: f < 147 - L ? "calm" : "smug", hat: true, seed: 3, look: 0.25 * Math.sin(t * 2), blink: f > 154 && f < 160 ? 1 : 0 }, seed: 3, x: EMU3[0], y: 0, z: EMU3[2] }); break;
    case 4: {
      const F = FARMER4(f);
      who.push({ o: farmer(0), seed: 41, x: F[0], y: 0, z: F[2], expr: f < 238 - L ? "smile_closed" : "smile", mode: f < 290 ? "stroll" : "stand", phase: t * 1.0, facing: 1, look: f > 270 ? -1 : 0 });
      who.push({ o: farmer(1), seed: 42, x: -9, y: 0, z: 2.5, expr: "grin", prop: ["hammer", 0.5 + 0.5 * Math.sin(t * 7)] });
      break;
    }
    case 5: {
      if (f < 352) birds.push(...flock(240, 100, t, 2, -86, 80, 80, 0.3, 1, 1.6, 0.12, 302 / FPS));
      else {
        const pk: [number, number, number][] = [[0.6, -58.4, 0.0], [2.8, -59.6, 0.37], [-0.9, -60.4, 0.71], [4.0, -61.4, 0.2]];
        pk.forEach(([x, z, ph], k) => birds.push({ ...bird(500 + k, x, z, "peck", t + ph), b: { mode: "peck", phase: t * 1.3 + ph, expr: k === 1 ? "happy" : "calm", seed: k } }));
        birds.push(...flock(30, 520, t, 6, -66, 26, 14, 0.25, 1, 1.3, 0.5));
      }
      break;
    }
    case 6: {
      who.push({ o: farmer(0), seed: 41, x: PORCH[0] - 1.05, y: 0, z: PORCH[2], expr: f < 405 - L ? "stern" : "pained", prop: "scroll", facing: 1 });
      who.push({ o: farmer(1), seed: 43, x: PORCH[0] + 0.25, y: 0, z: PORCH[2] - 0.6, expr: f < 403 ? "stern" : "sneer", pose: f < 403 ? "cross" : "fist" });
      who.push({ o: farmer(2), seed: 44, x: PORCH[0] + 1.45, y: 0, z: PORCH[2] + 0.1, expr: "nervous", pose: "point", facing: -1 });
      birds.push(bird(61, -6.5 + 0.9 * t - 12.5, 6.8, "walk", t, {}, 0.9, 0), bird(62, 8.5, 7.2, "peck", t));
      break;
    }
    case 7: {
      const pop = (f0: number) => popIn(at(f, f0, 9));
      if (f >= 445) who.push({ o: MAJOR, seed: 71, x: LINE[0], y: 0, z: LINE[2], expr: f < 470 ? "proud" : "smug", pose: "salute", scale: pop(445) });
      if (f >= 467) who.push({ o: gunner(0), seed: 21, x: LINE[0] + 1.55, y: 0, z: LINE[2] + 0.1, expr: "grin", scale: pop(467) });
      if (f >= 473) who.push({ o: gunner(1), seed: 22, x: LINE[0] + 3.0, y: 0, z: LINE[2] - 0.1, expr: "smile", scale: pop(473) });
      if (f > 528) birds.push(bird(71, LINE[0] + 12.5 - 1.3 * (t - 528 / FPS), LINE[2] - 3.2, "walk", t, {}, -1.3, 0)); // a photobomber strolls past behind
      break;
    }
    case 8: {
      who.push({ o: MAJOR, seed: 71, x: MAJ8[0], y: 0, z: MAJ8[2], expr: f < 577 - L ? "stern" : "pained", pose: "binoc" });
      who.push({ o: gunner(1), seed: 22, x: MAJ8[0] - 1.7, y: 0, z: MAJ8[2] - 2.6, expr: "dazed" });
      break;
    }
    case 9: birds.push(...flock(60, 900, t, -40, -159, 4, 34, 1, 0.02, 0.9, 0.4)); break;
    case 10: case 11: {
      const jam = id === 11 && f >= 713;
      who.push({ o: gunner(0), seed: 21, x: NEST[0] + 0.1, y: -0.35, z: NEST[2] + 0.7, expr: id === 10 ? (f < 685 - L ? "stern" : "grin") : jam ? "shock" : "grin", pose: "aim", noBlob: true });
      who.push({ o: gunner(1), seed: 22, x: NEST[0] - 1.25, y: -0.55, z: NEST[2] + 0.2, expr: jam ? "scared" : "smile", noBlob: true });
      if (!jam) birds.push(...flock(180, 300, t, 72, -56, 30, 40, 1, 0.5, 1.5, 0.2, 620 / FPS));
      else { // scatter away from the dam at a run
        for (let i = 0; i < 70; i++) {
          const s = 300 + i, a = h01(s, 5) * Math.PI * 2, v = 11 + 4 * h01(s, 6), u = Math.max(0, t - 713 / FPS - 0.1 * h01(s, 7));
          const x = DAM[0] - 18 + 20 * h01(s, 1) + Math.cos(a) * v * u, z = DAM[2] - 26 + 18 * h01(s, 2) + Math.sin(a) * v * u * 0.6;
          birds.push({ ...bird(s, x, z, "run", t, { expr: "alarm" }, Math.cos(a) * v, Math.sin(a) * v), dust: true });
        }
      }
      break;
    }
    case 12: {
      const T0 = truckAt(12, f), hop = smooth(at(f, 756, 16));
      who.push({ o: gunner(0), seed: 21, x: T0.x - 1.2 - 1.6 * (1 - hop), y: 0.95 * hop + 0.5 * Math.sin(Math.PI * hop), z: T0.z + 0.15 + 1.6 * (1 - hop), expr: f < 770 ? "grin" : "proud", pose: hop > 0.9 ? "aim" : undefined, noBlob: hop > 0.1 });
      who.push({ o: MAJOR, seed: 71, x: T0.x + 2.9, y: 0, z: T0.z + 1.9, expr: "proud", pose: "point", facing: -1 });
      who.push({ o: gunner(1), seed: 22, x: T0.x + 0.55, y: 0.95, z: T0.z + 0.35, expr: "smile", noBlob: true });
      break;
    }
    case 13: case 14: {
      const T0 = truckAt(id, f), bb = T0.bounce, wild = id === 14 && f > 896;
      who.push({ o: gunner(0), seed: 21, x: T0.x - 1.25, y: 0.95 + bb * (wild ? 4 : 1.2), z: T0.z + 0.1, expr: id === 13 ? "grin" : f < 842 ? "grin" : f < 900 ? "shock" : "dazed", pose: "aim",
        tilt: wild ? 9 * Math.sin(t * 13) : 0, noBlob: true });
      who.push({ o: gunner(1), seed: 22, x: T0.x + 0.6, y: 0.9 + bb, z: T0.z + 0.35, expr: id === 13 ? "smile" : "nervous", noBlob: true });
      who.push({ o: MAJOR, seed: 71, x: T0.x + 0.6, y: 0.9 + bb, z: T0.z - 0.4, expr: id === 13 ? "proud" : "shock", noBlob: true });
      if (id === 14) for (let i = 0; i < 11; i++) { // the overtakers: faster than the truck, between it and the lens
        const s = 700 + i, rel = -8 - 12 * h01(s, 1) + (5 + 2 * h01(s, 2)) * (t - 826 / FPS), side = i % 3 === 0 ? -3.2 - 2 * h01(s, 3) : 3.0 + 2.4 * h01(s, 3);
        birds.push({ ...bird(s, T0.x + rel, T0.z + side, "run", t, { expr: i % 2 ? "smug" : "calm" }, 16, 0), dust: true });
      }
      break;
    }
    case 15: {
      const look = f < 1037 ? 0 : Math.sin((t - 1037 / FPS) * 3.2);
      birds.push({ b: { mode: "front", dark: true, tall: 0.6 + 0.4 * smooth(at(f, 1003, 14)), expr: f < 1035 ? "calm" : "squint", look, seed: 5, blink: lidAt(f, 5) }, seed: 5, x: LOOKOUT[0], y: ROCK_TOP, z: LOOKOUT[2], noBlob: true });
      for (let i = 0; i < 46; i++) {
        const s = 1500 + i, a = h01(s, 1) * 6.28, r = 7 + 20 * h01(s, 2), mode = h01(s, 3) < 0.6 ? "peck" : "walk", v = mode === "walk" ? 0.8 : 0;
        const x = ROCK[0] + Math.cos(a) * r + v * Math.cos(a + 1.6) * (t - 31), z = ROCK[2] + Math.sin(a) * r * 0.8 + v * Math.sin(a + 1.6) * (t - 31);
        birds.push(bird(s, x, z, mode as EmuOpts["mode"], t, {}, v * Math.cos(a + 1.6), v * Math.sin(a + 1.6)));
      }
      break;
    }
    case 16: case 17: {
      if (id === 17 && f >= 1194) { // tracking the runners at 50 km/h
        const R0 = RUN17(f);
        [[0, 0, 0.0], [-2.6, -1.4, 0.33], [-4.6, 0.9, 0.66]].forEach(([dx, dz, ph], k) =>
          birds.push({ b: { mode: "run", phase: t * CAD.run + ph, expr: k === 0 ? "smug" : "calm", seed: k }, seed: 1700 + k, x: R0[0] + dx, y: 0, z: R0[2] + dz, vx: 13, vz: 0, dust: true }));
        for (let i = 0; i < 8; i++) { const s = 1720 + i; birds.push({ ...bird(s, R0[0] - 30 + 60 * h01(s, 1) + 6 * (t - 40), R0[2] - 30 - 25 * h01(s, 2), "run", t, {}, 7, -3), dust: false }); }
        break;
      }
      const burst = id === 17 ? Math.max(0, t - 1157 / FPS) : 0;
      for (let i = 0; i < 48; i++) {
        const s = 1600 + i, gA = (Math.floor(h01(s, 1) * 8) / 8) * Math.PI * 2 + 0.25, r0 = 1.2 * Math.sqrt(i + 0.5), a0 = i * 2.399;
        const x0 = STUB[0] + r0 * Math.cos(a0), z0 = STUB[2] + r0 * Math.sin(a0);
        if (!burst) { birds.push(bird(s, x0, z0, h01(s, 3) < 0.5 ? "peck" : "stand", t, { expr: "calm" })); continue; }
        const u = Math.max(0, burst - 0.12 * h01(s, 4)), v = 12 + 2 * h01(s, 5), d = v * u * (1 - Math.exp(-u * 3)) / Math.max(1e-3, 1 - Math.exp(-u * 3)) ;
        const x = x0 + Math.cos(gA) * d, z = z0 + Math.sin(gA) * d;
        birds.push({ ...bird(s, x, z, u > 0 ? "run" : "stand", t, { expr: "alarm" }, Math.cos(gA) * v, Math.sin(gA) * v), dust: u > 0 });
      }
      break;
    }
    case 19: {
      who.push({ o: gunner(0), seed: 21, x: TALLY[0], y: 0, z: TALLY[2], expr: f < 1469 - L ? "dazed" : "pained", mode: "sit", prop: "scroll" });
      who.push({ o: gunner(1), seed: 22, x: TALLY[0] - 1.9, y: 0, z: TALLY[2] - 1.0, expr: "relief", mode: "sit" });
      who.push({ o: MAJOR, seed: 71, x: PILE[0] - 2.2, y: 0, z: PILE[2] - 2.6, expr: f < 1394 ? "proud" : "shock", pose: f < 1394 ? "hips" : undefined });
      birds.push(...flock(18, 1900, t, -90, 40, 10, 40, 1, 0.05, 1.1, 0.3, 1347 / FPS));
      break;
    }
    case 20: birds.push({ b: { mode: "stand", expr: f < 1569 - L ? "calm" : "smug", seed: 2, dir: -1, blink: lidAt(f, 2) }, seed: 2001, x: BIRD20[0], y: 0, z: BIRD20[2] }); break;
    case 21: {
      const pose: FrontOpts["pose"] = f < 1702 ? "hips" : f < 1745 ? "point" : "hips";
      who.push({ o: MAJOR, seed: 71, x: MAJ21[0], y: 0, z: MAJ21[2], expr: f < 1615 ? "stern" : f < 1702 ? "neutral" : "shock", pose, facing: f < 1702 ? 0 : -1,
        talk: talkAt(WORDS, t, ...QUOTE_MAJOR) });
      for (let i = 0; i < 12; i++) { // the emu division: in single file, in step
        const x = -86 + 2.3 * i + 1.3 * (t - 1586 / FPS), z = MAJ21[2] - 15 + 0.25 * Math.sin(i);
        birds.push({ b: { mode: "walk", phase: t * CAD.walk, expr: i % 4 === 0 ? "smug" : "calm", seed: i % 7 }, seed: 2100 + i, x, y: 0, z, vx: 1.3, vz: 0 });
      }
      break;
    }
    case 22: {
      const T0 = truckAt(22, f), stop = at(f, 1800, 6);
      const fx0 = 2 - 5.2 * Math.max(0, Math.min(t, 1800 / FPS) - 1768 / FPS);
      who.push({ o: farmer(0), seed: 41, x: fx0, y: 0, z: ROAD_Z + 0.8, expr: f < 1803 ? "stern" : f < 1830 ? "pained" : "nervous", mode: stop < 1 ? "run" : "stand", phase: t * 2.6, prop: stop < 1 ? "scroll" : null, pose: stop >= 1 ? "shrug" : undefined });
      who.push({ o: gunner(0), seed: 21, x: T0.x + 1.3, y: 0.95 + T0.bounce, z: T0.z, expr: "smile_closed", mode: "sit", wave: 0.5 + 0.5 * Math.sin(t * 9), noBlob: true });
      birds.push(bird(2201, -3, ROAD_Z - 5, "stand", t, { expr: "smug", dir: -1, blink: lidAt(f, 7) }), bird(2202, 8.5, ROAD_Z - 4.2, "peck", t));
      break;
    }
    case 23: {
      birds.push({ b: { mode: "front", expr: f < 1955 ? "smug" : f < 1966 ? "wink" : "smug", seed: 4, look: f < 1918 ? 0.3 : -0.15, puff: 0.15, blink: lidAt(f, 4) }, seed: 4, x: MONU[0] + 1.3, y: 1.55, z: MONU[2] + 0.35, noBlob: true, scale: 1.3 });
      birds.push({ b: { mode: "front", seed: 0 }, seed: 9, x: MONU[0] - 1.35, y: 1.55, z: MONU[2] + 0.35, noBlob: true, roo: true, scale: 1.3 });
      birds.push(...flock(26, 2300, t, -70, -150, 16, 30, 1, 0.05, 1.3, 0.3, 1865 / FPS));
      break;
    }
    default: break;
  }
  return { who, birds };
};

// ---------------- world ----------------
type GunRig = { g: THREE.Group; pitch: THREE.Group };
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunCache = new Map<number, THREE.Vector3>();
  private outside = new THREE.Group();
  private marbSet = new THREE.Group();
  private wheel = new THREE.Group();
  private truck = new THREE.Group(); private wheels: THREE.Group[] = []; private truckGun!: GunRig;
  private guns: GunRig[] = [];
  private crates: THREE.Mesh[] = [];
  private pile!: THREE.InstancedMesh; private bullets: THREE.Group[] = [];
  private marbles: THREE.Mesh[] = [];
  private embers: THREE.Mesh[] = [];
  private tuftMats: THREE.MeshBasicMaterial[] = [];
  private water!: THREE.MeshBasicMaterial;
  private frustumC = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + 0.3, d = 700 + (i % 3) * 70, w = 150 + (i % 4) * 40;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.cos(a) * d, 90 + (i % 4) * 40, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); this.outside.add(m);
    }
    R.add(this.outside, this.marbSet);
    this.buildLand();
    this.buildWheat();
    this.buildTrees();
    this.buildFences();
    this.buildFarm();
    this.buildPlaces();
    this.buildCamp();
    this.buildTruck();
    this.buildGuns();
    this.buildMonument();
    this.buildMarbles();
  }

  // ---------------- land ----------------
  private buildLand() {
    const O = this.outside, W = 1400, N = 700, cx = 40, cz = 0;
    const g = new THREE.PlaneGeometry(W, W, N, N); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
    const P0 = g.attributes.position as THREE.BufferAttribute, cols: number[] = [], c = new THREE.Color(), c2 = new THREE.Color();
    const PAD = ["#caa45c", "#bf9a52", "#d1ae64", "#b9a25a", "#c8a057", "#d2b780"].map((h) => new THREE.Color(h));
    const dirt = new THREE.Color("#b8764a"), yard = new THREE.Color("#b98e5e"), stub = new THREE.Color("#d9c896"), bank = new THREE.Color("#a8744a"), fallow = new THREE.Color("#b9744a");
    for (let i = 0; i < P0.count; i++) {
      const x = P0.getX(i), z = P0.getZ(i), y = groundY(x, z);
      P0.setY(i, y);
      const cell = Math.floor((x + 1000) / 64) * 131 + Math.floor((z + 1000) / 52), k = h01(cell, 3);
      c.copy(PAD[Math.floor(k * PAD.length)]);
      if (h01(cell, 4) < 0.07) c.copy(fallow);
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.06 - x * 0.02);
      c.multiplyScalar(0.93 + 0.12 * n);
      if (inStub(x, z)) c.copy(stub).multiplyScalar(0.96 + 0.06 * n);
      const dd = Math.hypot(x - DAM[0], z - DAM[2]);
      if (dd < 17) c.lerp(bank, smooth((17 - dd) / 3));
      if (inYard(x, z) || Math.hypot(x - CAMP[0], z - CAMP[2]) < 19 || Math.hypot(x - MONU[0], z - MONU[2]) < 5) c.lerp(yard, 0.85);
      if (inRoad(x, z)) c2.copy(dirt).multiplyScalar(0.94 + 0.1 * n), c.lerp(c2, Math.abs(z - ROAD_Z) < 3.4 ? smooth((3.4 - Math.abs(z - ROAD_Z)) / 0.8) : 1);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 160, uv.getY(i) * 160);
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, lam("emuTerrain", () => ({ map: fieldTex(), vertexColors: true })));
    ground.receiveShadow = true; ground.castShadow = true; O.add(ground);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), lam("emuFar", () => ({ color: "#d9b05a" })));
    far.position.set(0, -0.5, 0); far.receiveShadow = true; O.add(far);
    // the road surface: a dirt ribbon with ruts, slightly above the ground
    const rg = new THREE.PlaneGeometry(1400, 6.2).rotateX(-Math.PI / 2);
    const ruv = rg.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < ruv.count; i++) ruv.setXY(i, ruv.getY(i), ruv.getX(i) * 230);
    const road = new THREE.Mesh(rg, lam("emuRoad", () => ({ map: dirtTex() })));
    road.position.set(40, 0.03, ROAD_Z); road.receiveShadow = true; O.add(road);
    // the dam water
    // the dam water reflects the sky: unlit, tinted per light in update() (lit water read as a violet hole at golden hour)
    this.water = new THREE.MeshBasicMaterial({ map: rep(damTex(), 2, 2) });
    const water = new THREE.Mesh(new THREE.CircleGeometry(11.5, 48).rotateX(-Math.PI / 2), this.water);
    water.position.set(DAM[0], -0.75, DAM[2]); water.receiveShadow = true; O.add(water);
  }

  /** alpha wheat tufts (no ink): sparse everywhere, dense round the shots' foregrounds */
  private buildWheat() {
    const pts: [number, number, number][] = [];
    // keep 3 m round every lens position of every outdoor shot clear (a tuft at the lens is a blurred wall)
    const lens: [number, number][] = [];
    for (const sh of SHOTS) if (sh.light !== "inside") for (let f = sh.a; f < sh.b; f += 4) { const c = camAt(sh.id, f); if (c.pos[1] < 6) lens.push([c.pos[0], c.pos[2]]); }
    const nearLens = (x: number, z: number) => lens.some(([a, b]) => (x - a) ** 2 + (z - b) ** 2 < 4);
    const tryAdd = (x: number, z: number, s: number) => { if (!bare(x, z) && !nearLens(x, z)) pts.push([x, z, s]); };
    for (let i = 0; i < 26000; i++) tryAdd(-240 + 520 * h01(i, 1), -240 + 360 * h01(i, 2), 0.9 + 0.3 * h01(i, 3));
    const patches: [number, number, number, number][] = [
      [12, -38, 26, 2.2], [2, -60, 18, 2.0], [-40, -46, 12, 2.4], [98, -24, 12, 2.6], [-20, 30, 30, 0.9], [-70, -82, 20, 1.6], [0, -126, 18, 2.0],
      [9, 22, 13, 2.2], [-4, 24, 12, 2.0], [60, 30, 40, 0.8], [-60, 30, 40, 0.8], [-40, 56, 16, 1.6], [-80, 52, 14, 1.4],
    ];
    patches.forEach(([cx, cz, r, d], pi) => {
      const n = Math.round(Math.PI * r * r * d);
      for (let i = 0; i < n; i++) { const a = h01(i, pi * 7 + 1) * 6.283, rr = r * Math.sqrt(h01(i, pi * 7 + 2)); tryAdd(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 0.85 + 0.35 * h01(i, pi + 3)); }
    });
    const geo = (() => { // two crossed quads, 1.3 m wide x 1.0 m tall, base at y = 0
      const a = new THREE.PlaneGeometry(1.3, 1.0).translate(0, 0.5, 0), b = a.clone().rotateY(Math.PI / 2);
      const g = new THREE.BufferGeometry(), pa = [a, b];
      const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
      let off = 0;
      for (const p of pa) {
        pos.push(...(p.attributes.position.array as Float32Array)); uv.push(...(p.attributes.uv.array as Float32Array));
        for (let i = 0; i < p.attributes.position.count; i++) nor.push(0, 1, 0); // up-facing normals: tufts shade like the ground
        idx.push(...Array.from(p.index!.array as Uint16Array, (v) => v + off)); off += p.attributes.position.count;
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      return g;
    })();
    for (let k = 0; k < 3; k++) {
      const tex = tuftTex(k);
      const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide }); this.tuftMats.push(mat);
      const mine = pts.filter((_, i) => i % 3 === k);
      const im = new THREE.InstancedMesh(geo, mat, mine.length), m = new THREE.Matrix4(), col = new THREE.Color();
      mine.forEach(([x, z, s], i) => {
        m.makeRotationY(h01(i, k + 11) * 3.14).scale(new THREE.Vector3(s, s * (0.62 + 0.22 * h01(i, k + 12)), s)).setPosition(x, groundY(x, z) - 0.05, z);
        im.setMatrixAt(i, m);
        im.setColorAt(i, col.setHSL(0.11 + 0.02 * h01(i, k + 13), 0.5, 0.8 + 0.12 * h01(i, k + 14)));
      });
      im.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45, side: THREE.DoubleSide });
      im.castShadow = false; im.receiveShadow = false; im.layers.set(NOINK); im.frustumCulled = false;
      this.outside.add(im);
    }
  }

  /** gum trees: pale smooth trunks forking into branches, clumps of olive leaves, sparse and airy */
  private buildTrees() {
    const b = new Batch(), bark = lam("gumBark", () => ({ map: rep(barkTex(), 1, 2) }));
    const leaves = ["#7a9654", "#6c8a4c", "#8aa25e", "#5f7c46"].map((c, i) => lam("gumLeaf" + i, () => ({ color: c })));
    const canopy = new THREE.IcosahedronGeometry(1, 1);
    const gum = (x: number, z: number, s: number, i: number) => {
      const y = groundY(x, z), lean = (h01(i, 1) - 0.5) * 0.25;
      b.add(cyl(0.32 * s, 4.2 * s, 9, 0.22 * s), bark, new THREE.Matrix4().makeRotationZ(lean).setPosition(x, y - 0.2, z));
      const top = new THREE.Vector3(x - Math.sin(lean) * 4.2 * s, y + 4 * s, z);
      for (let k = 0; k < 3; k++) { // forks
        const a = h01(i, k + 2) * 6.28, tilt = 0.35 + 0.3 * h01(i, k + 5), len = (3.2 + 2 * h01(i, k + 8)) * s;
        const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.sin(a) * tilt, 0, Math.cos(a) * tilt)).setPosition(top);
        b.add(cyl(0.16 * s, len, 7, 0.08 * s), bark, m);
        const tip = new THREE.Vector3(0, len, 0).applyMatrix4(m);
        for (let j = 0; j < 3; j++) {
          const sc = (1.5 + 1.1 * h01(i * 3 + k, j + 11)) * s;
          b.add(canopy, leaves[(i + k + j) % 4], new THREE.Matrix4().makeScale(sc * 1.3, sc * 0.7, sc * 1.2).setPosition(tip.x + (h01(i, j + k * 3) - 0.5) * 2.6 * s, tip.y + (j - 1) * 0.5 * s, tip.z + (h01(i, j + k * 3 + 20) - 0.5) * 2.6 * s));
        }
      }
    };
    let n = 0;
    for (let x = -300; x < 300; x += 24) { const z = 26 - 4 * h01(n, 31); if (Math.abs(x - 4) > 18) gum(x + 6 * h01(n, 30), z, 1 + 0.4 * h01(n, 32), n); n++; } // along the road (behind the truck's lane)
    for (let x = -300; x < 300; x += 31) { gum(x, 58 + 8 * h01(n, 33), 1.1 + 0.4 * h01(n, 34), n); n++; }
    const spots: [number, number][] = [[-20, 4], [24, 8], [-14, -14], [30, -18], [-34, 14], [118, -46], [104, -64], [66, -34], [-90, -98], [-54, -104], [-86, -70],
      [26, -128], [-30, -140], [-62, 86], [-40, 92], [-78, 60], [236, 140], [180, 76], [-18, -52], [44, -64]];
    for (const [x, z] of spots) { gum(x, z, 1.0 + 0.5 * h01(n, 35), n); n++; }
    for (let i = 0; i < 90; i++) { const x = -400 + 800 * h01(i, 40), z = -300 + 600 * h01(i, 41); if (Math.hypot(x - 20, z + 10) > 130 && !bare(x, z)) { gum(x, z, 1 + 0.6 * h01(i, 42), n); n++; } }
    b.build(this.outside);
  }

  /** post-and-wire fences: the road's north side, the north paddock (the horde's fence), the house paddock */
  private buildFences() {
    const b = new Batch(), post = lam("fencePost", () => ({ color: "#8a6a48" })), wire = lam("fenceWire", () => ({ color: "#5a5a5e" }));
    const line = (ax: number, az: number, bx: number, bz: number, gap?: [number, number]) => {
      const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, n = Math.floor(len / 3.2);
      for (let i = 0; i <= n; i++) {
        const x = ax + ux * i * 3.2, z = az + uz * i * 3.2;
        if (gap && x > gap[0] && x < gap[1]) continue;
        b.add(cyl(0.07, 1.25, 6), post, T(x, groundY(x, z) - 0.05, z));
      }
      for (const h of [0.45, 0.78, 1.1]) {
        const segs = gap ? [[ax, gap[0]], [gap[1], bx]] : [[ax, bx]];
        for (const [x0, x1] of segs) {
          const l = Math.abs(x1 - x0) / Math.max(1e-3, Math.abs(ux)) || len, mx = (x0 + x1) / 2, mz = az + uz * ((mx - ax) / (ux || 1));
          const g = new THREE.CylinderGeometry(0.012, 0.012, ux ? Math.abs(x1 - x0) / Math.abs(ux) : l, 4).rotateZ(Math.PI / 2).rotateY(-Math.atan2(uz, ux));
          b.add(g, wire, T(mx, groundY(mx, mz) + h, mz));
        }
      }
    };
    line(-320, ROAD_Z - 3.8, 320, ROAD_Z - 3.8, [2.4, 8.8]);
    line(60, ROAD_Z + 3.8, 320, ROAD_Z + 3.8);
    line(-110, NFENCE_Z - 3, 120, NFENCE_Z - 3);
    line(-16, 12, -16, -16); line(30, 12, 30, -20);
    b.build(this.outside);
  }

  // ---------------- the homestead ----------------
  private buildFarm() {
    const b = new Batch(), [hx, , hz] = HOUSE;
    const walls = lam("weatherboards", () => ({ map: rep(boardsTex("cream", "#efe4c6"), 1, 1) }));
    const roofM = lam("roofIron", () => ({ map: rep(ironTex("red", "#a8483a", 0.4), 1, 1), side: THREE.DoubleSide }));
    const verM = lam("verandahIron", () => ({ map: rep(ironTex("grey", "#a9adb0", 0.2), 1, 1), side: THREE.DoubleSide }));
    const trim = lam("houseTrim", () => ({ color: "#2f5a46" })), deck = lam("deckBoards", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
    const glass = lam("windowGlass", () => ({ color: "#3a4a5c" })), white = lam("windowFrame", () => ({ color: "#f2efe6" }));
    const x0 = hx - 6, x1 = hx + 6, z0 = hz - 4.5, z1 = hz + 4.5, y0 = 0.45, y1 = 3.5;
    // stumps + walls
    for (let x = x0; x <= x1; x += 2) for (const z of [z0, z1]) b.add(boxGeo(V(x - 0.12, 0, z - 0.12), V(x + 0.12, y0, z + 0.12)), trim);
    b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), 3), walls);
    // hipped roof
    const rh = 2.4, rx0 = x0 - 0.5, rx1 = x1 + 0.5, rz0 = z0 - 0.5, rz1 = z1 + 0.5, r0 = V(hx - 2, y1 + rh, hz), r1 = V(hx + 2, y1 + rh, hz);
    b.add(quad(V(rx0, y1 - 0.1, rz1), V(rx1, y1 - 0.1, rz1), r1, r0, 4, 1), roofM);
    b.add(quad(V(rx1, y1 - 0.1, rz0), V(rx0, y1 - 0.1, rz0), r0, r1, 4, 1), roofM);
    b.add(tri(V(rx1, y1 - 0.1, rz1), V(rx1, y1 - 0.1, rz0), r1), roofM);
    b.add(tri(V(rx0, y1 - 0.1, rz0), V(rx0, y1 - 0.1, rz1), r0), roofM);
    // verandah: deck, posts, skillion roof, rail
    const vz = z1 + 3.0;
    b.add(boxGeo(V(x0 - 1, y0 - 0.1, z1), V(x1 + 1, y0, vz), 1), deck);
    for (let x = x0 - 1; x <= x1 + 1.01; x += 2.6) b.add(boxGeo(V(x - 0.08, y0, vz - 0.2), V(x + 0.08, 3.0, vz - 0.04)), white);
    b.add(quad(V(x0 - 1.2, 2.95, vz + 0.2), V(x1 + 1.2, 2.95, vz + 0.2), V(x1 + 1.2, 3.45, z1), V(x0 - 1.2, 3.45, z1), 4, 1), verM);
    b.add(boxGeo(V(x0 - 1, 1.2, vz - 0.16), V(-1.2, 1.28, vz - 0.08)), white); b.add(boxGeo(V(1.2, 1.2, vz - 0.16), V(x1 + 1, 1.28, vz - 0.08)), white);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(-1.2, y0 - 0.15 - k * 0.15, vz + k * 0.3), V(1.2, y0 - k * 0.15, vz + 0.3 + k * 0.3)), deck); // steps
    // windows and the door on the front wall, windows on the sides
    const win = (x: number, z: number, yaw: number) => {
      const m = RY(yaw, x, 0, z);
      b.add(boxGeo(V(-0.75, 1.2, 0), V(0.75, 2.6, 0.06)), white, m);
      b.add(boxGeo(V(-0.62, 1.32, 0.04), V(0.62, 2.48, 0.08)), glass, m);
      b.add(boxGeo(V(-0.04, 1.32, 0.06), V(0.04, 2.48, 0.1)), white, m); b.add(boxGeo(V(-0.62, 1.86, 0.06), V(0.62, 1.94, 0.1)), white, m);
      for (const s of [-1, 1]) b.add(boxGeo(V(s * 0.78 - 0.18, 1.2, 0.02), V(s * 0.78 + 0.18, 2.6, 0.08)), trim, m);
    };
    win(-3.4, z1 + 0.01, 0); win(3.4, z1 + 0.01, 0); win(x1 + 0.01, 0, Math.PI / 2); win(x0 - 0.01, -1, -Math.PI / 2);
    b.add(boxGeo(V(-0.55, y0, z1), V(0.55, 2.6, z1 + 0.06)), trim); b.add(boxGeo(V(0.3, 1.5, z1 + 0.06), V(0.4, 1.6, z1 + 0.1)), white);
    // brick chimney
    b.add(boxGeo(V(hx - 4.4, y1 - 0.5, hz - 1.4), V(hx - 3.4, y1 + rh + 1.0, hz - 0.4)), lam("chimneyBrick", () => ({ color: "#a8603e" })));
    // the water tank on its stand
    const iron = lam("tankIron", () => ({ map: rep(ironTex("tank", "#b9bcbc", 0.5), 3, 1) })), wood = lam("standWood", () => ({ color: "#8a6a4a" }));
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]]) b.add(boxGeo(V(TANK[0] + dx - 0.12, 0, TANK[2] + dz - 0.12), V(TANK[0] + dx + 0.12, 1.7, TANK[2] + dz + 0.12)), wood);
    b.add(boxGeo(V(TANK[0] - 1.7, 1.6, TANK[2] - 1.7), V(TANK[0] + 1.7, 1.8, TANK[2] + 1.7)), wood);
    b.add(cyl(1.6, 2.4, 28), iron, T(TANK[0], 1.8, TANK[2]));
    b.add(new THREE.ConeGeometry(1.7, 0.6, 28).translate(TANK[0], 4.5, TANK[2]), iron);
    // the hay shed with bales and stacked wheat bags
    const sx = -26, sz = -12, roof2 = lam("shedIron", () => ({ map: rep(ironTex("shed", "#9ea2a2", 0.6), 2, 1), side: THREE.DoubleSide }));
    for (let x = sx - 5; x <= sx + 5; x += 5) for (const z of [sz - 3.5, sz + 3.5]) b.add(boxGeo(V(x - 0.14, 0, z - 0.14), V(x + 0.14, 4.2, z + 0.14)), wood);
    b.add(quad(V(sx - 5.6, 4.0, sz + 4.2), V(sx + 5.6, 4.0, sz + 4.2), V(sx + 5.6, 4.7, sz - 4.2), V(sx - 5.6, 4.7, sz - 4.2), 3, 1), roof2);
    const hay = lam("hayBale", () => ({ color: "#e2c06a" })), sack = lam("wheatSack", () => ({ color: "#c9b08a" }));
    for (let i = 0; i < 7; i++) b.add(new THREE.CylinderGeometry(0.7, 0.7, 1.3, 16).rotateZ(Math.PI / 2).translate(sx - 3.6 + (i % 4) * 1.4, 0.7 + Math.floor(i / 4) * 1.3, sz - 1.4), hay);
    for (let i = 0; i < 12; i++) b.add(new THREE.CapsuleGeometry(0.28, 0.5, 4, 10).rotateX(Math.PI / 2).translate(sx + 2 + (i % 4) * 0.6, 0.3 + Math.floor(i / 4) * 0.5, sz + 1.6), sack);
    // a trough by the windmill and a cart
    b.add(new THREE.CylinderGeometry(0.5, 0.5, 3, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI).translate(MILL[0] + 2.5, 0.55, MILL[2] + 2), iron);
    // the windmill: lattice tower, platform, tail vane; the wheel is its own group (it turns)
    const steel = lam("millSteel", () => ({ color: "#8a8e92" })), [mx, , mz] = MILL, H = 9.2;
    for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]) {
      const a = V(mx + dx, 0, mz + dz), c = V(mx + dx * 0.18, H, mz + dz * 0.18), len = a.distanceTo(c);
      const g = new THREE.CylinderGeometry(0.06, 0.06, len, 6).translate(0, len / 2, 0);
      const q1 = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize());
      b.add(g, steel, new THREE.Matrix4().compose(a, q1, V(1, 1, 1)));
    }
    for (let k = 1; k <= 4; k++) { // braces: rings of rods
      const y = (H * k) / 5, s = 1.5 * (1 - (0.82 * k) / 5);
      for (const [ax, az, bx, bz] of [[-s, -s, s, -s], [s, -s, s, s], [s, s, -s, s], [-s, s, -s, -s]]) {
        const A = V(mx + ax, y, mz + az), B2 = V(mx + bx, y, mz + bz), len = A.distanceTo(B2);
        const g = new THREE.CylinderGeometry(0.03, 0.03, len, 5).rotateZ(Math.PI / 2);
        b.add(g, steel, new THREE.Matrix4().makeRotationY(-Math.atan2(B2.z - A.z, B2.x - A.x)).setPosition(A.clone().add(B2).multiplyScalar(0.5)));
      }
    }
    b.add(boxGeo(V(mx - 0.7, H - 0.1, mz - 0.7), V(mx + 0.7, H + 0.05, mz + 0.7)), wood);
    b.add(boxGeo(V(mx - 0.08, H + 0.4, mz - 2.8), V(mx + 0.08, H + 0.55, mz)), steel);
    b.add(boxGeo(V(mx - 0.03, H - 0.3, mz - 3.9), V(mx + 0.03, H + 1.3, mz - 2.6)), lam("vaneRed", () => ({ color: "#b8483a" })));
    b.build(this.outside);
    const wb = new Batch(), blade = lam("millBlade", () => ({ color: "#c9ccce", side: THREE.DoubleSide }));
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      wb.add(new THREE.BoxGeometry(0.34, 1.75, 0.02).rotateY(0.45).translate(0, 1.45, 0).rotateZ(a), blade);
    }
    wb.add(new THREE.TorusGeometry(2.3, 0.04, 6, 36), steel); wb.add(new THREE.TorusGeometry(0.6, 0.04, 6, 24), steel);
    wb.add(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 14).rotateX(Math.PI / 2), steel);
    wb.build(this.wheel);
    this.wheel.position.set(mx, H + 0.48, mz + 0.35); this.outside.add(this.wheel);
  }

  // ---------------- the granite rock, the stubble paddock's stooks, the monument ----------------
  private buildPlaces() {
    const b = new Batch(), gran = lam("granite", () => ({ map: rep(graniteTex(), 2, 2) }));
    b.add(new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), gran, new THREE.Matrix4().makeScale(4.6, ROCK_TOP, 4.0).setPosition(ROCK[0], 0, ROCK[2]));
    for (const [dx, dz, s] of [[4.6, 2.8, 1.6], [-4.2, 3.4, 1.2], [3.2, -3.6, 2.0], [-5.6, -1.2, 1.4], [1.0, 5.0, 0.9]] as const)
      b.add(new THREE.DodecahedronGeometry(1, 1), gran, new THREE.Matrix4().makeScale(s * 1.2, s * 0.8, s).setPosition(ROCK[0] + dx, s * 0.3, ROCK[2] + dz));
    // granite boulders scattered in the paddocks (shade + ink in open fields)
    for (let i = 0; i < 40; i++) {
      const x = -200 + 420 * h01(i, 70), z = -220 + 300 * h01(i, 71), s = 0.6 + 1.6 * h01(i, 72);
      if (bare(x, z) || Math.hypot(x - 10, z + 40) < 30 || Math.hypot(x - MONU[0], z - MONU[2]) < 28) continue;
      b.add(new THREE.DodecahedronGeometry(1, 1), gran, new THREE.Matrix4().makeScale(s * 1.3, s * 0.7, s).setPosition(x, groundY(x, z) + s * 0.2, z));
    }
    // stubble paddock: a few hay stooks at the edges so the empty field has scale
    const hay = lam("hayBale", () => ({ color: "#e2c06a" }));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28, x = STUB[0] + Math.cos(a) * 34, z = STUB[2] + Math.sin(a) * 30; if (z > STUB[2] + 4 && Math.cos(a) > 0) continue; b.add(new THREE.CylinderGeometry(0.7, 0.7, 1.3, 16).rotateZ(Math.PI / 2).rotateY(a), hay, T(x, 0.7, z)); }
    b.build(this.outside);
  }

  private buildMonument() {
    const b = new Batch(), ss = lam("sandstone", () => ({ map: rep(sandstoneTex(), 1, 1) })), gold = lam("goldLeaf", () => ({ color: "#e8b84a" }));
    const [mx, , mz] = MONU;
    b.add(boxGeo(V(mx - 2.7, 0, mz - 1.5), V(mx + 2.7, 0.3, mz + 1.5), 1.2), ss);
    b.add(boxGeo(V(mx - 2.3, 0.3, mz - 1.15), V(mx + 2.3, 1.55, mz + 1.15), 1.2), ss);
    b.add(boxGeo(V(mx - 2.45, 1.45, mz - 1.3), V(mx + 2.45, 1.58, mz + 1.3), 1.2), ss);
    // the shield: flat top, curved to a point; a gold rim behind the painted face
    const sh = new THREE.Shape();
    sh.moveTo(-0.8, 0.95); sh.lineTo(0.8, 0.95); sh.lineTo(0.8, -0.1); sh.quadraticCurveTo(0.75, -0.75, 0, -1.0); sh.quadraticCurveTo(-0.75, -0.75, -0.8, -0.1); sh.lineTo(-0.8, 0.95);
    const rim = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.04, bevelSegments: 2 });
    rim.scale(0.72, 0.72, 1); b.add(rim, gold, T(mx, 2.45, mz - 0.1));
    const face = new THREE.ShapeGeometry(sh, 24), fuv = face.attributes.uv as THREE.BufferAttribute, fp = face.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fuv.count; i++) fuv.setXY(i, (fp.getX(i) + 0.8) / 1.6, (fp.getY(i) + 1.0) / 1.95);
    face.scale(0.72, 0.72, 1); b.add(face, lam("shieldFace", () => ({ map: shieldTex() })), T(mx, 2.45, mz + 0.105));
    // the seven-pointed gold star above
    const st = new THREE.Shape();
    for (let k = 0; k < 14; k++) { const r = k % 2 ? 0.2 : 0.46, a = (k / 14) * Math.PI * 2 + Math.PI / 2; if (k) st.lineTo(r * Math.cos(a), r * Math.sin(a)); else st.moveTo(r * Math.cos(a), r * Math.sin(a)); }
    b.add(new THREE.ExtrudeGeometry(st, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), gold, T(mx, 3.55, mz));
    // a wattle sprig either side under the shield (gold balls on green twigs)
    const twig = lam("wattleLeaf", () => ({ color: "#5f7c46" }));
    for (const s of [-1, 1]) for (let k = 0; k < 7; k++) {
      const x = mx + s * (0.4 + 0.14 * k), y = 1.75 + 0.05 * k;
      b.add(new THREE.SphereGeometry(0.075, 8, 6), gold, T(x, y + 0.08, mz + 0.9)); b.add(new THREE.SphereGeometry(0.06, 6, 5).scale(1.6, 0.6, 1), twig, T(x + s * 0.06, y, mz + 0.9));
    }
    b.build(this.outside);
  }

  // ---------------- the army camp ----------------
  private buildCamp() {
    const b = new Batch(), canvas = lam("tentCanvas", () => ({ map: canvasTex(), side: THREE.DoubleSide })), dark = lam("tentDoor", () => ({ color: "#3a3024" }));
    const wood = lam("standWood", () => ({ color: "#8a6a4a" })), crate = lam("ammoCrate", () => ({ map: crateTex() }));
    for (const [dx, dz] of [[-12, 4], [12, 5], [-13, -6], [13, -5], [0, 12]]) {
      const x = CAMP[0] + dx, z = CAMP[2] + dz;
      b.add(new THREE.CylinderGeometry(2.3, 2.3, 0.7, 24, 1, true).translate(x, 0.35, z), canvas);
      b.add(new THREE.ConeGeometry(2.45, 2.7, 24, 1, true).translate(x, 0.7 + 1.35, z), canvas);
      b.add(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6).translate(x, 1.8, z), wood);
      const yaw = Math.atan2(CAMP[0] - x, CAMP[2] - z);
      b.add(tri(V(-0.55, 0.02, 2.36), V(0.55, 0.02, 2.36), V(0, 1.7, 2.1)), dark, RY(yaw, x, 0, z));
    }
    // campfire: a stone ring and logs (the embers are HDR, NOINK)
    const fx = CAMP[0] + 3, fz = CAMP[2] + 1, stone = lam("fireStone", () => ({ color: "#9a8a80" }));
    for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.28; b.add(new THREE.DodecahedronGeometry(0.2, 0), stone, T(fx + Math.cos(a) * 0.65, 0.1, fz + Math.sin(a) * 0.65)); }
    for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6).rotateZ(Math.PI / 2 - 0.35).rotateY((k / 4) * 3.14), lam("logWood", () => ({ color: "#6a4a30" })), T(fx, 0.25, fz));
    const ember = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.75, 0.18) });
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 9).translate(fx, 0.45, fz), ember); e.layers.set(NOINK); this.embers.push(e); this.outside.add(e);
    // crates (the empty ammunition), a seat crate for the tally, a table
    for (const [dx, dz, h] of [[-2.4, -1.2, 0], [-1.7, -1.4, 0], [-2.05, -1.3, 0.46], [6.5, 2.2, 0], [6.9, 3.0, 0], [1.4, 2.6, 0]] as const)
      b.add(boxGeo(V(-0.36, 0, -0.24), V(0.36, 0.46, 0.24)), crate, RY(0.2 * dx, CAMP[0] + dx, h, CAMP[2] + dz));
    b.add(boxGeo(V(-0.36, 0, -0.24), V(0.36, 0.46, 0.24)), crate, T(TALLY[0], 0, TALLY[2] - 0.1));
    b.build(this.outside);
    // the pile of cartridge cases: brass cylinders heaped in a cone; it grows on "fired 9,860" (1394)
    const N = 1300, geo = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8);
    this.pile = new THREE.InstancedMesh(geo, lam("brass", () => ({ color: "#e0a83e" })), N);
    const m = new THREE.Matrix4(), qn = new THREE.Quaternion(), e3 = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      const a = h01(i, 81) * 6.28, r = 1.5 * Math.sqrt(h01(i, 82)), y = Math.max(0.03, 1.05 * (1 - r / 1.5) * h01(i, 83) ** 0.35);
      e3.set(h01(i, 84) * 3.14, h01(i, 85) * 3.14, h01(i, 86) * 3.14); qn.setFromEuler(e3);
      m.compose(V(Math.cos(a) * r, y, Math.sin(a) * r), qn, V(1, 1, 1)); this.pile.setMatrixAt(i, m);
    }
    this.pile.castShadow = true; this.pile.receiveShadow = true; this.pile.position.set(...PILE); this.pile.layers.set(NOINK); this.outside.add(this.pile);
    // ten oversized cartridges (shot 20)
    const brass = lam("brass", () => ({})), copper = lam("copperTip", () => ({ color: "#c8763a" }));
    for (let k = 0; k < 10; k++) {
      const g = new THREE.Group(), bb = new Batch();
      bb.add(cyl(0.075, 0.34, 14), brass); bb.add(cyl(0.085, 0.03, 14), brass);
      bb.add(new THREE.SphereGeometry(0.075, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2.2, 1).translate(0, 0.34, 0), copper);
      bb.build(g); g.position.set(BIRD20[0] - 2.0 + k * 0.145, 0, BIRD20[2] + 0.35); this.bullets.push(g); this.outside.add(g);
    }
    // the line-up's crates of bullets (shot 7): a 3-2-1 stack
    const cm = lam("ammoCrate", () => ({}));
    const spots: V3[] = [[7.75, 0, 0.3], [8.5, 0, 0.3], [9.25, 0, 0.3], [8.1, 0.47, 0.3], [8.85, 0.47, 0.3], [8.5, 0.94, 0.3]];
    for (const s of spots) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.46, 0.5).translate(0, 0.23, 0), cm); c.position.set(LINE[0] + s[0], s[1], LINE[2] + s[2]); c.castShadow = c.receiveShadow = true; this.crates.push(c); this.outside.add(c); }
  }

  // ---------------- the truck (a 1930s army lorry: open cab, flat bed with rails, a gun on a pintle) ----------------
  private buildTruck() {
    const b = new Batch(), green = lam("truckGreen", () => ({ color: "#5d6b3f" })), dark = lam("truckDark", () => ({ color: "#2e2c28" }));
    const bed = lam("truckBed", () => ({ map: rep(planksHD(), 0.5, 0.5) })), chrome = lam("chrome", () => ({ color: "#d8d6cc" })), lamp = lam("lampLens", () => ({ color: "#fff2c0" }));
    b.add(boxGeo(V(-2.6, 0.5, -0.8), V(2.4, 0.75, 0.8)), dark); // chassis
    b.add(boxGeo(V(1.15, 0.75, -0.62), V(2.42, 1.5, 0.62)), green); // bonnet
    b.add(boxGeo(V(2.42, 0.8, -0.56), V(2.52, 1.48, 0.56)), dark); // radiator
    for (let k = -4; k <= 4; k++) b.add(boxGeo(V(2.52, 0.86, k * 0.12 - 0.02), V(2.55, 1.42, k * 0.12 + 0.02)), chrome);
    for (const s of [-1, 1]) { b.add(new THREE.SphereGeometry(0.14, 12, 10).translate(2.42, 1.42, s * 0.72), chrome); b.add(new THREE.CircleGeometry(0.1, 12).rotateY(Math.PI / 2).translate(2.57, 1.42, s * 0.72), lamp); }
    // fenders over the wheels, running boards
    for (const [x, s] of [[1.75, -1], [1.75, 1], [-1.7, -1], [-1.7, 1]] as const) b.add(new THREE.CylinderGeometry(0.6, 0.6, 0.34, 16, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(x, 0.55, s * 0.9), green);
    for (const s of [-1, 1]) b.add(boxGeo(V(0.0, 0.48, s * 0.82 - 0.12), V(1.15, 0.53, s * 0.82 + 0.12)), dark);
    // open cab: firewall, windscreen frame, roof on posts, half doors, a bench seat
    b.add(boxGeo(V(1.05, 0.75, -0.8), V(1.15, 1.55, 0.8)), green);
    b.add(boxGeo(V(1.08, 1.55, -0.8), V(1.12, 2.15, -0.74)), dark); b.add(boxGeo(V(1.08, 1.55, 0.74), V(1.12, 2.15, 0.8)), dark); b.add(boxGeo(V(1.08, 2.11, -0.8), V(1.12, 2.17, 0.8)), dark);
    b.add(boxGeo(V(-0.1, 2.17, -0.9), V(1.2, 2.25, 0.9)), green);
    for (const s of [-1, 1]) { b.add(boxGeo(V(-0.06, 0.75, s * 0.86 - 0.04), V(0.0, 2.17, s * 0.86 + 0.04)), dark); b.add(boxGeo(V(0.0, 0.75, s * 0.84 - 0.04), V(1.05, 1.3, s * 0.84 + 0.04)), green); }
    b.add(boxGeo(V(0.05, 0.75, -0.75), V(0.6, 1.1, 0.75)), lam("seatLeather", () => ({ color: "#5a3a26" })));
    b.add(new THREE.TorusGeometry(0.18, 0.025, 6, 16).rotateY(Math.PI / 2).rotateZ(0.5).translate(0.85, 1.5, 0.35), dark); // wheel
    // the bed: floor and rails
    b.add(boxGeo(V(-2.65, 0.75, -0.95), V(-0.05, 0.9, 0.95), 1), bed);
    for (const s of [-1, 1]) b.add(boxGeo(V(-2.65, 0.9, s * 0.92 - 0.04), V(-0.05, 1.3, s * 0.92 + 0.04), 1), bed);
    b.add(boxGeo(V(-2.69, 0.9, -0.95), V(-2.61, 1.3, 0.95), 1), bed);
    b.add(boxGeo(V(-1.1, 0.9, -0.06), V(-0.98, 1.75, 0.06)), dark); // pintle post
    b.build(this.truck);
    for (const [x, s] of [[1.75, -1], [1.75, 1], [-1.7, -1], [-1.7, 1]] as const) {
      const w = new THREE.Group(), wb = new Batch();
      wb.add(new THREE.CylinderGeometry(0.45, 0.45, 0.24, 20).rotateX(Math.PI / 2), lam("tyre", () => ({ color: "#26241f" })));
      wb.add(new THREE.CylinderGeometry(0.26, 0.26, 0.26, 16).rotateX(Math.PI / 2), green);
      for (let k = 0; k < 5; k++) wb.add(boxGeo(V(-0.03, 0.05, -0.135), V(0.03, 0.24, -0.13)).rotateZ((k / 5) * 6.28), chrome);
      wb.build(w); w.position.set(x, 0.45, s * 0.9); this.wheels.push(w); this.truck.add(w);
    }
    this.truck.visible = false; this.outside.add(this.truck);
  }

  /** a Lewis gun: finned barrel shroud, the flat pan magazine on top, wooden butt, bipod; muzzle at +x */
  private lewis(): GunRig {
    const g = new THREE.Group(), pitch = new THREE.Group(), b = new Batch();
    const steel = lam("gunSteel", () => ({ color: "#4a4f48" })), pan = lam("gunPan", () => ({ color: "#3e3e3a" })), wood = lam("gunWood", () => ({ color: "#8a5a34" }));
    b.add(new THREE.CylinderGeometry(0.075, 0.075, 0.78, 16).rotateZ(Math.PI / 2).translate(0.28, 0, 0), steel);
    for (let k = 0; k < 6; k++) b.add(new THREE.TorusGeometry(0.078, 0.008, 4, 16).rotateY(Math.PI / 2).translate(0.0 + k * 0.11, 0, 0), pan);
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8).rotateZ(Math.PI / 2).translate(0.82, 0, 0), steel);
    b.add(new THREE.CylinderGeometry(0.045, 0.06, 0.06, 10).rotateZ(Math.PI / 2).translate(0.98, 0, 0), steel);
    b.add(boxGeo(V(-0.36, -0.07, -0.055), V(-0.08, 0.075, 0.055)), steel);
    b.add(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 28).translate(-0.2, 0.12, 0), pan);
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12).translate(-0.2, 0.14, 0), steel);
    b.add(boxGeo(V(-0.86, -0.15, -0.04), V(-0.36, 0.02, 0.04)), wood);
    b.add(boxGeo(V(-0.4, -0.2, -0.03), V(-0.32, -0.04, 0.03)), wood);
    for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.015, 0.015, 0.62, 6).translate(0, -0.31, 0).rotateX(s * 0.38).translate(0.55, 0, 0), steel);
    b.build(pitch);
    g.add(pitch);
    return { g, pitch };
  }
  private buildGuns() {
    const place = (x: number, y: number, z: number, yaw: number) => { const r = this.lewis(); r.g.position.set(x, y, z); r.g.rotation.y = yaw; this.outside.add(r.g); this.guns.push(r); return r; };
    place(GUN1[0], 0.58, GUN1[2], -2.84); // 0: the hook's gun, aimed screen-left at the emus (-x)
    place(NEST[0], 0.55, NEST[2], 2.0); // 1: the ambush gun, aimed at the dam
    place(LINE[0] + 5.9, 0.58, LINE[2] + 0.4, 0.4); // 2, 3: the line-up's two guns
    place(LINE[0] + 6.95, 0.58, LINE[2] + 0.5, -0.3);
    this.truckGun = this.lewis(); this.truckGun.g.position.set(-1.04, 1.85, 0); this.truck.add(this.truckGun.g);
  }

  // ---------------- the marbles set ----------------
  private buildMarbles() {
    const G = this.marbSet, b = new Batch();
    b.add(boxGeo(V(-6, -0.2, -6), V(6, 0, 6), 2), lam("floorBoards", () => ({ map: rep(planksHD(), 2, 2) })));
    b.add(boxGeo(V(-6, 0, -3.2), V(6, 3, -3.0), 3), lam("roomWall", () => ({ map: rep(boardsTex("sage", "#a9c2a0"), 1, 1) })));
    b.add(boxGeo(V(-6, 0, -3.0), V(6, 0.18, -2.92)), lam("skirting", () => ({ color: "#6a4a30" })));
    // the jar on its side, open toward +x, and its lid
    const glass = lam("jarGlass", () => ({ color: "#bfe0e4", side: THREE.DoubleSide }));
    b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.85, 24, 1, true).rotateZ(Math.PI / 2).translate(-0.95, 0.32, -0.55), glass);
    b.add(new THREE.CircleGeometry(0.32, 24).rotateY(Math.PI / 2).translate(-1.375, 0.32, -0.55), glass);
    b.add(new THREE.TorusGeometry(0.33, 0.03, 6, 24).rotateY(Math.PI / 2).translate(-0.53, 0.32, -0.55), glass);
    b.add(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 24).translate(-1.4, 0.04, 0.35), lam("lidRed", () => ({ color: "#c8423a" })));
    // a toy truck and blocks for scale and depth
    const blk = ["#e8b84a", "#3a6ab0", "#c8423a"].map((c, i) => lam("toyBlock" + i, () => ({ color: c })));
    for (let i = 0; i < 6; i++) b.add(new THREE.BoxGeometry(0.28, 0.28, 0.28).translate(1.6 + (i % 3) * 0.3, 0.14 + Math.floor(i / 3) * 0.28, -1.6), blk[i % 3]);
    b.build(G);
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), lam("marble" + (i % 6), () => ({ map: marbleTex(i % 6) })));
      m.castShadow = true; m.receiveShadow = true; this.marbles.push(m); G.add(m);
    }
    G.position.set(...MARB); G.visible = false;
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, Lp: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.az ?? Lp.az), el = THREE.MathUtils.degToRad(Lp.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], Lp = P[s.light], K = LK[s.light], t = f / FPS;
    const set = id === 18 ? "marbles" : "out";
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 2000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, Lp);
    this.hemi.color.set(Lp.sky); this.hemi.groundColor.set(Lp.ground); this.hemi.intensity = Lp.hemiI;
    this.sun.color.set(Lp.sunCol); this.sun.intensity = Lp.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.1 + 8, 12, 160) * (s.light === "golden" ? 1.25 : 1);
    this.sun.position.copy(focus).addScaledVector(sunDir, 320); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 760; sc.updateProjectionMatrix();
    this.sun.shadow.bias = Lp.bias; this.sun.shadow.normalBias = Lp.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...Lp.lit); TONE.uShadeCol.value.set(...Lp.shade); TONE.uShadeLift.value.set(...Lp.lift);
    TONE.uLambert.value = Lp.lambert; TONE.uSideK.value = Lp.sideK; TONE.uTerm.value = Lp.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...Lp.charTint); CHAR.uCharShade.value = Lp.charShade; CHAR.uGrad.value = Lp.charGrad;
    CHAR.uBodyGrad.value = Lp.bodyGrad; CHAR.uSideTint.value.set(...Lp.sideTint);
    // ---- sky + fog ----
    const su = this.skyMat.uniforms;
    SKYCOL[s.light].forEach((h, i) => untone(h, su["c" + i].value));
    const e = SKYE[s.light].map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar;
    scene.fog = this.fog; scene.background = null;
    const cl = s.light === "golden" ? "golden" : "day";
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i]; m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[cl][i % 4];
    }
    this.outside.visible = set === "out"; this.marbSet.visible = set === "marbles"; this.sky.visible = set === "out";
    const tint = s.light === "golden" ? [1.3, 0.86, 0.5] : [1.12, 1.06, 0.92];
    for (const m of this.tuftMats) m.color.setRGB(tint[0], tint[1], tint[2]);
    if (s.light === "golden") this.water.color.setRGB(2.0, 1.45, 1.05); else this.water.color.setRGB(1.25, 1.45, 1.7);
    // ---- moving props ----
    this.wheel.rotation.z = -t * 2.6;
    this.embers.forEach((m, i) => m.scale.set(1, 0.85 + 0.2 * Math.sin(t * 11 + i) + 0.1 * Math.sin(t * 23), 1));
    const truckOn = id === 12 || id === 13 || id === 14 || id === 22;
    this.truck.visible = truckOn;
    if (truckOn) {
      const T0 = truckAt(id, f);
      this.truck.position.set(T0.x, T0.bounce, T0.z); this.truck.rotation.set(0, T0.yaw, T0.bounce * 0.25 * Math.sin(t * 9));
      this.wheels.forEach((w) => { w.rotation.z = -(T0.x * (T0.yaw ? -1 : 1)) / 0.45; });
      const gunIn = id === 12 ? popIn(at(f, 750, 10)) : 1;
      this.truckGun.g.scale.setScalar(Math.max(0.001, gunIn));
      this.truckGun.g.rotation.y = id === 14 && f > 896 ? 0.5 * Math.sin(t * 7) : id === 22 ? Math.PI : 0.15;
      this.truckGun.pitch.rotation.z = id === 14 && f > 896 ? 0.45 + 0.35 * Math.sin(t * 11) : 0.05;
    }
    this.guns[0].g.visible = id === 1 || id === 2;
    this.guns[0].pitch.rotation.z = id === 2 && f > 110 ? 0.02 * Math.sin(t * 60) : 0;
    this.guns[1].g.visible = id === 10 || id === 11;
    this.guns[1].pitch.rotation.z = id === 11 && f > 713 ? -0.12 : 0.03;
    [2, 3].forEach((k, j) => { const g = this.guns[k].g, sc2 = id === 7 ? popIn(at(f, [499, 505][j], 9)) : 0; g.visible = sc2 > 0.001; g.scale.setScalar(Math.max(0.001, sc2)); });
    this.crates.forEach((m, i) => { const sc2 = id === 7 ? popIn(at(f, 526 + i * 3.4, 8)) : 0; m.visible = sc2 > 0.001; m.scale.setScalar(Math.max(0.001, sc2)); });
    this.pile.visible = id === 19;
    if (id === 19) { const k = 0.32 + 0.68 * popIn(at(f, 1391, 12)); this.pile.scale.set(k, k * (0.9 + 0.1 * k), k); }
    this.bullets.forEach((g, k) => { const sc2 = id === 20 ? popIn(at(f, 1540 + k * 3.2, 7)) : 0; g.visible = sc2 > 0.001; g.scale.setScalar(Math.max(0.001, sc2)); });
    if (id === 18) this.posMarbles(f);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx) / (Math.PI / 4)) * (Math.PI / 4);
    type Pl = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number; scale: number };
    const places: Pl[] = [];
    const fxs: FxP[] = [];
    const cast = castFor(id, f);
    const blobCol = set === "out" ? (s.light === "golden" ? "#a89ab8" : "#9aa0c0") : "#7a6a6a";
    cast.who.forEach((w) => {
      const d = cam.position.distanceTo(this.v.set(w.x, w.y + 1.2, w.z));
      const [cw, ch, k] = tier(d);
      const fo: FrontOpts = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: w.mode ?? "stand", blink: lidAt(f, w.seed), light: light2, seed: w.seed,
        wave: w.wave, prop: w.prop ?? null, look: w.look ?? 0, pose: w.pose, facing: w.facing ?? 0, tilt: w.tilt ? q(w.tilt, 2) : 0, ...(w.talk ? { talk: w.talk } : {}) };
      const breath = (w.mode ?? "stand") === "stand" || w.mode === "sit" ? 0.012 * Math.sin((2 * Math.PI * t) / (3.1 + 0.5 * h01(w.seed, 3)) + w.seed) : 0;
      places.push({ key: `F|${JSON.stringify(w.o)}|${JSON.stringify(fo)}|${cw}`, draw: (p) => bodyFront(p, w.o, fo), x: w.x, y: w.y, z: w.z, size: [cw, ch, k], breath, scale: w.scale ?? 1 });
      if (!w.noBlob && (w.scale ?? 1) > 0.5) fxs.push({ key: `blob|contact|${blobCol}`, cw: 128, ch: 128, draw: (p) => fxContact(p, blobCol), x: w.x, y: groundY(w.x, w.z) + 0.025, z: w.z, w: 0.75, h: 0.55, flat: true });
    });
    cast.birds.forEach((bd) => {
      const d = cam.position.distanceTo(this.v.set(bd.x, bd.y + 1.0, bd.z));
      if (d > 420) return;
      const [cw, ch, k] = tier(d);
      const sp = Math.hypot(bd.vx ?? 0, bd.vz ?? 0), vr = (bd.vx ?? 0) * right.x + (bd.vz ?? 0) * right.z;
      const dir: 1 | -1 = bd.b.dir ?? (sp > 0.05 ? (vr >= 0 ? 1 : -1) : h01(bd.seed, 9) < 0.5 ? 1 : -1);
      const steps = d > 45 ? 8 : 16;
      const eo: EmuOpts = { ...bd.b, dir, light: light2, phase: q(((bd.b.phase ?? 0) % 1 + 1) % 1, steps), blink: bd.b.blink ?? (d < 16 ? lidAt(f, bd.seed) : 0) };
      if (bd.roo) places.push({ key: `R|${light2}|${cw}`, draw: (p) => roo(p, { light: light2, blink: lidAt(f, 77), expr: "smug" }), x: bd.x, y: bd.y, z: bd.z, size: [cw, ch, k], breath: 0.01 * Math.sin(t * 2), scale: bd.scale ?? 1 });
      else {
        const breath = eo.mode === "stand" || eo.mode === "front" ? 0.012 * Math.sin((2 * Math.PI * t) / (2.6 + 0.5 * h01(bd.seed, 3)) + bd.seed) : 0;
        places.push({ key: `E|${JSON.stringify(eo)}|${cw}`, draw: (p) => emuCard(p, eo), x: bd.x, y: bd.y, z: bd.z, size: [cw, ch, k], breath, scale: bd.scale ?? 1 });
      }
      if (!bd.noBlob && d < 120) fxs.push({ key: `blob|contact|${blobCol}`, cw: 128, ch: 128, draw: (p) => fxContact(p, blobCol), x: bd.x, y: bd.y + 0.025, z: bd.z, w: 1.0, h: 0.6, flat: true });
      if (bd.dust && d < 40) { const u = q(((t * 3.4 + h01(bd.seed, 5)) % 1), 12); fxs.push({ key: `dust${u}`, cw: 300, ch: 300, draw: (p) => fxDust(p, u), x: bd.x - (bd.vx ?? 0) * 0.06, y: bd.y + 0.35, z: bd.z - (bd.vz ?? 0) * 0.06, w: 1.4 + u, h: 1.4 + u, soft: true }); }
    });
    const puff = (f0: number, x: number, y: number, z: number, size: number, n = 26) => {
      const u = (f - f0) / n;
      if (u < 0 || u > 1) return;
      const qq = q(u, n);
      fxs.push({ key: `puff${qq}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, qq), x, y, z, w: size, h: size, soft: true });
    };
    const spark = (f0: number, x: number, y: number, z: number, size: number, col = "#fff3b0") => {
      const u = (f - f0) / 10;
      if (u < 0 || u > 1) return;
      const qq = q(u, 10);
      fxs.push({ key: `spark${qq}${col}`, cw: 500, ch: 500, draw: (p) => { p.ol = 5; fxSpark(p, qq, col); }, x, y, z, w: size, h: size });
    };
    const muzzle = (g: THREE.Object3D, f0: number, size = 0.7) => {
      const u = (f - f0) / 4;
      if (u < 0 || u > 1) return;
      const m = g.localToWorld(this.v.set(1.08, 0, 0).clone());
      const qq = q(u, 4);
      fxs.push({ key: `flash${qq}`, cw: 300, ch: 300, draw: (p) => fxFlash(p, qq), x: m.x, y: m.y, z: m.z, w: size, h: size });
    };
    this.root.updateMatrixWorld(true);
    if (id === 2) [111, 115, 119, 123, 127, 131].forEach((f0) => muzzle(this.guns[0].pitch, f0, 0.9));
    if (id === 3) spark(148, EMU3[0] + 0.5, 2.3, EMU3[2] + 0.4, 0.9);
    if (id === 7) { [445, 467, 473].forEach((f0, k) => spark(f0, LINE[0] + [0, 1.55, 3.0][k], 1.0, LINE[2] + 0.4, 1.6)); [499, 505].forEach((f0, k) => spark(f0, LINE[0] + [5.9, 6.95][k], 0.6, LINE[2] + 0.6, 1.2)); for (let i = 0; i < 6; i++) spark(526 + i * 3.4, LINE[0] + 8.5, 0.5 + 0.2 * i, LINE[2] + 0.6, 0.9, "#ffe066"); }
    if (id === 11 && f >= 713) { const u = q(at(f, 713, 21), 21); fxs.push({ key: `jam${u}`, cw: 300, ch: 300, draw: (p) => fxJam(p, u), x: NEST[0] - 0.2, y: 1.15, z: NEST[2] + 0.2, w: 0.9, h: 0.9 }); }
    if (id === 12) spark(752, truckAt(12, f).x - 1.04, 2.1, ROAD_Z + 0.3, 1.4);
    if (id === 13 || id === 14) {
      const T0 = truckAt(id, f);
      for (let k = 0; k < 4; k++) { const ph = q(((t * 2.2 + k * 0.25) % 1), 16); fxs.push({ key: `dust${ph}`, cw: 300, ch: 300, draw: (p) => fxDust(p, ph), x: T0.x - 3.2 - 5 * ph, y: 0.5 + 0.6 * ph, z: T0.z + (k % 2 ? -0.6 : 0.6), w: 2.2 + 2.6 * ph, h: 2.2 + 2.6 * ph, soft: true }); }
      if (id === 14 && f > 905) [910, 916, 925, 931, 940].forEach((f0) => muzzle(this.truckGun.pitch, f0, 0.8));
    }
    if (id === 16 || (id === 17 && f < 1194)) {
      const k = id === 16 ? popIn(at(f, 1108, 10)) : 1 - at(f, 1157, 10);
      if (k > 0.01) { const kk = q(k, 20); fxs.push({ key: `target${kk}`, cw: 512, ch: 512, draw: (p) => fxTarget(p, kk), x: STUB[0], y: 0.04, z: STUB[2], w: 13, h: 13, flat: true }); }
      if (id === 17) for (let i = 0; i < 6; i++) puff(1157 + i, STUB[0] + 3 * Math.cos(i), 0.5, STUB[2] + 3 * Math.sin(i), 4, 22);
    }
    if (id === 17 && f >= 1194) { const R0 = RUN17(f), ph = q((t * 6) % 1, 4); fxs.push({ key: `speed${ph}`, cw: 600, ch: 300, draw: (p) => fxSpeed(p, ph), x: R0[0] - 2.6, y: 1.1, z: R0[2] + 0.4, w: 3.2, h: 1.6, soft: true }); }
    if (id === 18) {
      const y = 2.9 - 2.55 * easeOut(at(f, 1290, 30)), close = q(at(f, 1324, 9), 9);
      fxs.push({ key: `hand${close}`, cw: 400, ch: 400, draw: (p) => fxHand(p, close), x: MARB[0] + 0.55, y, z: MARB[2] - 0.15, w: 1.5, h: 1.5, flat: true });
    }
    if (id === 19) {
      for (let i = 0; i < 3; i++) { const u = (t * 0.45 + i * 0.33) % 1, qq = q(u, 20); fxs.push({ key: `puff${qq}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, qq), x: CAMP[0] + 3 + 0.4 * u, y: 1.3 + 2.6 * u, z: CAMP[2] + 1, w: 1.4 + u, h: 1.4 + u, soft: true }); }
      for (let i = 0; i < 2; i++) { const ph = q((t * 2 + i * 0.5) % 1, 12); fxs.push({ key: `flame${ph}`, cw: 200, ch: 300, draw: (p) => fxFlame(p, ph), x: CAMP[0] + 3 + (i - 0.5) * 0.3, y: 0.55, z: CAMP[2] + 1 + 0.1 * i, w: 0.75, h: 1.1 }); }
      if (f >= 1391) for (let i = 0; i < 5; i++) spark(1391 + i * 2, PILE[0] + Math.cos(i * 1.7) * 0.9, 0.9, PILE[2] + Math.sin(i * 1.7) * 0.9 + 0.3, 1.0, "#ffd166");
    }
    if (id === 20) for (let k = 0; k < 10; k++) spark(1540 + k * 3.2, BIRD20[0] - 2.0 + k * 0.145, 0.45, BIRD20[2] + 0.5, 0.5, "#ffe066");
    if (id === 22) { const T0 = truckAt(22, f); [1828, 1836, 1842].forEach((f0) => { if (f >= f0 && f < f0 + 20) fxs.push({ key: `bang${q(at(f, f0, 20), 20)}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, q(at(f, f0, 20), 20)), x: T0.x + 2.9, y: 0.6, z: T0.z - 0.5, w: 2.4, h: 2.4, soft: true }); }); }
    if (id === 23) spark(1960, MONU[0] + 1.25, 3.25, MONU[2] + 0.5, 0.9);
    // ---- bind cards ----
    this.frustumC.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of places) {
      if (p.scale < 0.002 || !this.frustumC.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      a.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set((1 - 0.4 * p.breath) * p.scale, (1 + p.breath) * p.scale, p.scale);
      a.mesh.castShadow = Lp.actorShadow && set === "out";
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of fxs) {
      if (!this.frustumC.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft); e2.mesh.visible = true; e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, 0);
      else if (p.yaw !== undefined) e2.mesh.rotation.set(0, p.yaw, 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); if (p.rot) e2.mesh.rotateZ(p.rot); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }

  /** marbles roll out of the jar mouth in a fan, decelerating; the hand lands where they were */
  private posMarbles(f: number) {
    this.marbles.forEach((m, i) => {
      const f0 = 1279 + (i % 10) * 0.8 + Math.floor(i / 10) * 1.5, u = Math.max(0, (f - f0) / FPS);
      const a = (-80 + 160 * h01(i, 1)) * (Math.PI / 180), v = 0.9 + 1.9 * h01(i, 2), k = 1.5, d = (v / k) * (1 - Math.exp(-k * u));
      const flee = Math.max(0, (f - 1306) / FPS) * 0.9 * h01(i, 3), x = -0.5 + Math.cos(a) * (d + flee) + 0.05 * (i % 3), z = -0.55 + Math.sin(a) * (d + flee) * 0.9 + 0.05 * ((i >> 2) % 3);
      const inJar = u <= 0;
      m.position.set(inJar ? -0.9 + 0.12 * (i % 5) : x, inJar ? 0.1 + 0.1 * ((i >> 3) % 3) : 0.075 + 0.03 * Math.abs(Math.sin(u * 14)) * Math.exp(-u * 3), inJar ? -0.55 + 0.1 * ((i % 4) - 1.5) : z);
      m.rotation.set(0, -a, -(d + flee) / 0.075);
    });
  }
}
