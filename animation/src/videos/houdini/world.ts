// Every place of "The Last Escape" (all interior sets, built from the cartoon-3d-short skill's look modules; geometry,
// staging and gags are ours):
// - the séance room: plum damask walls, a round velvet table with candles and a crystal ball, Houdini's portrait;
// - the theatre: plank stage, red curtains, footlights; the cage, the dead whale, the water torture cell;
// - the room: study (Conan Doyle), dressing room (the punch), parlour (the password);
// - the studio cyclorama for the gag beats (Halloween, the book and the sour cream, the fake psychics);
// - the Knickerbocker Hotel roof in Los Angeles at night (the last of Bess's séances).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { rep, planksHD, stoneHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxContact, fxBurst, fxStars, Outfit, Expr, FrontOpts } from "../bridge/toon";
import { fxSpark, fxFlame, fxHeart, fxSmoke, fxStink } from "../castle/paintc";
import { talkAt } from "../../lib/talk";
import {
  FPS, SHOTS, LS, LE, wf, wi, WORDS, L, SEA, THE, ROOM, STU, ROOF, WHALE, TANK, TABLE, PORTRAIT, COUCH, RTABLE,
  Light, ShotDef, V3, camAt, popIn, at, smooth, easeOut, easeIn, add,
} from "./story";
import { HOUDINI, SWIM, DISGUISE, GHOST, BESS, DOYLE, COP, STUDENT, MEDIUM20, MEDIUM26, AUTHOR, ASSIST, REPORTER, folk, psychic } from "./people";
import {
  damaskTex, parlourTex, clothTex, theatreTex, curtainTex, nightLATex, bookTex, tubTex, frameRim, photoRim, fxCuffs, fxWatch,
  fxThermo, fxSweat, fxBubbles, fxAxe, fxPumpkin, fxLock, fxSheet, fxCamera, fxTumble, fxFairy,
} from "./painth";

// ---------------- light presets ----------------
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
const CYC: Record<number, string> = { 9: "#4a2a6a", 10: "#2ab0b8", 11: "#5a2a7a" };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RY = (yaw: number, x: number, y: number, z: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg).translate(0, h / 2, 0);
const SIT = 0.36; // a seated card's height above the floor so the seat lands on a 0.45 m chair

// séance seats round TABLE (offsets), the medium at the back
const SEATS: V3[] = [[0, SIT, -0.85], [-0.62, SIT, -0.55], [0.62, SIT, -0.55], [-0.78, SIT, 0.12], [0.78, SIT, 0.12]];

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
const tk = (t: number, i0: number, i1: number) => talkAt(WORDS, t, i0, i1);

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS, out: Who[] = [];
  const P3 = (o: Outfit, seed: number, p: V3, expr: Expr, extra: Partial<Who> = {}) => out.push({ o, seed, x: p[0], y: p[1], z: p[2], expr, ...extra });
  const seat = (k: number) => add(TABLE, SEATS[k]);
  switch (id) {
    case 1: { // 2026: the medium and four sitters, eyes shut, swaying; on "same dead man" they peek
      const peek = f >= wf(0, -3) - L;
      P3(MEDIUM26, 41, seat(0), peek ? "nervous" : "relief", { mode: "sit", noBlob: true, tilt: 4 * Math.sin(t * 2.2), wave: 0.5 + 0.5 * Math.sin(t * 3) });
      for (let k = 1; k < 5; k++) P3(folk(k + 20, true), 41 + k, seat(k), peek ? (k % 2 ? "shock" : "nervous") : "relief", { mode: "sit", noBlob: true, tilt: 3 * Math.sin(t * 2.2 + k), look: peek ? (k < 3 ? 1 : -1) * 0.6 : 0 });
      break;
    }
    case 2: { // the ghost behind the medium: arms crossed, bored; whistles and looks away on "a hundred years"
      const away = f >= wf(1, -3) - L;
      P3(MEDIUM26, 41, seat(0), "relief", { mode: "sit", noBlob: true, tilt: 5 * Math.sin(t * 2.4), wave: 0.5 + 0.5 * Math.sin(t * 3), talk: q(0.5 + 0.5 * Math.sin(t * 9), 4) });
      P3(GHOST, 7, add(TABLE, [0.55, 0.12 + 0.05 * Math.sin(t * 2), -1.5]), away ? "whistle" : "smug", { pose: "cross", noBlob: true, look: away ? 1 : -0.5, facing: away ? 1 : -1 });
      break;
    }
    case 3: { // cuffs fly off; a cage drops and bursts; then he climbs out of a dead whale
      const inWhale = f >= wf(2, 7) - 2;
      if (!inWhale) P3(HOUDINI, 1, add(THE, [0, 0, 0]), f < wf(2, 4) - L ? "stern" : f < wf(2, 5) - L ? "smug" : "proud", { pose: f >= wf(2, 4) - L && f < wf(2, 5) ? "fist" : undefined, wave: f > wf(2, 6) + 6 ? 1 : undefined });
      else { const u = at(f, wf(2, 9) - 6, 10); P3(HOUDINI, 1, add(WHALE, [-0.55, 1.35 * easeOut(u) - 0.6, 0.05]), u < 1 ? "dazed" : "queasy", { noBlob: true, tilt: 10 * Math.sin(u * 8) * (1 - u) }); }
      break;
    }
    case 4: { // upside down in the water cell; the assistant with the axe, sweating
      P3(SWIM, 1, add(TANK, [0, 2.12, 0.0]), f < wf(3, -2) - L ? "stern" : "smug", { roll: Math.PI, noBlob: true, scale: 0.86, phase: 0, tilt: 3 * Math.sin(t * 1.4) });
      P3(ASSIST, 51, add(TANK, [-0.72, 0, 0.45]), f < wf(3, -2) - L ? "nervous" : "scared", { facing: 1, tilt: 3 * Math.sin(t * 7) });
      break;
    }
    case 5: { // the 1920s séance: the bearded sitter stands up, rips off the beard; the cop pops in
      const up = f >= wf(4, 4) - L, rip = f >= wf(4, 7) - L, cop = f >= wf(4, -1) - L - 2;
      P3(MEDIUM20, 61, seat(0), up ? "shock" : "relief", { mode: "sit", noBlob: true, tilt: up ? 0 : 4 * Math.sin(t * 2.5) });
      P3(folk(3), 62, seat(2), up ? "shock" : "relief", { mode: "sit", noBlob: true, look: up ? -1 : 0 });
      P3(rip ? HOUDINI : DISGUISE, 1, up ? add(TABLE, [-0.62, 0, -0.1]) : seat(1), rip ? "grin" : up ? "stern" : "relief", { mode: up ? "stand" : "sit", noBlob: !up, pose: up ? "point" : undefined, facing: 1 });
      if (cop) P3(COP, 63, add(TABLE, [0.45, 0, 0.5]), "stern", { scale: popIn(at(f, wf(4, -1) - L - 2, 8)), pose: "point", facing: -1 });
      break;
    }
    case 6: { // Doyle points at Houdini; stars burst on "real magic powers"; Houdini shrugs
      const magic = f >= wf(5, -3) - L;
      P3(DOYLE, 71, add(ROOM, [-0.36, 0, -0.25]), f < wf(5, 7) - L ? "smile_closed" : "proud", { pose: f >= wf(5, 7) - L ? "point" : "hips", facing: 1 });
      P3(HOUDINI, 1, add(ROOM, [0.36, 0, 0.05]), magic ? "nervous" : "neutral", { pose: magic ? "shrug" : undefined, look: -1, facing: -1 });
      break;
    }
    case 7: { // the student walks in and punches; Houdini on the couch reading letters
      const fp = wf(6, 6) - L, hit = f >= fp;
      const x = -1.45 + 0.95 * smooth(at(f, LS[6], fp - LS[6] - 2));
      P3(HOUDINI, 1, add(COUCH, [0.15, 0.3, 0.05]), hit ? "shock" : "smile_closed", { mode: "sit", noBlob: true, prop: hit ? null : "scroll", tilt: hit ? -12 * Math.exp(-(f - fp) / 12) : 0, facing: hit ? 0 : -1 });
      P3(STUDENT, 81, add(COUCH, [x, 0, 0.15]), hit ? "grin" : "smile", { mode: f < fp - 4 ? "stroll" : "stand", phase: t * 1.6, pose: hit && f < fp + 18 ? "fist" : undefined, facing: 1 });
      break;
    }
    case 8: { // the show: a hunch on "burst", then a brave bow while the thermometer climbs
      const burst = f >= wf(7, 2) - L, brave = f >= wf(7, 6) - L;
      P3(HOUDINI, 1, add(THE, [-0.1, 0, 0]), !burst ? "smile" : brave ? (f > wf(7, -1) - L ? "shock" : "pained") : "queasy", {
        tilt: burst && !brave ? 14 : brave ? 4 * Math.sin(t * 5) : 0, pose: brave ? "hips" : undefined, wave: brave && f < wf(7, 10) ? 1 : undefined });
      break;
    }
    case 10: { // the author with the book, then pointing at the tub
      const tub = f >= wf(9, -2) - L;
      P3(AUTHOR, 91, add(STU, [0.38, 0, -0.1]), tub ? "smug" : "stern", { scale: popIn(at(f, wf(9, 6) - L - 4, 8)), pose: tub ? "point" : "hips", facing: -1 });
      break;
    }
    case 11: { // three fake psychics pop in; Houdini in front, hands on hips
      P3(HOUDINI, 1, add(STU, [-0.45, 0, 0.75]), f < wf(10, -2) - L ? "smug" : "sneer", { pose: "hips", facing: 1 });
      for (let k = 0; k < 3; k++) {
        const f0 = wf(10, 4) - L + k * 5;
        if (f < f0) continue;
        P3(psychic(k), 95 + k, add(STU, [-0.1 + k * 0.42, 0, -0.75 + 0.15 * k]), (["laugh", "grin", "smug"] as Expr[])[k], { scale: popIn(at(f, f0, 8)), wave: 0.5 + 0.5 * Math.sin(t * 7 + k * 2), facing: -1 });
      }
      break;
    }
    case 12: { // the password: Houdini leans in and whispers; Bess smiles
      const pw = f >= wf(11, -2) - L;
      P3(BESS, 2, add(ROOM, [-0.25, 0, -0.15]), pw ? "smile" : f >= wf(11, 6) - L ? "shock" : "smile_closed", { scale: 0.9, look: 1, facing: 1 });
      P3(HOUDINI, 1, add(ROOM, [0.25, 0, -0.32]), pw ? "smile" : "smug", { tilt: -9, facing: -1, look: -1, talk: tk(t, wi(11, 0), wi(11, -1)) > 0 ? q(0.25 + 0.25 * Math.sin(t * 20), 4) : 0 });
      break;
    }
    case 13: { // the roof: sitters vanish over the years; Bess and the medium stay
      P3(BESS, 2, add(RTABLE, [-0.25, SIT, -0.62]), f < wf(12, -1) - L ? "relief" : "neutral", { mode: "sit", noBlob: true, scale: 0.9 });
      P3(MEDIUM20, 61, add(RTABLE, [0.35, SIT, -0.6]), f < wf(12, -1) - L ? "relief" : "dazed", { mode: "sit", noBlob: true });
      const gone = [wf(12, 6), wf(12, 7), wf(12, 8)];
      [[-0.78, 0.05], [0.78, 0.05], [0.0, -0.95]].forEach(([dx, dz], k) => {
        const g = gone[k] - L; if (f >= g + 5) return;
        P3(folk(k + 30), 120 + k, add(RTABLE, [dx, SIT, dz]), "relief", { mode: "sit", noBlob: true, scale: 1 - easeIn(at(f, g, 5)) });
      });
      break;
    }
    case 14: { // Bess blows out the candle, then delivers her line (lip-synced on the quote)
      const blow = f >= wf(13, 2) - L && f < wf(13, 5) + 6, quote = f >= wf(13, 8) - L;
      P3(BESS, 2, add(RTABLE, [-0.14, 0, -0.45]), blow ? "whistle" : quote ? (f >= wf(13, -1) - L ? "smug" : "smile_closed") : "neutral", {
        scale: 0.9, pose: quote ? "hips" : undefined, facing: blow ? 1 : 0, talk: quote ? tk(t, wi(13, 8), wi(13, -1)) : 0 });
      break;
    }
    case 15: { // 2026 séance: the medium whispers the password; the ghost appears on "Or his greatest escape" and winks
      const fr = f >= wf(14, -5) - L, esc = f >= wf(14, -4) - L;
      P3(MEDIUM26, 41, seat(0), fr ? (esc ? "shock" : "smug") : "relief", { mode: "sit", noBlob: true, talk: tk(t, wi(14, 5), wi(14, 6)), tilt: esc ? 0 : 4 * Math.sin(t * 2.2) });
      P3(folk(21, true), 42, seat(1), fr ? (esc ? "shock" : "smug") : "relief", { mode: "sit", noBlob: true, look: fr ? 1 : 0 });
      P3(folk(22, true), 43, seat(2), esc ? "shock" : "relief", { mode: "sit", noBlob: true });
      if (esc) {
        const u = at(f, wf(14, -4) - L, 8), gone = at(f, LE[14] + 18, 6);
        P3(GHOST, 7, add(TABLE, [0.5, 0.15 + 0.05 * Math.sin(t * 2), -1.4]), f > wf(14, -1) ? "grin" : "smug", { pose: "hips", noBlob: true, scale: popIn(u) * (1 - easeIn(gone)) || 0.001, facing: -1 });
      }
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
  private sets: Record<string, THREE.Group> = { seance: new THREE.Group(), theatre: new THREE.Group(), room: new THREE.Group(), studio: new THREE.Group(), roof: new THREE.Group() };
  private cycMat!: THREE.MeshLambertMaterial;
  private ball = new THREE.Group(); private trumpet = new THREE.Group();
  private cage: THREE.Group[] = []; private whale = new THREE.Group(); private tank = new THREE.Group();
  private mirror = new THREE.Group(); private rack = new THREE.Group(); private desk = new THREE.Group(); private tea = new THREE.Group();
  private chair = new THREE.Group(); private book = new THREE.Group(); private tub = new THREE.Group(); private balls: THREE.Group[] = [];
  private moon!: THREE.Mesh;
  private candles: { set: string; p: THREE.Vector3; g?: THREE.Object3D }[] = [];
  private roofCandle = new THREE.Group();
  private frustumC = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    Object.values(this.sets).forEach((g) => { g.visible = false; R.add(g); });
    this.buildSeance(); this.buildTheatre(); this.buildRoom(); this.buildStudio(); this.buildRoof();
  }

  private candle(G: THREE.Group, b: Batch, set: string, x: number, y: number, z: number, h = 0.2) {
    b.add(cyl(0.032, h, 12), lam("candleWax", () => ({ color: "#f4efe2" })), T(x, y, z));
    b.add(cyl(0.06, 0.02, 16), lam("candleDish", () => ({ color: "#c89a3a" })), T(x, y, z));
    this.candles.push({ set, p: V(x, y + h + 0.05, z) });
    void G;
  }

  /** a room shell: floor, back wall and side walls, with skirting */
  private shell(b: Batch, c: V3, w: number, d: number, h: number, wall: THREE.Material, floor: THREE.Material, back = -2.9) {
    const [x, , z] = c;
    b.add(boxGeo(V(x - w / 2, -0.2, z + back - 0.1), V(x + w / 2, 0, z + d), 2), floor);
    b.add(boxGeo(V(x - w / 2, 0, z + back - 0.2), V(x + w / 2, h, z + back), 3), wall);
    b.add(boxGeo(V(x - w / 2 - 0.2, 0, z + back), V(x - w / 2, h, z + d), 3), wall);
    b.add(boxGeo(V(x + w / 2, 0, z + back), V(x + w / 2 + 0.2, h, z + d), 3), wall);
    b.add(boxGeo(V(x - w / 2, 0, z + back), V(x + w / 2, 0.14, z + back + 0.06)), lam("skirting", () => ({ color: "#3a2420" })));
    b.add(boxGeo(V(x - w / 2, h - 0.2, z + back), V(x + w / 2, h, z + back + 0.1)), lam("cornice", () => ({ color: "#d8c8a8" })));
  }

  // ---------------- the séance room ----------------
  private buildSeance() {
    const b = new Batch(), G = this.sets.seance, [tx, , tz] = TABLE;
    this.shell(b, SEA, 9, 7, 3.6, lam("damaskWall", () => ({ map: rep(damaskTex(), 3, 1.2) })), lam("seanceFloor", () => ({ map: rep(planksHD(), 1.5, 1.5) })));
    // a rug, the table with its cloth, chairs
    b.add(new THREE.CircleGeometry(2.2, 40).rotateX(-Math.PI / 2).translate(tx, 0.01, tz), lam("rug", () => ({ color: "#8a3a3a" })));
    b.add(new THREE.CircleGeometry(1.8, 40).rotateX(-Math.PI / 2).translate(tx, 0.012, tz), lam("rug2", () => ({ color: "#c89a3a" })));
    b.add(new THREE.CircleGeometry(1.65, 40).rotateX(-Math.PI / 2).translate(tx, 0.014, tz), lam("rug3", () => ({ color: "#6a2a3a" })));
    b.add(new THREE.CylinderGeometry(0.7, 0.74, 0.74, 40, 1, true).translate(tx, 0.37, tz), lam("tableCloth", () => ({ map: clothTex(), side: THREE.DoubleSide })));
    b.add(cyl(0.7, 0.03, 40), lam("tableTop", () => ({ color: "#6a2038" })), T(tx, 0.73, tz));
    const wood = lam("chairWood", () => ({ color: "#4a2a20" }));
    SEATS.forEach(([dx, , dz]) => {
      const x = tx + dx, z = tz + dz, yaw = Math.atan2(-dx, -dz);
      b.add(boxGeo(V(-0.24, 0.42, -0.22), V(0.24, 0.47, 0.22)), wood, RY(yaw, x, 0, z));
      b.add(boxGeo(V(-0.24, 0.47, 0.18), V(0.24, 1.15, 0.24)), wood, RY(yaw + Math.PI, x, 0, z).multiply(T(0, 0, 0.02)));
      for (const [lx, lz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) b.add(boxGeo(V(lx - 0.025, 0, lz - 0.025), V(lx + 0.025, 0.42, lz + 0.025)), wood, RY(yaw, x, 0, z));
    });
    for (const [dx, dz, h] of [[-0.32, 0.12, 0.22], [0.34, 0.1, 0.16], [0.05, -0.38, 0.26]] as const) this.candle(G, b, "seance", tx + dx, 0.75, tz + dz, h);
    // a cabinet, a tall candelabra, curtains at a side window, a mantel clock
    b.add(boxGeo(V(SEA[0] - 4.3, 0, SEA[2] - 2.8), V(SEA[0] - 3.1, 1.5, SEA[2] - 2.3)), lam("cabinetDark", () => ({ color: "#3a2420" })));
    for (let k = 0; k < 5; k++) b.add(boxGeo(V(-0.07, 0, -0.06), V(0.07, 0.22 + 0.08 * (k % 2), 0.06)), lam("bookDark" + (k % 3), () => ({ color: ["#7a2a2a", "#2a4a5a", "#6a5a2a"][k % 3] })), T(SEA[0] - 4.1 + k * 0.17, 1.5, SEA[2] - 2.55));
    b.add(cyl(0.12, 0.04, 16), lam("brass", () => ({ color: "#c89a3a" })), T(SEA[0] + 1.9, 0, SEA[2] - 2.2)); b.add(cyl(0.025, 1.6, 8), lam("brass", () => ({})), T(SEA[0] + 1.9, 0, SEA[2] - 2.2));
    b.add(boxGeo(V(-0.45, 1.6, -0.02), V(0.45, 1.64, 0.02)), lam("brass", () => ({})), T(SEA[0] + 1.9, 0, SEA[2] - 2.2));
    for (const dx of [-0.42, 0, 0.42]) this.candle(G, b, "seance", SEA[0] + 1.9 + dx, 1.64, SEA[2] - 2.2, 0.22);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.2).translate(0, 1.6, 0), lam("curtainVelvetH", () => ({ map: curtainTex(), side: THREE.DoubleSide }))); c.position.set(SEA[0] - 2.2 + s * 0.75, 0, SEA[2] - 2.68); G.add(c); }
    b.add(boxGeo(V(SEA[0] - 2.8, 0.9, SEA[2] - 2.72), V(SEA[0] - 1.6, 2.8, SEA[2] - 2.7)), lam("nightGlass", () => ({ color: "#1a2448" })));
    // the crystal ball on its stand
    b.add(cyl(0.1, 0.06, 20, 0.07), lam("brass", () => ({})), T(tx, 0.75, tz - 0.05));
    b.build(G);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.9, 1.8) }));
    ball.layers.set(NOINK); this.ball.add(ball); this.ball.position.set(tx, 0.94, tz - 0.05); G.add(this.ball);
    // the 1920s trumpet (a medium's prop) floating on a thread
    const tr = new Batch(); tr.add(new THREE.ConeGeometry(0.12, 0.6, 20, 1, true).rotateZ(Math.PI / 2), lam("tinTrumpet", () => ({ color: "#d8d6cc", side: THREE.DoubleSide }))); tr.build(this.trumpet);
    G.add(this.trumpet);
  }

  // ---------------- the theatre ----------------
  private buildTheatre() {
    const b = new Batch(), G = this.sets.theatre, [x, , z] = THE;
    b.add(boxGeo(V(x - 7, -0.2, z - 3.8), V(x + 7, 0, z + 1.8), 2), lam("stageFloor", () => ({ map: rep(planksHD(), 2.5, 1.2) })));
    b.add(boxGeo(V(x - 7, -1.2, z + 1.8), V(x + 7, 0, z + 1.9)), lam("apron", () => ({ color: "#3a2016" })));
    b.add(boxGeo(V(x - 7, -1.4, z + 1.9), V(x + 7, -1.2, z + 14)), lam("pitFloor", () => ({ color: "#2a1418" })));
    b.add(boxGeo(V(x - 7, 0, z - 4.2), V(x + 7, 8, z - 4.0)), lam("theatreWall", () => ({ map: rep(theatreTex(), 4, 2) })));
    const curt = lam("curtainStage", () => ({ map: rep(curtainTex(), 4, 1), side: THREE.DoubleSide }));
    b.add(new THREE.PlaneGeometry(10, 6.5).translate(x, 3.25, z - 3.7), curt);
    for (const s of [-1, 1]) b.add(new THREE.PlaneGeometry(2.2, 6.5).rotateY(-s * 0.5).translate(x + s * 3.4, 3.25, z - 1.2), curt);
    b.add(boxGeo(V(x - 6, 5.2, z - 3.0), V(x + 6, 6.6, z - 2.9)), lam("valance", () => ({ color: "#a8202e" })));
    b.add(boxGeo(V(x - 6, 5.15, z - 2.95), V(x + 6, 5.25, z - 2.85)), lam("goldTrim", () => ({ color: "#d8a84a" })));
    // footlight trough
    b.add(boxGeo(V(x - 5, 0, z + 1.55), V(x + 5, 0.14, z + 1.75)), lam("trough", () => ({ color: "#2a2226" })));
    b.build(G);
    const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.1, 1.3) });
    for (let k = 0; k < 21; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), bulbM); m.position.set(x - 5 + k * 0.5, 0.16, z + 1.62); m.layers.set(NOINK); G.add(m); }
    // a prop trunk and a chair at the side, for depth
    const pb = new Batch();
    pb.add(boxGeo(V(x - 2.6, 0, z - 2.2), V(x - 1.6, 0.6, z - 1.6)), lam("trunk", () => ({ color: "#6a3a20" })));
    pb.add(boxGeo(V(x - 2.62, 0.25, z - 2.22), V(x - 1.58, 0.3, z - 1.58)), lam("brass", () => ({ color: "#c89a3a" })));
    pb.build(G);
    // the cage: four barred panels that drop and burst
    const bar = lam("ironBar", () => ({ color: "#2e3238" }));
    for (let k = 0; k < 4; k++) {
      const g = new THREE.Group(), pbt = new Batch();
      for (let i = 0; i < 6; i++) pbt.add(cyl(0.025, 2.4, 8), bar, T(-0.55 + i * 0.22, 0, 0));
      pbt.add(boxGeo(V(-0.6, 2.3, -0.04), V(0.6, 2.4, 0.04)), bar); pbt.add(boxGeo(V(-0.6, 0, -0.04), V(0.6, 0.08, 0.04)), bar);
      pbt.build(g);
      const holder = new THREE.Group(); holder.add(g); holder.rotation.y = (k * Math.PI) / 2; g.position.z = 0.6;
      this.cage.push(holder); G.add(holder);
    }
    // the dead whale: a grey-blue hulk lying on stage, flukes up
    const wb = new Batch(), skin = lam("whaleSkin", () => ({ color: "#5a6a8a" })), belly = lam("whaleBelly", () => ({ color: "#c8ccd4" }));
    wb.add(new THREE.SphereGeometry(1, 32, 20).scale(1.9, 0.8, 0.85).translate(0, 0.75, 0), skin);
    wb.add(new THREE.SphereGeometry(1, 32, 20).scale(1.7, 0.45, 0.7).translate(-0.1, 0.42, 0.12), belly);
    wb.add(new THREE.ConeGeometry(0.42, 1.4, 16).rotateZ(Math.PI / 2).translate(2.3, 0.85, 0), skin);
    wb.add(boxGeo(V(-0.12, -0.1, -0.85), V(0.12, 0.1, 0.85)), skin, new THREE.Matrix4().makeRotationZ(0.5).setPosition(3.0, 1.15, 0));
    wb.build(this.whale); this.whale.position.set(...WHALE); G.add(this.whale);
    // the water torture cell
    const steel = lam("cellSteel", () => ({ color: "#3a4048" })), tw = 0.42, th = 2.3;
    const tb = new Batch();
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tb.add(boxGeo(V(sx * tw - 0.04, 0, sz * tw - 0.04), V(sx * tw + 0.04, th, sz * tw + 0.04)), steel);
    tb.add(boxGeo(V(-tw - 0.05, 0, -tw - 0.05), V(tw + 0.05, 0.16, tw + 0.05)), steel);
    tb.add(boxGeo(V(-tw - 0.06, th, -tw - 0.06), V(tw + 0.06, th + 0.14, tw + 0.06)), lam("stocksWood", () => ({ color: "#8a5a34" })));
    tb.add(boxGeo(V(-0.6, th + 0.14, -0.08), V(0.6, th + 0.24, 0.08)), steel);
    tb.build(this.tank);
    const water = new THREE.Mesh(new THREE.BoxGeometry(2 * tw - 0.04, th - 0.25, 2 * tw - 0.04).translate(0, 0.16 + (th - 0.25) / 2, 0),
      new THREE.MeshBasicMaterial({ color: "#4ab0e0", transparent: true, opacity: 0.22, depthWrite: false }));
    water.layers.set(NOINK); water.renderOrder = 3; this.tank.add(water);
    this.tank.position.set(...TANK); G.add(this.tank);
  }

  // ---------------- the room (study / dressing room / parlour) ----------------
  private buildRoom() {
    const b = new Batch(), G = this.sets.room, [x, , z] = ROOM;
    this.shell(b, ROOM, 8, 6, 3.4, lam("parlourWall", () => ({ map: rep(parlourTex(), 3, 1.2) })), lam("roomFloor", () => ({ map: rep(planksHD(), 1.5, 1.5) })), -2.4);
    b.add(boxGeo(V(x - 1.8, 0, z - 1.6), V(x + 1.8, 0.012, z + 1.0)), lam("rugBlue", () => ({ color: "#3a4a7a" })));
    b.add(boxGeo(V(x - 1.6, 0.012, z - 1.4), V(x + 1.6, 0.014, z + 0.8)), lam("rugBlue2", () => ({ color: "#b8823a" })));
    // the couch (COUCH)
    const fab = lam("couchFabric", () => ({ color: "#3a7a6a" })), [cx, , cz] = COUCH;
    b.add(boxGeo(V(cx - 1.0, 0.2, cz - 0.4), V(cx + 1.0, 0.45, cz + 0.4)), fab); b.add(boxGeo(V(cx - 1.0, 0.45, cz - 0.5), V(cx + 1.0, 1.0, cz - 0.28)), fab);
    for (const s of [-1, 1]) b.add(boxGeo(V(cx + s * 1.0 - 0.16, 0.2, cz - 0.45), V(cx + s * 1.0 + 0.16, 0.66, cz + 0.4)), fab);
    for (const s of [-1, 1]) b.add(cyl(0.04, 0.2, 8), lam("couchLeg", () => ({ color: "#4a3426" })), T(cx + s * 0.85, 0, cz + 0.3));
    // bookshelf left, a floor lamp, a window with night
    const wood2 = lam("shelfWood", () => ({ color: "#5a3424" }));
    b.add(boxGeo(V(x - 3.2, 0, z - 2.35), V(x - 1.9, 2.4, z - 1.95)), wood2);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) b.add(boxGeo(V(x - 3.15 + k * 0.17, 0.12 + r * 0.58, z - 2.0), V(x - 3.02 + k * 0.17, 0.5 + r * 0.58 + 0.04 * (k % 2), z - 1.96)), lam("rbook" + ((k + r) % 4), () => ({ color: ["#8a2a2a", "#2a4a6a", "#3a6a3a", "#b8823a"][(k + r) % 4] })));
    b.add(cyl(0.18, 0.04, 16), lam("lampBase", () => ({ color: "#2a2226" })), T(x + 2.5, 0, z - 1.9)); b.add(cyl(0.025, 1.6, 8), lam("lampBase", () => ({})), T(x + 2.5, 0, z - 1.9));
    b.add(new THREE.ConeGeometry(0.32, 0.36, 18, 1, true).translate(x + 2.5, 1.78, z - 1.9), lam("lampShade", () => ({ color: "#e8b84a", side: THREE.DoubleSide })));
    b.add(boxGeo(V(x + 0.6, 1.0, z - 2.39), V(x + 1.8, 2.5, z - 2.37)), lam("roomNightGlass", () => ({ color: "#1e2a58" })));
    b.build(G);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8).translate(x + 2.5, 1.68, z - 1.9), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8) })); bulb.layers.set(NOINK); G.add(bulb);
    // dressing room: a vanity mirror with bulbs, a costume rack (shot 7)
    const mb = new Batch();
    mb.add(boxGeo(V(-0.6, 0.75, -0.02), V(0.6, 1.9, 0.0)), lam("mirrorFrame", () => ({ color: "#2a2226" })));
    mb.add(boxGeo(V(-0.52, 0.83, 0.0), V(0.52, 1.82, 0.01)), lam("mirrorGlass", () => ({ color: "#9ab4c8" })));
    mb.add(boxGeo(V(-0.7, 0.7, 0), V(0.7, 0.76, 0.45)), lam("vanityTop", () => ({ color: "#6a4026" })));
    mb.build(this.mirror);
    const mbulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.4, 1.6) });
    for (let k = 0; k < 10; k++) { const a = k / 9; const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mbulb); m.position.set(-0.6 + 1.2 * a, 1.93, 0.03); m.layers.set(NOINK); this.mirror.add(m); }
    this.mirror.position.set(x + 1.6, 0, z - 2.36); G.add(this.mirror);
    const rb = new Batch();
    rb.add(cyl(0.02, 1.7, 8), lam("rackMetal", () => ({ color: "#2a2a30" })), T(-0.6, 0, 0)); rb.add(cyl(0.02, 1.7, 8), lam("rackMetal", () => ({})), T(0.6, 0, 0));
    rb.add(boxGeo(V(-0.62, 1.68, -0.02), V(0.62, 1.72, 0.02)), lam("rackMetal", () => ({})));
    ["#c8323a", "#25222c", "#e8b84a", "#3a6a9a"].forEach((c, k) => rb.add(boxGeo(V(-0.45 + k * 0.28, 0.75, -0.18), V(-0.25 + k * 0.28, 1.66, 0.18)), lam("costume" + k, () => ({ color: c }))));
    rb.build(this.rack); this.rack.position.set(x - 1.5, 0, z - 1.7); G.add(this.rack);
    // study: a desk with a globe and papers (shot 6)
    const db = new Batch(), dw = lam("deskOak", () => ({ color: "#7a4a2a" }));
    db.add(boxGeo(V(-0.8, 0.72, -0.4), V(0.8, 0.78, 0.4)), dw);
    for (const s of [-1, 1]) db.add(boxGeo(V(s * 0.8 - (s > 0 ? 0.35 : 0), 0, -0.38), V(s * 0.8 + (s < 0 ? 0.35 : 0), 0.72, 0.38)), lam("deskOakDark", () => ({ color: "#5a3420" })));
    db.add(cyl(0.03, 0.25, 8), dw, T(0.5, 0.78, 0)); db.add(new THREE.SphereGeometry(0.2, 20, 14).translate(0.5, 1.2, 0), lam("globeSea", () => ({ color: "#5a9ad0" })));
    for (let k = 0; k < 5; k++) db.add(boxGeo(V(-0.15, 0, -0.1), V(0.15, 0.004, 0.1)), lam("paperSheet", () => ({ color: "#fbf7ec" })), RY(k, -0.3 + 0.1 * k, 0.78 + 0.004 * k, 0.05));
    db.build(this.desk); this.desk.position.set(x + 0.9, 0, z - 1.5); G.add(this.desk);
    // parlour: a tea table (shot 12)
    const tb = new Batch();
    tb.add(cyl(0.35, 0.03, 24), lam("teaTable", () => ({ color: "#6a4026" })), T(0, 0.6, 0)); tb.add(cyl(0.04, 0.6, 8), lam("teaTable", () => ({})));
    tb.add(cyl(0.07, 0.14, 16), lam("teapot", () => ({ color: "#f4efe2" })), T(-0.1, 0.63, 0)); tb.add(cyl(0.045, 0.06, 12), lam("teacup", () => ({ color: "#e86e9a" })), T(0.15, 0.63, 0.05));
    tb.build(this.tea); this.tea.position.set(x - 1.2, 0, z - 0.9); G.add(this.tea);
  }

  // ---------------- the studio cyclorama and its props ----------------
  private buildStudio() {
    const G = this.sets.studio, [sx, , sz] = STU;
    this.cycMat = new THREE.MeshLambertMaterial({ color: "#2ab0b8" });
    const R0 = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2).translate(sx, 0, sz + 2), this.cycMat); floor.receiveShadow = true; G.add(floor);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 30, 24, 1, true, Math.PI, Math.PI / 2).rotateZ(Math.PI / 2).translate(sx, R0, sz - 5), this.cycMat);
    (curve.material as THREE.MeshLambertMaterial).side = THREE.DoubleSide; curve.receiveShadow = true; G.add(curve);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 16).translate(sx, R0 + 8, sz - 5 - R0), this.cycMat); back.receiveShadow = true; G.add(back);
    // Halloween: an empty chair (handcuffs on its seat drawn as an effect), a stool with a candle
    const cb = new Batch(), wood = lam("chairWood", () => ({ color: "#4a2a20" }));
    cb.add(boxGeo(V(-0.26, 0.45, -0.24), V(0.26, 0.5, 0.24)), wood); cb.add(boxGeo(V(-0.26, 0.5, -0.26), V(0.26, 1.25, -0.2)), wood);
    for (const [lx, lz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) cb.add(boxGeo(V(lx - 0.03, 0, lz - 0.03), V(lx + 0.03, 0.45, lz + 0.03)), wood);
    cb.add(cyl(0.18, 0.04, 16), wood, T(0.75, 0.6, 0.1)); cb.add(cyl(0.04, 0.6, 8), wood, T(0.75, 0, 0.1));
    cb.build(this.chair); this.chair.position.set(sx, 0, sz - 0.3); G.add(this.chair);
    const cnd = new Batch(); this.candle(G, cnd, "studio", sx + 0.75, 0.64, sz - 0.2, 0.24); cnd.build(G);
    // the book (a standing slab that slams down) and the giant sour-cream tub
    const jb = new Batch();
    jb.add(boxGeo(V(-0.5, 0, -0.09), V(0.5, 1.3, 0.09)), lam("bookPages", () => ({ color: "#f4efe2" })));
    jb.build(this.book); const cover = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.32).translate(0, 0.65, 0.095), lam("bookCoverM", () => ({ map: bookTex() }))); this.book.add(cover); G.add(this.book);
    const ub = new Batch();
    ub.add(new THREE.CylinderGeometry(0.42, 0.36, 0.55, 32, 1, true).translate(0, 0.275, 0), lam("tubSide", () => ({ map: rep(tubTex(), 3, 1), side: THREE.DoubleSide })));
    ub.add(cyl(0.36, 0.02, 32), lam("tubBottom", () => ({ color: "#fbfbf6" })));
    ub.add(cyl(0.45, 0.07, 32), lam("tubLid", () => ({ color: "#2c56b8" })), T(0, 0.55, 0));
    ub.build(this.tub); this.tub.position.set(sx - 0.22, 0, sz + 0.3); G.add(this.tub);
    // crystal balls for the psychics
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(...([[1.2, 0.9, 2.0], [0.9, 1.8, 1.6], [2.0, 1.4, 0.9]] as const)[k]) }));
      m.layers.set(NOINK); g.add(m); this.balls.push(g); G.add(g);
    }
  }

  // ---------------- the hotel roof at night ----------------
  private buildRoof() {
    const b = new Batch(), G = this.sets.roof, [x, , z] = ROOF, [tx, , tz] = RTABLE;
    b.add(boxGeo(V(x - 8, -0.2, z - 6), V(x + 8, 0, z + 6), 2), lam("roofTiles", () => ({ map: rep(stoneHD("roofTiles", ["#b8a48a", "#a8947a", "#c4b096", "#9a876e"], "#6a5a48"), 6, 6) })));
    const par = lam("parapet", () => ({ map: rep(stoneHD("parapet", ["#d8c8a8", "#cbb998", "#e2d2b4"], "#9a8a70"), 4, 0.5) }));
    b.add(boxGeo(V(x - 8, 0, z - 6.2), V(x + 8, 1.0, z - 5.8), 2), par);
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 8 - 0.2, 0, z - 6), V(x + s * 8 + 0.2, 1.0, z + 6), 2), par);
    // a water tower, chimneys, a vent
    const tw = lam("waterTower", () => ({ color: "#8a6a4a" }));
    b.add(cyl(1.1, 2.0, 24), tw, T(x - 4.5, 2.2, z - 4.2)); b.add(new THREE.ConeGeometry(1.25, 0.8, 24).translate(x - 4.5, 4.6, z - 4.2), lam("towerCap", () => ({ color: "#5a4a3a" })));
    for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) b.add(boxGeo(V(lx - 0.06, 0, lz - 0.06), V(lx + 0.06, 2.2, lz + 0.06)), lam("towerLeg", () => ({ color: "#3a3a40" })), T(x - 4.5, 0, z - 4.2));
    b.add(boxGeo(V(x + 3.2, 0, z - 4.6), V(x + 4.2, 1.8, z - 3.8), 2), lam("chimney", () => ({ color: "#a8584a" })));
    b.add(boxGeo(V(x + 5.0, 0, z - 2.5), V(x + 5.6, 1.2, z - 1.9)), lam("vent", () => ({ color: "#8a9098" })));
    // the table, white cloth, chairs; the candle by Houdini's photo
    b.add(new THREE.CylinderGeometry(0.62, 0.66, 0.74, 32, 1, true).translate(tx, 0.37, tz), lam("whiteCloth", () => ({ color: "#f4efe2", side: THREE.DoubleSide })));
    b.add(cyl(0.62, 0.03, 32), lam("whiteClothTop", () => ({ color: "#fbf8f0" })), T(tx, 0.73, tz));
    const wood = lam("chairWood", () => ({ color: "#4a2a20" }));
    for (const [dx, dz] of [[-0.25, -0.75], [0.35, -0.72], [-0.92, 0.0], [0.92, 0.0], [0, -1.1]]) {
      b.add(boxGeo(V(tx + dx - 0.22, 0.42, tz + dz - 0.2), V(tx + dx + 0.22, 0.47, tz + dz + 0.2)), wood);
      b.add(boxGeo(V(tx + dx - 0.22, 0.47, tz + dz - 0.24), V(tx + dx + 0.22, 1.1, tz + dz - 0.19)), wood);
    }
    b.build(G);
    const cb = new Batch(); this.candle(G, cb, "roof", 0, 0, 0, 0.26); cb.build(this.roofCandle);
    this.roofCandle.position.set(tx + 0.22, 0.75, tz + 0.12); G.add(this.roofCandle);
    const last = this.candles[this.candles.length - 1]; last.g = this.roofCandle;
    // the night: a skyline backdrop and a moon
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: nightLATex(), fog: false }));
    sky.position.set(x, 12, z - 40); sky.layers.set(NOINK); G.add(sky);
    this.moon = new THREE.Mesh(new THREE.CircleGeometry(1.8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.55, 1.3), fog: false }));
    this.moon.layers.set(NOINK); G.add(this.moon);
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
    // ---- props per shot ----
    this.ball.visible = id === 1 || id === 2 || id === 15;
    this.trumpet.visible = id === 5 && f < wf(4, 4) - L + 10;
    if (this.trumpet.visible) { const u = at(f, wf(4, 4) - L, 10); this.trumpet.position.set(TABLE[0] + 0.25, 1.55 + 0.08 * Math.sin(t * 3) - 0.8 * easeIn(u), TABLE[2] - 0.35); this.trumpet.rotation.set(0, 0.4, 0.3 * Math.sin(t * 2) + 2 * u); }
    // cage (shot 3): drops on "jail", bursts on "cells"
    const fD = wf(2, 5) - L, fB = wf(2, 6) + 2;
    this.cage.forEach((h, k) => {
      h.visible = id === 3 && f >= fD - 8 && f < wf(2, 7) + 2;
      if (!h.visible) return;
      const drop = 4 * (1 - easeIn(at(f, fD - 8, 8))), u = at(f, fB, 14), g = h.children[0];
      h.position.set(THE[0], drop, THE[2]);
      g.position.set(0, 2.2 * u - 3.6 * u * u, 0.6 + 2.2 * u); g.rotation.x = 1.4 * u * (k % 2 ? 1 : -1);
    });
    this.whale.visible = this.tank.visible = false;
    if (s.set === "theatre") { this.whale.visible = id === 3 && f >= wf(2, 7) - 10; this.tank.visible = id === 4; }
    // room dressing per shot
    this.mirror.visible = this.rack.visible = id === 7; this.desk.visible = id === 6; this.tea.visible = id === 12;
    // studio
    if (s.set === "studio") this.cycMat.color.set(CYC[id] ?? "#2ab0b8");
    this.chair.visible = id === 9;
    this.book.visible = id === 10 && f >= wf(9, 2) - L - 8;
    if (this.book.visible) { const u = at(f, wf(9, 2) - L - 8, wf(9, 3) - wf(9, 2) + 8); this.book.position.set(STU[0] - 0.22, 6 * (1 - easeIn(u)), STU[2] - 0.35); this.book.rotation.set(0, 0.2 * (1 - u), 0.3 * (1 - u)); }
    this.tub.visible = id === 10 && f >= wf(9, -2) - L - 2;
    if (this.tub.visible) this.tub.scale.setScalar(Math.max(0.001, popIn(at(f, wf(9, -2) - L - 2, 9))));
    this.balls.forEach((g, k) => { const f0 = wf(10, 4) - L + k * 5; g.visible = id === 11 && f >= f0; g.position.set(STU[0] - 0.1 + k * 0.42, 1.05 + 0.04 * Math.sin(t * 4 + k), STU[2] - 0.45 + 0.15 * k); g.scale.setScalar(Math.max(0.001, popIn(at(f, f0, 8)))); });
    // roof: the moon races across the sky through the ten years (shot 13), then hangs (shot 14)
    if (s.set === "roof") {
      const yrs = id === 13 ? at(f, wf(12, 4) - L, wf(12, 8) - wf(12, 4) + 8) : 1, a = (yrs * 10) % 1;
      const mx = id === 13 ? -26 + 52 * a : 9, my = id === 13 ? 8 + 14 * Math.sin(Math.PI * a) : 18;
      this.moon.position.set(ROOF[0] + mx, my, ROOF[2] - 39);
      this.roofCandle.scale.set(1, id === 13 ? 1 - 0.5 * yrs : 0.5, 1);
    }

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx2 = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx2) / (Math.PI / 4)) * (Math.PI / 4);
    type Pl = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number; scale: number; sx: number; roll: number };
    const places: Pl[] = [], fxs: FxP[] = [];
    const blobCol = s.set === "studio" ? "#6a5a6a" : "#5a4a4a";
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
    /** a framed bust of Houdini (the portrait on the séance wall, the photo on the roof table) */
    const bust = (key: string, cw: number, ch: number, rim: (p: Pen) => void, o: Outfit, fo: FrontOpts, bg: string) => (p: Pen) => {
      const g = p.g; g.save();
      g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
      g.beginPath(); g.rect(cw * 0.08, ch * 0.08, cw * 0.84, ch * 0.84); g.clip();
      const s2 = (cw / 600) * 1.45; g.translate(cw / 2, ch * 0.62); g.scale(s2, s2); g.translate(-300, -300);
      bodyFront(p, o, fo); g.restore(); rim(p); void key;
    };
    // candle flames in the active set (the roof candle goes out in shot 14)
    const outAt = id === 14 ? wf(13, 4) - 2 : id === 15 ? wf(14, -4) - L : 1e9;
    this.candles.forEach((cv, i) => {
      if (cv.set !== s.set || (cv.set === "studio" && id !== 9)) return;
      if (f >= outAt && (id === 15 ? f < wf(14, -1) + 4 : true)) return; // shot 15: all blow out on "Or", relight on "escape"
      const wp = cv.p.clone();
      if (cv.g) { wp.set(0, (0.26 + 0.05) * cv.g.scale.y, 0).add(cv.g.position); }
      const ph = q(((t * 3 + i * 0.37) % 1), 6);
      fxs.push({ key: `flame${ph}`, cw: 100, ch: 150, draw: (p) => fxFlame(p, ph), x: wp.x, y: wp.y + 0.02, z: wp.z, w: 0.07, h: 0.11 });
    });
    if (id === 1 || id === 2 || id === 15) { // the portrait on the wall: smug; rolls its eyes on "same dead man"; winks at the end
      const ex: Expr = id === 1 ? (f >= wf(0, -3) - L ? "dazed" : "smug") : id === 2 ? "smug" : f >= wf(14, -1) - L ? "grin" : "smug";
      const fo: FrontOpts = { expr: ex, mode: "stand", seed: 1, light: light2, look: id === 1 && f >= wf(0, -3) - L ? 1 : 0, blink: id === 15 && f >= wf(14, -1) && f < wf(14, -1) + 8 ? 1 : 0 };
      const key = `portrait|${ex}|${fo.look}|${fo.blink}`;
      fxs.push({ key, cw: 600, ch: 600, draw: bust(key, 600, 600, frameRim, HOUDINI, fo, "#2a3a4a"), x: PORTRAIT[0], y: PORTRAIT[1], z: PORTRAIT[2], w: 0.95, h: 0.95, yaw: 0 });
    }
    if (id === 2 || (id === 15 && f >= wf(14, -4) - L)) { // a cold blue haze round the ghost
      const ph = q((t * 0.5) % 1, 10);
      fxs.push({ key: `haze${ph}`, cw: 300, ch: 300, draw: (p) => { for (let i = 0; i < 4; i++) p.ell(150 + 60 * Math.cos(ph * 6.28 + i * 1.6), 150 + 30 * Math.sin(ph * 6.28 + i), 90, 120, "rgba(160,210,255,0.16)", 0); }, x: TABLE[0] + (id === 2 ? 0.55 : 0.5), y: 1.2, z: TABLE[2] - 1.55, w: 1.8, h: 2.4, soft: true });
    }
    if (id === 1) spark(wf(0, -3) - L, PORTRAIT[0], PORTRAIT[1] + 0.3, PORTRAIT[2] + 0.1, 0.9, "#cfe6ff");
    if (id === 3) {
      const fc = wf(2, 4) - L, u = at(f, fc, 16);
      if (f < wf(2, 7)) {
        const k = f < fc ? 0 : 1;
        fxs.push({ key: `cuffs${k}`, cw: 300, ch: 160, draw: (p) => fxCuffs(p, k), x: THE[0] + 0.0, y: 0.95 + 2.2 * u - 1.6 * u * u, z: THE[2] + 0.25, w: 0.42, h: 0.22, rot: 6 * u });
        spark(fc, THE[0], 1.0, THE[2] + 0.3, 1.0, "#ffe066");
        puff(fB, THE[0], 0.8, THE[2] + 0.4, 2.4, 20);
      } else {
        puff(wf(2, 9) - 6, WHALE[0] - 0.55, 1.4, WHALE[2] + 0.4, 1.8, 18);
        const ph = q((t * 0.8) % 1, 10);
        if (f > wf(2, 9)) fxs.push({ key: `stink${ph}`, cw: 200, ch: 300, draw: (p) => fxStink(p, ph), x: WHALE[0] - 0.55, y: 2.4, z: WHALE[2] + 0.3, w: 0.5, h: 0.75, soft: true });
        fxs.push({ key: "whaleEye", cw: 120, ch: 120, draw: (p) => { p.stroke([[25, 25], [95, 95]], 14); p.stroke([[95, 25], [25, 95]], 14); }, x: WHALE[0] - 1.35, y: 0.95, z: WHALE[2] + 0.62, w: 0.16, h: 0.16 });
      }
    }
    if (id === 4) { // bubbles, the stopwatch, the axe
      const ph = q((t * 0.7) % 1, 16);
      fxs.push({ key: `bubbles${ph}`, cw: 200, ch: 400, draw: (p) => fxBubbles(p, ph), x: TANK[0] + 0.2, y: 1.45, z: TANK[2] + 0.3, w: 0.36, h: 1.3, soft: true });
      const spin = f >= wf(3, -2) - L ? 0.6 * (f - (wf(3, -2) - L)) : 0, a = q((t * 0.4 + spin) % (Math.PI * 2), 24);
      fxs.push({ key: `watch${a}`, cw: 400, ch: 460, draw: (p) => fxWatch(p, a), x: TANK[0] + 0.62, y: 1.8 + 0.03 * Math.sin(t * 6), z: TANK[2] + 0.55, w: 0.5, h: 0.58 });
      fxs.push({ key: "axe", cw: 140, ch: 420, draw: fxAxe, x: TANK[0] - 0.55, y: 0.85, z: TANK[2] + 0.52, w: 0.25, h: 0.76, rot: -0.3 + 0.08 * Math.sin(t * 7) });
      if (f >= wf(3, -2) - L) for (let i = 0; i < 2; i++) fxs.push({ key: "sweat", cw: 80, ch: 110, draw: fxSweat, x: TANK[0] - 0.75 + 0.2 * i, y: 1.95 - 0.5 * (((t * 2 + i * 0.5) % 1)), z: TANK[2] + 0.45, w: 0.07, h: 0.1 });
    }
    if (id === 5) {
      const up = wf(4, 4) - L, rip = wf(4, 7) - L, cop = wf(4, -1) - L - 2;
      if (f < up + 10) { const u = at(f, up, 10), k = q((t * 2) % 1, 8); fxs.push({ key: `sheet${k}`, cw: 240, ch: 340, draw: (p) => fxSheet(p, k), x: TABLE[0] - 0.05, y: 1.75 + 0.1 * Math.sin(t * 3) - 1.0 * easeIn(u), z: TABLE[2] - 0.75, w: 0.5, h: 0.7, rot: 0.2 * Math.sin(t * 2.5) + u }); }
      puff(rip - 2, TABLE[0] - 0.62, 1.55, TABLE[2] + 0.05, 1.0, 16);
      { const u = at(f, rip, 22); if (u > 0 && u < 1) fxs.push({ key: "fakeBeard", cw: 160, ch: 160, draw: (p) => { p.ell(80, 70, 60, 55, "#9a9894", 6); p.ell(80, 40, 40, 16, "#efc39c", 0); }, x: TABLE[0] - 0.62 - 0.9 * u, y: 1.45 + 0.9 * u - 1.6 * u * u, z: TABLE[2] + 0.2, w: 0.3, h: 0.3, rot: u * 9 }); }
      puff(cop - 2, TABLE[0] + 0.45, 1.0, TABLE[2] + 0.55, 2.0, 18);
      if (f >= cop) { const fl = f < cop + 6 ? 1 : 0; fxs.push({ key: `camera${fl}`, cw: 260, ch: 220, draw: (p) => fxCamera(p, fl), x: TABLE[0] + 0.85, y: 1.7, z: TABLE[2] + 0.8, w: 0.4, h: 0.34 }); }
      if (f >= cop && f < cop + 5) burst(cop, TABLE[0] + 0.8, 1.85, TABLE[2] + 0.85, 1.4, "#ffffff", 5);
    }
    if (id === 6) {
      for (let i = 0; i < 3; i++) { const ph = q((t * 6 + i * 0.3) % 1, 6), a = t * 1.6 + i * 2.1; fxs.push({ key: `fairy${ph}`, cw: 120, ch: 110, draw: (p) => fxFairy(p, ph), x: ROOM[0] - 0.36 + 0.4 * Math.cos(a), y: 1.75 + 0.18 * Math.sin(a * 1.7), z: ROOM[2] - 0.2 + 0.3 * Math.sin(a), w: 0.17, h: 0.16 }); }
      const fm = wf(5, -3) - L;
      for (let i = 0; i < 4; i++) spark(fm + i * 4, ROOM[0] + 0.36 + [-0.3, 0.3, -0.25, 0.32][i], [2.05, 1.95, 1.0, 0.85][i], ROOM[2] + 0.2, 0.45, ["#ffe066", "#ff9ad0", "#9ad0ff", "#9af0a0"][i]);
    }
    if (id === 7) {
      const fp = wf(6, 6) - L;
      burst(fp, COUCH[0] - 0.05, 0.95, COUCH[2] + 0.35, 1.0, "#fff3b0", 12);
      if (f >= fp + 2 && f < LE[6] + 30) stars(COUCH[0] + 0.15, 1.75, COUCH[2] + 0.2, 0.5);
      if (f >= fp) for (let k = 0; k < 6; k++) { const u = at(f, fp + k, 24), a = k * 1.1; if (u > 0 && u < 1) fxs.push({ key: "letterFx", cw: 120, ch: 90, draw: (p) => p.poly([[6, 6], [114, 4], [116, 84], [4, 86]], "#fbf7ec", 4), x: COUCH[0] + 0.2 + Math.cos(a) * u * 0.8, y: 0.9 + 1.2 * Math.sin(u * 3) * (1 - u * 0.4), z: COUCH[2] + 0.3 + Math.sin(a) * u * 0.3, w: 0.2, h: 0.15, rot: u * 6 + k }); }
    }
    if (id === 8) {
      const burstF = wf(7, 2) - L, fev = wf(7, 10) - L, pop = wf(7, -1) - L;
      burst(burstF, THE[0] - 0.1, 0.95, THE[2] + 0.2, 1.1, "#ff6a4a", 12);
      const lvl = 0.25 + 0.75 * smooth(at(f, fev, pop - fev)), k = q(Math.min(1, lvl), 20);
      if (f < pop + 2) fxs.push({ key: `thermo${k}`, cw: 160, ch: 520, draw: (p) => fxThermo(p, k), x: THE[0] + 0.42, y: 1.25, z: THE[2] + 0.2, w: 0.3, h: 0.98, rot: 0.03 * Math.sin(t * 12) });
      spark(pop, THE[0] + 0.42, 1.75, THE[2] + 0.25, 1.4, "#ff6a4a"); burst(pop, THE[0] + 0.42, 1.6, THE[2] + 0.25, 1.6, "#e2323a", 16);
      if (f >= burstF) for (let i = 0; i < 3; i++) fxs.push({ key: "sweat", cw: 80, ch: 110, draw: fxSweat, x: THE[0] - 0.1 + [-0.22, 0.2, 0.05][i], y: 1.75 - 0.4 * (((t * 1.6 + i * 0.33) % 1)), z: THE[2] + 0.15, w: 0.07, h: 0.1 });
    }
    if (id === 9) { // pumpkins, the cuffs on the empty chair, falling leaves
      for (const [dx, dz, sz, i] of [[-0.5, 0.3, 0.5, 0], [-0.22, 0.85, 0.36, 1], [0.5, 0.7, 0.44, 2]] as const) {
        const gk = q(0.5 + 0.5 * Math.sin(t * 9 + i * 2), 4);
        fxs.push({ key: `pumpkin${gk}`, cw: 300, ch: 260, draw: (p) => fxPumpkin(p, gk), x: STU[0] + dx, y: sz * 0.43, z: STU[2] + dz, w: sz, h: sz * 0.87 });
      }
      fxs.push({ key: "cuffsSeat", cw: 300, ch: 160, draw: (p) => fxCuffs(p, 0.6), x: STU[0], y: 0.56, z: STU[2] - 0.15, w: 0.36, h: 0.19, rot: 0.2 });
      for (let i = 0; i < 7; i++) { const u = ((t * 0.18 + h01(i, 1)) % 1), col = ["#e8823a", "#c8423a", "#e8b84a"][i % 3]; fxs.push({ key: `leaf${col}`, cw: 80, ch: 50, draw: (p) => p.ell(40, 25, 34, 16, col, 4), x: STU[0] - 1.4 + 2.8 * h01(i, 2) + 0.3 * Math.sin(t * 2 + i), y: 3.0 - 3.0 * u, z: STU[2] + 0.4 * h01(i, 3), w: 0.12, h: 0.075, rot: t * 3 + i }); }
    }
    if (id === 10) {
      puff(wf(9, 3) - 1, STU[0] - 0.3, 0.25, STU[2] - 0.2, 2.6, 20);
      puff(wf(9, -2) - L, STU[0] - 0.22, 0.3, STU[2] + 0.4, 1.6, 18);
    }
    if (id === 11) for (let k = 0; k < 3; k++) puff(wf(10, 4) - L + k * 5 - 2, STU[0] - 0.1 + k * 0.42, 0.9, STU[2] - 0.6 + 0.15 * k, 1.4, 16);
    if (id === 12) {
      const fl = wf(11, 6) - L, sh = wf(11, -1) - L;
      if (f >= fl) { const k = q(at(f, sh, 8), 8); const pp = popIn(at(f, fl, 9)); fxs.push({ key: `lock${k}`, cw: 200, ch: 240, draw: (p) => fxLock(p, k), x: ROOM[0] + 0.02, y: 2.05 + 0.03 * Math.sin(t * 4), z: ROOM[2] - 0.1, w: 0.32 * pp, h: 0.38 * pp }); }
      spark(sh, ROOM[0] + 0.02, 2.05, ROOM[2] - 0.05, 0.9, "#ffe066");
      for (let i = 0; i < 2; i++) { const u = at(f, wf(11, -2) - L + i * 5, 30); if (u > 0 && u < 1) fxs.push({ key: "heart", cw: 120, ch: 120, draw: fxHeart, x: ROOM[0] - 0.28 + 0.2 * i, y: 1.55 + 0.6 * u, z: ROOM[2] - 0.05, w: 0.14 * popIn(u * 4), h: 0.14 * popIn(u * 4) }); }
    }
    if (id === 13) {
      [wf(12, 6), wf(12, 7), wf(12, 8)].forEach((g, k) => puff(g - L, RTABLE[0] + [-0.78, 0.78, 0][k], 0.95, RTABLE[2] + [0.05, 0.05, -0.95][k], 1.1, 16));
      const u = at(f, wf(12, -1) - L, 40); if (u > 0 && u < 1) { const a = q(u * 12, 12); fxs.push({ key: `tumble${a}`, cw: 200, ch: 200, draw: (p) => fxTumble(p, a), x: RTABLE[0] - 2.2 + 4.4 * u, y: 0.3 + 0.12 * Math.abs(Math.sin(u * 14)), z: RTABLE[2] + 0.9, w: 0.55, h: 0.55 }); }
    }
    if (id === 13 || id === 14) { // Houdini's photo by the candle
      const fo: FrontOpts = { expr: "smile_closed", mode: "stand", seed: 1, light: light2 };
      fxs.push({ key: "photoBust", cw: 320, ch: 400, draw: bust("photo", 320, 400, (p) => { p.g.save(); p.g.scale(2, 2); photoRim(p); p.g.restore(); }, HOUDINI, fo, "#d8c8a8"), x: RTABLE[0] + 0.42, y: 0.93, z: RTABLE[2] + 0.02, w: 0.2, h: 0.25, yaw: 0 });
    }
    if (id === 14) smoke(wf(13, 4) - 2, this.roofCandle.position.x, 1.12, this.roofCandle.position.z, 0.5, 30);
    if (id === 15) {
      const fr = wf(14, -5) - L, esc = wf(14, -4) - L;
      if (f >= fr && f < esc) fxs.push({ key: "phone", cw: 120, ch: 200, draw: (p) => { p.poly([[10, 6], [110, 6], [110, 194], [10, 194]], "#1e1e24", 5); p.poly([[20, 20], [100, 20], [100, 176], [20, 176]], "#9ad0ff", 0); for (let k = 0; k < 6; k++) p.poly([[28, 34 + k * 22], [92 - (k % 3) * 12, 34 + k * 22], [92 - (k % 3) * 12, 42 + k * 22], [28, 42 + k * 22]], "#3a5a8a", 0); }, x: TABLE[0] + 0.22, y: 1.05, z: TABLE[2] - 0.55, w: 0.1, h: 0.17 });
      for (const cv of this.candles) if (cv.set === "seance") smoke(esc, cv.p.x, cv.p.y + 0.05, cv.p.z, 0.35, 22);
      puff(esc - 2, TABLE[0] + 0.5, 1.2, TABLE[2] - 1.35, 2.4, 22);
      { const k = f >= esc ? 1 : 0; fxs.push({ key: `cuffs${k}`, cw: 300, ch: 160, draw: (p) => fxCuffs(p, k), x: TABLE[0] - 0.3, y: 0.8, z: TABLE[2] + 0.25, w: 0.3, h: 0.16, rot: 0.1 }); }
      if (f >= wf(14, -1)) for (const cv of this.candles) if (cv.set === "seance") spark(wf(14, -1), cv.p.x, cv.p.y + 0.05, cv.p.z, 0.3, "#ffe066");
      if (f > LE[14] + 18) puff(LE[14] + 18, TABLE[0] + 0.5, 1.3, TABLE[2] - 1.35, 2.2, 20);
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
void REPORTER; void LS;
