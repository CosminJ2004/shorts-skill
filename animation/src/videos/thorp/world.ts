// Every place of "The Shoe Computer" (all built from the cartoon-3d-short skill's look modules; geometry, staging and
// gags are ours):
// - the casino floor: red carpet, teal panels, a roulette table, slot machines, a chandelier of bulbs;
// - Shannon's basement lab: breeze-block walls, a workbench, a chalkboard, a stool;
// - the colour cyclorama for the gag beats (bars, the secret, markets, chips);
// - the Las Vegas street at night; the MIT museum gallery with the display case; a 2026 trading desk.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { rep, planksHD, stoneHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxContact, fxBurst, fxStars, Outfit, Expr, FrontOpts } from "../bridge/toon";
import { fxSpark, fxSmoke } from "../castle/paintc";
import { fxWatch } from "../houdini/painth";
import {
  FPS, SHOTS, LS, LE, wf, L, CAS, LAB, STU, STRIP, MUS, DESK, RTAB, BENCH, BOARD, CASE,
  Light, ShotDef, V3, camAt, popIn, at, smooth, easeOut, easeIn, add,
} from "./story";
import { THORP, SHANNON, CROUPIER, GUARD, ROLLER, KID, QUANT, QUANT2, folk } from "./people";
import {
  carpetTex, casinoWallTex, feltTex, labWallTex, slateTex, museumTex, vegasTex, fxShoe, fxWheel, fxChips, fxBars, fxScreen,
  fxSmartwatch, fxPhoneWaves, fxApple, fxJet, fxCalendar, fxRosette, fxChalk, fxBox, fxSweat, fxNote, fxNeon,
} from "./painth";

// ---------------- light presets (the doomsday/houdini fits) ----------------
const P: Record<Light, LightPreset> = {
  inside: {
    ...LIGHTS.golden, az: 140, el: 40, lit: [1.62, 1.32, 1.02], shade: [0.34, 0.3, 0.46], lift: [0.08, 0.07, 0.12], term: 0.3,
    charTint: [1.0, 0.9, 0.78], fog: "#2a2a3a", fogNear: 14, fogFar: 90, actorShadow: true,
  },
  candle: {
    ...LIGHTS.golden, az: 150, el: 34, lit: [1.5, 1.08, 0.74], shade: [0.26, 0.2, 0.38], lift: [0.07, 0.05, 0.12], term: 0.3,
    charTint: [1.0, 0.86, 0.72], fog: "#1c1424", fogNear: 10, fogFar: 60, actorShadow: true,
  },
  stage: {
    ...LIGHTS.day, az: 150, el: 38, lit: [1.58, 1.46, 1.3], shade: [0.4, 0.36, 0.5], lift: [0.08, 0.07, 0.12], term: 0.25,
    charTint: [1.0, 0.96, 0.9], fog: "#000000", fogNear: 200, fogFar: 900, actorShadow: true,
  },
  night: {
    ...LIGHTS.golden, az: 135, el: 30, lit: [1.05, 1.08, 1.4], shade: [0.2, 0.22, 0.4], lift: [0.05, 0.06, 0.15], term: 0.3,
    charTint: [0.9, 0.93, 1.06], fog: "#141c34", fogNear: 30, fogFar: 160, actorShadow: true, sunCol: "#c8d4ff",
  },
};
const LK: Record<Light, WorldLook> = { inside: { ...LOOK.golden, sat: 0.97 }, candle: { ...LOOK.golden, sat: 0.98 }, stage: { ...LOOK.day, sat: 1.0 }, night: { ...LOOK.golden, sat: 0.95 } };
/** cyclorama colour per studio shot */
const CYC: Record<number, string> = { 7: "#2ab0b8", 10: "#5a2a7a", 12: "#3a6ad0", 13: "#e8a83a" };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg).translate(0, h / 2, 0);

// ---------------- the cast ----------------
type Who = { o: Outfit; seed: number; x: number; y: number; z: number; expr: Expr; mode?: FrontOpts["mode"]; phase?: number; wave?: number;
  prop?: FrontOpts["prop"]; look?: number; pose?: FrontOpts["pose"]; facing?: -1 | 0 | 1; tilt?: number; noBlob?: boolean; talk?: number;
  scale?: number; sx?: number; roll?: number };
type FxP = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number; yaw?: number };
const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4]);
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * h01(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = Math.floor(f - s); if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h01(i * 31 + n, 13)); }
  return 0;
};
const SUN: Outfit = { ...THORP, glasses: "#111114" };
const SUN2: Outfit = { ...SHANNON, glasses: "#111114" };

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS, out: Who[] = [];
  const P3 = (o: Outfit, seed: number, p: V3, expr: Expr, extra: Partial<Who> = {}) => out.push({ o, seed, x: p[0], y: p[1], z: p[2], expr, ...extra });
  switch (id) {
    case 1: { // the hook: two geniuses at the roulette table, glancing down at their shoes
      const sh = f >= wf(0, 9) - L - 6, win = f >= wf(0, -1) - L;
      P3(CROUPIER, 31, add(RTAB, [0, 0, -0.85]), win ? "shock" : "smile_closed", { scale: 1, facing: 0 });
      P3(THORP, 1, add(CAS, [-0.45, 0, 0.55]), win ? "grin" : "smug", { look: sh ? -0.3 : 0, tilt: 2 * Math.sin(t * 2), pose: win ? "fist" : undefined, facing: 1 });
      P3(SHANNON, 2, add(CAS, [0.45, 0, 0.55]), win ? "grin" : "smug", { look: sh ? 0.3 : 0, tilt: -2 * Math.sin(t * 2), facing: -1 });
      break;
    }
    case 2: { // Shannon explains; Thorp nods
      const th = f >= wf(1, 8) - L;
      P3(SHANNON, 2, add(LAB, [-0.4, 0, -0.55]), th ? "proud" : "smile", { pose: th ? "point" : "hips", facing: 1, talk: q(0.3 + 0.2 * Math.sin(t * 17), 4) });
      P3(THORP, 1, add(LAB, [0.5, 0, -0.45]), th ? "grin" : "smile", { facing: -1, tilt: 3 * Math.sin(t * 3) });
      break;
    }
    case 3: { // Thorp at the chalkboard; the apple bonks him on "problems"
      const hit = f >= wf(2, 14) - L;
      P3(THORP, 1, add(LAB, [-0.3, 0, -1.15]), hit ? "dazed" : f >= wf(2, 10) - L ? "smug" : "proud", { pose: hit ? undefined : "point", facing: -1, tilt: hit ? 8 * Math.sin((f - (wf(2, 14) - L)) * 0.8) * Math.exp(-(f - (wf(2, 14) - L)) / 14) : 0 });
      P3(SHANNON, 2, add(LAB, [0.55, 0, -0.7]), hit ? "laugh" : "smile", { facing: -1, scale: 0.98 });
      break;
    }
    case 4: { // both lean over the wheel
      P3(THORP, 1, add(CAS, [-0.5, 0, -0.1]), f >= wf(3, 17) - L ? "grin" : "smile", { look: 0.4, facing: 1, tilt: 4 });
      P3(SHANNON, 2, add(CAS, [0.5, 0, -0.1]), f >= wf(3, 17) - L ? "grin" : "smile", { look: -0.4, facing: -1, tilt: -4 });
      P3(CROUPIER, 31, add(RTAB, [0, 0, -0.95]), "smile_closed", {});
      break;
    }
    case 5: { // Thorp on a stool with his shoe off; Shannon behind him; the toe clicks
      const toes = f >= wf(4, 16) - L;
      P3(THORP, 1, add(LAB, [-0.5, 0.0, -0.3]), toes ? "grin" : "smile", { pose: "point", look: 0.5, facing: 1 });
      P3(SHANNON, 2, add(LAB, [0.55, 0, -0.5]), f >= wf(4, 3) - L ? "proud" : "smile", { pose: f >= wf(4, 3) - L ? "point" : undefined, facing: -1 });
      break;
    }
    case 6: { // the basement test: both cheer as the bar rises
      const up = f >= wf(5, 8) - L;
      P3(THORP, 1, add(LAB, [-0.5, 0, -0.4]), up ? "laugh" : "smile", { pose: up ? "fist" : undefined, facing: 1, tilt: up ? 4 * Math.sin(t * 9) : 0 });
      P3(SHANNON, 2, add(LAB, [0.5, 0, -0.4]), up ? "laugh" : "smile", { wave: up ? 1 : undefined, facing: -1, tilt: up ? -4 * Math.sin(t * 9) : 0 });
      break;
    }
    case 7: { // the high roller sobs at the tiny bar
      const five = f >= wf(6, 7) - L;
      P3(ROLLER, 5, add(STU, [0.55, 0, 0.55]), five ? "queasy" : f >= wf(6, 4) - L ? "nervous" : "smug", { tilt: five ? 5 * Math.sin(t * 11) : 0, facing: -1, look: -0.5 });
      break;
    }
    case 8: { // Las Vegas: they stroll in sunglasses
      const u = at(f, LS[7] + 8, LE[7] - LS[7] - 8);
      const x = -0.85 + 0.9 * smooth(u);
      P3(SUN, 1, add(STRIP, [x - 0.1, 0, 0.1]), "smug", { mode: "stroll", phase: t * 1.5, facing: 1 });
      P3(SUN2, 2, add(STRIP, [x + 0.62, 0, 0.25]), "smug", { mode: "stroll", phase: t * 1.5 + 0.3, facing: 1 });
      break;
    }
    case 9: { // nerves, the guard looms, they bolt
      const nerv = f >= wf(8, 7) - L, quit = f >= wf(8, 13) - L, run = at(f, wf(8, 13) - L, 14);
      P3(CROUPIER, 31, add(RTAB, [0, 0, -0.9]), nerv ? "sneer" : "smile_closed", {});
      if (run < 1) {
        P3(THORP, 1, add(CAS, [-0.5 - 3.4 * easeIn(run), 0, 0.3]), quit ? "scared" : nerv ? "nervous" : "grin", { mode: quit ? "stroll" : "stand", phase: t * 3, facing: quit ? -1 : 1, tilt: nerv && !quit ? 3 * Math.sin(t * 14) : 0 });
        P3(SHANNON, 2, add(CAS, [0.5 + 3.4 * easeIn(run), 0, 0.3]), quit ? "scared" : nerv ? "nervous" : "grin", { mode: quit ? "stroll" : "stand", phase: t * 3 + 1, facing: quit ? 1 : -1, tilt: nerv && !quit ? -3 * Math.sin(t * 14) : 0 });
      }
      if (f >= wf(8, 9) - L) P3(GUARD, 33, add(CAS, [1.15, 0, -0.35]), "stern", { scale: popIn(at(f, wf(8, 9) - L, 8)), pose: "cross", facing: -1 });
      break;
    }
    case 10: { // the secret, five years, the record
      const rec = f >= wf(9, 7) - L;
      P3(THORP, 1, add(STU, [-0.35, 0, 0.15]), rec ? "proud" : "smug", { pose: rec ? "hips" : "cross", facing: 0, look: rec ? 0.6 : 0 });
      break;
    }
    case 11: { // the museum: a kid points at the shoe
      const w = f >= wf(10, 10) - L;
      P3(KID, 61, add(MUS, [-0.62, 0, 0.55]), w ? "laugh" : "proud", { pose: "point", facing: 1, scale: 0.78, look: 0.5 });
      break;
    }
    case 12: { // Thorp tosses the wheel away and points at the market screen
      const toss = f >= wf(11, 9) - L, mk = f >= wf(11, -1) - L;
      P3(THORP, 1, add(STU, [-0.5, 0, 0.3]), mk ? "proud" : toss ? "smug" : "stern", { pose: mk ? "point" : toss ? "fist" : "hips", facing: 1 });
      break;
    }
    case 13: { // small stacks (Thorp) vs a wobbly tower (the roller)
      const wipe = f >= wf(12, 15) - L;
      P3(THORP, 1, add(STU, [-0.7, 0, 0.1]), wipe ? "smug" : "smile_closed", { pose: "cross", facing: 1 });
      P3(ROLLER, 5, add(STU, [0.7, 0, 0.1]), wipe ? "shock" : f >= wf(12, 9) - L ? "nervous" : "grin", { facing: -1, tilt: wipe ? 0 : 2 * Math.sin(t * 6) });
      break;
    }
    case 14: { // the 2026 trading desk
      const pm = f >= wf(13, 8) - L;
      P3(QUANT, 71, add(DESK, [-0.75, 0, -0.55]), pm ? "grin" : "smug", { look: 0.5, facing: 1 });
      P3(QUANT2, 72, add(DESK, [0.05, 0, -0.45]), pm ? "laugh" : "smile", { facing: 0 });
      P3(folk(5, true), 73, add(DESK, [0.8, 0, -0.6]), pm ? "grin" : "smug", { look: -0.5, facing: -1 });
      break;
    }
    case 15: { // the high roller smirks: it's all luck
      const sh = f >= wf(14, 9) - L;
      P3(CROUPIER, 31, add(RTAB, [0, 0, -0.9]), "smile_closed", {});
      P3(ROLLER, 5, add(CAS, [0, 0, 0.4]), sh ? "nervous" : f >= wf(14, 5) - L ? "smug" : "grin", { pose: "cross", facing: 0, tilt: sh ? 3 * Math.sin(t * 12) : 0 });
      break;
    }
    default: break;
  }
  return out;
};

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private fog = new THREE.Fog("#1c1424", 10, 60);
  private sunCache = new Map<number, THREE.Vector3>();
  private sets: Record<string, THREE.Group> = { casino: new THREE.Group(), lab: new THREE.Group(), studio: new THREE.Group(), strip: new THREE.Group(), museum: new THREE.Group(), desk: new THREE.Group() };
  private cycMat!: THREE.MeshLambertMaterial;
  private stool = new THREE.Group(); private crate = new THREE.Group();
  private frustumC = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    Object.values(this.sets).forEach((g) => { g.visible = false; R.add(g); });
    this.buildCasino(); this.buildLab(); this.buildStudio(); this.buildStrip(); this.buildMuseum(); this.buildDesk();
  }

  /** a room shell: floor, back wall and side walls, with skirting */
  private shell(b: Batch, c: V3, w: number, d: number, h: number, wall: THREE.Material, floor: THREE.Material, back = -2.9, skirt = "#3a2420") {
    const [x, , z] = c;
    b.add(boxGeo(V(x - w / 2, -0.2, z + back - 0.1), V(x + w / 2, 0, z + d), 2), floor);
    b.add(boxGeo(V(x - w / 2, 0, z + back - 0.2), V(x + w / 2, h, z + back), 3), wall);
    b.add(boxGeo(V(x - w / 2 - 0.2, 0, z + back), V(x - w / 2, h, z + d), 3), wall);
    b.add(boxGeo(V(x + w / 2, 0, z + back), V(x + w / 2 + 0.2, h, z + d), 3), wall);
    b.add(boxGeo(V(x - w / 2, 0, z + back), V(x + w / 2, 0.14, z + back + 0.06)), lam("skirt" + skirt, () => ({ color: skirt })));
  }
  private bulbs(G: THREE.Group, pts: V3[], col: [number, number, number] = [2.8, 2.3, 1.4], r = 0.07) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...col) });
    for (const p of pts) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); s.position.set(...p); s.layers.set(NOINK); G.add(s); }
  }

  // ---------------- the casino floor ----------------
  private buildCasino() {
    const b = new Batch(), G = this.sets.casino, [x, , z] = CAS, [tx, , tz] = RTAB;
    this.shell(b, CAS, 10, 8, 3.8, lam("casinoWallM", () => ({ map: rep(casinoWallTex(), 3, 1.2) })), lam("casinoCarpetM", () => ({ map: rep(carpetTex(), 4, 3) })), -3.4, "#2a1a14");
    // the roulette table: a green felt top on a dark wooden base, with a polished rail
    b.add(boxGeo(V(tx - 1.35, 0, tz - 0.62), V(tx + 1.35, 0.7, tz + 0.62)), lam("tableBase", () => ({ color: "#3a1a14" })));
    b.add(boxGeo(V(tx - 1.4, 0.7, tz - 0.67), V(tx + 1.4, 0.78, tz + 0.67)), lam("tableRail", () => ({ color: "#7a4a24" })));
    b.add(boxGeo(V(tx - 1.3, 0.78, tz - 0.57), V(tx + 1.3, 0.79, tz + 0.57)), lam("tableFelt", () => ({ map: rep(feltTex(), 3, 1.5) })));
    // slot machines along the back wall and the sides
    const body = lam("slotBody", () => ({ color: "#b8283a" })), trim = lam("slotTrim", () => ({ color: "#e8c45a" }));
    for (const sx of [-3.9, -3.0, 3.0, 3.9]) {
      b.add(boxGeo(V(x + sx - 0.3, 0, z - 3.0), V(x + sx + 0.3, 1.5, z - 2.5)), body);
      b.add(boxGeo(V(x + sx - 0.34, 1.35, z - 3.0), V(x + sx + 0.34, 1.55, z - 2.45)), trim);
    }
    // pillars with gold bands
    for (const sx of [-4.4, 4.4]) { b.add(boxGeo(V(x + sx - 0.3, 0, z - 3.2), V(x + sx + 0.3, 3.8, z - 2.6)), lam("pillar", () => ({ color: "#2a4a54" }))); b.add(boxGeo(V(x + sx - 0.34, 1.0, z - 3.24), V(x + sx + 0.34, 1.12, z - 2.56)), trim); }
    b.build(G);
    const screens = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.2, 1.6) });
    for (const sx of [-3.9, -3.0, 3.0, 3.9]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), screens); s.position.set(x + sx, 1.1, z - 2.48); s.layers.set(NOINK); G.add(s); }
    // chandelier bulbs hanging over the table (bokeh against the dark)
    const pts: V3[] = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; pts.push([tx + 1.3 * Math.cos(a), 3.1, tz + 1.3 * Math.sin(a) - 0.6]); }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pts.push([tx + 0.6 * Math.cos(a), 3.3, tz + 0.6 * Math.sin(a) - 0.6]); }
    this.bulbs(G, pts);
    this.bulbs(G, [-4, -2, 0, 2, 4].map((k) => [x + k, 3.45, z - 3.3] as V3), [2.6, 1.6, 0.9]);
  }

  // ---------------- Shannon's basement lab ----------------
  private buildLab() {
    const b = new Batch(), G = this.sets.lab, [x, , z] = LAB, [bx, , bz] = BENCH, [kx, , kz] = BOARD;
    this.shell(b, LAB, 9, 7, 3.2, lam("labWallM", () => ({ map: rep(labWallTex(), 3, 1.2) })), lam("labFloor", () => ({ map: rep(stoneHD("labFloorT", ["#9a9a98", "#8a8a88", "#a6a6a2"], "#5a5a58"), 3, 3) })), -2.9, "#3a4a40");
    const wood = lam("benchWood", () => ({ color: "#8a5a34" })), dark = lam("benchDark", () => ({ color: "#4a3426" }));
    b.add(boxGeo(V(bx - 1.1, 0.84, bz - 0.4), V(bx + 1.1, 0.9, bz + 0.4)), wood);
    for (const sx of [-1, 1]) b.add(boxGeo(V(bx + sx * 1.0 - 0.06, 0, bz - 0.34), V(bx + sx * 1.0 + 0.06, 0.84, bz + 0.34)), dark);
    b.add(boxGeo(V(bx - 1.0, 0.3, bz - 0.36), V(bx + 1.0, 0.36, bz + 0.34)), dark);
    // a chalkboard: slate with a wooden frame
    b.add(boxGeo(V(kx - 0.95, 0.95, kz - 0.05), V(kx + 0.95, 2.55, kz + 0.0)), lam("slateFrame", () => ({ color: "#6a4026" })));
    b.add(boxGeo(V(kx - 0.9, 1.0, kz), V(kx + 0.9, 2.5, kz + 0.02)), lam("slateM", () => ({ map: slateTex() })));
    b.add(boxGeo(V(kx - 0.9, 0.92, kz), V(kx + 0.9, 0.98, kz + 0.1)), lam("slateTray", () => ({ color: "#6a4026" })));
    // shelves with equipment on the right wall
    for (let r = 0; r < 3; r++) b.add(boxGeo(V(x + 3.0, 0.8 + r * 0.7, z - 2.85), V(x + 4.3, 0.84 + r * 0.7, z - 2.45)), dark);
    const col = ["#c8323a", "#3a6ad0", "#e8c45a", "#3aa86a"];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) b.add(boxGeo(V(x + 3.06 + k * 0.24, 0.84 + r * 0.7, z - 2.8), V(x + 3.24 + k * 0.24, 1.2 + r * 0.7 + 0.12 * (k % 2), z - 2.55)), lam("eq" + ((k + r) % 4), () => ({ color: col[(k + r) % 4] })));
    // a pipe and conduit
    b.add(cyl(0.06, 9, 10).rotateZ(Math.PI / 2), lam("pipe", () => ({ color: "#6a7a8a" })), T(x, 3.0, z - 2.7));
    b.build(G);
    // a hanging bulb (bokeh) and a lamp over the bench
    this.bulbs(G, [[x + 0.2, 2.9, z - 0.5], [x - 1.8, 2.9, z - 1.2], [x + 2.2, 2.9, z - 1.4]], [3.0, 2.6, 1.8], 0.09);
    const sb = new Batch(); sb.add(cyl(0.2, 0.04, 16), lam("stoolSeat", () => ({ color: "#4a3426" })), T(0, 0.43, 0)); sb.add(cyl(0.03, 0.43, 8), lam("stoolLeg", () => ({ color: "#2a2226" })));
    sb.build(this.stool); G.add(this.stool);
    const cb = new Batch(); cb.add(boxGeo(V(-0.34, 0, -0.3), V(0.34, 0.46, 0.3)), lam("crateWood", () => ({ color: "#9a6a3a" }))); cb.build(this.crate); G.add(this.crate);
  }

  // ---------------- the studio cyclorama ----------------
  private buildStudio() {
    const G = this.sets.studio, [sx, , sz] = STU;
    this.cycMat = new THREE.MeshLambertMaterial({ color: "#2ab0b8" });
    const R0 = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2).translate(sx, 0, sz + 2), this.cycMat); floor.receiveShadow = true; G.add(floor);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 30, 24, 1, true, Math.PI, Math.PI / 2).rotateZ(Math.PI / 2).translate(sx, R0, sz - 5), this.cycMat);
    (curve.material as THREE.MeshLambertMaterial).side = THREE.DoubleSide; curve.receiveShadow = true; G.add(curve);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 16).translate(sx, R0 + 8, sz - 5 - R0), this.cycMat); back.receiveShadow = true; G.add(back);
  }

  // ---------------- the Las Vegas street at night ----------------
  private buildStrip() {
    const b = new Batch(), G = this.sets.strip, [x, , z] = STRIP;
    b.add(boxGeo(V(x - 9, -0.2, z - 6), V(x + 9, 0, z + 6), 2), lam("road", () => ({ map: rep(stoneHD("roadT", ["#3a3a44", "#34343e", "#40404a"], "#22222a"), 8, 4) })));
    b.add(boxGeo(V(x - 9, 0, z - 6), V(x + 9, 0.14, z - 2.2), 2), lam("sidewalk", () => ({ map: rep(stoneHD("walkT", ["#8a8478", "#7e786c", "#948e82"], "#5a564c"), 8, 2) })));
    const neon = ["#ff3a8a", "#3affc8", "#ffe03a", "#4a8aff"];
    for (let k = 0; k < 6; k++) {
      const bx = x - 7.5 + k * 3, h = 4.5 + 2 * h01(k, 4);
      b.add(boxGeo(V(bx - 1.3, 0, z - 6), V(bx + 1.3, h, z - 3.6)), lam("facade" + (k % 3), () => ({ color: ["#2a1a4a", "#3a1a3a", "#1a2a4a"][k % 3] })));
    }
    for (const lx of [-3.4, 3.4]) { b.add(cyl(0.05, 3.2, 8), lam("lampPost", () => ({ color: "#2a2a34" })), T(x + lx, 0.14, z - 2.0)); }
    b.build(G);
    for (let k = 0; k < 6; k++) { const bx = x - 7.5 + k * 3, c = neon[k % 4]; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.2) })); m.position.set(bx, 2.6, z - 3.58); m.layers.set(NOINK); G.add(m); }
    this.bulbs(G, [-3.4, 3.4].map((lx) => [x + lx, 3.4, z - 2.0] as V3), [3.0, 2.6, 1.8], 0.12);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: vegasTex(), fog: false }));
    sky.position.set(x, 12, z - 40); sky.layers.set(NOINK); G.add(sky);
  }

  // ---------------- the MIT museum gallery ----------------
  private buildMuseum() {
    const b = new Batch(), G = this.sets.museum, [x, , z] = MUS, [cx, , cz] = CASE;
    this.shell(b, MUS, 9, 7, 4.0, lam("museumWallM", () => ({ map: rep(museumTex(), 3, 1) })), lam("museumFloor", () => ({ map: rep(stoneHD("museumFloorT", ["#c8c4b8", "#b8b4a8", "#d2cec2"], "#8a867a"), 3, 3) })), -2.9, "#6a5a4a");
    // the display case: a pedestal, a glass box
    b.add(boxGeo(V(cx - 0.75, 0, cz - 0.5), V(cx + 0.75, 0.95, cz + 0.5)), lam("pedestal", () => ({ color: "#2a3a5a" })));
    b.add(boxGeo(V(cx - 0.8, 0.95, cz - 0.55), V(cx + 0.8, 1.0, cz + 0.55)), lam("pedestalTop", () => ({ color: "#d8d4c8" })));
    b.add(boxGeo(V(cx + 0.95, 0, cz + 0.2), V(cx + 1.45, 0.85, cz + 0.7)), lam("pedestal2", () => ({ color: "#2a3a5a" })));
    b.add(boxGeo(V(x - 3.2, 0.04, z - 2.88), V(x - 1.2, 1.5, z - 2.84)), lam("posterBack", () => ({ color: "#c8c0a8" })));
    b.add(boxGeo(V(x + 1.2, 0.04, z - 2.88), V(x + 3.2, 1.5, z - 2.84)), lam("posterBack", () => ({})));
    b.build(G);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 1.0).translate(cx, 1.5, cz), new THREE.MeshBasicMaterial({ color: "#bfe2ff", transparent: true, opacity: 0.12, depthWrite: false }));
    glass.layers.set(NOINK); glass.renderOrder = 3; G.add(glass);
    this.bulbs(G, [cx - 0.6, cx, cx + 0.6].map((k) => [k, 3.6, cz + 0.3] as V3), [3.0, 2.8, 2.2], 0.1);
  }

  // ---------------- a 2026 trading desk ----------------
  private buildDesk() {
    const b = new Batch(), G = this.sets.desk, [x, , z] = DESK;
    this.shell(b, DESK, 10, 7, 3.6, lam("deskWallM", () => ({ color: "#1e2a4a" })), lam("deskFloor", () => ({ color: "#2a2e3a" })), -2.9, "#14182a");
    b.add(boxGeo(V(x - 1.6, 0.72, z - 0.95), V(x + 1.6, 0.78, z - 0.25)), lam("deskTop", () => ({ color: "#d8d4c8" })));
    for (const sx of [-1, 1]) b.add(boxGeo(V(x + sx * 1.5 - 0.04, 0, z - 0.9), V(x + sx * 1.5 + 0.04, 0.72, z - 0.3)), lam("deskLeg", () => ({ color: "#2a2a30" })));
    for (const sx of [-0.9, 0.0, 0.9]) { b.add(boxGeo(V(x + sx - 0.28, 0.78, z - 0.62), V(x + sx + 0.28, 1.12, z - 0.58)), lam("monitorFrame", () => ({ color: "#14141a" }))); b.add(cyl(0.03, 0.12, 8), lam("monitorFrame", () => ({})), T(x + sx, 0.78, z - 0.6)); }
    b.build(G);
    this.bulbs(G, [-3, -1.5, 0, 1.5, 3].map((k) => [x + k, 3.45, z - 1.2] as V3), [2.4, 2.8, 3.2], 0.09);
  }

  /** camera-relative key light, frozen per shot */
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
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 400; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, Lp);
    this.hemi.color.set(Lp.sky); this.hemi.groundColor.set(Lp.ground); this.hemi.intensity = Lp.hemiI;
    this.sun.color.set(Lp.sunCol); this.sun.intensity = Lp.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.1 + 6, 10, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = Lp.bias; this.sun.shadow.normalBias = Lp.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...Lp.lit); TONE.uShadeCol.value.set(...Lp.shade); TONE.uShadeLift.value.set(...Lp.lift);
    TONE.uLambert.value = Lp.lambert; TONE.uSideK.value = Lp.sideK; TONE.uTerm.value = Lp.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...Lp.charTint); CHAR.uCharShade.value = Lp.charShade; CHAR.uGrad.value = Lp.charGrad;
    CHAR.uBodyGrad.value = Lp.bodyGrad; CHAR.uSideTint.value.set(...Lp.sideTint);
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar;
    scene.fog = this.fog; scene.background = null;
    for (const [k, g] of Object.entries(this.sets)) g.visible = k === s.set;
    if (s.set === "studio") this.cycMat.color.set(CYC[id] ?? "#2ab0b8");
    // lab furniture per shot
    this.stool.visible = false; this.crate.visible = false;
    this.stool.position.set(LAB[0] - 0.55, 0, LAB[2] - 0.1);
    this.crate.position.set(LAB[0] + 0.45, 0, LAB[2] - 0.15);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx2 = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx2) / (Math.PI / 4)) * (Math.PI / 4);
    type Pl = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number; scale: number; sx: number; roll: number };
    const places: Pl[] = [], fxs: FxP[] = [];
    const blobCol = s.set === "studio" ? "#6a5a6a" : "#4a3a4a";
    castFor(id, f).forEach((w) => {
      const d = cam.position.distanceTo(this.v.set(w.x, w.y + 1.2, w.z));
      if (d > 120) return;
      const [cw, ch, k] = tier(d);
      const fo: FrontOpts = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: w.mode ?? "stand", blink: lidAt(f, w.seed), light: light2, seed: w.seed,
        wave: w.wave === undefined ? undefined : q(w.wave, 8), prop: w.prop ?? null, look: w.look ?? 0, pose: w.pose, facing: w.facing ?? 0, tilt: w.tilt ? q(w.tilt, 2) : 0, ...(w.talk ? { talk: w.talk } : {}) };
      const breath = (w.mode ?? "stand") === "stand" || w.mode === "sit" ? 0.012 * Math.sin((2 * Math.PI * t) / (3.1 + 0.5 * h01(w.seed, 3)) + w.seed) : 0;
      places.push({ key: `F|${JSON.stringify(w.o)}|${JSON.stringify(fo)}|${cw}`, draw: (p) => bodyFront(p, w.o, fo), x: w.x, y: w.y, z: w.z, size: [cw, ch, k], breath, scale: w.scale ?? 1, sx: w.sx ?? 1, roll: w.roll ?? 0 });
      if (!w.noBlob && (w.scale ?? 1) > 0.5 && d < 40) fxs.push({ key: `blob|contact|${blobCol}`, cw: 128, ch: 128, draw: (p) => fxContact(p, blobCol), x: w.x, y: 0.025, z: w.z, w: 0.75, h: 0.55, flat: true });
    });
    const puff = (f0: number, x: number, y: number, z: number, size: number, n = 22) => {
      const u = (f - f0) / n; if (u < 0 || u > 1) return; const qq = q(u, n);
      fxs.push({ key: `puff${qq}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, qq), x, y, z, w: size, h: size, soft: true });
    };
    const smoke = (f0: number, x: number, y: number, z: number, size: number, n = 26) => {
      const u = (f - f0) / n; if (u < 0 || u > 1) return; const qq = q(u, n);
      fxs.push({ key: `smoke${qq}`, cw: 300, ch: 300, draw: (p) => fxSmoke(p, qq), x, y, z, w: size, h: size, soft: true });
    };
    const spark = (f0: number, x: number, y: number, z: number, size: number, col = "#fff3b0") => {
      const u = (f - f0) / 10; if (u < 0 || u > 1) return; const qq = q(u, 10);
      fxs.push({ key: `spark${qq}${col}`, cw: 500, ch: 500, draw: (p) => { p.ol = 5; fxSpark(p, qq, col); }, x, y, z, w: size, h: size });
    };
    const burst = (f0: number, x: number, y: number, z: number, size: number, col: string, n = 20) => {
      const u = (f - f0) / n; if (u < 0 || u > 1) return; const qq = q(u, n);
      fxs.push({ key: `burst${qq}${col}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, qq, col, 12, 30, 230), x, y, z, w: size, h: size });
    };
    const stars = (x: number, y: number, z: number, w: number) => { const ph = q((t * 1.5) % 1, 12); fxs.push({ key: `stars${ph}`, cw: 420, ch: 210, draw: (p) => fxStars(p, ph), x, y, z, w, h: w / 2 }); };
    const sweat = (x: number, y: number, z: number, i: number) => fxs.push({ key: "sweat", cw: 80, ch: 110, draw: fxSweat, x, y: y - 0.4 * (((t * 1.7 + i * 0.37) % 1)), z, w: 0.07, h: 0.1 });
    /** the wheel on the table: wheel angle, ball angle/radius, highlighted slice */
    const wheel = (w: number, a: number, b: number, rb: number, hl = -1, upright = false) => {
      const qa = q(a % (Math.PI * 2), 40), qb = q(b % (Math.PI * 2), 40), qr = q(rb, 20);
      fxs.push({ key: `wheel${qa}|${qb}|${qr}|${hl}`, cw: 500, ch: 500, draw: (p) => fxWheel(p, qa, qb, qr, hl), x: RTAB[0], y: upright ? 0.8 + w * 0.5 : 0.8, z: upright ? RTAB[2] + 0.1 : RTAB[2], w, h: w, flat: !upright });
    };
    const led = () => (Math.floor(t * 3) % 2);

    if (id === 1) {
      const win = f >= wf(0, -1) - L, spin = win ? 1 : 0.4;
      wheel(0.7, t * 3 * spin, t * (win ? 14 : 7), win ? 0.55 : 1, -1, true);
      if (f >= wf(0, 9) - L - 6) {
        for (const sgn of [-1, 1]) { const u = popIn(at(f, wf(0, 9) - L - 6, 9)); fxs.push({ key: `shoe1|${led()}`, cw: 360, ch: 240, draw: (p) => fxShoe(p, 1, led(), 0), x: CAS[0] + sgn * 0.5 + (sgn < 0 ? -0.1 : 0.1), y: 0.32, z: CAS[2] + 0.98, w: 0.7 * u, h: 0.47 * u }); }
        spark(wf(0, 9) - L, CAS[0] - 0.7, 0.4, CAS[2] + 1.0, 0.5, "#ff6a6a"); spark(wf(0, 9) - L, CAS[0] + 0.7, 0.4, CAS[2] + 1.0, 0.5, "#ff6a6a");
      }
      burst(wf(0, -1) - L, RTAB[0], 1.4, RTAB[2], 1.6, "#ffe03a", 16);
    }
    if (id === 2) {
      burst(wf(1, 9) - L, LAB[0] - 0.4, 2.1, LAB[2] - 0.5, 1.0, "#ffe03a", 14);
      if (f >= wf(1, 14) - L) { const ph = q((t * 0.9) % 1, 12), u = popIn(at(f, wf(1, 14) - L, 8)); fxs.push({ key: `phone${ph}`, cw: 200, ch: 300, draw: (p) => fxPhoneWaves(p, ph), x: LAB[0] + 0.95, y: 1.8, z: LAB[2] - 0.2, w: 0.55 * u, h: 0.8 * u }); }
    }
    if (id === 3) {
      const u = at(f, LS[2] + 6, wf(2, 12) - LS[2]);
      fxs.push({ key: `chalk${q(u, 16)}`, cw: 480, ch: 300, draw: (p) => fxChalk(p, q(u, 16)), x: BOARD[0], y: 1.75, z: BOARD[2] + 0.05, w: 1.5, h: 0.94 });
      const a0 = wf(2, 13) - L - 8, a = at(f, a0, 10);
      if (f >= a0 && f < wf(2, 14) - L + 4) fxs.push({ key: "apple", cw: 300, ch: 300, draw: (p) => fxApple(p, 0.92), x: LAB[0] - 0.3, y: 3.4 - 1.75 * easeIn(a), z: LAB[2] - 1.1, w: 0.5, h: 0.5 });
      if (f >= wf(2, 14) - L) { burst(wf(2, 14) - L, LAB[0] - 0.3, 1.95, LAB[2] - 1.05, 1.0, "#fff3b0", 12); if (f < LE[2] + 20) stars(LAB[0] - 0.3, 2.1, LAB[2] - 1.0, 0.5); }
    }
    if (id === 4) {
      const u = at(f, wf(3, 6) - L, wf(3, 17) - wf(3, 6));
      const b = t * (12 - 8 * u), rb = 1 - 0.55 * u, hl = f >= wf(3, 17) - L ? 5 : -1;
      wheel(1.25, t * 2.4, b, rb, hl);
      if (f >= wf(3, 6) - L) { const a = q((t * 0.6) % (Math.PI * 2), 24), k = popIn(at(f, wf(3, 6) - L, 8)); fxs.push({ key: `watch${a}`, cw: 400, ch: 460, draw: (p) => fxWatch(p, a), x: RTAB[0] + 0.05, y: 1.7, z: RTAB[2] + 0.3, w: 0.4 * k, h: 0.46 * k }); }
      if (hl >= 0) spark(wf(3, 17) - L, RTAB[0], 1.1, RTAB[2], 1.2, "#ffe03a");
    }
    if (id === 5) {
      const toes = f >= wf(4, 16) - L, press = toes ? (Math.floor((f - (wf(4, 16) - L)) / 6) % 2) : 0;
      fxs.push({ key: `shoe5|${press}|${led()}`, cw: 360, ch: 240, draw: (p) => fxShoe(p, 1, toes ? press : led(), toes ? press : 0), x: LAB[0] + 0.1, y: 1.15, z: LAB[2] - 0.1, w: 0.9, h: 0.6 });
      fxs.push({ key: `box${led()}`, cw: 300, ch: 160, draw: (p) => fxBox(p, led()), x: BENCH[0] - 0.1, y: 1.1, z: BENCH[2] + 0.05, w: 0.8, h: 0.43 });
      for (let k = 0; k < 4; k++) spark(wf(4, 3) - L + 3 * k, BENCH[0] - 0.4 + 0.25 * k, 1.35 + 0.1 * (k % 2), BENCH[2] + 0.1, 0.4, "#ffe066");
      if (toes) { burst(wf(4, 16) - L, LAB[0] + 0.4, 1.1, LAB[2] - 0.05, 0.9, "#ff6a6a", 10); }
    }
    if (id === 6) {
      const u = smooth(at(f, wf(5, 8) - L, 22));
      fxs.push({ key: `bars6|${q(u, 24)}`, cw: 520, ch: 420, draw: (p) => fxBars(p, 0.92 * q(u, 24), 0), x: LAB[0], y: 1.85, z: LAB[2] - 1.9, w: 1.5, h: 1.2 });
      burst(wf(5, 8) - L + 18, LAB[0], 2.6, LAB[2] - 1.8, 1.4, "#3aff7a", 14);
    }
    if (id === 7) {
      const u = smooth(at(f, wf(6, 7) - L, 8));
      fxs.push({ key: `bars7|${q(u, 12)}`, cw: 520, ch: 420, draw: (p) => fxBars(p, 0.92, 0.08 * q(u, 12)), x: STU[0] - 0.3, y: 1.35, z: STU[2] - 0.2, w: 1.25, h: 1.01 });
      if (f >= wf(6, 7) - L) for (let i = 0; i < 3; i++) { const uu = at(f, wf(6, 7) - L + i * 6, 40); if (uu > 0 && uu < 1) fxs.push({ key: "note", cw: 160, ch: 90, draw: fxNote, x: STU[0] + 0.55 + 0.7 * uu, y: 1.1 - 0.3 * uu + 0.2 * Math.sin(uu * 9 + i), z: STU[2] + 0.6, w: 0.22, h: 0.12, rot: uu * 5 + i }); }
    }
    if (id === 8) {
      const u = at(f, LS[7] - 4, wf(7, 6) - LS[7] + 4);
      if (u < 1) fxs.push({ key: "jet", cw: 360, ch: 160, draw: fxJet, x: STRIP[0] - 3.4 + 6.8 * u, y: 2.9 + 0.3 * Math.sin(u * 6), z: STRIP[2] - 0.4, w: 1.6, h: 0.71, rot: 0.05 });
      const ph = q((t * 1.2) % 1, 6);
      fxs.push({ key: `neon${ph}`, cw: 240, ch: 160, draw: (p) => fxNeon(p, ph), x: STRIP[0] + 0.9, y: 2.25, z: STRIP[2] - 3.5, w: 1.3, h: 0.87 });
      if (f >= wf(7, 6) - L) burst(wf(7, 6) - L, STRIP[0] + 0.9, 2.25, STRIP[2] - 3.2, 1.8, "#ffe03a", 16);
    }
    if (id === 9) {
      const nerv = f >= wf(8, 7) - L, quit = f >= wf(8, 13) - L;
      wheel(0.7, t * 2, t * 8, 0.8, -1, true);
      if (nerv && !quit) { sweat(CAS[0] - 0.55, 1.95, CAS[2] + 0.35, 0); sweat(CAS[0] - 0.4, 1.9, CAS[2] + 0.35, 1); sweat(CAS[0] + 0.55, 1.95, CAS[2] + 0.35, 2); sweat(CAS[0] + 0.4, 1.9, CAS[2] + 0.35, 3); }
      if (f >= wf(8, 9) - L) puff(wf(8, 9) - L - 2, CAS[0] + 1.15, 1.0, CAS[2] - 0.3, 1.8, 16);
      if (quit) { puff(wf(8, 13) - L, CAS[0], 0.8, CAS[2] + 0.3, 2.4, 18); stars(CAS[0] + 1.1, 2.4, CAS[2] - 0.3, 0.5); }
    }
    if (id === 10) {
      const cal = wf(9, 5) - L;
      if (f < wf(9, 7) - L) { const k = q(popIn(at(f, wf(9, 3) - L, 8)), 8); fxs.push({ key: "zip", cw: 220, ch: 140, draw: fxZip0, x: STU[0] - 0.35, y: 1.5, z: STU[2] + 0.25, w: 0.26 * k, h: 0.17 * k }); }
      for (let i = 0; i < 5; i++) { const u = at(f, cal - 14 + i * 5, 28); if (u > 0 && u < 1) fxs.push({ key: `cal${i % 2}`, cw: 220, ch: 240, draw: (p) => fxCalendar(p, i), x: STU[0] - 0.9 + 0.45 * i + 0.1 * Math.sin(u * 8 + i), y: 3.3 - 3.0 * easeIn(u), z: STU[2] + 0.3, w: 0.36, h: 0.39, rot: 0.6 * Math.sin(u * 7 + i) }); }
      if (f >= wf(9, 7) - L) { const k = popIn(at(f, wf(9, 7) - L, 9)); fxs.push({ key: "rosette", cw: 240, ch: 280, draw: fxRosette, x: STU[0] + 0.5, y: 2.0, z: STU[2] + 0.2, w: 0.62 * k, h: 0.72 * k }); burst(wf(9, 7) - L, STU[0] + 0.5, 2.0, STU[2] + 0.2, 1.4, "#ffe03a", 14); }
    }
    if (id === 11) {
      fxs.push({ key: `shoe11|${led()}`, cw: 360, ch: 240, draw: (p) => fxShoe(p, 1, led(), 0), x: CASE[0], y: 1.28, z: CASE[2], w: 0.75, h: 0.5 });
      const love = f >= wf(10, 10) - L ? 1 : 0, bob = 0.02 * Math.sin(t * 3), k = popIn(at(f, wf(10, 9) - L - 6, 9));
      fxs.push({ key: `swatch${love}`, cw: 300, ch: 360, draw: (p) => fxSmartwatch(p, love), x: CASE[0] + 1.2, y: 1.25 + bob, z: CASE[2] + 0.5, w: 0.5 * k, h: 0.6 * k });
      if (love) { const u = at(f, wf(10, 10) - L, 30); if (u < 1) spark(wf(10, 10) - L, CASE[0] + 1.2, 1.6, CASE[2] + 0.6, 0.7, "#ff7aa0"); }
    }
    if (id === 12) {
      const toss = wf(11, 9) - L, u = at(f, toss, 22);
      if (f < toss + 22) { const qa = q(t * 4, 12); fxs.push({ key: `wheelup${qa}`, cw: 500, ch: 500, draw: (p) => fxWheel(p, qa, 1, 1, -1), x: u > 0 ? STU[0] - 0.4 + 3.4 * u : STU[0] - 0.12, y: u > 0 ? 1.4 + 1.6 * Math.sin(u * 2.6) - 0.5 * u : 1.3, z: STU[2] + 0.5, w: 0.55, h: 0.55, rot: u * 9 }); }
      if (f >= wf(11, -1) - L) { const ph = q((t * 0.5) % 1, 10), k = popIn(at(f, wf(11, -1) - L, 9)); fxs.push({ key: `scr${ph}`, cw: 480, ch: 360, draw: (p) => fxScreen(p, ph), x: STU[0] + 0.5, y: 1.8, z: STU[2] - 0.5, w: 1.5 * k, h: 1.12 * k }); burst(wf(11, -1) - L, STU[0] + 0.5, 1.8, STU[2] - 0.3, 1.8, "#3affc8", 14); }
    }
    if (id === 13) {
      const wipe = wf(12, 15) - L, w2 = f >= wipe, sway = w2 ? 0 : 6 * Math.sin(t * 6) * smooth(at(f, wf(12, 9) - L, 30));
      for (const dx of [-0.2, 0.2]) fxs.push({ key: "chipsS", cw: 200, ch: 260, draw: (p) => fxChips(p, 3, 0, "#3a6ad0"), x: STU[0] - 0.7 + dx, y: 0.17, z: STU[2] + 0.62, w: 0.3, h: 0.39 });
      if (!w2) fxs.push({ key: `chipsT${q(sway, 2)}`, cw: 200, ch: 260, draw: (p) => fxChips(p, 12, q(sway, 2) * 3, "#d8282a"), x: STU[0] + 0.7, y: 0.4, z: STU[2] + 0.62, w: 0.42, h: 0.55 });
      else {
        burst(wipe, STU[0] + 0.7, 0.8, STU[2] + 0.62, 1.4, "#ffe03a", 12);
        for (let i = 0; i < 7; i++) { const uu = at(f, wipe + i, 26); if (uu > 0 && uu < 1) fxs.push({ key: "chip1", cw: 200, ch: 260, draw: (p) => fxChips(p, 1, 0, "#d8282a"), x: STU[0] + 0.7 + (h01(i, 1) - 0.4) * 1.6 * uu, y: 0.2 + 1.0 * Math.sin(uu * 3.1) * (0.4 + h01(i, 2)), z: STU[2] + 0.62 + 0.4 * (h01(i, 3) - 0.5), w: 0.2, h: 0.26, rot: uu * 8 }); }
        puff(wipe, STU[0] + 0.7, 0.3, STU[2] + 0.7, 1.4, 16);
      }
    }
    if (id === 14) {
      const ph = q((t * 0.4) % 1, 10);
      for (const [dx, k] of [[-1.2, 0], [0.5, 1]] as const) fxs.push({ key: `deskscr${k}|${ph}`, cw: 480, ch: 360, draw: (p) => fxScreen(p, (ph + k * 0.3) % 1, k === 1), x: DESK[0] + dx, y: 2.1, z: DESK[2] - 2.8, w: 1.5, h: 1.12 });
      if (f >= wf(13, 8) - L) { const k = popIn(at(f, wf(13, 8) - L, 9)); fxs.push({ key: `deskbig${ph}`, cw: 480, ch: 360, draw: (p) => fxScreen(p, (ph + 0.6) % 1, true), x: DESK[0] + 0.0, y: 3.0, z: DESK[2] - 2.5, w: 1.1 * k, h: 0.82 * k }); spark(wf(13, 8) - L, DESK[0], 3.0, DESK[2] - 2.4, 1.0, "#3affc8"); }
    }
    if (id === 15) {
      wheel(0.7, t * 2, t * 7, 0.9, -1, true);
      if (f >= wf(14, 9) - L) {
        const u = popIn(at(f, wf(14, 9) - L, 9)), press = f >= wf(14, -1) - L ? Math.floor((f - (wf(14, -1) - L)) / 5) % 2 : 0;
        fxs.push({ key: `shoe15|${press}|${led()}`, cw: 360, ch: 240, draw: (p) => fxShoe(p, 1, led(), press), x: CAS[0], y: 0.27, z: CAS[2] + 0.88, w: 0.78 * u, h: 0.52 * u });
        if (f >= wf(14, -1) - L) burst(wf(14, -1) - L, CAS[0] + 0.1, 0.45, CAS[2] + 0.95, 1.0, "#ff6a6a", 10);
      }
    }
    // ---- bind cards ----
    this.frustumC.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of places) {
      if (p.scale < 0.002 || !this.frustumC.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      a.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll);
      a.mesh.scale.set((1 - 0.4 * p.breath) * p.scale * p.sx, (1 + p.breath) * p.scale * (p.sx < 1 ? 1 + (1 - p.sx) * 0.4 : 1), p.scale);
      a.mesh.castShadow = Lp.actorShadow;
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
}
const fxZip0 = (p: Pen) => {
  p.poly([[20, 40], [200, 40], [200, 100], [20, 100]], "#c8ccd4", 7);
  for (let i = 0; i < 8; i++) p.poly([[28 + i * 22, 48], [40 + i * 22, 48], [40 + i * 22, 92], [28 + i * 22, 92]], i % 2 ? "#6a6a74" : "#e8e8ee", 3);
};
void LE; void easeOut; void planksHD; void add; void folk; void CAS;
