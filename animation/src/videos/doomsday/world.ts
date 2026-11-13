// Every place of "Doomsday Is Today":
// - the 1960 office (interior): wallpaper, a window on the night city, the chalkboard with the hyperbola, the desk with
//   a mechanical calculator, a lamp, books and papers, a wall clock that spins, the birthday cake with 115 candles;
// - the studio (interior): a seamless colour cyclorama with a spotlight for the gag beats (the flipping calendar, the
//   cult and the psychic swept away, the journal slam, the magician and his rabbit, the shrinking family, the sofa);
// - outside: a town plaza with a fountain and a clock tower (the doubling crowd, the time-lapse towers, golden hour),
//   a narrow street (the squeeze), the hills with the doomsday curve as a roller-coaster track, and a cliff with a
//   1960 convertible that brakes at the edge.
// Built from the cartoon-3d-short skill's look modules; geometry, staging and gags are ours.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, house } from "../bridge/build";
import { rep, cloudHD, planksHD, cobbleHD, grassHD, stoneHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxContact, fxBurst, Outfit, Expr, FrontOpts } from "../bridge/toon";
import { fxSpark, fxFlame } from "../castle/paintc";
import { fxDust } from "../emu/birds";
import {
  FPS, SHOTS, LS, LE, wf, OFF, STU, PLAZA, STREET, HILL, CLIFF, ASYM_X, curveY, BOARD, DESK, CAKE, coaster, carX,
  Light, ShotDef, V3, camAt, popIn, clamp01, at, smooth, easeOut, easeIn, add,
} from "./story";
import { HEINZ, MAGICIAN, MORA, AMIOT, expert, folk, MUM, DAD, kid } from "./people";
import { talkAt } from "../../lib/talk";
import { wallpaperTex, boardTex, nightTex, calTex, journalTex, curtainTex, envTex, towerTex } from "./paintd";

// ---------------- light presets ----------------
const P: Record<Light, LightPreset> = {
  day: { ...LIGHTS.day, fogNear: 160, fogFar: 1500, actorShadow: true },
  golden: { ...LIGHTS.golden, az: 70, el: 16, lit: [1.6, 1.02, 0.62], shade: [0.34, 0.29, 0.46], lift: [0.07, 0.06, 0.15], fogNear: 140, fogFar: 1300, actorShadow: true },
  inside: {
    ...LIGHTS.golden, az: 140, el: 40, lit: [1.62, 1.32, 1.02], shade: [0.34, 0.3, 0.46], lift: [0.08, 0.07, 0.12], term: 0.3,
    charTint: [1.0, 0.9, 0.78], fog: "#2a2a3a", fogNear: 14, fogFar: 90, actorShadow: true,
  },
  stage: {
    ...LIGHTS.day, az: 150, el: 38, lit: [1.55, 1.48, 1.38], shade: [0.42, 0.4, 0.52], lift: [0.08, 0.08, 0.12], term: 0.25,
    charTint: [1.0, 0.97, 0.94], fog: "#000000", fogNear: 200, fogFar: 900, actorShadow: true,
  },
};
const LK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, inside: { ...LOOK.golden, sat: 0.97 }, stage: { ...LOOK.day, sat: 1.0 } };
const SKYCOL: Record<"day" | "golden", string[]> = { day: LOOK.day.sky.c, golden: ["#ffd48c", "#ffc27c", "#f8a876", "#e2947e", "#b08290"] };
/** cyclorama colour per studio shot (a saturated pop-art backdrop per gag) */
const CYC: Record<number, string> = { 2: "#e8463c", 3: "#3b6fd2", 9: "#5a2a7a", 13: "#f2b33a", 16: "#2a3a6a" };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RY = (yaw: number, x: number, y: number, z: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg).translate(0, h / 2, 0);
const L = 3;
/** the coaster's pitch at frame f (rad) */
const trackAngle = (f: number) => { const s2 = Math.min(69.2, Math.max(0, coaster(f)[0] - HILL[0])); return Math.atan(Math.max(0, curveY(s2 + 0.3) - curveY(Math.max(0, s2 - 0.3))) / 0.6); };

/** outdoor ground: flat town, rolling hills round the curve, the cliff dropping toward +x */
export const groundY = (x: number, z: number) => {
  let y = 0;
  const r = Math.hypot(x, z + 30);
  if (r > 90) y += 6 * smooth((r - 90) / 80) * (0.5 + 0.5 * Math.sin(x * 0.02 + z * 0.015));
  const dz = Math.abs(z - CLIFF[2]);
  if (x > CLIFF[0] && dz < 260) y = Math.min(y, -70 * smooth((x - CLIFF[0]) / 6) * smooth((260 - dz) / 40));
  if (Math.abs(z - CLIFF[2]) < 6 && x > CLIFF[0] - 120 && x <= CLIFF[0]) y = Math.min(y, 0); // the road to the edge is flat
  if (Math.abs(z - HILL[2]) < 12 && x > HILL[0] - 10 && x < HILL[0] + ASYM_X + 6) y = Math.min(y, 0); // the coaster's foot
  return y;
};

// ---------------- the cast ----------------
type Who = { o: Outfit; seed: number; x: number; y: number; z: number; expr: Expr; mode?: FrontOpts["mode"]; phase?: number; wave?: number;
  prop?: FrontOpts["prop"]; look?: number; pose?: FrontOpts["pose"]; facing?: -1 | 0 | 1; tilt?: number; noBlob?: boolean; talk?: number;
  scale?: number; sx?: number; roll?: number };
type FxP = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number; yaw?: number };
const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : d < 45 ? [240, 400, 0.4] : [120, 200, 0.2]);
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * h01(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = Math.floor(f - s); if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h01(i * 31 + n, 13)); }
  return 0;
};

/** people of the doubling plaza: person n is born at the time of its doubling level, accelerating */
const DOUBLE_R = 0.7;
const bornAt = (n: number) => {
  const k = n === 0 ? 0 : Math.floor(Math.log2(n)) + 1, D = (LE[4] - LS[4] - 6) / ((1 - DOUBLE_R ** 10) / (1 - DOUBLE_R));
  return LS[4] + 2 + (D * (1 - DOUBLE_R ** k)) / (1 - DOUBLE_R);
};
const spiral = (n: number, r0 = 3.6, step = 0.62): [number, number] => { const r = r0 + step * Math.sqrt(n), a = n * 2.39996; return [Math.cos(a) * r, Math.sin(a) * r * 0.8]; };

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS, out: Who[] = [];
  const P3 = (o: Outfit, seed: number, p: V3, expr: Expr, extra: Partial<Who> = {}) => out.push({ o, seed, x: p[0], y: p[1], z: p[2], expr, ...extra });
  switch (id) {
    case 1: { // the hook: three scientists at the board; Heinz finishes the curve and turns
      P3(HEINZ, 11, add(BOARD, [0.75, 0, 1.25]), f < wf(0, -2) - L ? "stern" : "shock", { pose: f < wf(0, 5) ? "point" : undefined, facing: -1 });
      P3(MORA, 12, add(BOARD, [0.0, 0, 1.0]), f < wf(0, -2) - L ? "neutral" : "nervous", { facing: 1 });
      P3(AMIOT, 13, add(BOARD, [1.6, 0, 1.5]), f < wf(0, -2) - L ? "neutral" : "scared", { prop: "scroll", facing: -1 });
      break;
    }
    case 3: { // a cult guy, then a psychic, swept away
      const cult = folk(21), psy = folk(24);
      const sweep = (f0: number) => -9 * easeIn(at(f, f0, 8));
      if (f < wf(2, 3) + 8) P3({ ...cult, dress: "#7a3a9a", jacket: "#7a3a9a", hood: "#5a2a7a", hat: null }, 31, add(STU, [sweep(wf(2, 3)), 0, 0]), "grin", { scale: popIn(at(f, LS[2] - 2, 8)), pose: "point", facing: 1 });
      if (f >= wf(2, 3) - 2 && f < wf(2, 6) + 8) P3({ ...psy, dress: "#2ab0b8", jacket: "#2ab0b8", hood: "#e8b84a", hat: null }, 32, add(STU, [sweep(wf(2, 6)) - 0.6, 0, 0]), "smug", { scale: popIn(at(f, wf(2, 3) - 2, 8)), pose: "cradle" });
      break;
    }
    case 4: {
      const shock = f >= wf(3, -2) - L;
      P3(HEINZ, 11, add(DESK, [-0.2, 0, -0.95]), shock ? "shock" : "stern", { look: shock ? 0 : -1 });
      P3(MORA, 12, add(DESK, [-1.25, 0, -0.55]), shock ? "scared" : "neutral", { prop: shock ? null : "scroll", facing: 1 });
      P3(AMIOT, 13, add(DESK, [0.95, 0, -0.35]), shock ? "shock" : "grin", { prop: shock ? null : ["hammer", 0.5 + 0.5 * Math.sin(t * 14)], facing: -1 });
      break;
    }
    case 5: for (let n = 0; n < 512; n++) {
      const b = bornAt(n);
      if (f < b) break;
      const [x, z] = spiral(n);
      out.push({ o: folk(n), seed: 100 + n, x: PLAZA[0] + x, y: 0, z: PLAZA[2] + z, expr: (["grin", "smile", "shock", "laugh"] as Expr[])[n % 4], scale: popIn(at(f, b, 6)),
        mode: n % 3 ? "stand" : "stroll", phase: t * 1.2 + h01(n, 2), wave: n % 5 === 0 ? 0.5 + 0.5 * Math.sin(t * 8 + n) : undefined });
    } break;
    case 6: { // the scientists ride the curve: seated in the cart, tipped back with the track
      const c = coaster(f), up = f > LS[5] + 30, ang = trackAngle(f), co = Math.cos(ang), si = Math.sin(ang);
      [-0.75, 0.0, 0.75].forEach((dx, k) => out.push({ o: [HEINZ, MORA, AMIOT][k], seed: 11 + k, x: c[0] + dx * co, y: c[1] - 0.2 + dx * si, z: c[2] + 0.05,
        expr: up ? (k === 0 ? "laugh" : "shock") : "grin", mode: "sit", noBlob: true, wave: k === 0 && up ? 1 : undefined, roll: ang }));
      break;
    }
    case 7: { // the squeeze: a packed street, everyone a bit squashed; one man shoots out of the top on "squeezed"
      const fs = wf(6, -3) - L;
      for (let i = 0; i < 15; i++) for (let j = 0; j < 30; j++) {
        const n = i * 30 + j, x = STREET[0] - 3.9 + i * 0.56 + 0.12 * Math.sin(n), z = STREET[2] - 13 + j * 0.5;
        if (n === 217) continue;
        const sq = 0.82 + 0.06 * Math.sin(t * 6 + n) - (f > fs ? 0.06 : 0);
        out.push({ o: folk(n + 40), seed: 200 + n, x: x + 0.05 * Math.sin(t * 7 + n), y: 0, z, expr: (f < fs ? ["pained", "nervous", "dazed", "queasy"] : ["shock", "pained", "scared", "dazed"])[n % 4] as Expr,
          sx: sq, noBlob: true });
      }
      const u = at(f, fs, 18), x = STREET[0] - 3.9 + 7 * 0.56, z = STREET[2] - 13 + 7 * 0.5 + 3;
      out.push({ o: folk(257), seed: 417, x, y: 3.2 * easeOut(u) * (1 - 0.25 * at(f, fs + 18, 30)), z, expr: f < fs ? "pained" : "relief_open", tilt: 20 * Math.sin(u * 9), noBlob: true, sx: 0.8 + 0.2 * u });
      break;
    }
    case 8: { // the birthday cake
      const rev = f >= wf(7, -2) - L;
      P3({ ...HEINZ, hat: rev ? "party" : "hair", cap: "#e86e9a" }, 11, add(CAKE, [0, -0.82, -0.85]), rev ? "smug" : "neutral", { look: rev ? 0 : 1 });
      P3(MORA, 12, add(CAKE, [-1.15, -0.82, -0.55]), rev ? "shock" : "neutral", { facing: 1 });
      P3(AMIOT, 13, add(CAKE, [1.15, -0.82, -0.5]), rev ? "laugh" : "neutral", { facing: -1 });
      break;
    }
    case 9: { // the magician: a puff on "stage", Heinz in tails, the rabbit
      const mag = f >= wf(8, 7) - L;
      P3(mag ? MAGICIAN : HEINZ, 11, add(STU, [-0.55, 0, 0.1]), mag ? "smug" : "nervous", { pose: mag ? "point" : undefined, facing: 1 });
      break;
    }
    case 10: { // the experts laugh; Heinz at the desk under a rain of letters
      P3(HEINZ, 11, add(DESK, [-0.2, 0, -0.95]), "stern", { pose: "cross" });
      for (let k = 0; k < 4; k++) P3(expert(k), 60 + k, add(OFF, [-2.6 + k * 1.15, 0, 1.4 + 0.3 * (k % 2)]), k % 2 ? "laugh" : "grin",
        { pose: k === 1 ? "point" : k === 3 ? "hips" : undefined, tilt: 4 * Math.sin(t * 9 + k), facing: k < 2 ? 1 : -1 });
      break;
    }
    case 11: for (let n = 0; n < 140; n++) { // time-lapse crowds hurrying across the plaza
      const a = h01(n, 1) * 6.28, v = 3.5 + 2 * h01(n, 2), sp = ((t * v * 0.06 + h01(n, 3)) % 1) * 2 - 1;
      const x = PLAZA[0] + Math.cos(a) * 15 * sp + 4 * Math.sin(a * 3), z = PLAZA[2] + Math.sin(a) * 13 * sp;
      if (Math.hypot(x, z) < 3.4) continue;
      out.push({ o: folk(n + 600), seed: 600 + n, x, y: 0, z, expr: "neutral", mode: "march", phase: t * 3.2 + h01(n, 4) });
    } break;
    case 12: {
      const ppl = f >= wf(11, -2) - L;
      P3(HEINZ, 11, add(BOARD, [0.9, 0, 1.2]), ppl ? "smile" : "stern", { pose: ppl ? "shrug" : "point", facing: -1 });
      break;
    }
    case 13: { // the family portrait: kids vanish one by one
      P3(DAD, 71, add(STU, [-0.65, 0, -0.4]), f < wf(12, -1) ? "smile_closed" : "relief", {});
      P3(MUM, 72, add(STU, [0.65, 0, -0.4]), f < wf(12, -1) ? "smile" : "grin", {});
      const gone = [wf(12, 2), wf(12, 3), wf(12, 5), wf(12, 8), wf(12, -2), wf(12, -1)];
      for (let k = 0; k < 8; k++) {
        const g = k < 2 ? 1e9 : gone[k - 2] - L, x = STU[0] + (k - 3.5) * 0.48;
        if (f >= g + 4) continue;
        P3(kid(k), 80 + k, [x, 0, STU[2] + 0.45 + 0.1 * (k % 2)], "grin", { scale: 1 - easeIn(at(f, g, 4)) });
      }
      break;
    }
    case 14: { // the convertible's riders
      const x = carX(f), stopped = f >= wf(13, -1) - 8, rock = stopped ? 0.05 * Math.sin((f - wf(13, -1)) * 0.5) * Math.exp(-(f - wf(13, -1)) / 30) : 0;
      P3(folk(5), 91, [x + 0.25, 0.42, CLIFF[2] - 0.3], stopped ? "scared" : "grin", { noBlob: true, tilt: rock * 40, wave: stopped ? undefined : 1 });
      P3(folk(10), 92, [x - 0.8, 0.42, CLIFF[2] + 0.25], stopped ? "shock" : "laugh", { noBlob: true, tilt: rock * 40 });
      break;
    }
    case 15: for (let n = 0; n < 80; n++) { // golden hour: everyone fine
      const a = h01(n, 5) * 6.28, r = 4 + 13 * h01(n, 6), walk = n % 3 === 0, v = 0.9;
      const x = PLAZA[0] + Math.cos(a) * r + (walk ? v * Math.cos(a + 1.6) * (t - 50) * 0.3 : 0), z = PLAZA[2] + Math.sin(a) * r * 0.8;
      out.push({ o: folk(n + 900), seed: 900 + n, x, y: 0, z, expr: (["smile", "grin", "laugh", "smile_closed"] as Expr[])[n % 4], mode: walk ? "stroll" : "stand", phase: t * 1.1 + h01(n, 7),
        wave: n % 7 === 0 ? 0.5 + 0.5 * Math.sin(t * 6 + n) : undefined });
    } break;
    case 16: { // the viewer on the sofa
      const end = f >= wf(15, -3) - L;
      P3(folk(6), 95, add(STU, [0.1, 0, 0.08]), end ? "grin" : "neutral", { mode: "sit", prop: end ? null : "scroll", pose: end ? "shrug" : undefined });
      break;
    }
    case 17: {
      const blow = f >= wf(16, -1) - L - 6;
      P3({ ...HEINZ, hat: "party", cap: "#e86e9a" }, 11, add(CAKE, [0, -0.82, -0.85]), blow ? (f > wf(16, -1) + 14 ? "grin" : "whistle") : "smile", {});
      P3({ ...MORA, hat: "party", cap: "#3b6fd2" }, 12, add(CAKE, [-1.15, -0.82, -0.55]), "laugh", { wave: 0.5 + 0.5 * Math.sin(t * 9), facing: 1 });
      P3({ ...AMIOT, hat: "party", cap: "#3aa86a" }, 13, add(CAKE, [1.15, -0.82, -0.5]), "laugh", { wave: 0.5 + 0.5 * Math.sin(t * 9 + 1), facing: -1 });
      break;
    }
    default: break;
  }
  return out;
};
void talkAt;

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = []; private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunCache = new Map<number, THREE.Vector3>();
  private outside = new THREE.Group(); private office = new THREE.Group(); private studio = new THREE.Group();
  private boardMat!: THREE.MeshLambertMaterial; private cycMat!: THREE.MeshLambertMaterial;
  private crank = new THREE.Group(); private clockH = new THREE.Group(); private clockM = new THREE.Group();
  private towerClockH = new THREE.Group(); private towerClockM = new THREE.Group();
  private cake = new THREE.Group(); private candles: THREE.Vector3[] = [];
  private cal = new THREE.Group(); private calPages: THREE.Mesh[] = []; private flip = new THREE.Group(); private flipMat!: THREE.MeshLambertMaterial;
  private journal = new THREE.Group(); private ball = new THREE.Group(); private tophat = new THREE.Group(); private curtains = new THREE.Group();
  private sofa = new THREE.Group(); private towers: THREE.Mesh[] = [];
  private cart = new THREE.Group(); private car = new THREE.Group(); private carWheels: THREE.Group[] = [];
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
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 50, Math.sin(a) * d - 150); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); this.outside.add(m);
    }
    R.add(this.outside, this.office, this.studio);
    this.buildOutside();
    this.buildTown();
    this.buildHills();
    this.buildOffice();
    this.buildStudio();
  }

  // ---------------- outside: terrain ----------------
  private buildOutside() {
    const W = 1200, N = 480, g = new THREE.PlaneGeometry(W, W, N, N);
    g.rotateX(-Math.PI / 2); g.translate(60, 0, -200);
    const P0 = g.attributes.position as THREE.BufferAttribute, cols: number[] = [], c = new THREE.Color();
    const grass = new THREE.Color("#8fb862"), grass2 = new THREE.Color("#a9c46e"), rock = new THREE.Color("#b8a48a"), road = new THREE.Color("#b9a68a");
    for (let i = 0; i < P0.count; i++) {
      const x = P0.getX(i), z = P0.getZ(i), y = groundY(x, z);
      P0.setY(i, y);
      const n = 0.5 + 0.5 * Math.sin(x * 0.05 + Math.sin(z * 0.04) * 2) * Math.cos(z * 0.05 - x * 0.02);
      c.copy(grass).lerp(grass2, n * 0.8);
      if (y < -1) c.copy(rock).multiplyScalar(0.9 + 0.15 * Math.sin(y * 0.8 + z * 0.1));
      if (Math.abs(z - CLIFF[2]) < 3.2 && x < CLIFF[0] && x > CLIFF[0] - 140) c.copy(road);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 120, uv.getY(i) * 120);
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, lam("doomGround", () => ({ map: grassHD(), vertexColors: true })));
    ground.receiveShadow = true; ground.castShadow = true; this.outside.add(ground);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), lam("doomSea", () => ({ color: "#3a8ab8" })));
    sea.position.set(1400, -62, -200); this.outside.add(sea);
  }

  // ---------------- the town: plaza, fountain, clock tower, rows of houses, the street, lamps, trees ----------------
  private buildTown() {
    const b = new Batch(), O = this.outside;
    const cob = lam("plazaCobble", () => ({ map: rep(cobbleHD(), 6, 6) }));
    b.add(new THREE.PlaneGeometry(40, 36).rotateX(-Math.PI / 2).translate(PLAZA[0], 0.02, PLAZA[2]), cob);
    b.add(new THREE.PlaneGeometry(10, 70).rotateX(-Math.PI / 2).translate(STREET[0], 0.02, STREET[2] - 12), cob);
    // fountain
    const st = lam("fountainStone", () => ({ map: stoneHD("fountainStone") })), water = lam("fountainWater", () => ({ color: "#5ab4d8" }));
    b.add(cyl(3.0, 0.7, 32), st, T(PLAZA[0], 0, PLAZA[2])); b.add(cyl(2.7, 0.66, 32), water, T(PLAZA[0], 0.02, PLAZA[2]));
    b.add(cyl(0.4, 2.2, 16), st, T(PLAZA[0], 0, PLAZA[2])); b.add(cyl(1.1, 0.25, 24), st, T(PLAZA[0], 2.0, PLAZA[2]));
    // the houses round the plaza (gaps for the north street and the east/west lanes)
    let si = 0;
    for (let x = -19; x <= 19; x += 7.6) { if (Math.abs(x) > 6) house(b, x, -21.5, 0, 7, 8, [7, 8.4, 9.8][si % 3], si++, 0); house(b, x, 21.5, Math.PI, 7, 8, [8.4, 7, 9.8][si % 3], si++, 0); }
    for (let z = -14; z <= 14; z += 7.6) { if (Math.abs(z) > 4) { house(b, -24, z, Math.PI / 2, 7, 8, [8.4, 9.8, 7][si % 3], si++, 0); house(b, 24, z, -Math.PI / 2, 7, 8, [9.8, 7, 8.4][si % 3], si++, 0); } }
    // the narrow street north: tall rows both sides
    for (let z = -28; z >= -74; z -= 7.2) { house(b, STREET[0] - 8.5, z, Math.PI / 2, 7, 8, [9.8, 11.2][si % 2], si++, 0); house(b, STREET[0] + 8.5, z, -Math.PI / 2, 7, 8, [11.2, 9.8][si % 2], si++, 0); }
    // the clock tower on the plaza's north-east corner
    const tw = lam("towerStone", () => ({ map: stoneHD("towerStone", ["#e2d2b4", "#d6c4a2", "#ead9bd", "#cdb998"], "#a08c70") }));
    b.add(boxGeo(V(14, 0, -18), V(19, 22, -13), 3), tw);
    b.add(new THREE.ConeGeometry(4.0, 6, 4).rotateY(Math.PI / 4).translate(16.5, 25, -15.5), lam("towerRoof", () => ({ color: "#3a5a7a" })));
    b.add(new THREE.CircleGeometry(1.7, 40).translate(16.5, 17.5, -12.96), lam("clockFace", () => ({ color: "#fbf7ec" })));
    // lamp posts, benches, trees
    const iron = lam("lampIron", () => ({ color: "#2e3a3a" })), lampG = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.6, 1.1) });
    for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9], [-3, -30], [3, -44], [-3, -58]]) {
      b.add(cyl(0.08, 4.2, 8), iron, T(x, 0, z));
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10).translate(x, 4.4, z), lampG); l.layers.set(NOINK); O.add(l);
    }
    const wood = lam("benchWood", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
    for (const [x, z, yaw] of [[-12, 0, Math.PI / 2], [12, 0, -Math.PI / 2], [0, 12, Math.PI]]) {
      b.add(boxGeo(V(-1.2, 0.42, -0.25), V(1.2, 0.5, 0.25)), wood, RY(yaw, x, 0, z)); b.add(boxGeo(V(-1.2, 0.5, -0.3), V(1.2, 0.95, -0.22)), wood, RY(yaw, x, 0, z));
    }
    const leaf = ["#5c9a48", "#6fa653", "#4d8744"].map((cc, i) => lam("dleaf" + i, () => ({ color: cc }))), trunk = lam("dtrunk", () => ({ color: "#7a5236" }));
    const tree = (x: number, z: number, s: number, i: number) => {
      const y = groundY(x, z);
      b.add(cyl(0.2 * s, 2.6 * s, 7), trunk, T(x, y, z));
      for (let k = 0; k < 3; k++) b.add(new THREE.IcosahedronGeometry(1.5 * s, 1), leaf[(i + k) % 3], T(x + (k - 1) * 0.9 * s, y + (3 + 0.5 * (k % 2)) * s, z + (h01(i, k) - 0.5) * s));
    };
    [[-15, -12], [15, 12], [-15, 12], [-34, -40], [34, -40], [-40, 20], [40, 20]].forEach(([x, z], i) => tree(x, z, 1.1, i));
    for (let i = 0; i < 160; i++) { const a = h01(i, 1) * 6.28, r = 60 + 200 * h01(i, 2), x = Math.cos(a) * r, z = Math.sin(a) * r - 60; if (Math.abs(z - HILL[2]) < 30 && x > -20 && x < 90) continue; if (x > CLIFF[0] - 20) continue; if (Math.abs(z - CLIFF[2]) < 10) continue; tree(x, z, 0.9 + 0.7 * h01(i, 3), i); }
    b.build(O);
    // the clock tower's hands (they spin in the time-lapse)
    const hand = (len: number, w: number) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.05).translate(0, len / 2, 0), lam("clockHand", () => ({ color: "#1e1e24" }))); g.add(m); return g; };
    this.towerClockH = hand(1.0, 0.16); this.towerClockM = hand(1.45, 0.1);
    for (const g of [this.towerClockH, this.towerClockM]) { g.position.set(16.5, 17.5, -12.9); O.add(g); }
    // time-lapse towers behind the rows (hidden until shot 11, risen in shot 15)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 1.1 + Math.PI * 0.95, r = 46 + 14 * h01(i, 4), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.7 - 30, h = 28 + 34 * h01(i, 5);
      const m = new THREE.Mesh(new THREE.BoxGeometry(9, h, 9).translate(0, h / 2, 0), lam("towerFace" + (i % 4), () => ({ map: rep(towerTex(i % 4), 1, 3) })));
      m.position.set(x, 0, z); m.castShadow = m.receiveShadow = true; this.towers.push(m); O.add(m);
    }
  }

  // ---------------- the hills: the doomsday curve as a coaster, and the cliff with the road ----------------
  private buildHills() {
    const b = new Batch(), O = this.outside;
    const rail = lam("coasterRail", () => ({ color: "#d8282a" })), tie = lam("coasterTie", () => ({ map: rep(planksHD(), 0.3, 0.3) })), post = lam("coasterPost", () => ({ color: "#f4efe2" }));
    const pts: THREE.Vector3[] = [];
    for (let s = -8; s <= ASYM_X - 0.75; s += s < 50 ? 1.0 : 0.15) pts.push(V(HILL[0] + s, Math.max(0, curveY(Math.max(0, s))) + 0.25, HILL[2]));
    const path = new THREE.CatmullRomCurve3(pts);
    for (const dz of [-0.55, 0.55]) {
      const shifted = new THREE.CatmullRomCurve3(pts.map((p) => p.clone().add(V(0, 0, dz))));
      b.add(new THREE.TubeGeometry(shifted, 600, 0.09, 8, false), rail);
    }
    for (let k = 0; k < 260; k++) {
      const u = k / 259, p = path.getPointAt(u), tg = path.getTangentAt(u);
      const m = new THREE.Matrix4().makeBasis(tg, V(-tg.y, tg.x, 0).normalize(), V(0, 0, 1)).setPosition(p);
      b.add(new THREE.BoxGeometry(0.22, 0.1, 1.5).translate(0, -0.08, 0), tie, m);
      if (k % 6 === 0 && p.y > 1.2 && p.y < 160) b.add(cyl(0.12, p.y - 0.2, 8), post, T(p.x, 0, p.z - 0.9)), b.add(cyl(0.12, p.y - 0.2, 8), post, T(p.x, 0, p.z + 0.9));
    }
    b.build(O);
    // the cart (three seats)
    const cb = new Batch(), cartM = lam("cartBody", () => ({ color: "#f2b33a" })), seat = lam("cartSeat", () => ({ color: "#3b6fd2" }));
    cb.add(boxGeo(V(-1.3, 0, -0.7), V(1.3, 0.3, 0.7)), cartM); cb.add(boxGeo(V(1.1, 0.3, -0.7), V(1.4, 0.7, 0.7)), cartM);
    for (let k = 0; k < 3; k++) cb.add(boxGeo(V(-1.15 + k * 0.75, 0.3, -0.62), V(-1.05 + k * 0.75, 0.75, -0.3)), seat);
    cb.build(this.cart); O.add(this.cart);
    // the cliff road: a guard-rail-free edge with a few rocks and a lonely warning post (no text)
    const rock = lam("cliffRock", () => ({ color: "#b8a48a" })), postM = lam("warnPost", () => ({ color: "#f4efe2" })), red = lam("warnRed", () => ({ color: "#d8282a" }));
    for (let i = 0; i < 22; i++) { const z = CLIFF[2] - 40 + 80 * h01(i, 3); if (Math.abs(z - CLIFF[2]) < 5) continue; const s = 0.6 + 1.4 * h01(i, 4); b.add(new THREE.DodecahedronGeometry(1, 1), rock, new THREE.Matrix4().makeScale(s, s * 0.7, s).setPosition(CLIFF[0] - 1 - 3 * h01(i, 5), 0.2, z)); }
    for (const dz of [-4.5, 4.5]) { b.add(cyl(0.08, 1.1, 8), postM, T(CLIFF[0] - 1.5, 0, CLIFF[2] + dz)); b.add(boxGeo(V(-0.1, 0.8, -0.3), V(0.1, 1.1, 0.3)), red, T(CLIFF[0] - 1.5, 0, CLIFF[2] + dz)); }
    // cliff face rocks down the drop
    for (let i = 0; i < 40; i++) { const z = CLIFF[2] - 60 + 120 * h01(i, 6), y = -6 - 50 * h01(i, 7), s = 2 + 4 * h01(i, 8); b.add(new THREE.DodecahedronGeometry(1, 0), rock, new THREE.Matrix4().makeScale(s, s, s * 1.4).setPosition(CLIFF[0] + 2 - y * 0.06, y, z)); }
    b.build(O);
    // the 1960 convertible
    const car = new Batch(), paint = lam("carPaint", () => ({ color: "#4ac0b0" })), white = lam("carWhite", () => ({ color: "#f4efe2" })), chrome = lam("carChrome", () => ({ color: "#d8d6cc" })), dark = lam("carDark", () => ({ color: "#2a2a30" }));
    car.add(boxGeo(V(-2.3, 0.35, -0.9), V(2.3, 0.85, 0.9)), paint);
    car.add(boxGeo(V(1.0, 0.85, -0.85), V(2.25, 0.95, 0.85)), paint); car.add(boxGeo(V(-2.25, 0.85, -0.85), V(-1.0, 1.0, 0.85)), paint); // fins at the back
    for (const s of [-1, 1]) car.add(boxGeo(V(-2.4, 0.85, s * 0.85 - 0.06), V(-1.4, 1.15, s * 0.85 + 0.06)), paint);
    car.add(boxGeo(V(-0.9, 0.85, -0.85), V(0.6, 1.0, -0.75)), white); car.add(boxGeo(V(-0.9, 0.85, 0.75), V(0.6, 1.0, 0.85)), white);
    car.add(boxGeo(V(0.75, 0.95, -0.75), V(0.8, 1.35, 0.75)), lam("windshield", () => ({ color: "#bfe0ec" })));
    car.add(boxGeo(V(-0.9, 0.55, -0.7), V(0.3, 0.9, 0.7)), lam("carSeats", () => ({ color: "#f4efe2" })));
    car.add(boxGeo(V(2.3, 0.35, -0.9), V(2.42, 0.55, 0.9)), chrome); car.add(boxGeo(V(-2.42, 0.35, -0.9), V(-2.3, 0.55, 0.9)), chrome);
    for (const s of [-1, 1]) car.add(new THREE.SphereGeometry(0.13, 12, 10).translate(2.3, 0.72, s * 0.62), white);
    car.build(this.car);
    for (const [x, s] of [[1.45, -1], [1.45, 1], [-1.45, -1], [-1.45, 1]] as const) {
      const w = new THREE.Group(), wb = new Batch();
      wb.add(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 20).rotateX(Math.PI / 2), dark); wb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 16).rotateX(Math.PI / 2), white);
      wb.build(w); w.position.set(x, 0.38, s * 0.86); this.carWheels.push(w); this.car.add(w);
    }
    O.add(this.car);
  }

  // ---------------- the 1960 office ----------------
  private buildOffice() {
    const b = new Batch(), G = this.office, [ox, , oz] = OFF;
    const floor = lam("officeFloor", () => ({ map: rep(planksHD(), 1.5, 1.5) })), wall = lam("wallpaper", () => ({ map: rep(wallpaperTex(), 2, 1) }));
    const wood = lam("deskWood", () => ({ color: "#8a5a34" })), wood2 = lam("deskWoodDark", () => ({ color: "#6a4026" }));
    b.add(boxGeo(V(ox - 6, -0.2, oz - 4.5), V(ox + 6, 0, oz + 7), 2), floor);
    b.add(boxGeo(V(ox - 6, 0, oz - 4.6), V(ox + 6, 3.6, oz - 4.4), 3), wall);
    b.add(boxGeo(V(ox - 6.1, 0, oz - 4.5), V(ox - 5.9, 3.6, oz + 7), 3), wall);
    b.add(boxGeo(V(ox + 5.9, 0, oz - 4.5), V(ox + 6.1, 3.6, oz + 7), 3), wall);
    b.add(boxGeo(V(ox - 6, 0, oz - 4.4), V(ox + 6, 0.15, oz - 4.3)), wood2); // skirting
    // the window on the night city
    const night = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ map: nightTex() }));
    night.position.set(ox + 2.6, 2.0, oz - 4.38); night.layers.set(NOINK); G.add(night);
    for (const [x0, y0, x1, y1] of [[1.25, 1.05, 3.95, 1.15], [1.25, 2.85, 3.95, 2.95], [1.25, 1.05, 1.35, 2.95], [3.85, 1.05, 3.95, 2.95], [2.55, 1.05, 2.65, 2.95]])
      b.add(boxGeo(V(ox + x0, y0, oz - 4.38), V(ox + x1, y1, oz - 4.3)), lam("winFrame", () => ({ color: "#f2efe6" })));
    // the chalkboard on its easel
    const [bx, , bz] = BOARD;
    b.add(boxGeo(V(bx - 1.75, 0.85, bz - 0.06), V(bx + 1.75, 2.55, bz + 0.02)), wood2);
    for (const s of [-1, 1]) b.add(boxGeo(V(bx + s * 1.6 - 0.06, 0, bz - 0.25), V(bx + s * 1.6 + 0.06, 2.6, bz - 0.13)), wood2);
    b.add(boxGeo(V(bx - 1.7, 0.82, bz - 0.04), V(bx + 1.7, 0.86, bz + 0.12)), wood);
    this.boardMat = new THREE.MeshLambertMaterial({ map: boardTex(1) });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.55), this.boardMat); board.position.set(bx, 1.7, bz + 0.03); board.receiveShadow = true; G.add(board);
    // the desk, the calculator, the lamp, books, papers, a cup
    const [dx, , dz] = DESK;
    b.add(boxGeo(V(dx - 1.1, 0.74, dz - 0.55), V(dx + 1.1, 0.8, dz + 0.55)), wood);
    for (const sx of [-1, 1]) b.add(boxGeo(V(dx + sx * 1.05 - 0.4, 0, dz - 0.5), V(dx + sx * 1.05 + (sx > 0 ? 0 : 0.4) - (sx > 0 ? 0 : 0), 0.74, dz + 0.5)), wood2);
    b.add(boxGeo(V(dx + 0.15, 0.8, dz - 0.15), V(dx + 0.65, 1.0, dz + 0.25)), lam("calcBody", () => ({ color: "#6a8a7a" })));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) b.add(cyl(0.022, 0.05, 6), lam("calcKey", () => ({ color: "#f2efe6" })), T(dx + 0.2 + k * 0.08, 1.0, dz - 0.1 + r * 0.08));
    const lampM = lam("lampMetal", () => ({ color: "#2f5a46" }));
    const lx = ox - 4.6, lz = oz - 3.3; // a floor lamp in the corner (a desk lamp hid Mora's face)
    b.add(cyl(0.2, 0.04, 16), lampM, T(lx, 0, lz)); b.add(cyl(0.025, 1.7, 8), lampM, T(lx, 0.04, lz));
    b.add(new THREE.ConeGeometry(0.3, 0.32, 16, 1, true).translate(lx, 1.85, lz), lampM);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8).translate(lx, 1.74, lz), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8) })); bulb.layers.set(NOINK); G.add(bulb);
    const books = ["#c8323a", "#2c56b8", "#3a8a5a", "#e8b84a", "#6a3a8a"].map((c, i) => lam("book" + i, () => ({ color: c })));
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(-0.18, 0, -0.13), V(0.18, 0.06 + 0.02 * (k % 2), 0.13)), books[k % 5], RY(0.2 * Math.sin(k), dx - 0.92, 0.8 + k * 0.075, dz + 0.25));
    const paper = lam("paperSheet", () => ({ color: "#fbf7ec" }));
    for (let k = 0; k < 9; k++) b.add(boxGeo(V(-0.15, 0, -0.1), V(0.15, 0.004, 0.1)), paper, RY(h01(k, 3) * 3, dx - 0.2 + 0.5 * (h01(k, 4) - 0.5), 0.8 + 0.004 * k, dz + 0.3 * (h01(k, 5) - 0.5)));
    b.add(cyl(0.05, 0.1, 12), lam("cupWhite", () => ({ color: "#f4efe2" })), T(dx + 0.85, 0.8, dz + 0.3));
    // paper stacks and book towers on the floor ("two thousand years of numbers")
    for (let k = 0; k < 6; k++) { const h = 0.4 + 0.9 * h01(k, 7); b.add(boxGeo(V(-0.25, 0, -0.2), V(0.25, h, 0.2)), k % 2 ? paper : books[k % 5], RY(0.3 * k, dx - 2.4 + 0.6 * k, 0, dz - 1.9 - 0.3 * (k % 2))); }
    // a bookshelf, a filing cabinet, a globe
    b.add(boxGeo(V(ox - 5.9, 0, oz - 3.2), V(ox - 5.4, 2.6, oz + 0.2)), wood2);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) b.add(boxGeo(V(ox - 5.85, 0.15 + r * 0.62, oz - 3.1 + k * 0.36), V(ox - 5.5, 0.15 + r * 0.62 + 0.42 + 0.06 * (k % 3), oz - 2.82 + k * 0.36)), books[(k + r) % 5]);
    b.add(boxGeo(V(ox + 4.3, 0, oz - 4.3), V(ox + 5.3, 1.4, oz - 3.6)), lam("cabinet", () => ({ color: "#8a9488" })));
    b.add(cyl(0.04, 1.0, 8), wood2, T(ox + 4.6, 0, oz - 1.5)); b.add(new THREE.SphereGeometry(0.32, 20, 14).translate(ox + 4.6, 1.3, oz - 1.5), lam("globeSea", () => ({ color: "#5a9ad0" })));
    // a wall clock (its hands spin)
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32).rotateX(Math.PI / 2).translate(ox - 0.6, 2.75, oz - 4.36), lam("clockRim", () => ({ color: "#6a4026" })));
    b.add(new THREE.CircleGeometry(0.36, 32).translate(ox - 0.6, 2.75, oz - 4.31), lam("clockFace2", () => ({ color: "#fbf7ec" })));
    b.build(G);
    const hand = (len: number, w: number) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02).translate(0, len / 2, 0), lam("clockHand", () => ({ color: "#1e1e24" })))); return g; };
    this.clockH = hand(0.2, 0.04); this.clockM = hand(0.3, 0.025);
    for (const g of [this.clockH, this.clockM]) { g.position.set(ox - 0.6, 2.75, oz - 4.29); G.add(g); }
    // the calculator crank
    const cr = new Batch(); cr.add(boxGeo(V(-0.01, -0.02, -0.02), V(0.16, 0.02, 0.02)), lampM); cr.add(cyl(0.02, 0.08, 8).rotateZ(Math.PI / 2).translate(0.16, 0, 0), lam("crankKnob", () => ({ color: "#c8323a" })));
    cr.build(this.crank); this.crank.position.set(dx + 0.67, 0.92, dz + 0.05); this.crank.rotation.y = Math.PI / 2; G.add(this.crank);
    // the cake: two tiers, icing, 115 candles in rings
    const ck = new Batch(), sponge = lam("cakePink", () => ({ color: "#f2a8c0" })), icing = lam("cakeIcing", () => ({ color: "#fbf3ec" })), wax = lam("candleWax", () => ({ color: "#9ad0ff" }));
    ck.add(cyl(0.34, 0.16, 32), sponge); ck.add(cyl(0.35, 0.03, 32), icing, T(0, 0.16, 0)); ck.add(cyl(0.24, 0.14, 32), sponge, T(0, 0.19, 0)); ck.add(cyl(0.25, 0.03, 32), icing, T(0, 0.33, 0));
    ck.add(cyl(0.42, 0.02, 32), lam("cakePlate", () => ({ color: "#e8e4dc" })), T(0, -0.02, 0));
    let n = 0;
    for (const [r, y, cnt] of [[0.3, 0.19, 45], [0.2, 0.36, 40], [0.11, 0.36, 22], [0.03, 0.36, 8]] as const) for (let k = 0; k < cnt && n < 115; k++, n++) {
      const a = (k / cnt) * Math.PI * 2 + r, x = Math.cos(a) * r, z = Math.sin(a) * r;
      ck.add(cyl(0.008, 0.07, 6), n % 3 === 0 ? lam("candleWax2", () => ({ color: "#f2b33a" })) : wax, T(x, y, z));
      this.candles.push(V(x, y + 0.085, z));
    }
    ck.build(this.cake); this.cake.position.set(...CAKE); G.add(this.cake);
    G.visible = false;
  }

  // ---------------- the studio cyclorama and its props ----------------
  private buildStudio() {
    const G = this.studio, [sx, , sz] = STU;
    this.cycMat = new THREE.MeshLambertMaterial({ color: "#e8463c" });
    const R0 = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2).translate(sx, 0, sz + 2), this.cycMat); floor.receiveShadow = true; G.add(floor);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 30, 24, 1, true, Math.PI, Math.PI / 2).rotateZ(Math.PI / 2).translate(sx, R0, sz - 5), this.cycMat);
    (curve.material as THREE.MeshLambertMaterial).side = THREE.DoubleSide; curve.receiveShadow = true; G.add(curve);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 16).translate(sx, R0 + 8, sz - 5 - R0), this.cycMat); back.receiveShadow = true; G.add(back);
    // the wall calendar (a block of pages; the top page flips over its rings)
    const cb = new Batch(), card = lam("calBack", () => ({ color: "#6a4026" }));
    cb.add(boxGeo(V(-0.85, -1.05, -0.12), V(0.85, 1.05, -0.02)), card);
    cb.build(this.cal);
    for (let k = 0; k < 2; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), lam(`calPage${k}`, () => ({ map: calTex(k, k === 1) })));
      m.position.set(0, 0, 0.005 * k); this.calPages.push(m); this.cal.add(m);
    }
    this.flipMat = new THREE.MeshLambertMaterial({ map: calTex(2, false), side: THREE.DoubleSide });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0).translate(0, -1.0, 0), this.flipMat); this.flip.add(fp); this.flip.position.set(0, 1.0, 0.02); this.cal.add(this.flip);
    this.cal.position.set(sx, 1.75, sz - 0.3); G.add(this.cal);
    // the journal
    const jb = new Batch();
    jb.add(boxGeo(V(-0.62, 0, -0.1), V(0.62, 1.6, 0.1)), lam("journalPages", () => ({ color: "#f4efe2" })));
    const cover = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 1.62).translate(0, 0.8, 0.105), lam("journalCover", () => ({ map: journalTex() })));
    jb.build(this.journal); this.journal.add(cover); G.add(this.journal);
    // the psychic's crystal ball
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 0.9, 2.0) }));
    ball.layers.set(NOINK); this.ball.add(ball); G.add(this.ball);
    // the magician's table and top hat, the curtains
    const tb = new Batch();
    tb.add(cyl(0.35, 0.03, 24), lam("magTable", () => ({ color: "#25222c" })), T(0, 0.85, 0)); tb.add(cyl(0.05, 0.85, 8), lam("magTable", () => ({})));
    tb.add(cyl(0.18, 0.32, 24), lam("hatBlack", () => ({ color: "#1e1b22" })), T(0, 0.88, 0)); tb.add(cyl(0.28, 0.02, 24), lam("hatBlack", () => ({})), T(0, 0.88, 0));
    tb.build(this.tophat); this.tophat.position.set(sx + 0.75, 0, sz + 0.2); G.add(this.tophat);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(3, 7).translate(0, 3.5, 0), lam("curtainVelvet", () => ({ map: curtainTex(), side: THREE.DoubleSide }))); c.position.set(sx + s * 3.3, 0, sz - 1.2); c.rotation.y = -s * 0.35; this.curtains.add(c); }
    G.add(this.curtains);
    // the sofa and a lamp
    const sb = new Batch(), fab = lam("sofaFabric", () => ({ color: "#e86a3a" }));
    sb.add(boxGeo(V(-1.2, 0.2, -0.45), V(1.2, 0.48, 0.45)), fab); sb.add(boxGeo(V(-1.2, 0.48, -0.55), V(1.2, 1.1, -0.3)), fab);
    for (const s of [-1, 1]) sb.add(boxGeo(V(s * 1.2 - 0.18, 0.2, -0.5), V(s * 1.2 + 0.18, 0.72, 0.45)), fab);
    for (const s of [-1, 1]) sb.add(cyl(0.04, 0.2, 8), lam("sofaLeg", () => ({ color: "#4a3426" })), T(s * 1.0, 0, 0.3));
    sb.build(this.sofa); this.sofa.position.set(sx + 0.1, 0, sz - 0.5); G.add(this.sofa);
    G.visible = false;
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
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 2500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
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
    const out = s.set === "out", su = this.skyMat.uniforms;
    if (out) {
      const cl = s.light === "golden" ? "golden" : "day";
      SKYCOL[cl].forEach((h, i) => untone(h, su["c" + i].value));
      const e = (cl === "golden" ? LOOK.golden : LOOK.day).sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
      su.e.value.set(e[1], e[2], e[3], e[4]);
      for (let i = 0; i < this.clouds.length; i++) { const m = this.clouds[i]; m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[cl][i % 4]; }
    }
    this.sky.position.copy(cam.position);
    untone(Lp.fog, this.fog.color); this.fog.near = Lp.fogNear; this.fog.far = Lp.fogFar;
    scene.fog = this.fog; scene.background = null;
    this.outside.visible = out; this.sky.visible = out; this.office.visible = s.set === "office"; this.studio.visible = s.set === "studio";
    // ---- props per shot ----
    this.clockM.rotation.z = -t * 2.2; this.clockH.rotation.z = -t * 0.18;
    const lapse = id === 11 ? at(f, LS[10], LE[10] - LS[10]) : id === 15 ? 1 : 0;
    this.towerClockM.rotation.z = -(id === 11 ? lapse * 120 : t * 0.1); this.towerClockH.rotation.z = -(id === 11 ? lapse * 10 : t * 0.01);
    this.towers.forEach((m, i) => { const k = id === 11 ? smooth(at(lapse, 0.08 + 0.05 * i, 0.22)) : lapse; m.visible = k > 0.002; m.scale.set(1, Math.max(0.002, k), 1); });
    this.crank.rotation.z = id === 4 ? t * 14 : 0;
    this.boardMat.map = boardTex(id === 1 ? q(smooth(at(f, LS[0] + 6, wf(0, -2) - LS[0])), 20) : 1);
    this.cake.visible = id === 8 || id === 17;
    if (id === 8) this.cake.scale.setScalar(Math.max(0.001, popIn(at(f, wf(7, -2) - L - 8, 10))));
    else this.cake.scale.setScalar(1);
    if (s.set === "studio") {
      this.cycMat.color.set(CYC[id] ?? "#e8463c");
      if (id === 16 && f > wf(15, -3)) this.cycMat.color.lerp(new THREE.Color("#1a1f3a"), 0);
    }
    this.cal.visible = id === 2;
    if (id === 2) { // flips accelerate between the three date words, landing on the doomsday page at "2026"
      const land = wf(1, 3) - 2, u = at(f, LS[1] - 4, land - LS[1] + 4), flips = Math.floor(u ** 1.6 * 14);
      const ph = (u ** 1.6 * 14) % 1;
      this.flip.visible = u < 1; this.flip.rotation.x = -Math.PI * smooth(ph) * 0.98;
      (this.flipMat.map as THREE.Texture | null) !== calTex(flips % 4, false) && (this.flipMat.map = calTex(flips % 4, false));
      this.calPages[0].visible = u < 1; this.calPages[1].visible = u >= 0.92;
      this.cal.position.y = 1.75 + 0.05 * Math.sin(t * 3);
    }
    this.journal.visible = id === 3 && f >= wf(2, 6) - 6;
    if (this.journal.visible) { const u = at(f, wf(2, 6) - 6, wf(2, 8) - wf(2, 6) + 4); this.journal.position.set(STU[0] + 0.1, 7 * (1 - easeIn(u)), STU[2] + 0.2); this.journal.rotation.set(0, 0.15 * (1 - u), 0.25 * (1 - u)); }
    this.ball.visible = id === 3 && f >= wf(2, 3) - 2 && f < wf(2, 6) + 8;
    if (this.ball.visible) { const sw = -9 * easeIn(at(f, wf(2, 6), 8)); this.ball.position.set(STU[0] - 0.25 + sw, 1.05 + 0.04 * Math.sin(t * 4), STU[2] + 0.35); this.ball.scale.setScalar(popIn(at(f, wf(2, 3) - 2, 8)) || 0.001); }
    this.tophat.visible = id === 9 && f >= wf(8, 7) - L; this.curtains.visible = id === 9;
    this.sofa.visible = id === 16;
    this.cart.visible = id === 6;
    if (id === 6) {
      const c2 = coaster(f);
      this.cart.position.set(c2[0], c2[1] - 0.25, c2[2]); this.cart.rotation.set(0, 0, trackAngle(f));
    }
    this.car.visible = id === 14;
    if (id === 14) {
      const x = carX(f), stopped = f >= wf(13, -1) - 8, dt = f - (wf(13, -1) - 8);
      this.car.position.set(x, 0, CLIFF[2]); this.car.rotation.set(0, 0, stopped ? -0.06 * Math.sin(dt * 0.45) * Math.exp(-dt / 28) - 0.03 * smooth(dt / 10) : 0.02 * Math.sin(t * 20));
      this.carWheels.forEach((w) => { w.rotation.z = -x / 0.38; });
    }

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx2 = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx2) / (Math.PI / 4)) * (Math.PI / 4);
    type Pl = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number; scale: number; sx: number; roll: number };
    const places: Pl[] = [], fxs: FxP[] = [];
    const blobCol = out ? "#9aa0c0" : s.set === "studio" ? "#6a5a6a" : "#7a6a6a";
    castFor(id, f).forEach((w) => {
      const d = cam.position.distanceTo(this.v.set(w.x, w.y + 1.2, w.z));
      if (d > 300) return;
      const [cw, ch, k] = tier(d);
      const fo: FrontOpts = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: w.mode ?? "stand", blink: lidAt(f, w.seed), light: light2, seed: w.seed,
        wave: w.wave === undefined ? undefined : q(w.wave, 8), prop: w.prop ?? null, look: w.look ?? 0, pose: w.pose, facing: w.facing ?? 0, tilt: w.tilt ? q(w.tilt, 2) : 0, ...(w.talk ? { talk: w.talk } : {}) };
      const breath = (w.mode ?? "stand") === "stand" || w.mode === "sit" ? 0.012 * Math.sin((2 * Math.PI * t) / (3.1 + 0.5 * h01(w.seed, 3)) + w.seed) : 0;
      places.push({ key: `F|${JSON.stringify(w.o)}|${JSON.stringify(fo)}|${cw}`, draw: (p) => bodyFront(p, w.o, fo), x: w.x, y: w.y, z: w.z, size: [cw, ch, k], breath, scale: w.scale ?? 1, sx: w.sx ?? 1, roll: w.roll ?? 0 });
      if (!w.noBlob && (w.scale ?? 1) > 0.5 && d < 60) fxs.push({ key: `blob|contact|${blobCol}`, cw: 128, ch: 128, draw: (p) => fxContact(p, blobCol), x: w.x, y: (out ? groundY(w.x, w.z) : 0) + 0.025, z: w.z, w: 0.75, h: 0.55, flat: true });
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
    if (id === 1) spark(wf(0, -2) - 2, BOARD[0] + 1.3, 2.35, BOARD[2] + 0.1, 0.8, "#ffe98a");
    if (id === 2) { burst(wf(1, 0), STU[0], 1.75, STU[2] - 0.6, 3.2, "#ffd84a"); burst(wf(1, 1), STU[0], 1.75, STU[2] - 0.6, 3.4, "#ffffff"); burst(wf(1, 3), STU[0], 1.75, STU[2] - 0.6, 4.2, "#ffd84a"); }
    if (id === 3) { puff(wf(2, 3), STU[0] - 4, 1, STU[2], 2.2); puff(wf(2, 6), STU[0] - 4.5, 1, STU[2], 2.2); puff(wf(2, 8), STU[0] + 0.1, 0.25, STU[2] + 0.4, 3.0, 20); spark(wf(2, 8), STU[0] + 0.1, 1.6, STU[2] + 0.5, 2.6, "#ffe066"); }
    if (id === 4 && f >= wf(3, -2) - L) for (let k = 0; k < 8; k++) { // papers fly up in fright
      const u = at(f, wf(3, -2) - L + k, 26), a = k * 0.8;
      if (u > 0 && u < 1) fxs.push({ key: "paperFx", cw: 120, ch: 90, draw: (p) => p.poly([[6, 6], [114, 4], [116, 84], [4, 86]], "#fbf7ec", 4), x: DESK[0] + Math.cos(a) * u * 1.2, y: 0.85 + 1.6 * Math.sin(u * 3) * (1 - u * 0.4), z: DESK[2] + 0.2 + Math.sin(a) * u * 0.6, w: 0.24, h: 0.18, rot: u * 6 + k });
    }
    if (id === 5) for (let n = 1; n < 512; n *= 2) spark(bornAt(n) - 1, PLAZA[0] + spiral(n)[0], 1.0, PLAZA[2] + spiral(n)[1], 0.9 + 0.2 * Math.log2(n), "#fff3b0");
    if (id === 6) { const c2 = coaster(f); for (let k = 0; k < 3; k++) { const ph = q(((t * 4 + k / 3) % 1), 10); fxs.push({ key: `spk${ph}`, cw: 500, ch: 500, draw: (p) => { p.ol = 4; fxSpark(p, ph, "#ffe066"); }, x: c2[0] - 1.3, y: c2[1] - 0.1, z: c2[2] + (k - 1) * 0.6, w: 0.5, h: 0.5 }); } }
    if (id === 7) puff(wf(6, -3) - L, STREET[0] - 3.9 + 7 * 0.56, 1.8, STREET[2] - 6.5, 2.2, 18);
    if (id === 8 || id === 17) { // 115 candle flames (blown out in the last shot); they appear with the cake
      const outF = id === 17 ? wf(16, -1) + 2 : 1e9, cs = this.cake.scale.x;
      this.candles.forEach((cv, i) => {
        if (f > outF + (i % 9) || cs < 0.6) return;
        const ph = q(((t * 3 + i * 0.13) % 1), 6), wp = cv.clone().multiplyScalar(cs).add(this.cake.position);
        fxs.push({ key: `flame${ph}`, cw: 100, ch: 150, draw: (p) => fxFlame(p, ph), x: wp.x, y: wp.y + 0.02, z: wp.z, w: 0.045, h: 0.07 });
      });
      if (id === 8) spark(wf(7, -2) - L, CAKE[0], CAKE[1] + 0.6, CAKE[2] + 0.2, 1.4, "#ff9ad0");
      if (id === 17 && f > outF) for (let i = 0; i < 6; i++) puff(outF + i * 2, CAKE[0] + (i - 2.5) * 0.12, CAKE[1] + 0.5, CAKE[2], 0.6, 26);
      if (id === 17) for (let i = 0; i < 40; i++) { // confetti
        const u = ((t - LS[16] / FPS) * 0.5 + h01(i, 1)) % 1, x = CAKE[0] - 1.8 + 3.6 * h01(i, 2), y = 3.2 - 3 * u, z = CAKE[2] - 0.2 + 1.2 * h01(i, 3);
        if (f < LS[16]) break;
        const col = ["#e8463c", "#3b6fd2", "#f2b33a", "#3aa86a", "#e86e9a"][i % 5];
        fxs.push({ key: `conf${col}`, cw: 40, ch: 24, draw: (p) => p.poly([[2, 2], [38, 2], [38, 22], [2, 22]], col, 0), x, y, z, w: 0.05, h: 0.03, rot: t * 6 + i });
      }
    }
    if (id === 9) {
      puff(wf(8, 7) - L - 2, STU[0] - 0.55, 1.2, STU[2] + 0.3, 2.6, 24);
      const ru = at(f, wf(8, -1) - 4, 10), [hx, , hz] = [this.tophat.position.x, 0, this.tophat.position.z];
      if (ru > 0) fxs.push({ key: "rabbit", cw: 300, ch: 360, draw: rabbit, x: hx, y: 0.92 + 0.35 * easeOut(ru), z: hz + 0.05, w: 0.42 * popIn(ru), h: 0.5 * popIn(ru) });
      for (let i = 0; i < 5; i++) { const u = at(f, wf(8, -1) + 6 + i * 3, 30); if (u > 0 && u < 1) fxs.push({ key: `dove${q((t * 8 + i) % 1, 4)}`, cw: 200, ch: 140, draw: (p) => dove(p, q((t * 8 + i) % 1, 4)), x: hx + (i - 2) * 0.5 * u, y: 1.2 + 3 * u, z: hz + 0.2, w: 0.4, h: 0.28 }); }
    }
    if (id === 10) for (let i = 0; i < 26; i++) { // letters rain on the desk
      const u = ((t - SHOTS[9].a / FPS) * 0.7 + h01(i, 1)) % 1, x = DESK[0] - 1.6 + 3.2 * h01(i, 2), z = DESK[2] - 0.6 + 1.6 * h01(i, 3);
      fxs.push({ key: "env", cw: 256, ch: 180, draw: (p) => { p.g.drawImage(envTex().image as CanvasImageSource, 0, 0); }, x, y: 3.4 - 2.6 * u, z, w: 0.3, h: 0.21, rot: u * 8 + i });
    }
    if (id === 13) [wf(12, 2), wf(12, 3), wf(12, 5), wf(12, 8), wf(12, -2), wf(12, -1)].forEach((g, k) => puff(g - L, STU[0] + (k + 2 - 3.5) * 0.48, 0.6, STU[2] + 0.5, 0.9, 16));
    if (id === 14) {
      const x = carX(f), braking = f >= wf(13, -1) - 8 && f < wf(13, -1) + 20;
      for (let k = 0; k < 3; k++) { const ph = q(((t * 3 + k / 3) % 1), 12); fxs.push({ key: `dust${ph}`, cw: 300, ch: 300, draw: (p) => fxDust(p, ph), x: x - 2.4 - 3 * ph, y: 0.4 + 0.5 * ph, z: CLIFF[2] + (k - 1) * 0.6, w: (braking ? 2.6 : 1.6) + 2 * ph, h: (braking ? 2.6 : 1.6) + 2 * ph, soft: true }); }
      if (f >= wf(13, -1) - 8) for (let k = 0; k < 2; k++) fxs.push({ key: "skid", cw: 256, ch: 32, draw: (p) => p.poly([[0, 8], [256, 4], [256, 26], [0, 22]], "rgba(30,25,25,0.6)", 0), x: (carX(wf(13, -1) - 8) + x) / 2 - 1.2, y: 0.03, z: CLIFF[2] + (k ? 0.86 : -0.86), w: Math.max(0.1, x - carX(wf(13, -1) - 8)), h: 0.25, flat: true });
      spark(wf(13, -1), CLIFF[0] - 0.4, 0.4, CLIFF[2] + 1.0, 1.6);
    }
    if (id === 16 && f > wf(15, -3) - L) for (let i = 0; i < 4; i++) burst(wf(15, -3) + i * 9, STU[0] + [-2.2, 1.8, -0.6, 2.6][i], 3.2 + [0.3, 0.8, 1.6, 0.2][i], STU[2] - 6, 3.0, ["#ffd84a", "#e86e9a", "#9ad0ff", "#3aa86a"][i], 24);
    if (id === 16 && f < wf(15, -3) - L) fxs.push({ key: "phone", cw: 120, ch: 200, draw: (p) => { p.poly([[10, 6], [110, 6], [110, 194], [10, 194]], "#1e1e24", 5); p.poly([[20, 20], [100, 20], [100, 176], [20, 176]], "#9ad0ff", 0); }, x: STU[0] + 0.35, y: 0.95, z: STU[2] + 0.1, w: 0.1, h: 0.17 });
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

/** the magician's rabbit popping out of the hat; 300 x 360 */
function rabbit(p: Pen) {
  for (const s of [-1, 1]) p.ell(150 + s * 34, 90, 26, 80, "#fbf8f2", 7, 0, 360, s * 10);
  for (const s of [-1, 1]) p.ell(150 + s * 34, 95, 11, 55, "#f2b8c8", 0, 0, 360, s * 10);
  p.ell(150, 220, 92, 82, "#fbf8f2", 7);
  for (const s of [-1, 1]) { p.ell(150 + s * 34, 205, 11, 13, "#241726", 0); }
  p.ell(150, 240, 12, 9, "#f28aa8", 4);
  for (const s of [-1, 1]) p.stroke([[150 + s * 20, 248], [150 + s * 80, 236]], 3);
}
/** a dove flapping; 200 x 140, k = 0..1 */
function dove(p: Pen, k: number) {
  const up = Math.sin(k * Math.PI * 2) * 40;
  p.poly([[100, 70], [30, 70 - up], [70, 85]], "#fbf8f2", 6); p.poly([[100, 70], [170, 70 - up], [130, 85]], "#fbf8f2", 6);
  p.ell(100, 80, 34, 18, "#fbf8f2", 6); p.dot(122, 74, 4);
}
void tier; void clamp01;
