// The whole place for "The Castle That Fell Through Its Toilet":
// - outside: a chalk spur above the Seine, the town below, the three wards of Château Gaillard (outer ward with the
//   advanced tower, middle ward with the chapel and John's garderobe and chute, the corrugated inner ward and the keep),
//   the building site (1196), the French siege camp (1203);
// - three interior sets: the chapel, a bank vault, the cutaway wall.
// Built from the cartoon-3d-short skill's look modules (two-tone shading, painted textures, ink pass, lit character
// cards); geometry and staging are ours. update(id, f, camera, scene) poses everything for shot `id` at frame f.
// Iteration 4 quality bar: shadows on everything, three depth layers, props everywhere, crenels and arrow slits.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../bridge/build";
import { ctex, grassHD, cobbleHD, cloudHD, facadeHD, roofHD, stoneHD, rep, planksHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, fxPuff, fxContact, Outfit, Expr, FrontOpts } from "../bridge/toon";
import {
  FPS, SHOTS, LOW, OUTER, ADV, MID, CHAPEL, WALL_W, GARDE, CHUTE, INNER, KEEP, DITCHES, CH, BANK, SEC, SEAT, SCALE, PHILIP_AT, R7,
  Light, ShotDef, V3, camAt, stateAt, popIn, clamp01, ahead, at, smooth, easeOut,
} from "./story";
import { RICHARD, PHILIP, JOHN, CLIMBER, TREASURER, french, english, worker } from "./people";
import { talkAt, quoteRange } from "../../lib/talk";
import type { Word } from "../../lib/Captions";
import wordsJson from "../../../shorts/castle/voice/words.json";
const WORDS = wordsJson as Word[];
const QUOTE_PHILIP = quoteRange(WORDS, 5), QUOTE_RICHARD = quoteRange(WORDS, 6);
import {
  terrainTex, butterTex, waterTex, tentTex, chuteTex, stainTex, sectionTex, steelTex, marbleTex, glassTex, flagTex, tapestryTex,
  cliffTex, fxSack, fxCoin, fxCrown, fxHeart, fxFly, fxStink, fxFlame, fxDrop, fxSmoke, fxMap, fxSpark,
} from "./paintc";

// ---------------- light presets ----------------
const P: Record<Light, LightPreset> = {
  day: { ...LIGHTS.day, fogNear: 140, fogFar: 1500, actorShadow: true },
  golden: { ...LIGHTS.golden, az: 70, el: 24, lit: [1.52, 1.04, 0.68], shade: [0.34, 0.29, 0.44], lift: [0.07, 0.06, 0.14], fogNear: 160, fogFar: 1400, actorShadow: true },
  // candle- and window-lit interiors: warm key, violet shade (the pyramid's tunnel preset, brighter)
  inside: {
    ...LIGHTS.golden, az: 140, el: 40,
    lit: [1.62, 1.3, 1.0], shade: [0.34, 0.29, 0.44], lift: [0.08, 0.06, 0.11], term: 0.3,
    charTint: [1.0, 0.88, 0.74], fog: "#3a2a24", fogNear: 14, fogFar: 90, actorShadow: false,
  },
};
const LK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, inside: { ...LOOK.golden, sat: 0.95 } };
const SKYCOL: Record<Light, string[]> = { day: LOOK.day.sky.c, golden: LOOK.golden.sky.c, inside: ["#3a2a24", "#3a2a24", "#3a2a24", "#3a2a24", "#3a2a24"] };
const SKYE: Record<Light, number[]> = { day: LOOK.day.sky.e, golden: LOOK.golden.sky.e, inside: [0, 3, 8, 16, 40] };

// ---------------- helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const M = () => new THREE.Matrix4();
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);

/** open cylinder with uv in metres / tile, plus a top cap */
const cylGeo = (r: number, h: number, tile = 4, seg = 28, r2 = r) => {
  const g = new THREE.CylinderGeometry(r2, r, h, seg, 1, true).translate(0, h / 2, 0);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * r) / tile, (uv.getY(i) * h) / tile);
  return g;
};
const capGeo = (r: number, y: number, seg = 28) => new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2).translate(0, y, 0);

// ---------------- terrain ----------------
const spurW = (z: number) => (z >= -60 ? 42 : 42 * Math.sqrt(Math.max(0, 1 - ((z + 60) / 24) ** 2)));
const eastEdge = (z: number) => (z < 84 ? spurW(z) : 42 + (z - 84) * 5);
/** height of the ground at (x, z): plateau 0, chalk cliffs down to the valley at LOW, the river bed, the ditches */
export const groundY = (x: number, z: number) => {
  const w = spurW(z), d = Math.min(x + (z > 84 ? 42 : w), eastEdge(z) - x);
  let y: number;
  if (d >= 0) y = 0;
  else {
    const n = 2.2 * Math.sin(z * 0.21 + x * 0.05) * Math.sin(z * 0.07 + 1.3);
    y = Math.max(LOW + 0.4 * Math.sin(x * 0.03) * Math.sin(z * 0.04), d * 6.2 - 2.5 * clamp01(-d / 1.5)); void n; // tucked behind the cliff face
  }
  if (d > -1) for (const [z0, z1] of DITCHES) {
    const e = Math.min(z - z0, z1 - z);
    if (e > -1.5 && Math.abs(x) < w + 2) y = Math.min(y, -9 * clamp01((e + 1.5) / 3));
  }
  if (x < -112 && x > -234) y = Math.min(y, LOW - 2.4 * clamp01(Math.min(-112 - x, x + 234) / 8));
  return y;
};

// ---------------- the cast ----------------
type Who = { o: Outfit; seed: number; x: number; y: number; z: number; expr: Expr; mode?: FrontOpts["mode"]; dir?: number; phase?: number; wave?: number;
  prop?: FrontOpts["prop"]; look?: number; scale?: number; pose?: FrontOpts["pose"]; facing?: -1 | 0 | 1; tilt?: number; noBlob?: boolean; talk?: number };
type FxP = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean; rot?: number; yaw?: number };

const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4]);
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * h01(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h01(i * 31 + n, 13)); }
  return 0;
};
const L = 2; // expressions land ~2 frames before their word
const GREEN_SKIN = "#bcd89a";
const climbY = (f: number) => 0.2 + 3.8 * smooth(at(f, 1228, 52));

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS;
  switch (id) {
    case 1: return [{ o: CLIMBER, seed: 21, x: CHUTE.x + 0.36, y: 0.5 + 1.6 * smooth(at(f, 70, 54)), z: (CHUTE.z0 + CHUTE.z1) / 2, expr: f < 100 ? "stern" : "grin", pose: "climb", tilt: 3 * Math.sin(t * 6), noBlob: true }];
    case 2: {
      const [x, , z] = ahead(2, 124, 4.6, -0.55);
      return [
        { o: RICHARD, seed: 11, x, y: 0, z, expr: f < 211 - L ? "proud" : "grin", prop: "scroll", facing: 1 },
        { o: worker(0), seed: 31, x: x + 4.5, y: 0, z: z - 9, expr: "grin", prop: ["hammer", 0.5 + 0.5 * Math.sin(t * 8)] },
        { o: worker(1), seed: 32, x: x - 5.5, y: 0, z: z - 14, expr: "smile_closed", mode: "stroll", phase: t * 1.1 },
        { o: worker(2), seed: 33, x: x + 9.5, y: 0, z: z - 19, expr: "laugh", prop: ["hammer", 0.5 + 0.5 * Math.sin(t * 7 + 1)] },
        { o: worker(3), seed: 34, x: x - 1.5, y: 0, z: z - 24, expr: "smile", wave: 1 },
      ];
    }
    case 4: {
      const k = f < 402 - L ? "smile" : f < 466 - L ? "grin" : "laugh";
      return [{ o: TREASURER, seed: 41, x: SCALE[0] + 0.55, y: 0, z: SCALE[2] - 1.3, expr: k as Expr, prop: "scroll", facing: -1 }];
    }
    case 5: {
      const [x, , z] = ahead(5, 482, 3.2, -0.25);
      return [{ o: RICHARD, seed: 11, x, y: 0, z, expr: f < 534 - L ? "proud" : "smile_closed", pose: "cradle", facing: 1 },
        { o: english(0), seed: 51, x: x + 3.2, y: 0, z: z - 6.5, expr: "smile_closed", wave: f > 545 ? 1 : undefined }];
    }
    case 6: { const [px, , pz] = ahead(6, 571, 4.8, -0.5); return [
      { o: PHILIP, seed: 12, x: px, y: LOW, z: pz, expr: f < 607 - L ? "stern" : f < 672 - L ? "sneer" : "laugh", pose: "point", facing: 1, talk: talkAt(WORDS, t, ...QUOTE_PHILIP) },
      ...([[8.5, 1.6, 0], [11, -2.4, 2]] as const).map(([d, sd, v], k) => { const [kx, , kz] = ahead(6, 571, d, sd); return { o: french(v), seed: 61 + k, x: kx, y: LOW, z: kz, expr: (k ? "laugh" : "grin") as Expr }; }),
    ]; }
    case 7: return [{ o: RICHARD, seed: 11, x: R7[0], y: 0, z: R7[2], expr: f < 701 - L ? "smug" : f < 756 - L ? "proud" : "laugh", pose: "hips", facing: -1, talk: talkAt(WORDS, t, ...QUOTE_RICHARD) }];
    case 8: {
      const [x, , z] = ahead(8, 770, 4.6, 0.35), crowned = f >= 828;
      return [{ o: crowned ? JOHN : { ...JOHN, hat: "hair" }, seed: 13, x, y: 0, z, expr: f < 809 - L ? "nervous" : f < 828 ? "shock" : "relief_open", facing: -1, look: f < 815 ? -1 : 0 },
        { o: english(0), seed: 81, x: x - 4.5, y: 0, z: z - 9, expr: f < 828 ? "shock" : "smile_closed" }, { o: english(1), seed: 82, x: x + 3.8, y: 0, z: z - 12, expr: "nervous" }];
    }
    case 9: {
      const [x, , z] = ahead(9, 855, 4.2, 0.55);
      return [{ o: JOHN, seed: 13, x, y: 0, z, expr: f < 887 - L ? "proud" : "grin", pose: "point", facing: -1 },
        { o: english(2), seed: 91, x: x - 6.5, y: 0, z: z - 6, expr: "smile_closed" }];
    }
    case 10: {
      if (f < 1010) {
        return [0, 1, 2, 3, 4].map((k) => { const [x, , z] = ahead(10, 929, 5.5 + 2.2 * k, [-1.3, 1.5, -2.4, 2.6, 0.2][k]); return { o: french(k), seed: 100 + k, x, y: 0, z, expr: (["grin", "stern", "laugh", "smile", "grin"] as Expr[])[k], wave: k === 2 ? 1 : undefined }; });
      }
      return [0, 1, 2].map((k) => ({ o: worker(k + 1), seed: 110 + k, x: [-0.7, 1.0, 2.6][k], y: 0, z: [85.6, 86.6, 85.1][k], expr: (f < 1050 ? "grin" : "shock") as Expr,
        prop: ["hammer", 0.5 + 0.5 * Math.sin(t * 9 + k * 2)] as FrontOpts["prop"] }));
    }
    case 11: return [-1.25, 0, 1.25].map((x, k) => ({ o: english(k), seed: 120 + k, x, y: MID.h, z: MID.z1 - 0.5, expr: (k === 1 ? "smug" : "grin") as Expr, pose: "cross" as const, noBlob: true }));
    case 12: return [{ o: CLIMBER, seed: 21, x: -36.5, y: 0, z: -1.3, expr: f < 1138 - L ? "neutral" : f < 1158 - L ? "dazed" : "grin", look: f < 1138 ? -1 : 1, facing: 1 }];
    case 14: return [{ o: CLIMBER, seed: 21, x: CHUTE.x + 0.36, y: climbY(f), z: (CHUTE.z0 + CHUTE.z1) / 2, expr: f < 1259 ? "stern" : "pained", pose: "climb", tilt: 4 * Math.sin(t * 7), noBlob: true }];
    case 15: {
      const y = -2.1 + 1.55 * popIn(at(f, 1285, 9));
      return [{ o: CLIMBER, seed: 21, x: SEAT[0], y, z: SEAT[2], expr: f < 1301 ? "shock" : f < 1336 - L ? "neutral" : "grin", look: f < 1310 ? -1 : f < 1324 ? 1 : 0, noBlob: true }];
    }
    case 16: return [{ o: { ...CLIMBER, skin: GREEN_SKIN }, seed: 21, x: SEAT[0], y: -0.55, z: SEAT[2], expr: f < 1452 - L ? "queasy" : "pained", noBlob: true }];
    case 17: return [{ o: { ...english(1), spear: false }, seed: 171, x: SEC[0] + 0.05, y: 10.42, z: SEC[2] + 0.55, expr: f < 1540 ? "smile_closed" : "whistle", mode: "sit", prop: "scroll", noBlob: true }];
    case 18: {
      if (f < 1684) return [];
      return [{ o: CLIMBER, seed: 21, x: BANK[0] + 0.75, y: -1.75 + 0.72 * popIn(at(f, 1686, 10)), z: BANK[2] - 2.66, expr: "grin", noBlob: true }];
    }
    case 19: {
      const out: Who[] = [];
      [1716, 1727, 1737].forEach((f0, k) => {
        if (f < f0) return;
        const pop = popIn(at(f, f0, 8)), step = smooth(at(f, f0 + 8, 10));
        out.push({ o: french(k), seed: 190 + k, x: SEAT[0] - 0.95 * step * (k + 1), y: -2.1 + 1.55 * pop + 0.55 * step, z: SEAT[2] + 0.5 * step * (k % 2 ? -1 : 1),
          expr: (step < 0.5 ? "shock" : "grin") as Expr, prop: k === 1 && step > 0.5 ? "torch" : null, noBlob: step < 0.9 });
      });
      return out;
    }
    case 20: {
      const out: Who[] = [];
      if (f >= 1764) for (let k = 0; k < 8; k++) {
        const z = 24.5 - 3.4 * (t - 1764 / FPS) + 1.7 * Math.floor(k / 2);
        if (z > 24.6) continue;
        out.push({ o: french(k), seed: 200 + k, x: (k % 2 ? 0.7 : -0.7), y: 0, z, expr: (k % 3 ? "grin" : "laugh") as Expr, mode: "march", phase: t * 1.6 + k * 0.25 });
      }
      out.push({ o: english(3), seed: 209, x: -6.5, y: 0, z: 15.5, expr: f < 1770 ? "smug" : "scared", pose: f < 1770 ? "cross" : undefined, facing: 1 });
      return out;
    }
    case 22: return [{ o: JOHN, seed: 13, x: CH[0] - 1.55, y: 0, z: CH[2] + 5.4, expr: f < 1854 - L ? "nervous" : "scared", facing: -1, look: -1 }];
    default: return [];
  }
};

// ---------------- world ----------------
type Pan = { g: THREE.Group };
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
  private sets = { chapel: new THREE.Group(), bank: new THREE.Group(), section: new THREE.Group() };
  // castle parts
  private wards: THREE.Group[] = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()]; // outer, mid, inner, keep
  private adv = new THREE.Group(); private rubble = new THREE.Group();
  private garde = new THREE.Group(); private plug!: THREE.Mesh;
  private gateL = new THREE.Group(); private gateR = new THREE.Group();
  private site = new THREE.Group(); private camp = new THREE.Group();
  private keepFlag!: THREE.Mesh; private chuteFlag = new THREE.Group();
  private stoneMeshes: THREE.Mesh[] = []; private stoneMats = new Map<THREE.Mesh, THREE.Material>(); private butterMat: THREE.Material;
  private flagMats: Record<"fr" | "en", THREE.Material>;
  // shot 4 balance and the little castles
  private scale = new THREE.Group(); private beam = new THREE.Group(); private pans: Pan[] = [];
  private chains: THREE.Mesh[] = [];
  private minis: THREE.Group[] = []; private cradleMini!: THREE.Group;
  private flap = new THREE.Group();
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
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3, d = 700 + (i % 3) * 70, w = 150 + (i % 4) * 35;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.cos(a) * d, 110 + (i % 4) * 40, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); this.outside.add(m);
    }
    this.butterMat = lam("butterWall", () => ({ map: rep(butterTex(), 1, 1) }));
    this.flagMats = {
      fr: lam("flagFR", () => ({ map: flagTex("fr"), side: THREE.DoubleSide })),
      en: lam("flagEN", () => ({ map: flagTex("en"), side: THREE.DoubleSide })),
    };
    R.add(this.outside, this.sets.chapel, this.sets.bank, this.sets.section);
    this.buildLand();
    this.buildCastle();
    this.buildSite();
    this.buildCamp();
    this.buildScale();
    this.buildChapel();
    this.buildBank();
    this.buildSection();
  }

  // ---------------- land: terrain, river, town, trees, rocks ----------------
  private buildLand() {
    const O = this.outside;
    const W = 900, N = 640, cx = -80, cz = 40;
    const g = new THREE.PlaneGeometry(W, W, N, N); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
    const P0 = g.attributes.position as THREE.BufferAttribute, cols: number[] = [];
    const grass = new THREE.Color("#8fb26a"), grass2 = new THREE.Color("#a7bd78"), chalk = new THREE.Color("#e9e3d3"), chalk2 = new THREE.Color("#cfc6b2");
    const dirt = new THREE.Color("#c9b08a"), mead = new THREE.Color("#86ad62"), sand = new THREE.Color("#d9c9a0"), c = new THREE.Color();
    for (let i = 0; i < P0.count; i++) {
      const x = P0.getX(i), z = P0.getZ(i), y = groundY(x, z);
      P0.setY(i, y);
      const n = 0.5 + 0.5 * Math.sin(x * 0.05 + Math.sin(z * 0.03) * 2) * Math.cos(z * 0.04 - x * 0.01);
      if (y > -0.05) c.copy(grass).lerp(grass2, n * 0.8);
      else if (y > LOW + 1.5) {
        const band = 0.5 + 0.5 * Math.sin(y * 0.95 + 0.6 * Math.sin(z * 0.08 + x * 0.05));
        c.copy(chalk).lerp(chalk2, 0.25 + 0.55 * band);
        if (Math.sin(y * 0.42 + 0.3 * Math.sin(z * 0.05)) > 0.93) c.lerp(new THREE.Color("#8a8478"), 0.55); // flint seams
      }
      else c.copy(mead).lerp(grass2, n * 0.5);
      if (y > -9.5 && y < -0.5 && Math.abs(x) < 44 && (DITCHES.some(([a, b]) => z > a - 2 && z < b + 2))) c.copy(chalk2).lerp(dirt, 0.4);
      if (x < -104 && x > -112) c.copy(sand);
      if (Math.abs(x - 2) < 3 && z > 76 && z < 200 && y > -0.1) c.copy(dirt); // the road up to the castle
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 110, uv.getY(i) * 110);
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, lam("terrain", () => ({ map: terrainTex(), vertexColors: true })));
    ground.receiveShadow = true; ground.castShadow = true; O.add(ground);
    O.add(cliffCurtain());
    const far = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), lam("farLand", () => ({ color: "#8fb06a" })));
    far.position.set(0, LOW - 0.6, 0); far.receiveShadow = true; O.add(far);
    // the Seine
    const wg = new THREE.PlaneGeometry(124, 2400).rotateX(-Math.PI / 2);
    const wuv = wg.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < wuv.count; i++) wuv.setXY(i, wuv.getX(i) * 6, wuv.getY(i) * 110);
    const water = new THREE.Mesh(wg, lam("seineWater", () => ({ map: waterTex() })));
    water.position.set(-173, LOW - 0.9, 0); water.receiveShadow = true; O.add(water);

    const b = new Batch();
    // ---- boats on the river ----
    const hull = lam("hull", () => ({ map: rep(planksHD(), 1, 0.4) })), sail = lam("sail", () => ({ color: "#f1e6cc", side: THREE.DoubleSide })), mast = lam("mast", () => ({ color: "#7a5236" }));
    for (const [x, z, yaw] of [[-150, 20, 0.2], [-196, -60, -0.1], [-168, 130, 0.4], [-140, -140, 0]] as const) {
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, LOW - 0.9, z);
      b.add(boxGeo(V(-1.6, -0.4, -5), V(1.6, 1.0, 5), 2), hull, m);
      b.add(boxGeo(V(-1.1, 1.0, -3.5), V(1.1, 1.15, 3.5)), hull, m);
      b.add(new THREE.CylinderGeometry(0.12, 0.15, 8, 6).translate(0, 5, 0), mast, m);
      b.add(new THREE.PlaneGeometry(5, 5.4).rotateY(Math.PI / 2).translate(0, 5.6, 0.4), sail, m);
    }
    // ---- the town below the cliff (Petit Andely): two rows of gabled houses along a street ----
    const STY = [
      { wall: "#f1e2c6", shutter: "#3f6fb5", roof: "#b5543c", timber: true }, { wall: "#e8c9a0", shutter: "#2f8a4f", roof: "#8a5a4a" },
      { wall: "#f4efe2", shutter: "#8c3b4a", roof: "#5d6c8c", timber: true }, { wall: "#e2c49a", shutter: "#3b5b9a", roof: "#c9775a" },
    ];
    const house = (x: number, z: number, yaw: number, w: number, d: number, h: number, si: number) => {
      const st = STY[si % 4], y = groundY(x, z);
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y - 0.3, z);
      const front = lam(`cf${si % 4}_${w}_${h}`, () => ({ map: facadeHD(`cf${si % 4}_${w}_${h}`, w, h, { wall: st.wall, shutter: st.shutter, door: true, timber: st.timber }) }));
      const side = lam(`cs${si % 4}_${d}_${h}`, () => ({ map: facadeHD(`cs${si % 4}_${d}_${h}`, d, h, { wall: st.wall, shutter: st.shutter, timber: st.timber }) }));
      const wallM = lam("cw" + (si % 4), () => ({ color: st.wall }));
      const roofM = lam("cr" + st.roof, () => ({ map: roofHD(st.roof, st.roof === "#5d6c8c"), side: THREE.DoubleSide }));
      const hw = w / 2, hd = d / 2, rh = d * 0.55;
      b.add(boxGeo(V(-hw, 0, -hd), V(hw, h, hd)), wallM, m);
      b.add(quad(V(-hw, 0, hd + 0.01), V(hw, 0, hd + 0.01), V(hw, h, hd + 0.01), V(-hw, h, hd + 0.01)), front, m);
      b.add(quad(V(hw + 0.01, 0, hd), V(hw + 0.01, 0, -hd), V(hw + 0.01, h, -hd), V(hw + 0.01, h, hd)), side, m);
      b.add(quad(V(-hw - 0.01, 0, -hd), V(-hw - 0.01, 0, hd), V(-hw - 0.01, h, hd), V(-hw - 0.01, h, -hd)), side, m);
      b.add(quad(V(-hw - 0.4, h - 0.1, hd + 0.5), V(hw + 0.4, h - 0.1, hd + 0.5), V(hw + 0.4, h + rh, 0), V(-hw - 0.4, h + rh, 0), w / 4, 1), roofM, m);
      b.add(quad(V(hw + 0.4, h - 0.1, -hd - 0.5), V(-hw - 0.4, h - 0.1, -hd - 0.5), V(-hw - 0.4, h + rh, 0), V(hw + 0.4, h + rh, 0), w / 4, 1), roofM, m);
      b.add(tri(V(hw, h, hd), V(hw, h, -hd), V(hw, h + rh, 0)), wallM, m);
      b.add(tri(V(-hw, h, -hd), V(-hw, h, hd), V(-hw, h + rh, 0)), wallM, m);
      b.add(boxGeo(V(hw * 0.4, h, -0.4), V(hw * 0.4 + 0.8, h + rh + 1.2, 0.4)), lam("chimney", () => ({ color: "#b98a6a" })), m);
    };
    for (let i = 0; i < 16; i++) {
      const z = -70 + i * 12 + 3 * h01(i, 3), w = 7 + 3 * h01(i, 4), h = 5 + 2 * Math.round(h01(i, 5) * 2);
      house(-74 - 2 * h01(i, 6), z, -Math.PI / 2, w, 7, h, i);
      house(-96 + 2 * h01(i, 7), z + 5, Math.PI / 2, w, 7, h, i + 2);
    }
    // the town church with a spire
    {
      const x = -86, z = 128, y = groundY(x, z);
      const st = lam("townChurch", () => ({ map: stoneHD("townChurchStone") }));
      b.add(boxGeo(V(x - 5, y, z - 9), V(x + 5, y + 9, z + 9), 4), st);
      b.add(boxGeo(V(x - 2.5, y, z + 9), V(x + 2.5, y + 17, z + 14), 4), st);
      b.add(new THREE.ConeGeometry(3.6, 11, 4).rotateY(Math.PI / 4).translate(x, y + 22.5, z + 11.5), lam("crSpire", () => ({ map: roofHD("#5d6c8c", true) })));
      b.add(quad(V(x - 5.4, y + 8.8, z - 9.4), V(x - 5.4, y + 8.8, z + 9.4), V(x, y + 14, z + 9.4), V(x, y + 14, z - 9.4), 4, 1), lam("cr#b5543c", () => ({ map: roofHD("#b5543c"), side: THREE.DoubleSide })));
      b.add(quad(V(x + 5.4, y + 8.8, z + 9.4), V(x + 5.4, y + 8.8, z - 9.4), V(x, y + 14, z - 9.4), V(x, y + 14, z + 9.4), 4, 1), lam("cr#b5543c", () => ({ map: roofHD("#b5543c"), side: THREE.DoubleSide })));
    }
    // fields on the far bank and the valley floor
    const field = (col: string) => lam("field" + col, () => ({ map: rep(fieldTex(col), 8, 8) }));
    for (const [x, z, w, d, col] of [[-300, 20, 90, 120, "#c9b55a"], [-320, -150, 120, 90, "#86ad55"], [-290, 190, 100, 110, "#b8a44a"], [120, -40, 120, 140, "#86ad55"], [140, 140, 100, 90, "#c9b55a"]] as const) {
      const fg = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
      b.add(fg, field(col), T(x, LOW + 0.05, z));
    }
    b.build(O);

    // ---- trees and bushes (shadow casters), rocks on the ledges ----
    const tb = new Batch();
    const trunkM = lam("trunk", () => ({ color: "#7a5236" }));
    const leafM = ["#5c9a48", "#6fa653", "#4d8744", "#82b35e"].map((c2, i) => lam("leaf" + i, () => ({ color: c2 })));
    const canopy = new THREE.IcosahedronGeometry(1, 2), trunk = new THREE.CylinderGeometry(0.18, 0.28, 1, 7).translate(0, 0.5, 0);
    const tree = (x: number, z: number, s: number, i: number) => {
      const y = groundY(x, z);
      tb.add(trunk, trunkM, new THREE.Matrix4().makeScale(s, 2.6 * s, s).setPosition(x, y - 0.2, z));
      for (let k = 0; k < 3; k++) tb.add(canopy, leafM[(i + k) % 4], new THREE.Matrix4().makeScale(1.5 * s, 1.3 * s, 1.5 * s).setPosition(x + (k - 1) * 0.9 * s, y + (2.8 + 0.5 * (k % 2)) * s, z + (h01(i, k + 5) - 0.5) * 0.9 * s));
    };
    const rockM = lam("rockChalk", () => ({ color: "#d9d2c2" })), bushM = lam("bush", () => ({ color: "#6f9a52" }));
    for (let i = 0; i < 420; i++) {
      const x = -380 + 560 * h01(i, 1), z = -260 + 560 * h01(i, 2), y = groundY(x, z);
      if (x < -105 && x > -240) continue; // river
      if (x > -100 && x < -70 && z > -80 && z < 140) continue; // town street
      if (y > -0.5 && Math.abs(x) < 46 && z < 92) continue; // the castle
      if (y > -0.5 && Math.abs(x - 2) < 6 && z > 70) continue; // the road
      if (y < -0.5 && y > LOW + 1) continue; // cliffs
      if (y > -0.5 && z > 96 && z < 190 && x > -36 && x < 46 && i % 3) continue; // the camp field stays open
      tree(x, z, 0.8 + 0.8 * h01(i, 3), i);
    }
    for (let i = 0; i < 70; i++) { // rocks and bushes along the cliff tops and the chute ledge
      const z = -60 + 150 * h01(i, 11), x = -36 - 6 * h01(i, 12), y = groundY(x, z);
      if (y < -1) continue;
      if (i % 2) tb.add(new THREE.DodecahedronGeometry(1, 0), rockM, new THREE.Matrix4().makeScale(0.6 + h01(i, 13), 0.4 + 0.4 * h01(i, 14), 0.6 + h01(i, 15)).setPosition(x, y + 0.1, z));
      else tb.add(new THREE.IcosahedronGeometry(1, 1), bushM, new THREE.Matrix4().makeScale(0.9 + 0.6 * h01(i, 16), 0.7, 0.9 + 0.6 * h01(i, 17)).setPosition(x, y + 0.3, z));
    }
    for (let i = 0; i < 260; i++) { // chalk outcrops on the cliff faces (silhouettes for the ink, cast shadows)
      if (i > 70) break;
      const z = -84 + 175 * h01(i, 51), side = i % 3 === 0 ? 1 : -1, yy = LOW + 0.3, s = 0.8 + 2.2 * h01(i, 53);
      const w = side < 0 ? (z > 84 ? 42 : spurW(z)) : eastEdge(z), x = side * (w + 45 / 6.2 + 1.5 + 4 * h01(i, 56));
      if (z > 84 && side > 0) continue;
      tb.add(new THREE.DodecahedronGeometry(1, 0), rockM, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(h01(i, 54) * 3, h01(i, 55) * 3, 0)).scale(new THREE.Vector3(s * 0.7, s, s * 1.3)).setPosition(x, yy, z));
    }
    for (let i = 0; i < 150; i++) { // bushes along the cliff edges (a broken green line on top of the chalk)
      const u = h01(i, 41), side = i % 4 === 0 ? 1 : -1, z = side < 0 ? -70 + 290 * u : -60 + 140 * u, x = side < 0 ? -41.2 - 0.8 * h01(i, 42) : 41.2 + 0.8 * h01(i, 42);
      if (Math.abs(z + 2) < 3) continue; // keep the chute clear
      tb.add(new THREE.IcosahedronGeometry(1, 1), bushM, new THREE.Matrix4().makeScale(0.8 + 0.9 * h01(i, 43), 0.6 + 0.4 * h01(i, 44), 0.8 + 0.9 * h01(i, 45)).setPosition(x, 0.2, z));
    }
    for (const [x, z, s] of [[-37.2, 0.8, 0.7], [-38.5, -3.8, 0.9], [-36.0, -4.6, 0.5], [-39.5, 2.6, 0.6]] as const) // ledge framing by the chute
      tb.add(new THREE.DodecahedronGeometry(1, 0), rockM, new THREE.Matrix4().makeScale(s * 1.3, s * 0.8, s).setPosition(x, s * 0.3, z));
    tb.build(O);
  }

  // ---------------- the castle ----------------
  private buildCastle() {
    const O = this.outside;
    const stone = lam("gaillardStone", () => ({ map: stoneHD("gaillardStone", ["#e7dcc8", "#dccfb8", "#efe5d3", "#d3c4ab", "#e2d6c0"], "#a69680") }));
    const stoneT = lam("gaillardTower", () => ({ map: stoneHD("gaillardTowerStone", ["#e2d6c0", "#d6c8ae", "#ebe0cc", "#cdbda3", "#dccfb7"], "#a08f78") }));
    const slit = lam("slitDark", () => ({ color: "#2a2226" }));
    const slate = lam("slateRoof", () => ({ map: roofHD("#5d6c8c", true), side: THREE.DoubleSide }));
    const redRoof = lam("redRoof", () => ({ map: roofHD("#b5543c"), side: THREE.DoubleSide }));
    const wood = lam("gateWood", () => ({ map: rep(planksHD(), 0.5, 0.5) }));

    /** straight curtain wall with merlons on the side away from (cx, cz) and arrow slits on that face */
    const wall = (b: Batch, ax: number, az: number, bx: number, bz: number, h: number, t: number, cx: number, cz: number, slits = true) => {
      const len = Math.hypot(bx - ax, bz - az), phi = Math.atan2(-(bz - az), bx - ax);
      const m = new THREE.Matrix4().makeRotationY(phi).setPosition(ax, 0, az);
      const nx = Math.sin(phi), nz = Math.cos(phi), os = nx * ((ax + bx) / 2 - cx) + nz * ((az + bz) / 2 - cz) > 0 ? 1 : -1;
      b.add(boxGeo(V(0, -3, -t / 2), V(len, h, t / 2), 4), stone, m);
      for (let s = 0.5; s + 0.9 < len; s += 1.75) {
        const z0 = os > 0 ? t / 2 - 0.6 : -t / 2, z1 = os > 0 ? t / 2 : -t / 2 + 0.6;
        b.add(boxGeo(V(s, h, z0), V(s + 0.95, h + 1.15, z1), 2), stone, m);
      }
      b.add(boxGeo(V(0, h - 0.35, os > 0 ? t / 2 : -t / 2 - 0.25), V(len, h, os > 0 ? t / 2 + 0.25 : -t / 2), 2), stone, m); // string course
      if (slits) for (let s = 3.5; s < len - 2; s += 6.5) {
        const zf = os > 0 ? t / 2 : -t / 2;
        b.add(boxGeo(V(s, h * 0.45, zf - 0.03), V(s + 0.22, h * 0.45 + 1.3, zf + 0.03)), slit, m);
      }
    };
    const tower = (b: Batch, x: number, z: number, r: number, h: number, roof: THREE.Material | null, mat = stoneT) => {
      b.add(cylGeo(r * 1.12, 3.5, 4, 28, r).translate(0, -3, 0), mat, T(x, 0, z)); // splayed base (talus)
      b.add(cylGeo(r, h, 4), mat, T(x, 0, z));
      b.add(capGeo(r, h), mat, T(x, 0, z));
      const n = Math.max(8, Math.round((2 * Math.PI * r) / 1.75));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        b.add(boxGeo(V(-0.45, 0, -0.3), V(0.45, 1.15, 0.3), 2), mat, new THREE.Matrix4().makeRotationY(-a).setPosition(x + Math.cos(a) * (r - 0.3), h, z + Math.sin(a) * (r - 0.3)));
      }
      for (let i = 0; i < 3; i++) { // arrow slits
        const a = 0.6 + (i * Math.PI * 2) / 3;
        b.add(boxGeo(V(-0.11, 0, -0.04), V(0.11, 1.3, 0.04)), slit, new THREE.Matrix4().makeRotationY(-a + Math.PI / 2).setPosition(x + Math.cos(a) * (r + 0.02), h * 0.5, z + Math.sin(a) * (r + 0.02)));
      }
      if (roof) b.add(new THREE.ConeGeometry(r + 0.7, r * 1.6, 24).translate(0, h + 1.15 + r * 0.8, 0), roof, T(x, 0, z));
    };

    // ---- outer ward (minus the advanced tower) ----
    const [ow, mw, iw, kw] = this.wards;
    let b = new Batch();
    const oc = [0, 52];
    for (let i = 0; i < OUTER.length; i++) {
      const [ax, az] = OUTER[i], [bx, bz] = OUTER[(i + 1) % OUTER.length];
      wall(b, ax, az, bx, bz, 11, 2.4, oc[0], oc[1]);
      if (!(ax === ADV[0] && az === ADV[2])) tower(b, ax, az, 4.4, 14.5, slate);
    }
    // huts and a stable in the outer ward
    b.add(boxGeo(V(-12, 0, 40), V(-4, 3.6, 46), 4), stone); b.add(boxGeo(V(5, 0, 40), V(13, 3.2, 45), 4), stone);
    b.add(quad(V(-12.4, 3.5, 46.5), V(-3.6, 3.5, 46.5), V(-3.6, 5.6, 43), V(-12.4, 5.6, 43), 2, 1), redRoof);
    b.add(quad(V(13.4, 3.1, 45.5), V(4.6, 3.1, 45.5), V(4.6, 5.0, 42.5), V(13.4, 5.0, 42.5), 2, 1), redRoof);
    b.build(ow); O.add(ow);
    // the advanced tower (its own group: it collapses), and the rubble it leaves
    b = new Batch(); tower(b, 0, 0, 7, 20, null); b.build(this.adv);
    this.adv.position.set(ADV[0], 0, ADV[2]); O.add(this.adv);
    b = new Batch();
    for (let i = 0; i < 40; i++) {
      const a = h01(i, 71) * 6.28, r = 9 * Math.sqrt(h01(i, 72)), s = 0.6 + 1.6 * h01(i, 73);
      b.add(new THREE.DodecahedronGeometry(1, 0), stoneT, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(h01(i, 74) * 3, h01(i, 75) * 3, 0)).scale(new THREE.Vector3(s, s * 0.7, s)).setPosition(Math.cos(a) * r, s * 0.4 * (1 - r / 10) * 2.2, Math.sin(a) * r));
    }
    b.build(this.rubble); this.rubble.position.set(ADV[0], 0, ADV[2] + 1); this.rubble.visible = false; O.add(this.rubble);

    // ---- middle ward: walls with the gate gap and the garderobe slot, towers, chapel, courtyard props ----
    b = new Batch();
    const { x0, x1, z0, z1, h, t } = MID, mc = [0, 5];
    wall(b, x0, z1, -1.4, z1, h, t, mc[0], mc[1]); wall(b, 1.4, z1, x1, z1, h, t, mc[0], mc[1]);
    b.add(boxGeo(V(-1.4, 5, z1 - t / 2), V(1.4, h, z1 + t / 2), 4), stone); // over the gate
    wall(b, x1, z1, x1, z0, h, t, mc[0], mc[1]); wall(b, x1, z0, x0, z0, h, t, mc[0], mc[1]);
    // west wall in three pieces around the chute slot (outer face x = WALL_W)
    wall(b, x0, z0, x0, CHUTE.z0, h, t, mc[0], mc[1], false); wall(b, x0, CHUTE.z1, x0, z1, h, t, mc[0], mc[1]);
    b.add(boxGeo(V(WALL_W + CHUTE.depth, -3, CHUTE.z0), V(x0 + t / 2, CHUTE.y1, CHUTE.z1), 4), stone); // behind the slot
    b.add(boxGeo(V(WALL_W, CHUTE.y1, CHUTE.z0), V(x0 + t / 2, h, CHUTE.z1), 4), stone); // above the slot
    for (let s = CHUTE.z0 + 0.1; s + 0.9 < CHUTE.z1; s += 1.75) b.add(boxGeo(V(WALL_W, h, s), V(WALL_W + 0.6, h + 1.15, s + 0.95), 2), stone);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(CHUTE.z1 - CHUTE.z0, CHUTE.y1 + 3).rotateY(-Math.PI / 2), lam("chuteBack", () => ({ map: chuteTex() })));
    back.position.set(WALL_W + CHUTE.depth - 0.01, (CHUTE.y1 - 3) / 2, (CHUTE.z0 + CHUTE.z1) / 2); back.receiveShadow = true; mw.add(back);
    const stain = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2).rotateY(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: stainTex(), transparent: true, depthWrite: false }));
    stain.position.set(WALL_W - 0.02, 1.2, (CHUTE.z0 + CHUTE.z1) / 2); stain.layers.set(NOINK); mw.add(stain);
    this.plug = new THREE.Mesh(boxGeo(V(WALL_W, -3, CHUTE.z0), V(WALL_W + CHUTE.depth, CHUTE.y1, CHUTE.z1), 4), stone);
    this.plug.castShadow = true; this.plug.receiveShadow = true; mw.add(this.plug);
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) tower(b, x, z, 4.8, 15.5, slate);
    tower(b, -4.2, z1, 2.8, 14.5, null); tower(b, 4.2, z1, 2.8, 14.5, null); // gatehouse
    // the causeway over the ditch to the outer ward
    b.add(boxGeo(V(-2.2, -9.5, 23.2), V(2.2, 0.02, 36.2), 4), stone);
    // chapel
    const C = CHAPEL, ch = C.h, rh = 3.2, cx2 = (C.x0 + C.x1) / 2;
    b.add(boxGeo(V(C.x0, 0, C.z0), V(C.x1, ch, C.z1), 4), stone);
    b.add(quad(V(C.x1 + 0.4, ch - 0.1, C.z1 + 0.4), V(C.x1 + 0.4, ch - 0.1, C.z0 - 0.4), V(cx2, ch + rh, C.z0 - 0.4), V(cx2, ch + rh, C.z1 + 0.4), 3, 1), redRoof);
    b.add(quad(V(C.x0 - 0.4, ch - 0.1, C.z0 - 0.4), V(C.x0 - 0.4, ch - 0.1, C.z1 + 0.4), V(cx2, ch + rh, C.z1 + 0.4), V(cx2, ch + rh, C.z0 - 0.4), 3, 1), redRoof);
    b.add(tri(V(C.x0, ch, C.z1), V(C.x1, ch, C.z1), V(cx2, ch + rh, C.z1)), stone);
    b.add(tri(V(C.x1, ch, C.z0), V(C.x0, ch, C.z0), V(cx2, ch + rh, C.z0)), stone);
    b.add(boxGeo(V(C.x1 - 0.05, 0, 3), V(C.x1 + 0.15, 3.2, 5)), wood); // door (east)
    b.add(boxGeo(V(C.x1 - 0.05, 3.2, 3), V(C.x1 + 0.2, 3.5, 5)), stone);
    for (const z of [0.5, 7.5]) b.add(boxGeo(V(C.x1 - 0.02, 2.4, z - 0.3), V(C.x1 + 0.05, 4.6, z + 0.3)), lam("glassDark", () => ({ color: "#3a4a7a" })));
    b.add(boxGeo(V(cx2 - 0.7, ch + rh - 0.4, C.z1 - 1.2), V(cx2 + 0.7, ch + rh + 1.8, C.z1)), stone); // bell-cote
    b.add(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI).translate(cx2, ch + rh + 1.3, C.z1 - 0.6), lam("bell", () => ({ color: "#c9a24a" })));
    // courtyard: a well, barrels, a cart, hay
    const barrel = lam("barrel", () => ({ color: "#8a5a34" })), hay = lam("hay", () => ({ color: "#e2c46a" }));
    b.add(cylGeo(1.1, 0.9, 2), stone, T(8, 0, 4)); b.add(new THREE.ConeGeometry(1.6, 1.1, 8).translate(8, 2.6, 4), redRoof);
    for (const [x, y, z] of [[8.4, 0, 1.6], [7.2, 0, 1.4], [-6, 0, -4], [-6.9, 0, -3.3], [-6.4, 0.9, -3.7], [12, 0, 15], [13, 0, 15.6]]) b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.95, 12).translate(x, y + 0.48, z), barrel);
    b.add(boxGeo(V(14, 0.5, 6), V(17, 1.3, 8), 2), wood); b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 14).rotateX(Math.PI / 2).translate(14.6, 0.55, 8.1), wood);
    b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 14).rotateX(Math.PI / 2).translate(16.4, 0.55, 8.1), wood);
    b.add(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.8, 1).translate(-10, 0, 14), hay);
    b.build(mw); O.add(mw);
    // gate leaves (hinged at the gate edges, swing inward)
    for (const [g, s] of [[this.gateL, -1], [this.gateR, 1]] as const) {
      const gb = new Batch(); gb.add(boxGeo(V(s < 0 ? 0 : -1.4, 0, -0.12), V(s < 0 ? 1.4 : 0, 5, 0.12), 2), wood); gb.build(g);
      g.position.set(s * 1.4, 0, z1 - 0.3); O.add(g);
    }
    // the garderobe: a stone box on corbels outside the west wall, lean-to roof, a little window
    b = new Batch();
    const G = GARDE;
    b.add(boxGeo(V(G.x0 - G.x1, G.y0, G.z0 - (G.z0 + G.z1) / 2), V(0, G.y1, G.z1 - (G.z0 + G.z1) / 2), 2), stone);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(-0.9 + k * 0.25 - 1.0, G.y0 - 0.5 - k * 0.45, -1.2), V(0, G.y0 - k * 0.45, -0.8 + 0.0)), stone);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(-0.9 + k * 0.25 - 1.0, G.y0 - 0.5 - k * 0.45, 0.8), V(0, G.y0 - k * 0.45, 1.2)), stone);
    b.add(quad(V(G.x0 - G.x1 - 0.4, G.y1 - 0.2, 1.8), V(G.x0 - G.x1 - 0.4, G.y1 - 0.2, -1.8), V(0.1, G.y1 + 1.3, -1.8), V(0.1, G.y1 + 1.3, 1.8), 2, 1), slate);
    b.add(boxGeo(V(G.x0 - G.x1 - 0.03, G.y0 + 1.4, -0.35), V(G.x0 - G.x1 + 0.05, G.y0 + 2.6, 0.35)), slit);
    b.add(boxGeo(V(G.x0 - G.x1, G.y0 - 0.05, CHUTE.z0 - (G.z0 + G.z1) / 2), V(G.x0 - G.x1 + 0.9, G.y0 + 0.02, CHUTE.z1 - (G.z0 + G.z1) / 2)), slit); // the hole
    b.build(this.garde);
    this.garde.position.set(G.x1, 0, (G.z0 + G.z1) / 2); mw.add(this.garde);
    // the French flag poking out of the garderobe window (last shot)
    {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6).rotateZ(Math.PI / 2 - 0.6).translate(-0.7, 0.5, 0), lam("mast", () => ({ color: "#7a5236" })));
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0).rotateY(Math.PI / 2).translate(0, 0, -0.8), this.flagMats.fr);
      fl.position.set(-1.4, 0.55, 0.85); fl.rotation.y = 0.25; fl.castShadow = true;
      this.chuteFlag.add(pole, fl); this.chuteFlag.position.set(G.x0 - G.x1, G.y0 + 2.0, 0); this.chuteFlag.visible = false; this.garde.add(this.chuteFlag);
    }

    // ---- inner ward: a corrugated ring of half-round bulges, the gate facing the middle ward ----
    b = new Batch();
    const NI = 16, pts: [number, number][] = [];
    for (let i = 0; i < NI; i++) { const a = (i / NI) * Math.PI * 2; pts.push([INNER.cx + INNER.rx * Math.cos(a), INNER.cz + INNER.rz * Math.sin(a)]); }
    for (let i = 0; i < NI; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % NI];
      if (i === 3) continue; // the gate gap (angle ~ +z)
      wall(b, ax, az, bx, bz, INNER.h, 2.6, INNER.cx, INNER.cz, i % 2 === 0);
      tower(b, ax, az, 2.3, INNER.h + 0.6, null);
    }
    tower(b, pts[3][0], pts[3][1], 3, INNER.h + 1.5, null); tower(b, pts[4][0], pts[4][1], 3, INNER.h + 1.5, null);
    b.add(boxGeo(V(-1.6, -9.5, INNER.cz + INNER.rz - 1), V(1.6, 0.02, -14.5), 4), stone); // the rock bridge
    b.build(iw); O.add(iw);
    // ---- the keep: round donjon with a spur, corbelled parapet, slate cone, flag ----
    b = new Batch();
    const [kx, , kz] = KEEP;
    b.add(new THREE.BoxGeometry(9, 22, 9).translate(0, 11, 0).applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 4)).translate(kx - 5.5, 0, kz - 5.5), stoneT);
    tower(b, kx, kz, 8, 30, null);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      b.add(boxGeo(V(-0.4, -1.4, -0.3), V(0.4, 0, 0.6)), stoneT, new THREE.Matrix4().makeRotationY(-a + Math.PI / 2).setPosition(kx + Math.cos(a) * 8, 30, kz + Math.sin(a) * 8));
    }
    b.add(new THREE.ConeGeometry(7.6, 11, 28).translate(kx, 36.5, kz), slate);
    b.add(new THREE.CylinderGeometry(0.1, 0.1, 6, 6).translate(kx, 44, kz), lam("mast", () => ({ color: "#7a5236" })));
    b.build(kw); O.add(kw);
    this.keepFlag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0).translate(1.6, 0, 0), this.flagMats.en);
    this.keepFlag.position.set(kx + 0.1, 46, kz); this.keepFlag.castShadow = true; O.add(this.keepFlag);

    // remember the stone meshes for the butter swap
    for (const g of [ow, mw, iw, kw, this.adv, this.garde]) g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material === stone || m.material === stoneT)) { this.stoneMeshes.push(m); this.stoneMats.set(m, m.material as THREE.Material); }
    });
    if (this.plug.material === stone) { this.stoneMeshes.push(this.plug); this.stoneMats.set(this.plug, stone); }
  }

  // ---------------- the building site (1196): scaffolds, treadwheel cranes, stone piles, carts ----------------
  private buildSite() {
    const b = new Batch(), pole = lam("scafPole", () => ({ color: "#9a6a42" })), plank = lam("scafPlank", () => ({ map: rep(planksHD(), 1, 0.3) }));
    const block = lam("blockStone", () => ({ map: stoneHD("gaillardStone") }));
    const scaf = (ax: number, az: number, bx: number, bz: number, off: number) => {
      const len = Math.hypot(bx - ax, bz - az), phi = Math.atan2(-(bz - az), bx - ax), m = new THREE.Matrix4().makeRotationY(phi).setPosition(ax, 0, az);
      for (let s = 0; s <= len; s += 3) for (const zz of [off, off + 1.4]) b.add(new THREE.CylinderGeometry(0.08, 0.08, 9, 5).translate(s, 4.5, zz), pole, m);
      for (const y of [2.6, 5.2, 7.8]) b.add(boxGeo(V(0, y, off - 0.1), V(len, y + 0.12, off + 1.5), 2), plank, m);
    };
    for (let i = 0; i < OUTER.length - 1; i++) { const [ax, az] = OUTER[i], [bx, bz] = OUTER[i + 1]; scaf(ax, az, bx, bz, 1.6); }
    scaf(MID.x0, MID.z1, MID.x1, MID.z1, 1.6);
    // treadwheel cranes
    for (const [x, z, yaw] of [[14, 55, 0.6], [-16, 30, -0.4]] as const) {
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      b.add(new THREE.TorusGeometry(2.2, 0.16, 6, 20).translate(0, 2.4, 0), pole, m);
      b.add(new THREE.CylinderGeometry(0.15, 0.15, 2.2, 6).rotateX(Math.PI / 2).translate(0, 2.4, 0), pole, m);
      for (const s of [-1, 1]) b.add(boxGeo(V(-0.12, 0, s * 1.2 - 0.12), V(0.12, 9, s * 1.2 + 0.12)), pole, m);
      b.add(boxGeo(V(-0.15, 8.6, -0.15), V(6, 8.9, 0.15)), pole, m);
    }
    // stone blocks, carts, a lime pit
    for (let i = 0; i < 26; i++) {
      const x = -22 + 44 * h01(i, 81), z = 82 + 14 * h01(i, 82);
      if (Math.abs(x - 2) < 4) continue;
      for (let k = 0; k < 1 + (i % 3); k++) b.add(boxGeo(V(x, k * 0.6, z), V(x + 1.1, k * 0.6 + 0.6, z + 0.7), 1), block);
    }
    b.build(this.site); this.site.visible = false; this.outside.add(this.site);
  }

  // ---------------- the French siege camp (1203) ----------------
  private buildCamp() {
    const b = new Batch();
    const tents = [lam("tentBW", () => ({ map: tentTex("#2c56b8", "#f4efe2") })), lam("tentRW", () => ({ map: tentTex("#e8c45a", "#f4efe2") }))];
    const wood = lam("trebWood", () => ({ color: "#8a5a34" })), pole = lam("mast", () => ({ color: "#7a5236" }));
    for (let i = 0; i < 22; i++) {
      const x = -30 + 70 * h01(i, 91), z = 108 + 70 * h01(i, 92);
      if (Math.abs(x - 2) < 5) continue;
      const r = 2 + 0.8 * h01(i, 93), h = 3 + h01(i, 94);
      b.add(new THREE.ConeGeometry(r, h, 14).translate(x, h / 2, z), tents[i % 2]);
      b.add(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5).translate(x, h + 0.5, z), pole);
    }
    // two trebuchets aimed at the castle
    for (const [x, z] of [[-14, 104], [18, 106]]) {
      const m = T(x, 0, z);
      b.add(boxGeo(V(-2.5, 0, -1.6), V(2.5, 0.5, 1.6)), wood, m);
      for (const s of [-1, 1]) { b.add(boxGeo(V(-0.2, 0, s * 1.2 - 0.2), V(0.2, 5, s * 1.2 + 0.2)), wood, m); }
      b.add(boxGeo(V(-6, 4.6, -0.18), V(3, 4.95, 0.18)), wood, new THREE.Matrix4().makeRotationZ(0.35).setPosition(x, 0, z));
      b.add(boxGeo(V(2.2, 1.6, -0.8), V(3.6, 3.2, 0.8)), lam("trebWeight", () => ({ color: "#6b6560" })), m);
    }
    // campfires: a stone ring and an HDR ember cone
    const ember = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 1.6, 0.4) });
    for (const [x, z] of [[-6, 120], [10, 134], [24, 118], [-18, 140]]) {
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; b.add(new THREE.DodecahedronGeometry(0.25, 0), lam("rockChalk", () => ({ color: "#d9d2c2" })), T(x + Math.cos(a) * 0.7, 0.12, z + Math.sin(a) * 0.7)); }
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 8).translate(x, 0.45, z), ember); e.layers.set(NOINK); this.camp.add(e);
    }
    // banners on poles (France)
    for (const [x, z] of [[-4, 104], [8, 104], [30, 128], [-24, 126]]) {
      b.add(new THREE.CylinderGeometry(0.08, 0.08, 6, 6).translate(x, 3, z), pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1).translate(0.9, 0, 0), this.flagMats.fr);
      fl.position.set(x, 5.3, z); fl.rotation.y = 0.4; fl.castShadow = true; this.camp.add(fl);
    }
    // the miners' tunnel mouth at the foot of the advanced tower, with spoil heaps
    const spoil = lam("spoil", () => ({ color: "#d8cfbe" }));
    b.add(new THREE.CircleGeometry(1.6, 18).rotateX(-Math.PI / 2).translate(0.5, 0.03, 82), lam("hole", () => ({ color: "#1f1a1c" })));
    for (const [x, z, s] of [[-3.4, 80.6, 1.6], [4.4, 81.0, 1.3], [2.4, 80.2, 1]]) b.add(new THREE.SphereGeometry(s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1).translate(x, 0, z), spoil);
    for (const s of [-1, 1]) b.add(boxGeo(V(0.5 + s * 1.4 - 0.12, 0, 81.9), V(0.5 + s * 1.4 + 0.12, 1.8, 82.1)), wood); // timber props
    b.add(boxGeo(V(-1.0, 1.7, 81.85), V(2.0, 1.95, 82.15)), wood);
    b.build(this.camp); this.camp.visible = false; this.outside.add(this.camp);
  }

  // ---------------- shot 4: the treasurer's balance; little castles ----------------
  private miniCastle() {
    const g = new THREE.Group(), b = new Batch(), st = lam("gaillardStone", () => ({})), roof = lam("slateRoof", () => ({}));
    b.add(boxGeo(V(-0.18, 0, -0.18), V(0.18, 0.16, 0.18), 0.5), st);
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.18, 0.18]]) {
      b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10).translate(x, 0.13, z), st);
      b.add(new THREE.ConeGeometry(0.08, 0.12, 10).translate(x, 0.32, z), roof);
    }
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 10).translate(0, 0.17, 0), st);
    b.add(new THREE.ConeGeometry(0.1, 0.14, 10).translate(0, 0.41, 0), roof);
    b.build(g);
    return g;
  }
  private buildScale() {
    const S = this.scale, b = new Batch(), wood = lam("scaleWood", () => ({ color: "#7a4b2a" })), brass = lam("brass", () => ({ color: "#d9a640" }));
    b.add(boxGeo(V(-0.8, 0, -0.6), V(0.8, 0.35, 0.6), 1), wood);
    b.add(new THREE.CylinderGeometry(0.11, 0.14, 2.7, 10).translate(0, 1.7, 0), brass);
    b.add(new THREE.SphereGeometry(0.18, 12, 8).translate(0, 3.08, 0), brass);
    b.build(S);
    const bb = new Batch(); bb.add(boxGeo(V(-1.3, -0.07, -0.07), V(1.3, 0.07, 0.07)), brass); bb.build(this.beam);
    this.beam.position.set(0, 3.0, 0); S.add(this.beam);
    for (let k = 0; k < 2; k++) {
      const g = new THREE.Group(), pb = new Batch();
      pb.add(new THREE.CylinderGeometry(0.5, 0.4, 0.12, 20).translate(0, 0, 0), brass);
      pb.build(g); S.add(g); this.pans.push({ g });
      for (let c = 0; c < 3; c++) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), brass); S.add(ch); this.chains.push(ch); }
    }
    for (let i = 0; i < 5; i++) { const m = this.miniCastle(); m.scale.setScalar(0.001); this.minis.push(m); S.add(m); }
    S.position.set(...SCALE); S.visible = false; this.outside.add(S);
    this.cradleMini = this.miniCastle(); this.cradleMini.visible = false; this.outside.add(this.cradleMini);
  }

  // ---------------- interior sets ----------------
  private buildChapel() {
    const G = this.sets.chapel, b = new Batch();
    const wall = lam("chapelWall", () => ({ map: stoneHD("chapelStone", ["#e6d4b4", "#dcc8a6", "#ecdcc0", "#d2bd98"], "#a48c6c") }));
    const floor = lam("chapelFloor", () => ({ map: rep(cobbleHD(), 3, 3) })), wood = lam("benchWood", () => ({ map: rep(planksHD(), 1, 1) }));
    const X0 = -5, X1 = 5, Z0 = -9, Z1 = 9, HH = 7.5;
    b.add(boxGeo(V(X0, -0.3, Z0), V(X1, 0, Z1), 3), floor);
    b.add(boxGeo(V(X0 - 0.5, 0, Z0), V(X0, HH, Z1), 4), wall); b.add(boxGeo(V(X1, 0, Z0), V(X1 + 0.5, HH, Z1), 4), wall);
    b.add(boxGeo(V(X0, 0, Z0 - 0.5), V(X1, HH, Z0), 4), wall); b.add(boxGeo(V(X0, 0, Z1), V(X1, HH, Z1 + 0.5), 4), wall);
    b.add(boxGeo(V(X0, HH, Z0), V(X1, HH + 0.3, Z1)), lam("ceilWood", () => ({ color: "#5a3f2d" })));
    for (let z = Z0 + 1; z < Z1; z += 2.4) b.add(boxGeo(V(X0, HH - 0.5, z - 0.15), V(X1, HH, z + 0.15)), wood); // beams
    // altar, cloth, cross, candles
    b.add(boxGeo(V(-1.6, 0, Z0 + 0.6), V(1.6, 1.1, Z0 + 1.6), 1), wall);
    b.add(boxGeo(V(-1.7, 1.1, Z0 + 0.55), V(1.7, 1.18, Z0 + 1.65)), lam("altarCloth", () => ({ color: "#f4efe2" })));
    b.add(boxGeo(V(-0.6, 0.6, Z0 + 1.61), V(0.6, 1.0, Z0 + 1.66)), lam("clothRed", () => ({ color: "#b8323a" })));
    const gold = lam("goldCross", () => ({ color: "#e8c45a" }));
    b.add(boxGeo(V(-0.08, 1.18, Z0 + 1.0), V(0.08, 2.4, Z0 + 1.16)), gold); b.add(boxGeo(V(-0.45, 1.9, Z0 + 1.0), V(0.45, 2.06, Z0 + 1.16)), gold);
    const flame = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 3.2, 1.2) });
    for (const [x, z] of [[-1.3, Z0 + 1.1], [1.3, Z0 + 1.1], [-3.8, 1.2], [3.6, -3.0], [-3.8, -4.4]]) {
      const y0 = x === -1.3 || x === 1.3 ? 1.18 : 0;
      b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.45 + (y0 ? 0 : 0.9), 8).translate(x, y0 + (0.45 + (y0 ? 0 : 0.9)) / 2, z), lam("candle", () => ({ color: "#f4efe2" })));
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6).scale(1, 1.8, 1), flame); fl.position.set(x, y0 + 0.5 + (y0 ? 0 : 0.9), z); fl.layers.set(NOINK); G.add(fl);
    }
    // benches, a rug, a tapestry, stained glass
    for (let r = 0; r < 4; r++) for (const s of [-1, 1]) {
      const z = -4.8 + r * 2.0, x0b = s < 0 ? -3.6 : 0.6, x1b = s < 0 ? -0.6 : 2.6;
      b.add(boxGeo(V(x0b, 0.42, z - 0.25), V(x1b, 0.52, z + 0.25)), wood);
      for (const xx of [x0b + 0.15, x1b - 0.25]) b.add(boxGeo(V(xx, 0, z - 0.2), V(xx + 0.1, 0.42, z + 0.2)), wood);
    }
    b.add(boxGeo(V(-0.45, 0.005, -7.4), V(0.45, 0.02, 7.6)), lam("rug", () => ({ color: "#8c2f3a" })));
    const tap = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.7).rotateY(Math.PI / 2), lam("tapestry", () => ({ map: tapestryTex() })));
    tap.position.set(X0 + 0.02, 3.4, -2.4); tap.receiveShadow = true; G.add(tap);
    for (const z of [-5.5, 0.5, 5.5]) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glassTex(Math.round(z * 10)), color: new THREE.Color(2.2, 2.2, 2.2) }));
      gl.position.set(X1 - 0.02, 4.0, z); gl.layers.set(NOINK); G.add(gl);
      if (z === 0.5 || z === 5.5) continue;
      const gl2 = gl.clone(); gl2.rotation.y = Math.PI; gl2.position.set(X0 + 0.02, 4.0, z); G.add(gl2);
    }
    // the toilet niche on the right wall: a stone seat with a dark hole, wooden partitions, a sconce
    const s0 = SEAT[0] - CH[0], s2 = SEAT[2] - CH[2];
    b.add(boxGeo(V(s0 - 0.75, 0, s2 - 0.75), V(X1, 0.55, s2 + 0.75), 1), wall);
    for (const zz of [s2 - 0.95, s2 + 0.75]) b.add(boxGeo(V(s0 - 0.8, 0, zz), V(X1, 2.3, zz + 0.2), 1.5), wood);
    b.add(boxGeo(V(s0 - 0.8, 2.3, s2 - 0.95), V(X1, 2.45, s2 + 0.95), 1.5), wood);
    { const sc = lam("sconce", () => ({ color: "#3a2a22" })); b.add(boxGeo(V(X1 - 0.25, 1.6, s2 - 1.4), V(X1, 1.9, s2 - 1.25)), sc);
      const fl2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6).scale(1, 1.8, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 3.2, 1.2) })); fl2.position.set(X1 - 0.15, 2.05, s2 - 1.32); fl2.layers.set(NOINK); G.add(fl2); }
    b.add(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 14).translate(s0 - 0.35, 0.75, s2 - 1.25), lam("basket", () => ({ color: "#b8894a" }))); // hay to wipe with
    b.add(new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(s0 - 0.35, 0.93, s2 - 1.25), lam("hay", () => ({ color: "#e2c46a" })));
    b.add(boxGeo(V(X1 - 0.35, 1.25, s2 + 1.2), V(X1, 1.32, s2 + 2.0)), wood); b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8).translate(X1 - 0.18, 1.47, s2 + 1.6), lam("candle", () => ({ color: "#f4efe2" })));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24).rotateX(-Math.PI / 2), lam("holeDark", () => ({ color: "#140f10" })));
    hole.position.set(s0, 0.556, s2); G.add(hole);
    // John's map easel near the door
    b.add(boxGeo(V(-3.6, 0, 4.0), V(-3.5, 2.1, 4.1)), wood); b.add(boxGeo(V(-2.3, 0, 4.0), V(-2.2, 2.1, 4.1)), wood);
    b.add(boxGeo(V(-3.75, 1.0, 3.95), V(-2.05, 2.15, 4.0)), lam("boardDark", () => ({ color: "#5a3f2d" })));
    b.build(G);
    G.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    G.position.set(...CH); G.visible = false;
  }
  private buildBank() {
    const G = this.sets.bank, b = new Batch();
    const steel = lam("vaultSteel", () => ({ map: steelTex() })), marble = lam("marble", () => ({ map: rep(marbleTex(), 6, 6) }));
    const cream = lam("bankWall", () => ({ color: "#efe4cc" })), dark = lam("vaultDark", () => ({ color: "#2a2e36" }));
    b.add(boxGeo(V(-12, -0.3, -12), V(12, 0, 12), 3), marble);
    for (const [a, c] of [[V(-12.5, 0, -12.5), V(-12, 7, 12.5)], [V(12, 0, -12.5), V(12.5, 7, 12.5)], [V(-12.5, 0, -12.5), V(12.5, 7, -12)], [V(-12.5, 0, 12), V(12.5, 7, 12.5)]] as const) b.add(boxGeo(a, c, 3), cream);
    b.add(boxGeo(V(-12.5, 7, -12.5), V(12.5, 7.3, 12.5)), cream);
    for (const [x, z] of [[-7, 7], [7, 7], [-7, -7], [7, -7]]) { b.add(cylGeo(0.5, 7, 2), cream, T(x, 0, z)); b.add(boxGeo(V(x - 0.7, 0, z - 0.7), V(x + 0.7, 0.4, z + 0.7)), cream); b.add(boxGeo(V(x - 0.7, 6.6, z - 0.7), V(x + 0.7, 7, z + 0.7)), cream); }
    // the vault: steel box, round door with bolts, wheel and hinges
    b.add(boxGeo(V(-2.5, 0, -2.5), V(2.5, 4, 2.5), 2.5), steel);
    b.add(new THREE.CylinderGeometry(1.75, 1.75, 0.2, 40).rotateX(Math.PI / 2).translate(0, 1.95, 2.6), dark);
    b.add(new THREE.CylinderGeometry(1.55, 1.55, 0.45, 40).rotateX(Math.PI / 2).translate(0, 1.95, 2.75), steel);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; b.add(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 8).rotateX(Math.PI / 2).translate(Math.cos(a) * 1.3, 1.95 + Math.sin(a) * 1.3, 3.0), dark); }
    b.add(new THREE.TorusGeometry(0.55, 0.06, 8, 24).translate(0, 1.95, 3.1), lam("brass", () => ({ color: "#d9a640" })));
    for (let i = 0; i < 4; i++) b.add(boxGeo(V(-0.04, 0, -0.04), V(0.04, 0.55, 0.04)), lam("brass", () => ({ color: "#d9a640" })), new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2).setPosition(0, 1.95, 3.1));
    b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10).rotateX(Math.PI / 2).translate(0, 1.95, 3.12), dark);
    // velvet rope in front
    for (const x of [-2.4, 2.4]) { b.add(new THREE.CylinderGeometry(0.05, 0.08, 1.0, 10).translate(x, 0.5, 5.2), lam("brass", () => ({ color: "#d9a640" }))); }
    b.add(new THREE.TorusGeometry(2.4, 0.05, 6, 24, Math.PI).rotateX(Math.PI).scale(1, 0.18, 1).translate(0, 0.98, 5.2), lam("velvet", () => ({ color: "#a8202e" })));
    // the doggy door frame on the back
    b.add(boxGeo(V(0.35, 0, -2.56), V(1.15, 0.95, -2.5)), dark);
    b.build(G);
    const fb = new Batch(); fb.add(boxGeo(V(-0.36, -0.85, -0.02), V(0.36, 0, 0.02)), lam("flapWood", () => ({ color: "#b0763c" }))); fb.build(this.flap);
    this.flap.position.set(0.75, 0.9, -2.6); G.add(this.flap);
    G.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    G.position.set(...BANK); G.visible = false;
  }
  private buildSection() {
    const G = this.sets.section, b = new Batch();
    const stone = lam("gaillardStone", () => ({})), cut = lam("sectionCut", () => ({ map: rep(sectionTex(), 1, 1) }));
    const grass = lam("secGrass", () => ({ map: rep(grassHD(), 30, 30), color: "#a8bd7f" })), dark = lam("chuteBack", () => ({}));
    b.add(new THREE.PlaneGeometry(240, 240).rotateX(-Math.PI / 2), grass);
    const blocks: [number, number, number, number, number, number][] = [
      [-5, 0, -1.5, -0.45, 10, 1.5], [0.45, 0, -1.5, 5, 10, 1.5], [-0.45, 0, -1.5, 0.45, 10, 0.0], // around the chute
      [-5, 10, -1.5, -1.8, 12.8, 1.5], [1.8, 10, -1.5, 5, 12.8, 1.5], [-1.8, 10, -1.5, 1.8, 12.8, -0.6], // the garderobe room
      [-5, 12.8, -1.5, 5, 13.4, 1.5], // its ceiling and the wall-walk
      [-0.9, 10, -0.6, -0.3, 10.5, 1.5], [0.3, 10, -0.6, 0.9, 10.5, 1.5], [-0.3, 10, -0.6, 0.3, 10.5, -0.1], // the seat around the hole
    ];
    for (const [ax, ay, az, bx, by, bz] of blocks) {
      b.add(boxGeo(V(ax, ay, az), V(bx, by, bz), 4), stone);
      if (bz > 0.0 || (ax === -0.45 && bz === 0.0)) b.add(quad(V(ax, ay, bz + 0.01), V(bx, ay, bz + 0.01), V(bx, by, bz + 0.01), V(ax, by, bz + 0.01), (bx - ax) / 3, (by - ay) / 3), bz === 0.0 ? dark : cut);
    }
    for (let s = -4.6; s < 4.6; s += 1.75) b.add(boxGeo(V(s, 13.4, -1.5), V(s + 0.95, 14.55, 1.5), 2), stone); // merlons
    for (let i = 0; i < 18; i++) { const a = h01(i, 61) * 6.28, r = 0.6 + 2.4 * h01(i, 62), s = 0.2 + 0.5 * h01(i, 63); b.add(new THREE.DodecahedronGeometry(1, 0), lam("rockChalk", () => ({ color: "#d9d2c2" })), new THREE.Matrix4().makeScale(s * 1.4, s, s).setPosition(Math.cos(a) * r, s * 0.4, 1.2 + Math.sin(a) * r * 0.6)); }
    b.build(G);
    G.position.set(...SEC); G.visible = false;
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
    const s = SHOTS[id - 1], Lp = P[s.light], K = LK[s.light], st = stateAt(id, f), t = f / FPS;
    const set = id === 15 || id === 16 || id === 19 || id === 22 ? "chapel" : id === 18 ? "bank" : id === 17 ? "section" : "out";
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
    // ---- which world ----
    this.outside.visible = set === "out" || set === "section";
    this.sets.chapel.visible = set === "chapel"; this.sets.bank.visible = set === "bank"; this.sets.section.visible = set === "section";
    this.sky.visible = set === "out" || set === "section";
    // ---- castle state ----
    this.wards.forEach((g, k) => { g.scale.set(1, Math.max(0.001, st.rise[k]), 1); });
    this.adv.scale.set(1, Math.max(0.001, st.rise[0]), 1);
    const fall = st.adv;
    this.adv.position.y = -16 * fall; this.adv.rotation.set(0.35 * fall, 0, -0.5 * fall);
    this.adv.visible = fall < 0.999; this.rubble.visible = fall > 0.55; this.rubble.scale.set(1, clamp01((fall - 0.55) / 0.45), 1);
    this.garde.visible = st.garde > 0.001; this.garde.scale.setScalar(Math.max(0.001, st.garde)); this.plug.visible = st.garde < 0.5;
    this.gateL.rotation.y = st.gate * 1.5; this.gateR.rotation.y = -st.gate * 1.5;
    this.site.visible = st.site; this.camp.visible = st.camp;
    this.keepFlag.material = this.flagMats[st.flag];
    this.keepFlag.rotation.y = 0.5 + 0.12 * Math.sin(t * 3);
    if (id === 21) { const k = st.flag === "en" ? 1 - at(f, 1806, 22) : at(f, 1828, 14); this.keepFlag.position.y = 40 + 6 * k; }
    else this.keepFlag.position.y = 46;
    this.chuteFlag.visible = st.chuteFlag; if (st.chuteFlag) this.chuteFlag.rotation.x = 0.1 * Math.sin(t * 4);
    const butter = st.butter > 0.5;
    for (const m of this.stoneMeshes) m.material = butter ? this.butterMat : this.stoneMats.get(m)!;
    // ---- shot 4: the balance ----
    this.scale.visible = id === 4;
    if (id === 4) {
      const sacks = [380, 386, 392, 398].filter((f0) => f >= f0 + 8).length;
      const th = -0.26 * popIn(at(f, 387, 14)) * (sacks > 0 ? 1 : 0) + 0.04 * Math.sin(t * 2.2) * (f > 400 ? 1 : 0);
      this.beam.rotation.z = th;
      this.pans.forEach((p, k) => {
        const sx = k ? 1 : -1, x = sx * 1.22 * Math.cos(th), y = 3.0 + sx * 1.22 * Math.sin(th);
        p.g.position.set(x, y - 1.35, 0);
        for (let cc = 0; cc < 3; cc++) {
          const a = (cc / 3) * 6.28, px = x + Math.cos(a) * 0.42, pz = Math.sin(a) * 0.42, ch = this.chains[k * 3 + cc];
          const top = new THREE.Vector3(x, y, 0), bot = new THREE.Vector3(px, y - 1.35, pz), mid = top.clone().add(bot).multiplyScalar(0.5);
          ch.position.copy(mid); ch.scale.set(1, top.distanceTo(bot), 1); ch.lookAt(this.v.copy(bot).add(this.scale.position)); ch.rotateX(Math.PI / 2);
        }
      });
      const pr = this.pans[1].g.position;
      this.minis.forEach((m, i) => {
        const k = popIn(at(f, 440 + i * 5, 8));
        m.scale.setScalar(Math.max(0.001, k * 0.9));
        m.position.set(pr.x + [-0.25, 0.22, 0, -0.2, 0.25][i], pr.y + 0.07 + (i > 2 ? 0.0 : 0), pr.z + [0.2, 0.2, -0.25, -0.15, -0.18][i]);
      });
    }
    this.cradleMini.visible = id === 5;
    if (id === 5) { const [x, , z] = ahead(5, 482, 3.2, -0.25); const c2 = run5(); this.cradleMini.position.set(x + c2[0] * 0.3, 0.8, z + c2[2] * 0.3); this.cradleMini.scale.setScalar(0.72); this.cradleMini.rotation.y = 0.4 + 0.2 * Math.sin(t * 2); }
    this.flap.rotation.x = id === 18 ? -1.1 * popIn(at(f, 1684, 8)) : 0;

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx) / (Math.PI / 4)) * (Math.PI / 4);
    const places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; size: [number, number, number]; breath: number }[] = [];
    const fxs: FxP[] = [];
    castFor(id, f).forEach((w) => {
      const d = cam.position.distanceTo(this.v.set(w.x, w.y + 1.2, w.z)) / (w.scale ?? 1);
      const [cw, ch, k] = tier(d);
      const blink = lidAt(f, w.seed);
      const fo: FrontOpts = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: w.mode ?? "stand", blink, light: light2, seed: w.seed,
        wave: w.wave, prop: w.prop ?? null, look: w.look ?? 0, pose: w.pose, facing: w.facing ?? 0, tilt: w.tilt ? q(w.tilt, 2) : 0, ...(w.talk ? { talk: w.talk } : {}) };
      // idle breathing (GrowKaz idea): standing and seated cards rise and settle ~1.2 % on a 3-4 s cycle, a phase per character
      const breath = (w.mode ?? "stand") === "stand" || w.mode === "sit" ? 0.012 * Math.sin((2 * Math.PI * t) / (3.1 + 0.5 * h01(w.seed, 3)) + w.seed) : 0;
      places.push({ key: `F|${JSON.stringify(w.o)}|${JSON.stringify(fo)}|${cw}`, draw: (p) => bodyFront(p, w.o, fo), x: w.x, y: w.y, z: w.z, size: [cw, ch, k], breath });
      if (!w.noBlob) {
        const cc = set === "out" ? "#9aa0c0" : "#7a6a6a";
        fxs.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: w.x, y: w.y + 0.025, z: w.z, w: 0.75, h: 0.55, flat: true });
      }
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
    if (id === 3) { for (const [f0, k] of [[287, 0], [295, 1], [302, 2]] as const) for (const [x, z] of [[[0, 74], [-26, 36], [26, 36]], [[-32, 22], [32, 22], [0, -12]], [[0, -30], [-19, -46], [19, -46]]][k]) puff(f0, x, 3, z, 16); puff(357, KEEP[0], 6, KEEP[2], 20); }
    if (id === 4) {
      const pl = this.pans[0].g.position;
      [380, 386, 392, 398].forEach((f0, i) => {
        if (f < f0) return;
        const u = at(f, f0, 8), y = pl.y + 0.35 + 3.0 * (1 - easeOut(u)) * (u < 1 ? 1 : 0) + [0, 0, 0.42, 0.42][i];
        fxs.push({ key: "sack", cw: 200, ch: 220, draw: fxSack, x: SCALE[0] + pl.x + [-0.18, 0.18, -0.08, 0.14][i], y, z: SCALE[2] + pl.z + 0.1 * i, w: 0.5, h: 0.55 });
        if (u >= 1) spark(f0 + 8, SCALE[0] + pl.x, pl.y + 0.6, SCALE[2] + 0.4, 1.2, "#ffe066");
      });
      for (let i = 0; i < 6; i++) if (f > 402) { const ph = q(((t * 1.5 + i * 0.17) % 1), 12); fxs.push({ key: `coin${ph}`, cw: 100, ch: 100, draw: (p) => fxCoin(p, ph), x: SCALE[0] - 1.2 + Math.cos(i) * 0.7, y: 2.2 + 0.8 * Math.sin(t * 2 + i), z: SCALE[2] + 0.6 + Math.sin(i * 2) * 0.4, w: 0.16, h: 0.16 }); }
    }
    if (id === 5 && f > 548) for (let i = 0; i < 5; i++) {
      const u = ((t - 548 / FPS) * 0.5 + i * 0.2) % 1, [x, , z] = ahead(5, 482, 3.2, -0.25);
      fxs.push({ key: "heart", cw: 120, ch: 120, draw: fxHeart, x: x + 0.5 * Math.sin(i * 2 + u * 4) - 0.2, y: 1.2 + 1.3 * u, z: z + 0.4, w: 0.22 * (1 - u * 0.4), h: 0.22 * (1 - u * 0.4) });
    }
    if (id === 7) spark(756, R7[0] - 0.9, 3.6, R7[2] - 0.6, 2.4, "#fff0a0");
    if (id === 23) spark(1953, -32, 8, 0, 30, "#fff0a0");
    if (id === 8) {
      const [jx, , jz] = ahead(8, 770, 4.6, 0.35);
      if (f >= 777 && f < 828) {
        const fallU = at(f, 777, 12), roll = at(f, 790, 25);
        const x = jx - 1.6 + 1.2 * smooth(roll), y = 0.18 + 2.6 * (1 - easeOut(fallU)) * (fallU < 1 ? 1 : 0) + 0.25 * Math.abs(Math.sin(roll * Math.PI * 2)) * (1 - roll);
        fxs.push({ key: "crown", cw: 260, ch: 160, draw: fxCrown, x, y, z: jz + 0.3, w: 0.42, h: 0.26, rot: -roll * 6.28 * 1.5 });
        if (f >= 789 && f < 799) puff(789, x, 0.2, jz + 0.3, 0.9, 10);
      }
    }
    if (id === 9) spark(913, GARDE.x0 - 0.5, 8.2, -2.0, 4.5);
    if (id === 10) {
      for (let i = 0; i < 6; i++) puff(1056 + i * 3, ADV[0] + (h01(i, 5) - 0.5) * 14, 2 + 4 * h01(i, 6), ADV[2] + 4 + (h01(i, 7) - 0.5) * 8, 14 + 6 * h01(i, 8), 32);
      if (f >= 1014 && f < 1050) for (let k = 0; k < 3; k++) { const f0 = 1014 + ((Math.floor((f - 1014 - k * 7) / 21)) * 21) + k * 7; puff(f0, [-0.7, 1.0, 2.6][k] + 0.4, 0.3, [85.6, 86.6, 85.1][k] - 0.4, 1.0, 14); }
    }
    if (id === 15) spark(1287, SEAT[0], 1.0, SEAT[2], 1.6);
    if (id === 16) {
      const ph = q((t * 0.9) % 1, 24);
      fxs.push({ key: `stink${ph}`, cw: 200, ch: 300, draw: (p) => fxStink(p, ph), x: SEAT[0] + 0.05, y: 1.25, z: SEAT[2] + 0.25, w: 0.55, h: 0.82, soft: true });
      const a = t * 4.2, fp = q((t * 8) % 1, 6);
      fxs.push({ key: `fly${fp}`, cw: 120, ch: 90, draw: (p) => fxFly(p, fp), x: SEAT[0] + 0.32 * Math.cos(a), y: 1.18 + 0.14 * Math.sin(a * 1.7), z: SEAT[2] + 0.3 * Math.sin(a) + 0.15, w: 0.1, h: 0.075 });
    }
    if (id === 17 && f >= 1540) {
      const u = at(f, 1540, 58), y = 10.0 - 9.6 * easeIn2(u);
      if (u < 1) fxs.push({ key: "drop", cw: 80, ch: 110, draw: fxDrop, x: SEC[0], y, z: SEC[2] + 0.75, w: 0.24, h: 0.33 });
      spark(1598, SEC[0], 0.5, SEC[2] + 1.0, 1.4, "#c9a26a");
    }
    if (id === 19 && f >= 1743) {
      for (const [x, z, s] of [[SEAT[0] - 0.55, SEAT[2] + 1.05, 0.9], [SEAT[0] - 2.2, SEAT[2] - 1.6, 1.0], [CH[0] + 1.6, CH[2] - 3.0, 0.8]] as const) {
        const ph = q((t * 2 + x) % 1, 12), g = popIn(at(f, 1743, 10));
        fxs.push({ key: `flame${ph}`, cw: 200, ch: 300, draw: (p) => fxFlame(p, ph), x, y: 0.75 * s * g, z, w: 1.0 * s * g, h: 1.5 * s * g });
      }
      for (let i = 0; i < 3; i++) { const u = ((t - 1743 / FPS) * 0.6 + i * 0.33) % 1, qq = q(u, 20); fxs.push({ key: `smoke${qq}`, cw: 300, ch: 300, draw: (p) => fxSmoke(p, qq), x: SEAT[0] - 1.6, y: 1.8 + 2.6 * u, z: SEAT[2] - 0.6, w: 2.4, h: 2.4, soft: true }); }
    }
    if (id === 20 && f >= 1760) puff(1774, 0, 1.2, MID.z1 - 1.5, 3.5, 20);
    if (id === 22) { const k = smooth(at(f, 1848, 18)); const kk = q(k, 24); fxs.push({ key: `map${kk}`, cw: 400, ch: 300, draw: (p) => fxMap(p, kk), x: CH[0] - 2.9, y: 1.58, z: CH[2] + 4.03, w: 1.6, h: 1.12, yaw: 0 }); }
    // ---- bind cards ----
    this.frustumC.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of places) {
      if (!this.frustumC.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      a.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(1 - 0.4 * p.breath, 1 + p.breath, 1);
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
}

const easeIn2 = (u: number) => clamp01(u) ** 2;

/** the chalk cliffs as their own high-resolution face along the spur outline: west side, the rounded tip, east side.
 *  Each column follows the terrain slope (1 : 6.2) and bulges out a little with noise, so it covers the coarse
 *  terrain behind it; the texture runs down the face (strata, flint, cracks, moss). */
function cliffCurtain() {
  const line: [number, number][] = [];
  for (let z = 230; z > -60; z -= 1.5) line.push([-42, z]);
  for (let k = 0; k <= 40; k++) { const th = Math.PI - (k / 40) * Math.PI; line.push([42 * Math.cos(th), -60 - 24 * Math.sin(th)]); }
  for (let z = -60; z < 84; z += 1.5) line.push([42, z]);
  for (let z = 84; z < 104; z += 1.5) line.push([42 + (z - 84) * 5, z]);
  const ROWS = 30, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let acc = 0;
  line.forEach(([x, z], i) => {
    const [px, pz] = line[Math.max(0, i - 1)], [nx2, nz2] = line[Math.min(line.length - 1, i + 1)];
    if (i) acc += Math.hypot(x - px, z - pz);
    let ox = nz2 - pz, oz = -(nx2 - px);
    const l = Math.hypot(ox, oz) || 1; ox /= l; oz /= l;
    if (ox * x + oz * (z - 30) < 0 && Math.abs(x) > 30) { ox = -ox; oz = -oz; } // outward = away from the spur
    for (let r = 0; r <= ROWS; r++) {
      const y = 0.3 + ((LOW - 1.5 - 0.3) * r) / ROWS;
      const n = 0.8 * Math.sin(acc * 0.21 + y * 0.05) + 0.5 * Math.sin(acc * 0.07 - y * 0.08) + 0.35 * Math.sin(acc * 0.63 + y * 0.12); // vertical gullies
      const out = (-y) / 6.2 + 0.9 + n * Math.min(1, -y / 6);
      pos.push(x + ox * out, y, z + oz * out); uv.push(acc / 24, (0.3 - y) / 24);
    }
  });
  for (let i = 0; i < line.length - 1; i++) for (let r = 0; r < ROWS; r++) {
    const a = i * (ROWS + 1) + r, b = a + 1, c = a + ROWS + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, lam("chalkCliff", () => ({ map: cliffTex(), side: THREE.DoubleSide })));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
/** direction from Richard toward the shot 5 camera (the little castle sits in front of his chest) */
const run5 = (): V3 => {
  const c = camAt(5, 482), [x, , z] = ahead(5, 482, 3.2, -0.25), dx = c.pos[0] - x, dz = c.pos[2] - z, n = Math.hypot(dx, dz) || 1;
  return [dx / n, 0, dz / n];
};

/** crop rows seen from above */
function fieldTex(col: string) {
  return ctex("cropField" + col, 256, 256, (g) => {
    g.fillStyle = "#a7834f"; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) { g.fillStyle = col; g.fillRect(0, y + 6, 256, 20); }
  });
}
