// Every place of "The Nickel Trap" (built from the cartoon-3d-short skill's look modules; geometry, staging and gags are
// ours). BRIGHT on purpose (user feedback 2026-11-15, "too dark, colours too closed"): daylight rooms, a sunny cyclorama,
// saturated colours, light shade tones:
// - the LTCM trading room: sunny cream walls, a big window onto blue sky, parquet, a coral rug, desks with monitors;
// - the bank hall for the rescue: pale blue panels, white columns, a marble floor;
// - the colour cyclorama for the gag beats (bonds, towers, flags, the steamroller).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { rep } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxBurst, fxContact, fxStars, Outfit, Expr, FrontOpts } from "../bridge/toon";
import { fxSpark } from "../castle/paintc";
import { fxChips, fxBars, fxSweat, fxNote } from "../thorp/painth";
import {
  FPS, SHOTS, LS, LE, wf, wfw, L, STU, OFF, HALL, Light, ShotDef, V3, camAt, popIn, at, smooth, easeIn, easeOut, add,
} from "./story";
import { PROF_A, PROF_B, TRADER, BANKER, THORP_B } from "./people";
import {
  officeWallTex, parquetTex, skyWindowTex, hallWallTex, marbleTex, fxBag, fxMoneyPile, fxMedal, fxBond, fxGap, fxCoin, fxBlocks, fxFlag,
  fxSafe, fxArrowDown, fxBankFront, fxNet, fxPhoneRing, fxDial, fxSteam, fxPaper, fxCheck, fxMagnifier, fxShoeB, fxStar,
} from "./painth";

// ---------------- light presets: bright, lifted shade, clean colour ----------------
const P: Record<Light, LightPreset> = {
  day: {
    ...LIGHTS.day, az: 140, el: 46, lit: [1.7, 1.6, 1.42], shade: [0.52, 0.5, 0.62], lift: [0.1, 0.1, 0.15], term: 0.2, hemiI: 0.85,
    charTint: [1.0, 0.97, 0.94], fog: "#e8f4ff", fogNear: 40, fogFar: 200, actorShadow: true,
  },
  stage: {
    ...LIGHTS.day, az: 150, el: 42, lit: [1.68, 1.56, 1.4], shade: [0.54, 0.5, 0.62], lift: [0.1, 0.1, 0.15], term: 0.2, hemiI: 0.85,
    charTint: [1.0, 0.97, 0.94], fog: "#000000", fogNear: 200, fogFar: 900, actorShadow: true,
  },
};
const LK: Record<Light, WorldLook> = { day: { ...LOOK.day, sat: 1.08 }, stage: { ...LOOK.day, sat: 1.08 } };
/** cyclorama colour per studio shot (all light and cheerful) */
const CYC: Record<number, string> = { 1: "#5cc8ff", 3: "#7fe0a8", 5: "#ffd84a", 7: "#ff9a86", 8: "#b9a4ff", 10: "#ffc94a", 13: "#ff9fc0", 14: "#46d2c0", 15: "#9ddcff" };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
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
/** the frame a word is spoken, minus the visual lead */
const wd = (i: number, w: string, n = 0) => wfw(i, w, n) - L;
const PILE = (o: V3): V3 => add(o, [0, 0, 0.55]);

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS, out: Who[] = [];
  const P3 = (o: Outfit, seed: number, p: V3, expr: Expr, extra: Partial<Who> = {}) => out.push({ o, seed, x: p[0], y: p[1], z: p[2], expr, ...extra });
  switch (id) {
    case 1: { // the hook: the fund's money pile shrinks, then the Nobel winners beam
      const lost = f >= wd(0, "lost"), nob = f >= wd(0, "Nobel");
      P3(PROF_A, 1, add(STU, [-0.8, 0, -0.35]), nob ? "proud" : lost ? "shock" : "smug", { facing: 1, tilt: lost && !nob ? 3 * Math.sin(t * 9) : 0 });
      P3(TRADER, 2, add(STU, [0, 0, -0.65]), nob ? "grin" : lost ? "shock" : "smug", { facing: 0 });
      P3(PROF_B, 3, add(STU, [0.8, 0, -0.35]), nob ? "proud" : lost ? "shock" : "smug", { facing: -1, tilt: lost && !nob ? -3 * Math.sin(t * 9) : 0 });
      break;
    }
    case 2: { // LTCM: professors, a famous bond trader, a Nobel formula
      const a = f >= wd(1, "Professors"), b = f >= wd(1, "famous"), c = f >= wd(1, "formula");
      P3(PROF_A, 1, add(OFF, [-0.8, 0, -0.45]), a ? "proud" : "smile", { facing: 1, pose: a ? "hips" : undefined });
      P3(TRADER, 2, add(OFF, [0, 0, -0.3]), b ? "smug" : "smile", { facing: 0, pose: b ? "hips" : undefined });
      P3(PROF_B, 3, add(OFF, [0.8, 0, -0.45]), c ? "grin" : "smile", { facing: -1, pose: c ? "point" : undefined });
      break;
    }
    case 3: { // two almost identical bonds: the trader studies them
      const cl = f >= wd(2, "closes");
      P3(TRADER, 2, add(STU, [-0.2, 0, 0.1]), cl ? "grin" : "smug", { facing: 1, look: 0.3, pose: cl ? "fist" : "point" });
      P3(PROF_A, 1, add(STU, [0.8, 0, -0.1]), cl ? "proud" : "smile", { facing: -1, tilt: 2 * Math.sin(t * 3) });
      break;
    }
    case 4: { // nickels: the trader scoops coins, then the loans pour in
      const bo = f >= wd(3, "borrowed"), lot = f >= wd(3, "lot");
      P3(TRADER, 2, add(OFF, [-0.2, 0, 0.1]), lot ? "nervous" : bo ? "grin" : "smile", { facing: 1, pose: bo ? "point" : "hips", look: -0.3 });
      P3(PROF_B, 3, add(OFF, [0.85, 0, -0.35]), lot ? "queasy" : "smile", { facing: -1 });
      break;
    }
    case 5: { // one dollar owned, twenty-five borrowed: the trader gapes at the tower
      const tw = f >= wd(4, "twentyfive");
      P3(TRADER, 2, add(STU, [-0.85, 0, 0.2]), tw ? "shock" : "smug", { facing: 1, look: 0.5, tilt: tw ? 3 * Math.sin(t * 8) : 0 });
      break;
    }
    case 6: { // it worked: bankers beg to lend them more
      const bg = f >= wd(5, "begged");
      P3(TRADER, 2, add(OFF, [-0.55, 0, -0.2]), bg ? "grin" : "proud", { facing: 1, pose: "hips" });
      P3(BANKER(0), 41, add(OFF, [0.45, 0, 0.1]), bg ? "nervous" : "smile", { facing: -1, wave: bg ? 1 : undefined });
      P3(BANKER(1), 42, add(OFF, [0.95, 0, -0.25]), bg ? "nervous" : "smile", { facing: -1, wave: bg ? 1 : undefined });
      break;
    }
    case 7: { // Russia defaults: the flag rips, the trader stares
      const d = f >= wd(6, "defaulted");
      P3(TRADER, 2, add(STU, [-0.85, 0, 0.2]), d ? "shock" : "smug", { facing: 1, look: 0.5, tilt: d ? 4 * Math.sin(t * 10) : 0 });
      break;
    }
    case 8: { // everyone runs to safe bonds
      const ran = at(f, wd(7, "ran"), 70);
      for (let k = 0; k < 3; k++) {
        const x = -1.9 + 3.6 * ran + 0.55 * k - 0.1 * k * k;
        P3(BANKER(2 + k), 50 + k, add(STU, [x, 0, 0.5 - 0.35 * k]), "scared", { mode: "run", phase: t * 3 + k * 0.4, facing: 1 });
      }
      break;
    }
    case 9: { // almost two billion lost: sweat and a shrinking pile
      P3(TRADER, 2, add(OFF, [0.35, 0, -0.15]), f >= wd(8, "almost") ? "scared" : "nervous", { facing: -1, tilt: 3 * Math.sin(t * 12) });
      P3(PROF_A, 1, add(OFF, [-0.45, 0, -0.5]), "queasy", { facing: 1 });
      break;
    }
    case 10: { // every loss hits 25 times harder
      const hr = f >= wd(9, "harder");
      P3(TRADER, 2, add(STU, [-0.85, 0, 0.2]), hr ? "shock" : "stern", { facing: 1, look: 0.5, tilt: hr ? 5 * Math.sin(t * 13) : 0 });
      break;
    }
    case 11: { // almost everything gone
      P3(TRADER, 2, add(OFF, [0, 0, -0.2]), "pained", { facing: 0, pose: "cross" });
      break;
    }
    case 12: { // the Fed rescue: banks hold a net
      const cr = f >= wd(11, "crash");
      P3(BANKER(0), 41, add(HALL, [-1.2, 0, -0.45]), cr ? "relief" : "stern", { facing: 1 });
      P3(BANKER(3), 44, add(HALL, [-0.4, 0, -0.55]), cr ? "relief" : "stern", { facing: 0 });
      P3(BANKER(4), 45, add(HALL, [0.4, 0, -0.55]), cr ? "relief" : "stern", { facing: 0 });
      P3(BANKER(1), 42, add(HALL, [1.2, 0, -0.45]), cr ? "relief" : "stern", { facing: -1 });
      break;
    }
    case 13: { // Thorp's callback
      const wipe = f >= wd(12, "wipe");
      P3(THORP_B, 71, add(STU, [-0.55, 0, 0.1]), wipe ? "grin" : "smug", { facing: 1, pose: wipe ? "fist" : "point", look: 0.3 });
      break;
    }
    case 14: { // being right is not enough
      const big = f >= wd(13, "big"), sv = f >= wd(13, "survive");
      P3(TRADER, 2, add(STU, [-0.8, 0, 0.2]), sv ? "scared" : big ? "nervous" : "proud", { facing: 1, look: 0.4, tilt: sv ? 4 * Math.sin(t * 12) : 0 });
      break;
    }
    case 15: { // nickels and the steamroller
      const st = f >= wd(14, "steamroller"), end = f >= wf(14, -1) - L;
      P3(TRADER, 2, add(STU, [-0.75, 0, 0.35]), end ? "shock" : st ? "scared" : "grin", { facing: 1, pose: st ? undefined : "point", look: 0.4 });
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
  private fog = new THREE.Fog("#e8f4ff", 40, 200);
  private sunCache = new Map<number, THREE.Vector3>();
  private sets: Record<string, THREE.Group> = { studio: new THREE.Group(), office: new THREE.Group(), hall: new THREE.Group() };
  private cycMat!: THREE.MeshLambertMaterial;
  private frustumC = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#e8f4ff", "#f0d8b0", 1.1);
    this.sun = new THREE.DirectionalLight("#fff6e0", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    Object.values(this.sets).forEach((g) => { g.visible = false; R.add(g); });
    this.buildStudio(); this.buildOffice(); this.buildHall();
  }

  /** a room shell: floor, back wall and side walls, with skirting */
  private shell(b: Batch, c: V3, w: number, d: number, h: number, wall: THREE.Material, floor: THREE.Material, back = -2.9, skirt = "#ffffff") {
    const [x, , z] = c;
    b.add(boxGeo(V(x - w / 2, -0.2, z + back - 0.1), V(x + w / 2, 0, z + d), 2), floor);
    b.add(boxGeo(V(x - w / 2, 0, z + back - 0.2), V(x + w / 2, h, z + back), 3), wall);
    b.add(boxGeo(V(x - w / 2 - 0.2, 0, z + back), V(x - w / 2, h, z + d), 3), wall);
    b.add(boxGeo(V(x + w / 2, 0, z + back), V(x + w / 2 + 0.2, h, z + d), 3), wall);
    b.add(boxGeo(V(x - w / 2, 0, z + back), V(x + w / 2, 0.14, z + back + 0.06)), lam("skirt" + skirt, () => ({ color: skirt })));
  }
  private bulbs(G: THREE.Group, pts: V3[], col: [number, number, number] = [2.6, 2.5, 2.0], r = 0.08) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...col) });
    for (const p of pts) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); s.position.set(...p); s.layers.set(NOINK); G.add(s); }
  }

  // ---------------- the studio cyclorama ----------------
  private buildStudio() {
    const G = this.sets.studio, [sx, , sz] = STU;
    this.cycMat = new THREE.MeshLambertMaterial({ color: "#5cc8ff" });
    const R0 = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2).translate(sx, 0, sz + 2), this.cycMat); floor.receiveShadow = true; G.add(floor);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 30, 24, 1, true, Math.PI, Math.PI / 2).rotateZ(Math.PI / 2).translate(sx, R0, sz - 5), this.cycMat);
    (curve.material as THREE.MeshLambertMaterial).side = THREE.DoubleSide; curve.receiveShadow = true; G.add(curve);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 16).translate(sx, R0 + 8, sz - 5 - R0), this.cycMat); back.receiveShadow = true; G.add(back);
  }

  // ---------------- the LTCM trading room (sunny) ----------------
  private buildOffice() {
    const b = new Batch(), G = this.sets.office, [x, , z] = OFF;
    this.shell(b, OFF, 10, 8, 3.8, lam("offWallM", () => ({ map: rep(officeWallTex(), 3, 1) })), lam("offFloorM", () => ({ map: rep(parquetTex(), 3, 2) })), -3.0, "#ffffff");
    // a coral rug under the cast
    b.add(boxGeo(V(x - 2.3, 0, z - 1.4), V(x + 2.3, 0.02, z + 1.2)), lam("rug", () => ({ color: "#ff8f7e" })));
    b.add(boxGeo(V(x - 2.1, 0.02, z - 1.2), V(x + 2.1, 0.03, z + 1.0)), lam("rugIn", () => ({ color: "#ffd2b8" })));
    // desks with monitors along both sides
    for (const sx of [-3.4, 3.4]) {
      b.add(boxGeo(V(x + sx - 0.8, 0.7, z - 2.6), V(x + sx + 0.8, 0.76, z - 1.8)), lam("deskTopO", () => ({ color: "#ffe3a8" })));
      for (const lx of [-0.7, 0.7]) b.add(boxGeo(V(x + sx + lx - 0.04, 0, z - 2.5), V(x + sx + lx + 0.04, 0.7, z - 1.9)), lam("deskLegO", () => ({ color: "#3b78e0" })));
      b.add(boxGeo(V(x + sx - 0.3, 0.76, z - 2.4), V(x + sx + 0.3, 1.14, z - 2.36)), lam("monO", () => ({ color: "#2a3a5a" })));
    }
    // two wall-hung abstract pictures (colour blocks, no lettering)
    for (const [sx, col] of [[-2.4, "#ff6a8a"], [2.4, "#3aa8e8"]] as const) b.add(boxGeo(V(x + sx - 0.5, 1.4, z - 2.98), V(x + sx + 0.5, 2.3, z - 2.94)), lam("pic" + col, () => ({ color: col })));
    b.build(G);
    // the big window onto a blue sky
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: skyWindowTex(), fog: false }));
    win.position.set(x, 2.1, z - 2.97); win.layers.set(NOINK); G.add(win);
    const fb = new Batch();
    fb.add(boxGeo(V(x - 1.98, 0.95, z - 2.99), V(x + 1.98, 1.02, z - 2.93)), lam("winFrame", () => ({ color: "#ffffff" })));
    fb.add(boxGeo(V(x - 1.98, 3.18, z - 2.99), V(x + 1.98, 3.25, z - 2.93)), lam("winFrame", () => ({})));
    for (const k of [-1.98, -0.66, 0.66, 1.98]) fb.add(boxGeo(V(x + k - 0.035, 0.95, z - 2.99), V(x + k + 0.035, 3.25, z - 2.93)), lam("winFrame", () => ({})));
    fb.build(G);
    // plants in the corners (green spheres on terracotta pots)
    const pb = new Batch();
    for (const sx of [-4.4, 4.4]) { pb.add(cyl(0.3, 0.5, 14, 0.24), lam("pot", () => ({ color: "#e8704a" })), new THREE.Matrix4().makeTranslation(x + sx, 0, z - 2.5)); pb.add(new THREE.SphereGeometry(0.6, 14, 10).translate(0, 1.15, 0), lam("leaf", () => ({ color: "#4fcf6a" })), new THREE.Matrix4().makeTranslation(x + sx, 0, z - 2.5)); }
    pb.build(G);
    this.bulbs(G, [-3, -1.5, 0, 1.5, 3].map((k) => [x + k, 3.55, z - 0.6] as V3));
  }

  // ---------------- the bank hall for the rescue ----------------
  private buildHall() {
    const b = new Batch(), G = this.sets.hall, [x, , z] = HALL;
    this.shell(b, HALL, 11, 8, 4.4, lam("hallWallM", () => ({ map: rep(hallWallTex(), 3, 1) })), lam("hallFloorM", () => ({ map: rep(marbleTex(), 3, 2) })), -3.0, "#ffffff");
    for (const sx of [-4.2, -2.4, 2.4, 4.2]) {
      b.add(boxGeo(V(x + sx - 0.28, 0, z - 2.7), V(x + sx + 0.28, 4.4, z - 2.15)), lam("colM", () => ({ color: "#fffaf0" })));
      b.add(boxGeo(V(x + sx - 0.34, 0, z - 2.76), V(x + sx + 0.34, 0.3, z - 2.1)), lam("colBase", () => ({ color: "#f2e2c0" })));
      b.add(boxGeo(V(x + sx - 0.34, 4.0, z - 2.76), V(x + sx + 0.34, 4.4, z - 2.1)), lam("colBase", () => ({})));
    }
    b.add(boxGeo(V(x - 3.2, 0, z - 1.4), V(x + 3.2, 0.02, z + 1.4)), lam("hallRug", () => ({ color: "#ff8f7e" })));
    b.build(G);
    this.bulbs(G, [-3.5, -1.2, 1.2, 3.5].map((k) => [x + k, 4.1, z - 1.2] as V3), [2.8, 2.6, 2.0], 0.1);
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
    if (s.set === "studio") this.cycMat.color.set(CYC[id] ?? "#5cc8ff");

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx2 = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx2) / (Math.PI / 4)) * (Math.PI / 4);
    type Pl = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number; scale: number; sx: number; roll: number };
    const places: Pl[] = [], fxs: FxP[] = [];
    const blobCol = s.set === "studio" ? "#7a8aa8" : "#8a7a8a";
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
    const bag = (x: number, y: number, z: number, w = 0.45, rot = 0) => fxs.push({ key: "bag", cw: 200, ch: 220, draw: fxBag, x, y, z, w, h: w * 1.1, rot });
    const bond = (x: number, y: number, z: number, col: string, w = 1.0, rot = 0) => fxs.push({ key: `bond${col}`, cw: 300, ch: 200, draw: (p) => fxBond(p, col), x, y, z, w, h: (w * 2) / 3, rot });
    const pile = (x: number, y: number, z: number, level: number, w = 1.3) => { const lv = q(level, 14); fxs.push({ key: `pile${lv}`, cw: 400, ch: 420, draw: (p) => fxMoneyPile(p, lv), x, y, z, w, h: w * 1.05 }); };
    const tower = (x: number, z: number, n: number, wob = 0, red = 0, w = 0.75) => { const nn = Math.round(n), ww = q(wob, 1); fxs.push({ key: `tower${nn}|${ww}|${red}`, cw: 260, ch: 720, draw: (p) => fxBlocks(p, nn, ww, red), x, y: (w * 720) / 260 / 2, z, w, h: (w * 720) / 260 }); };

    if (id === 1) {
      const lost = wd(0, "lost"), months = wd(0, "months"), lv = f < lost ? 1 : Math.max(0, 1 - at(f, lost, months - lost + 6) * 1.04);
      pile(STU[0], 0.7, STU[2] + 0.55, lv, 1.4);
      if (f >= months) burst(months, STU[0], 1.1, STU[2] + 0.6, 1.6, "#ffe03a", 16);
      const n = wd(0, "Nobel");
      for (const [sgn, k] of [[-1, 0], [1, 1]] as const) { const u = popIn(at(f, n + 6 * k, 9)); if (u > 0) { fxs.push({ key: "medal", cw: 200, ch: 260, draw: fxMedal, x: STU[0] + sgn * 0.78, y: 1.0, z: STU[2] - 0.05, w: 0.38 * u, h: 0.5 * u }); if (u < 1) spark(n + 6 * k, STU[0] + sgn * 0.78, 1.3, STU[2], 0.5, "#ffe03a"); } }
    }
    if (id === 2) {
      const a = wd(1, "Professors"), b = wd(1, "famous"), c = wd(1, "formula");
      burst(a, OFF[0] - 0.8, 2.2, OFF[2] - 0.4, 1.0, "#ffe03a", 12);
      if (f >= b) { const u = popIn(at(f, b, 9)); bond(OFF[0] + 0.05, 2.35, OFF[2] - 0.3, "#2c56b8", 0.8 * u); burst(b, OFF[0], 2.35, OFF[2] - 0.3, 1.0, "#3aa8e8", 12); }
      if (f >= c) { const u = popIn(at(f, c, 9)); fxs.push({ key: "medal", cw: 200, ch: 260, draw: fxMedal, x: OFF[0] + 0.85, y: 2.45, z: OFF[2] - 0.4, w: 0.5 * u, h: 0.65 * u }); burst(c, OFF[0] + 0.85, 2.45, OFF[2] - 0.4, 1.1, "#ffe03a", 14); }
    }
    if (id === 3) {
      const g0 = wd(2, "gap"), cl = wd(2, "closes"), u = smooth(at(f, cl, 14));
      const half = 0.56 + 0.06 * (1 - u), gapPx = 60 * (1 - u) + 10;
      bond(STU[0] - half, 2.55, STU[2] - 0.2, "#2c56b8", 1.0); bond(STU[0] + half, 2.55, STU[2] - 0.2, "#2c56b8", 1.0);
      if (f >= g0 && f < cl + 14) fxs.push({ key: `gap${q(gapPx, 0.5)}`, cw: 400, ch: 100, draw: (p) => fxGap(p, gapPx), x: STU[0], y: 1.9, z: STU[2] - 0.1, w: 1.0, h: 0.25 });
      if (f >= cl) { burst(cl + 10, STU[0], 2.55, STU[2] - 0.1, 1.4, "#3aff7a", 14); const k = popIn(at(f, cl + 6, 9)); fxs.push({ key: "check", cw: 200, ch: 200, draw: fxCheck, x: STU[0], y: 1.6, z: STU[2] - 0.05, w: 0.5 * k, h: 0.5 * k }); }
      const m = popIn(at(f, wd(2, "tiny"), 9)); if (m > 0 && f < cl) fxs.push({ key: "mag", cw: 220, ch: 260, draw: fxMagnifier, x: STU[0] + 0.15, y: 1.5, z: STU[2] + 0.25, w: 0.5 * m, h: 0.6 * m, rot: 0.2 * Math.sin(t * 3) });
    }
    if (id === 4) {
      const nk = wd(3, "nickels"), bo = wd(3, "borrowed"), lot = wd(3, "lot");
      for (let i = 0; i < 8; i++) { const u = popIn(at(f, nk + i * 2, 8)); if (u > 0) fxs.push({ key: "coin", cw: 100, ch: 100, draw: fxCoin, x: OFF[0] - 1.25 + i * 0.3 + 0.08 * Math.sin(i * 2.3), y: 0.1, z: OFF[2] + 0.55 + 0.1 * Math.sin(i * 1.7), w: 0.22 * u, h: 0.22 * u }); }
      if (f >= bo) for (let i = 0; i < (f >= lot ? 8 : 5); i++) { const f0 = bo + i * 5, u = at(f, f0, 22); if (u > 0 && u < 1) bag(OFF[0] - 0.2 + 1.5 * (h01(i, 5) - 0.5), 3.6 - 2.2 * easeIn(u), OFF[2] - 0.3 + 0.6 * h01(i, 6), 0.5, 0.5 * Math.sin(u * 9 + i)); else if (u >= 1) bag(OFF[0] - 0.9 + 0.35 * (i % 6), 0.28 + 0.4 * Math.floor(i / 6), OFF[2] + 0.75 - 0.1 * (i % 2), 0.5); }
      if (f >= bo) burst(bo, OFF[0] - 0.2, 2.3, OFF[2] - 0.3, 1.2, "#3aff7a", 12);
    }
    if (id === 5) {
      const bo = wd(4, "borrowed"), tw = wd(4, "twentyfive"), n = f < bo ? 0 : 25 * easeOut(at(f, bo, Math.max(20, tw - bo + 18)));
      tower(STU[0] + 0.55, STU[2] - 0.1, n, 0, 0, 0.78);
      const k = popIn(at(f, wd(4, "owned") - 3, 9)); bag(STU[0] - 0.1, 0.22, STU[2] + 0.4, 0.4 * k);
      if (f >= tw) { burst(tw, STU[0] + 0.55, 2.2, STU[2] - 0.1, 1.6, "#ffe03a", 14); }
    }
    if (id === 6) {
      const bg = wd(5, "begged"), u = smooth(at(f, wd(5, "forty"), 24));
      fxs.push({ key: `bars6|${q(u, 20)}`, cw: 520, ch: 420, draw: (p) => fxBars(p, 0.92 * q(u, 20), 0), x: OFF[0] - 1.9, y: 1.7, z: OFF[2] - 2.6, w: 1.5, h: 1.2 });
      if (f >= bg) for (let i = 0; i < 4; i++) { const uu = at(f, bg + i * 6, 26); if (uu > 0 && uu < 1) bag(OFF[0] + 0.9 - 1.5 * uu, 1.7 + 1.0 * Math.sin(uu * 3.1), OFF[2] + 0.1, 0.42, 6 * uu); }
      if (f >= bg) spark(bg, OFF[0] + 0.7, 1.9, OFF[2] + 0.2, 0.7, "#3aff7a");
    }
    if (id === 7) {
      const d = wd(6, "defaulted"), u = smooth(at(f, d, 14)), fall = easeIn(at(f, d + 6, 40));
      fxs.push({ key: `flag${q(u, 8)}`, cw: 400, ch: 300, draw: (p) => fxFlag(p, q(u, 8)), x: STU[0] + 0.1, y: 2.0 - 0.35 * fall, z: STU[2] - 0.2, w: 1.4, h: 1.05, rot: 0.25 * fall });
      if (f >= d) { burst(d, STU[0] + 0.1, 2.0, STU[2] - 0.1, 1.6, "#ff5a4a", 14); const a = popIn(at(f, d + 8, 9)); fxs.push({ key: "arrow", cw: 200, ch: 300, draw: fxArrowDown, x: STU[0] + 1.0, y: 2.0 - 0.6 * easeIn(at(f, d + 8, 30)), z: STU[2] - 0.1, w: 0.34 * a, h: 0.51 * a }); }
    }
    if (id === 8) {
      const w0 = wd(7, "wider"), u = smooth(at(f, w0, 40)), half = 0.56 + 0.7 * u, gapPx = 60 + 120 * u;
      bond(STU[0] - half, 2.55, STU[2] - 0.5, "#2c56b8", 0.95); bond(STU[0] + half, 2.55, STU[2] - 0.5, "#2c56b8", 0.95);
      fxs.push({ key: `gap${q(gapPx, 0.5)}`, cw: 400, ch: 100, draw: (p) => fxGap(p, gapPx), x: STU[0], y: 1.95, z: STU[2] - 0.4, w: 2.0, h: 0.5 });
      fxs.push({ key: "safe", cw: 300, ch: 300, draw: fxSafe, x: STU[0] + 1.25, y: 0.55, z: STU[2] - 0.3, w: 1.0, h: 1.0 });
      if (f >= w0) burst(w0, STU[0], 2.55, STU[2] - 0.4, 1.6, "#ff5a4a", 14);
      puff(wd(7, "ran"), STU[0] - 1.6, 0.4, STU[2] + 0.6, 1.4, 18);
    }
    if (id === 9) {
      const bl = wd(8, "billion"), lv = 0.55 - 0.45 * smooth(at(f, wd(8, "lost"), bl - wd(8, "lost") + 10));
      pile(OFF[0] - 1.25, 0.65, OFF[2] + 0.35, f < wd(8, "lost") ? 0.6 : lv, 1.2);
      if (f >= wd(8, "lost")) { const a = popIn(at(f, wd(8, "lost"), 9)); fxs.push({ key: "arrow", cw: 200, ch: 300, draw: fxArrowDown, x: OFF[0] - 1.25, y: 1.8 - 0.1 * Math.sin(t * 5), z: OFF[2] + 0.2, w: 0.3 * a, h: 0.45 * a }); }
      sweat(OFF[0] + 0.3, 1.85, OFF[2] - 0.1, 0); sweat(OFF[0] + 0.45, 1.8, OFF[2] - 0.1, 1);
      if (f >= bl) burst(bl, OFF[0] - 1.25, 1.2, OFF[2] + 0.3, 1.4, "#ff5a4a", 12);
    }
    if (id === 10) {
      const lo = wd(9, "loss"), hr = wd(9, "harder"), n = 25, red = f < lo ? 0 : f < hr ? 1 : Math.round(1 + 24 * easeOut(at(f, hr, 18))), wob = f < hr ? 0 : 14 * Math.sin((f - hr) * 0.9) * Math.exp(-(f - hr) / 30);
      tower(STU[0] + 0.55, STU[2] - 0.1, n, wob, red, 0.78);
      if (f >= lo && f < hr + 18) { const u = popIn(at(f, lo, 9)); fxs.push({ key: "arrow", cw: 200, ch: 300, draw: fxArrowDown, x: STU[0] + 0.55, y: 2.7, z: STU[2], w: 0.3 * u, h: 0.45 * u }); }
      if (f >= hr) { burst(hr, STU[0] + 0.55, 1.6, STU[2], 1.8, "#ff5a4a", 14); stars(STU[0] - 0.85, 2.15, STU[2] + 0.2, 0.5); }
    }
    if (id === 11) {
      for (let i = 0; i < 7; i++) { const u = (t * 0.25 + h01(i, 3)) % 1; fxs.push({ key: "paper", cw: 120, ch: 150, draw: fxPaper, x: OFF[0] - 2.3 + 4.6 * u, y: 1.9 - 1.5 * ((u * 3 + i * 0.17) % 1), z: OFF[2] + 0.4 * (h01(i, 2) - 0.3), w: 0.22, h: 0.28, rot: t * 2.4 + i }); }
      fxs.push({ key: "coin", cw: 100, ch: 100, draw: fxCoin, x: OFF[0] + 0.45, y: 0.1, z: OFF[2] + 0.5, w: 0.22, h: 0.22 });
      stars(OFF[0], 2.3, OFF[2] - 0.2, 0.0001);
    }
    if (id === 12) {
      const cl = wd(11, "called"), fo = wd(11, "Fourteen"), cr = wd(11, "crash");
      fxs.push({ key: "bank", cw: 600, ch: 420, draw: fxBankFront, x: HALL[0], y: 2.7, z: HALL[2] - 2.85, w: 2.6, h: 1.82 });
      if (f >= cl - 8 && f < fo) { const ph = q((t * 1.6) % 1, 12); fxs.push({ key: `phoneR${ph}`, cw: 200, ch: 200, draw: (p) => fxPhoneRing(p, ph), x: HALL[0], y: 2.2, z: HALL[2] + 0.1, w: 0.7, h: 0.7 }); }
      const sag = f < fo ? 8 : 8 + 60 * Math.min(1, (f - fo) / 40) * (f >= cr ? Math.exp(-(f - cr) / 8) * Math.cos((f - cr) * 0.5) * 0.5 + 0.5 : 1);
      fxs.push({ key: `net${q(sag, 0.2)}`, cw: 700, ch: 320, draw: (p) => fxNet(p, sag), x: HALL[0], y: 0.75, z: HALL[2] + 0.45, w: 3.0, h: 1.37 });
      if (f >= fo) for (let i = 0; i < 14; i++) { const f0 = fo + i * 3, u = at(f, f0, 18); const bx = HALL[0] - 1.1 + 2.2 * h01(i, 7); if (u > 0 && u < 1) bag(bx, 3.4 - 2.4 * easeIn(u), HALL[2] + 0.3, 0.3, 0.6 * Math.sin(u * 8 + i)); else if (u >= 1) bag(bx, 0.55 + 0.04 * (i % 3), HALL[2] + 0.3 + 0.05 * (i % 2), 0.3); }
      if (f >= cr) burst(cr, HALL[0], 1.3, HALL[2] + 0.4, 1.8, "#3aff7a", 14);
    }
    if (id === 13) {
      const sh = wd(12, "sized"), wipe = wd(12, "wipe"), w2 = f >= wipe;
      const k = popIn(at(f, wd(12, "Thorp") + 4, 9)); fxs.push({ key: `shoeB${Math.floor(t * 3) % 2}`, cw: 360, ch: 240, draw: (p) => fxShoeB(p, Math.floor(t * 3) % 2), x: STU[0] - 0.45, y: 0.22, z: STU[2] + 0.75, w: 0.6 * k, h: 0.4 * k });
      for (let i = 0; i < 3; i++) { const u = popIn(at(f, sh + i * 4, 8)); if (u > 0) fxs.push({ key: "chipsS", cw: 200, ch: 260, draw: (p) => fxChips(p, 3, 0, "#3a8ae0"), x: STU[0] + 0.25 + 0.38 * i, y: 0.2, z: STU[2] + 0.62, w: 0.3 * u, h: 0.39 * u }); }
      const sway = w2 ? 0 : 9 * Math.sin(t * 6) * smooth(at(f, wipe - 30, 30));
      if (f >= wd(12, "bet") && !w2) tower(STU[0] + 1.15, STU[2] - 0.3, 25, sway, 0, 0.5);
      if (w2) { burst(wipe, STU[0] + 1.15, 1.0, STU[2] - 0.2, 1.4, "#ffe03a", 12); for (let i = 0; i < 7; i++) { const uu = at(f, wipe + i, 26); if (uu > 0 && uu < 1) fxs.push({ key: "bagS", cw: 200, ch: 220, draw: fxBag, x: STU[0] + 1.15 + (h01(i, 1) - 0.4) * 1.4 * uu, y: 0.3 + 1.0 * Math.sin(uu * 3.1) * (0.4 + h01(i, 2)), z: STU[2] + 0.2, w: 0.22, h: 0.24, rot: uu * 8 }); } puff(wipe, STU[0] + 1.15, 0.3, STU[2], 1.4, 16); }
    }
    if (id === 14) {
      const rt = wd(13, "right"), nb = wd(13, "enough"), big = wd(13, "big"), sv = wd(13, "survive");
      const v = f < big ? 0.12 : 0.12 + 0.86 * smooth(at(f, big, sv - big + 6)), shake = f >= sv ? 0.02 * Math.sin(t * 40) : 0;
      fxs.push({ key: `dial${q(v + shake, 40)}`, cw: 400, ch: 260, draw: (p) => fxDial(p, v + shake), x: STU[0] + 0.45, y: 2.1, z: STU[2] - 0.1, w: 1.7, h: 1.1 });
      if (f >= rt && f < nb) { const k = popIn(at(f, rt, 9)); fxs.push({ key: "check", cw: 200, ch: 200, draw: fxCheck, x: STU[0] - 0.7, y: 2.3, z: STU[2], w: 0.55 * k, h: 0.55 * k }); }
      if (f >= sv) burst(sv, STU[0] + 1.1, 2.1, STU[2], 1.6, "#ff5a4a", 14);
      if (f >= nb && f < big) burst(nb, STU[0] - 0.7, 2.3, STU[2], 1.1, "#ffe03a", 12);
    }
    if (id === 15) {
      const st = wd(14, "steamroller"), end = wf(14, -1) - L, u0 = at(f, st - 20, end - st + 20), sxm = 3.2 - 2.5 * smooth(u0);
      fxs.push({ key: "road", cw: 128, ch: 128, draw: (p) => { p.poly([[0, 0], [128, 0], [128, 128], [0, 128]], "#7a8494", 0); p.stroke([[0, 64], [128, 64]], 12, "#f6e26a"); }, x: STU[0], y: 0.01, z: STU[2] + 0.4, w: 8, h: 1.5, flat: true });
      for (let i = 0; i < 6; i++) { const flat = sxm - 1.2 < STU[0] - 1.6 + i * 0.28; if (!flat) fxs.push({ key: "coin", cw: 100, ch: 100, draw: fxCoin, x: STU[0] - 1.0 + i * 0.28, y: 0.1, z: STU[2] + 0.55, w: 0.22, h: 0.22 }); }
      const rot = -sxm * 4;
      fxs.push({ key: `steam${q(rot % (Math.PI * 2), 12)}`, cw: 700, ch: 400, draw: (p) => fxSteam(p, q(rot % (Math.PI * 2), 12)), x: STU[0] + sxm, y: 0.8, z: STU[2] + 0.1, w: 2.6, h: 1.49, yaw: 0 });
      if (f >= st) puff(st, STU[0] + sxm + 1.0, 1.5, STU[2], 1.0, 22);
      if (f >= end) { burst(end, STU[0] + sxm - 0.4, 0.5, STU[2] + 0.6, 1.6, "#ffe03a", 12); stars(STU[0] - 0.75, 2.3, STU[2] + 0.2, 0.5); }
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
void LS; void LE; void easeOut; void PILE; void fxNote; void fxStar; void smooth;
