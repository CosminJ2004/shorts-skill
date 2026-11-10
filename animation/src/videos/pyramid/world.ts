// The whole place for "The Pyramid Wearing a Church": plain, five stepped pyramid stages that swallow each other,
// the overgrown hill, trees, the church on the summit, a colonial town, Popocatepetl in the haze, Giza for scale,
// and the tunnel set (lanterns, a buried stair, the drinking-party mural). Built from the cartoon-3d-short skill's
// look modules (two-tone shading, painted textures, ink pass, lit character cards); geometry and staging are ours.
// update(id, f, camera, scene) poses everything for shot `id` at frame f (a pure function of id + f).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, V, lam } from "../bridge/build";
import { ctex, grassHD, stoneHD, cobbleHD, cloudHD, facadeHD, rep } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, bodySide, fxPuff, fxContact, mix as mixHex, Outfit, Expr, FrontOpts } from "../bridge/toon";
import {
  FPS, SHOTS, STAGES, HILL_R, HILL_H, CHURCH_Y, GIZA, TUNNEL, MURAL, Light, ShotDef, V3, camAt, stateAt, popIn, clamp01, ahead,
} from "./story";

// ---------------- light presets (the skill's day / golden, plus an underground preset) ----------------
// our distances are 10x the bridge's (a 130 m pyramid), so the haze starts later; the golden sun comes from the
// front-right (not backlit) so the warm side of the pyramid faces the lens
const P: Record<Light, LightPreset> = {
  day: { ...LIGHTS.day, fogNear: 90, fogFar: 1100 },
  golden: { ...LIGHTS.golden, az: 128, el: 18, lit: [1.48, 1.0, 0.66], shade: [0.2, 0.19, 0.36], fogNear: 120, fogFar: 1000 },
  // look pass 3: v2 tunnels measured Y' p50 .27 (reference interiors .46), S .84 (.44) and brown shadows (b* +23):
  // warmer-white lantern key, brighter and violet shade
  tunnel: {
    ...LIGHTS.golden, az: 150, el: 28,
    lit: [1.6, 1.24, 0.92], shade: [0.3, 0.25, 0.4], lift: [0.07, 0.05, 0.1], term: 0.3,
    charTint: [1.0, 0.82, 0.62], fog: "#2b1d16", fogNear: 6, fogFar: 46, actorShadow: false,
  },
};
const LK: Record<Light, WorldLook> = { day: LOOK.day, golden: LOOK.golden, tunnel: { ...LOOK.golden, sat: 0.9 } };
const SKYCOL: Record<Light, string[]> = { day: LOOK.day.sky.c, golden: LOOK.golden.sky.c, tunnel: ["#2b1d16", "#2b1d16", "#2b1d16", "#2b1d16", "#2b1d16"] };
const SKYE: Record<Light, number[]> = { day: LOOK.day.sky.e, golden: LOOK.golden.sky.e, tunnel: [0, 3, 8, 16, 40] };

// ---------------- small helpers ----------------
const h01 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const tint = (hex: string, k: number) => (k >= 0 ? mixHex(hex, "#ffffff", k) : mixHex(hex, "#000000", -k));

/** square frustum (one pyramid tier): half-width a0 at y0 -> a1 at y1, painted faces tiled every `tile` metres */
const frustum = (a0: number, a1: number, y0: number, y1: number, tile = 4) => {
  const g: THREE.BufferGeometry[] = [];
  const side = (p: V3[], uw: number, uh: number) => {
    const geo = new THREE.BufferGeometry();
    const [a, b, c, d] = p.map((v) => new THREE.Vector3(...v));
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill(0).flatMap(() => [n.x, n.y, n.z]), 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, uw, 0, uw, uh, 0, 0, uw, uh, 0, uh], 2));
    g.push(geo);
  };
  const s = Math.hypot(a0 - a1, y1 - y0);
  for (let k = 0; k < 4; k++) {
    const r = (x: number, z: number): [number, number] => {
      const c = Math.cos((k * Math.PI) / 2), sn = Math.sin((k * Math.PI) / 2);
      return [x * c + z * sn, -x * sn + z * c];
    };
    const [ax, az] = r(-a0, a0), [bx, bz] = r(a0, a0), [cx, cz] = r(a1, a1), [dx, dz] = r(-a1, a1);
    side([[ax, y0, az], [bx, y0, bz], [cx, y1, cz], [dx, y1, dz]], (2 * a0) / tile, s / tile);
  }
  const top = new THREE.PlaneGeometry(2 * a1, 2 * a1);
  top.rotateX(-Math.PI / 2); top.translate(0, y1, 0);
  const uv = top.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * a1) / tile, (uv.getY(i) * 2 * a1) / tile);
  g.push(top.toNonIndexed());
  return mergeGeometries(g, false);
};

/** hill height at radius r for a fully grown mound (flattened summit for the church) */
export const hillY = (r: number) => {
  const r0 = 17;
  if (r <= r0) return HILL_H;
  const u = Math.min(1, (r - r0) / (HILL_R - r0));
  return HILL_H * 0.5 * (1 + Math.cos(Math.PI * u));
};

/** adobe painted texture in a stage's colour (stone blocks with dark seams, the skill's stoneHD) */
const adobe = (key: string, col: string) =>
  lam(key, () => ({ map: stoneHD(key, [col, tint(col, -0.06), tint(col, 0.07), tint(col, -0.1)], tint(col, -0.35)) }));

// ---------------- the cast (lit flat cards) ----------------
const SKINS = ["#c99067", "#b97d55", "#d6a27a", "#a86c45"];
const BUILDER = (v: number): Outfit => ({ jacket: v % 2 ? "#efe4cc" : "#e6d2a8", pants: "#efe4cc", boots: "#8a5a3c", hat: "hair", hair: "#1e1714", skin: SKINS[v % 4], build: v === 3 ? "stout" : "adult" });
const FRIAR: Outfit = { jacket: "#6b4a2f", pants: "#6b4a2f", boots: "#3a2a1a", hat: "hair", hair: "#3a2a1a", skin: "#f1cfae", build: "stout" };
const DIGGER: Outfit = { jacket: "#c9b27a", pants: "#7d6a49", boots: "#4a3426", hat: "cap", cap: "#a88d55", skin: "#e8bf98", moustache: "#4a3426" };
const TOURISTS: Outfit[] = [
  { jacket: "#e2453c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#f3d35a" },
  { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" },
  { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#2a201a", skin: "#c99067" },
];
const TOURIST = (v: number): Outfit => TOURISTS[v % 4];

type Who = { o: Outfit; seed: number; x: number; y: number; z: number; expr: Expr; mode?: FrontOpts["mode"]; side?: boolean;
  dir?: number; phase?: number; wave?: number; prop?: FrontOpts["prop"]; look?: number; scale?: number };
type FxP = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; soft?: boolean };

const tier = (d: number): [number, number, number] => (d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4]);
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * h01(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h01(i * 31 + n, 13)); }
  return 0;
};

const castFor = (id: number, f: number): Who[] => {
  const t = f / FPS, L = 2; // expressions land ~2 frames before their word
  switch (id) {
    case 1: { const [x, , z] = ahead(1, 0, 4.6, -0.35); return [{ o: TOURIST(0), seed: 3, x, y: 0, z, expr: f < 66 - L ? "grin" : "smile", mode: "stand", wave: f > 66 - L ? 1 : 0 }]; }
    case 4: {
      const k = f < 500 ? 428 : 500, [gx, , gz] = ahead(4, k, 6.2, -0.5), [kx, , kz] = ahead(4, k, 5.4, 0.42);
      return [
        { o: { ...BUILDER(3), hair: "#d9d4cc" }, seed: 9, x: gx, y: 0, z: gz, expr: f < 478 - L ? "smile" : f < 508 - L ? "grin" : "laugh", mode: "stand", prop: ["hammer", 0] },
        { o: { ...BUILDER(2), build: "kid" }, seed: 12, x: kx, y: 0, z: kz, expr: f < 440 ? "smile" : "laugh", mode: "stand", wave: f > 445 ? 1 : 0 },
      ];
    }
    case 5: { const [x, , z] = ahead(5, 551, 5.4, 0.35); return [{ o: BUILDER(1), seed: 4, x, y: 0, z, expr: f < 600 ? "grin" : "laugh", mode: "stand", wave: 1 }]; }
    case 6: {
      if (f >= 785) return [];
      const [x, , z] = ahead(6, 655, 5.4, -0.4);
      return [{ o: { ...BUILDER(3), hair: "#d9d4cc" }, seed: 9, x, y: 0, z, expr: f < 729 - L ? "nervous" : "pained", mode: "stand", look: -1 }];
    }
    case 7: { const [x, , z] = ahead(7, 828, 5.2, 0.38); return [{ o: TOURIST(3), seed: 14, x, y: 0, z, expr: f < 895 ? "neutral" : "smile_closed", mode: "stand" }]; }
    case 2: return [
      { o: BUILDER(0), seed: 1, x: -3.2, y: 0, z: 17.2, expr: "smile", mode: "stand", prop: ["hammer", 0.5 + 0.5 * Math.sin(t * 7)] },
      { o: BUILDER(1), seed: 4, x: 1.6, y: 0, z: 18.2, expr: "grin", mode: "stroll", side: true, dir: -1, phase: t * 1.1 },
      { o: BUILDER(3), seed: 6, x: 5.4, y: 0, z: 16.6, expr: "smile_closed", mode: "stand" },
    ];
    // the camera pulls back from the close-up (glide 358-384), so the same two builders stay put for the whole shot
    // and a third, standing behind the lens at the start, is revealed as the camera backs past him
    case 3: return [
      { o: BUILDER(0), seed: 1, x: -1.6, y: 0, z: 25.5, expr: f < 319 - L ? "stern" : f < 384 ? "grin" : "laugh", mode: "stand",
        look: f < 319 - L ? -1 : 0, wave: f > 392 ? 1 : 0 },
      { o: BUILDER(3), seed: 6, x: -3.35, y: 0, z: 24.6, expr: f < 300 ? "nervous" : f < 384 ? "neutral" : "shock", mode: "stand" },
      ...(f >= 358 ? [{ o: BUILDER(1), seed: 4, x: 4.5, y: 0, z: 40, expr: (f < 384 ? "neutral" : "laugh") as Expr, mode: "stand" as const }] : []),
    ];
    case 8: return [
      { o: FRIAR, seed: 2, x: -4, y: CHURCH_Y, z: 15, expr: "smile", mode: "stand" },
      { o: FRIAR, seed: 5, x: 3.2, y: CHURCH_Y, z: 16, expr: "smile_closed", mode: "stand" },
    ];
    case 9: return f < 1100 ? [{ o: FRIAR, seed: 2, x: 0, y: CHURCH_Y, z: 21, expr: "smile_closed", mode: "stand" }]
      : [{ o: DIGGER, seed: 7, x: 1.2, y: hillY(104), z: 104, expr: f < 1104 - L ? "neutral" : "pained", mode: "stand", prop: ["hammer", 0], look: 1 }];
    case 11: {
      const z = -6 - 1.35 * Math.max(0, t - 1312 / FPS);
      return [
        { o: DIGGER, seed: 7, x: TUNNEL[0] - 0.25, y: 0, z, expr: "neutral", mode: "march", phase: t * 1.0, prop: ["hammer", 0] },
        { o: BUILDER(2), seed: 8, x: TUNNEL[0] + 0.45, y: 0, z: z - 2.6, expr: "smile_closed", mode: "march", phase: t * 1.0 + 0.5 },
      ];
    }
    case 12: return f < 1560
      ? [{ o: DIGGER, seed: 7, x: TUNNEL[0] - 0.5, y: 0, z: -41.2, expr: f < 1500 ? "neutral" : "shock", mode: "stand" }]
      : [{ o: DIGGER, seed: 7, x: MURAL[0] + 0.1, y: 0, z: -12.6, expr: f < 1590 ? "shock" : "laugh", mode: "stand", wave: f > 1600 ? 1 : 0 }];
    case 13: return [0, 1, 2, 3].map((k) => { const [x, , z] = ahead(13, 1626, 5.6 + 1.6 * k, -0.7 + 0.5 * k); return { o: TOURIST(k), seed: 10 + k, x, y: 0, z: z - 1.1 * (t - 1630 / FPS),
      expr: (["grin", "smile", "laugh", "smile_closed"] as Expr[])[k], mode: "stroll" as const, side: true, dir: -1, phase: t * 1.1 + k * 0.3 }; });
    default: return [];
  }
};

// ---------------- world ----------------
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
  private stages: THREE.Group[] = [];
  private hill = new THREE.Group();
  private trees: { o: THREE.Object3D; r: number; a: number; k: number; s: number }[] = [];
  private church = new THREE.Group();
  private town = new THREE.Group();
  private giza = new THREE.Group();
  private volc!: THREE.Mesh; private snow!: THREE.Mesh;
  private outside = new THREE.Group();
  private underground = new THREE.Group();
  private frustumC = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- sky dome (5 colour stops by elevation), sun light, clouds: as in the bridge world ----
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
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); this.outside.add(m);
    }
    R.add(this.outside, this.underground);
    this.buildOutside();
    this.buildUnderground();
  }

  // ---------------- outside: plain, pyramid stages, hill, trees, church, town, volcano, Giza ----------------
  private buildOutside() {
    const O = this.outside;
    const grass = lam("plainGrassV", () => ({ map: grassHD(), vertexColors: true }));
    const plain = new THREE.PlaneGeometry(2400, 2400, 240, 240); plain.rotateX(-Math.PI / 2);
    {
      const P0 = plain.attributes.position as THREE.BufferAttribute, cols: number[] = [];
      const A = new THREE.Color("#9caf76"), B = new THREE.Color("#bbb683"), C = new THREE.Color("#859c68"), D = new THREE.Color("#c4ad84"), c = new THREE.Color();
      for (let i = 0; i < P0.count; i++) {
        const x = P0.getX(i), z = P0.getZ(i);
        const n1 = 0.5 + 0.5 * Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2.1) * Math.cos(z * 0.017 - x * 0.006);
        const n2 = 0.5 + 0.5 * Math.sin(x * 0.067 + z * 0.041 + Math.cos(x * 0.011) * 3);
        c.copy(A).lerp(B, n1 * 0.7).lerp(C, (1 - n1) * n2 * 0.6);
        if (n2 > 0.86) c.lerp(D, (n2 - 0.86) * 4);
        cols.push(c.r, c.g, c.b);
      }
      plain.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    }
    const uv = plain.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 400, uv.getY(i) * 400); // texture every 6 m
    const ground = new THREE.Mesh(plain, grass); ground.receiveShadow = true; O.add(ground);
    // a dirt path up to the stairway (+z), and the plaza in front of it
    const dirt = lam("dirt", () => ({ color: "#c8a87a" }));
    const b = new Batch();
    b.add(boxGeo(V(-3.5, -0.2, 64), V(3.5, 0.03, 260), 0), dirt);
    b.build(O, false);

    // ---- set dressing (static): agaves, rocks, flowers, dirt patches, maize fields, brick stacks ----
    const dress = new Batch();
    const agaveM = lam("agave", () => ({ color: "#6f9a7a" })), rockM = lam("rock", () => ({ color: "#b5a68c" }));
    const flowerM = ["#e2453c", "#f3c63a", "#9a5ac9", "#f4f1ea"].map((c, i) => lam("flower" + i, () => ({ color: c })));
    const patchM = lam("dirtPatch", () => ({ color: "#c9a774" })), brickM = adobe("bricks", "#c99a6a");
    const fieldM = lam("maize", () => ({ map: rep(fieldTex(), 6, 6) }));
    const leaf = new THREE.ConeGeometry(0.16, 1.3, 5).translate(0, 0.65, 0);
    const agave = (x: number, z: number, sz: number, seed: number) => {
      for (let k = 0; k < 9; k++) {
        const m = new THREE.Matrix4().makeRotationY((k / 9) * Math.PI * 2 + seed)
          .multiply(new THREE.Matrix4().makeRotationX(0.55 + (0.25 * (k % 3)) / 2))
          .scale(new THREE.Vector3(sz, sz * (0.8 + 0.3 * (k % 2)), sz));
        m.setPosition(x, 0, z);
        dress.add(leaf, agaveM, m);
      }
    };
    const rock = (x: number, z: number, sz: number) =>
      dress.add(new THREE.DodecahedronGeometry(1, 0), rockM, new THREE.Matrix4().makeScale(sz * 1.3, sz * 0.7, sz).setPosition(x, sz * 0.25, z));
    const flowers = (x: number, z: number, n: number, seed: number) => {
      for (let k = 0; k < n; k++) {
        const a = h01(seed, k) * 6.28, r = 0.2 + 1.1 * h01(seed, k + 50);
        dress.add(new THREE.SphereGeometry(0.09, 6, 4), flowerM[(seed + k) % 4],
          new THREE.Matrix4().makeTranslation(x + Math.cos(a) * r, 0.18 + 0.1 * h01(k, seed), z + Math.sin(a) * r));
      }
    };
    for (let i = 0; i < 260; i++) {
      const a = h01(i, 31) * Math.PI * 2, r = 70 + 260 * Math.sqrt(h01(i, 32)), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < 4.5 && z > 60) continue; // keep the path clear
      const k = i % 4;
      if (k === 0) agave(x, z, 0.8 + 0.7 * h01(i, 33), i);
      else if (k === 1) rock(x, z, 0.3 + 0.7 * h01(i, 34));
      else flowers(x, z, 7, i);
    }
    // framing pieces next to the foreground cast of the wide shots (reference: props in ~1/3 of shots)
    for (const [id, fk, d, sd] of [[1, 0, 3.4, 0.95], [4, 428, 3.8, 1.1], [5, 551, 3.6, -1.0], [6, 655, 3.5, 0.9], [7, 828, 3.8, -0.95], [13, 1626, 3.8, 1.1]] as const) {
      const [x, , z] = ahead(id, fk, d, sd);
      agave(x, z, 0.75, id); flowers(x - 0.6, z + 0.4, 9, id + 7); rock(x + 0.9, z - 0.5, 0.35);
    }
    for (let i = 0; i < 18; i++) { // dirt patches
      const a = h01(i, 41) * 6.28, r = 80 + 200 * h01(i, 42), w = 6 + 14 * h01(i, 43);
      const g = new THREE.CircleGeometry(w, 18).rotateX(-Math.PI / 2).scale(1, 1, 0.55);
      dress.add(g, patchM, new THREE.Matrix4().makeRotationY(a).setPosition(Math.cos(a) * r, 0.02, Math.sin(a) * r));
    }
    for (const [x, z, w, d] of [[-210, 60, 120, 80], [180, -40, 110, 140], [-150, -220, 160, 90], [230, 150, 90, 70]]) { // maize fields
      const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
      const uvA = g.attributes.uv as THREE.BufferAttribute;
      for (let i2 = 0; i2 < uvA.count; i2++) uvA.setXY(i2, (uvA.getX(i2) * w) / 12, (uvA.getY(i2) * d) / 12);
      dress.add(g, fieldM, new THREE.Matrix4().makeTranslation(x, 0.03, z));
    }
    for (const [x, z] of [[8.5, 21], [-7.5, 22.5], [3.5, 28]]) { // adobe bricks drying near the first temple
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4 - r2; c2++)
        dress.add(boxGeo(V(x + c2 * 0.42 + r2 * 0.21, r2 * 0.18, z), V(x + c2 * 0.42 + r2 * 0.21 + 0.38, r2 * 0.18 + 0.17, z + 0.26)), brickM);
    }
    dress.build(O);

    // ---- the five stages ----
    STAGES.forEach((st, k) => {
      const g = new THREE.Group(), bb = new Batch();
      const body = adobe(`adobe${k}`, st.col), band = lam(`band${k}`, () => ({ color: tint(st.col, 0.28) }));
      const stair = adobe(`stair${k}`, tint(st.col, -0.08));
      const top = st.a * 0.3, th = st.h / st.n;
      for (let i = 0; i < st.n; i++) {
        const a0 = st.a - ((st.a - top) * i) / st.n, a1 = st.a - ((st.a - top) * (i + 1)) / st.n;
        const y0 = i * th, ym = y0 + th * 0.68, y1 = (i + 1) * th;
        bb.add(frustum(a0, a0 - (a0 - a1) * 0.62, y0, ym), body); // sloping talud
        bb.add(frustum(a0 - (a0 - a1) * 0.62, a0 - (a0 - a1) * 0.66, ym, y1, 2), band); // near-vertical tablero band
        if (i === st.n - 1) bb.add(frustum(a0 - (a0 - a1) * 0.66, a0 - (a0 - a1) * 0.66, y1, y1 + 0.05), band);
      }
      // stairway up the front (+z) face, with low side walls
      const sw = Math.max(2.2, st.a * 0.16), steps = Math.round(st.h / 0.55);
      for (let i = 0; i < steps; i++) {
        const y = (i * st.h) / steps, z = st.a - ((st.a - top) * i) / steps;
        bb.add(boxGeo(V(-sw, 0, z - 1.2), V(sw, y + st.h / steps, z + 0.25), 2), stair);
      }
      // a small temple on the summit platform
      const tw = Math.min(top * 0.55, 7);
      bb.add(boxGeo(V(-tw, st.h, -tw * 0.7), V(tw, st.h + tw * 0.9, tw * 0.7), 2), body);
      bb.add(boxGeo(V(-tw - 0.4, st.h + tw * 0.9, -tw * 0.7 - 0.4), V(tw + 0.4, st.h + tw * 1.1, tw * 0.7 + 0.4)), band);
      bb.add(boxGeo(V(-tw * 0.3, st.h, tw * 0.7), V(tw * 0.3, st.h + tw * 0.6, tw * 0.7 + 0.08)), lam("doorDark", () => ({ color: "#3a2a24" })));
      bb.build(g);
      g.visible = false;
      this.stages.push(g); O.add(g);
    });

    // ---- the overgrown hill (a radial heightfield; its vertical scale is the overgrowth) ----
    const NR = 46, NA = 96, pos: number[] = [], idx: number[] = [], uvs: number[] = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) {
      const r = (HILL_R * i) / NR, a = (j / NA) * Math.PI * 2;
      const n = r < 18 ? 0 : 0.9 * Math.sin(a * 5 + r * 0.13) * Math.sin(r * 0.21 + a * 3) * Math.min(1, (HILL_R - r) / 20);
      pos.push(Math.cos(a) * r, Math.max(0, hillY(r) + n), Math.sin(a) * r); uvs.push((Math.cos(a) * r) / 6, (Math.sin(a) * r) / 6);
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
      const a = i * NA + j, bq = i * NA + ((j + 1) % NA), c = (i + 1) * NA + ((j + 1) % NA), d = (i + 1) * NA + j;
      idx.push(a, bq, c, a, c, d); // counter-clockwise from above: normals point up
    }
    const hg = new THREE.BufferGeometry();
    hg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    hg.setIndex(idx); hg.computeVertexNormals();
    const hillGrass = lam("hillGrass", () => ({ map: grassHD(), color: "#a8b67f" }));
    const hm = new THREE.Mesh(hg, hillGrass); hm.castShadow = true; hm.receiveShadow = true;
    this.hill.add(hm); this.hill.visible = false; O.add(this.hill);

    // ---- trees and bushes on the hill (pop in one by one as the overgrowth spreads) ----
    const trunkM = lam("trunk", () => ({ color: "#7a5236" }));
    const leafM = ["#5c9a48", "#6fa653", "#4d8744", "#82b35e"].map((c, i) => lam("leaf" + i, () => ({ color: c })));
    const canopy = new THREE.IcosahedronGeometry(1, 2), trunk = new THREE.CylinderGeometry(0.16, 0.24, 1, 7).translate(0, 0.5, 0);
    for (let i = 0; i < 150; i++) {
      const r = 24 + (HILL_R - 30) * Math.sqrt(h01(i, 1)), a = h01(i, 2) * Math.PI * 2;
      if (r < 70 && Math.abs(Math.cos(a)) < 0.1 && Math.sin(a) > 0) continue; // keep the path clear
      const s = 0.75 + 0.7 * h01(i, 3), tr = new THREE.Group();
      const tm = new THREE.Mesh(trunk, trunkM); tm.scale.set(s, 2.4 * s, s); tr.add(tm);
      for (let k = 0; k < 3; k++) {
        const c = new THREE.Mesh(canopy, leafM[(i + k) % 4]);
        c.position.set((k - 1) * 0.9 * s, (2.6 + 0.5 * (k % 2)) * s, (h01(i, k + 5) - 0.5) * 0.8 * s);
        c.scale.set(1.5 * s, 1.25 * s, 1.5 * s);
        tr.add(c);
      }
      tr.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
      tr.rotation.y = h01(i, 4) * 6.28;
      this.trees.push({ o: tr, r, a, k: h01(i, 6), s }); O.add(tr);
    }

    // ---- the church of Our Lady of Remedies on the summit (faces +z) ----
    const C = this.church, cb = new Batch(), H = 0;
    const yellow = lam("churchYellow", () => ({ color: "#f2c230" })), white = lam("churchWhite", () => ({ color: "#f4efe2" }));
    const dark = lam("churchDark", () => ({ color: "#3b2f2a" })), tiles = lam("domeTiles", () => ({ map: rep(domeTex(), 6, 3) }));
    const plaza = lam("cobbleHD", () => ({ map: cobbleHD() }));
    cb.add(boxGeo(V(-16, H - 0.6, -30), V(16, H + 0.15, 24), 4), plaza);
    cb.add(boxGeo(V(-6, H, -24), V(6, H + 10, 6), 0), yellow); // nave
    cb.add(boxGeo(V(-6.3, H + 10, -24.3), V(6.3, H + 10.6, 6.3)), white); // cornice
    cb.add(boxGeo(V(-2, H, 6), V(2, H + 5.2, 6.15)), white); // portal frame
    cb.add(boxGeo(V(-1.3, H, 6.1), V(1.3, H + 4.4, 6.25)), dark); // door
    cb.add(boxGeo(V(-1.1, H + 6.6, 6.0), V(1.1, H + 8.4, 6.2)), dark); // choir window
    for (const s of [-1, 1]) {
      const x = s * 7.6;
      cb.add(boxGeo(V(x - 2.2, H, 3), V(x + 2.2, H + 13, 7.4), 0), yellow);
      cb.add(boxGeo(V(x - 2.35, H + 13, 2.85), V(x + 2.35, H + 13.5, 7.55)), white);
      cb.add(boxGeo(V(x - 1.7, H + 13.5, 3.5), V(x + 1.7, H + 17.4, 6.9)), yellow); // belfry
      cb.add(boxGeo(V(x - 0.7, H + 14.3, 6.85), V(x + 0.7, H + 16.6, 6.95)), dark); // bell opening
      cb.add(boxGeo(V(x - 1.85, H + 17.4, 3.35), V(x + 1.85, H + 17.8, 7.05)), white);
      const cup = new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      cb.add(cup, tiles, new THREE.Matrix4().makeTranslation(x, H + 17.8, 5.2));
      cb.add(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), white, new THREE.Matrix4().makeTranslation(x, H + 20.0, 5.2)); // cross post
      cb.add(boxGeo(V(x - 0.5, H + 20.3, 5.12), V(x + 0.5, H + 20.5, 5.28)), white);
    }
    cb.add(new THREE.CylinderGeometry(4.2, 4.2, 3, 20), yellow, new THREE.Matrix4().makeTranslation(0, H + 11.5, -14)); // drum
    cb.add(new THREE.SphereGeometry(4.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tiles, new THREE.Matrix4().makeTranslation(0, H + 13, -14));
    cb.add(new THREE.CylinderGeometry(0.9, 0.9, 2, 10), white, new THREE.Matrix4().makeTranslation(0, H + 18.4, -14)); // lantern
    cb.build(C);
    C.position.set(0, CHURCH_Y, 0); C.visible = false; O.add(C);

    // ---- the town: colourful colonial houses in a ring, leaving the view lanes clear ----
    const tb = new Batch(), STY = [
      { wall: "#e8a0b4", shutter: "#6b3f2a" }, { wall: "#f2c96b", shutter: "#3f6fb5" }, { wall: "#8fc7d8", shutter: "#7a4a2a" },
      { wall: "#f4e9d8", shutter: "#2f8a4f" }, { wall: "#e98a5b", shutter: "#3b5b9a" }, { wall: "#b5d38a", shutter: "#8c3b4a" },
    ];
    for (let i = 0; i < 46; i++) {
      const a = h01(i, 21) * Math.PI * 2, r = 122 + 70 * h01(i, 22);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 60 && Math.abs(x) < 70) continue; // camera lanes in front of the hill
      const st = STY[i % STY.length], w = 9 + 6 * h01(i, 23), d = 8 + 4 * h01(i, 24), hh = 5 + 3 * Math.round(h01(i, 25) * 2);
      const face = lam(`tf${i % 6}_${Math.round(w)}_${hh}`, () => ({ map: facadeHD(`tf${i % 6}_${Math.round(w)}_${hh}`, w, hh, { ...st, door: true }) }));
      const wall = lam("tw" + (i % 6), () => ({ color: st.wall }));
      const m = new THREE.Matrix4().makeRotationY(Math.atan2(x, z)).setPosition(x, 0, z); // facades face the hill
      const g2 = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, hh, d / 2));
      tb.add(g2, wall, m);
      const front = new THREE.PlaneGeometry(w, hh); front.translate(0, hh / 2, -d / 2 - 0.02); front.rotateY(Math.PI);
      tb.add(front, face, m);
      tb.add(boxGeo(V(-w / 2 - 0.2, hh, -d / 2 - 0.2), V(w / 2 + 0.2, hh + 0.5, d / 2 + 0.2)), lam("roofEdge", () => ({ color: "#f4efe2" })), m);
    }
    tb.build(this.town); O.add(this.town);

    // ---- Popocatepetl in the haze (unfogged, painted the haze colour by hand) ----
    this.volc = new THREE.Mesh(new THREE.ConeGeometry(330, 190, 48, 1, true), new THREE.MeshBasicMaterial({ color: "#a9b8d6", fog: false }));
    this.volc.position.set(-380, 80, -1040);
    this.snow = new THREE.Mesh(new THREE.ConeGeometry(78, 45, 48, 1, true), new THREE.MeshBasicMaterial({ color: "#eef2fa", fog: false }));
    this.snow.position.set(-380, 152.5, -1040);
    for (const m of [this.volc, this.snow]) { m.layers.set(NOINK); O.add(m); }

    // ---- Giza for scale (shot 5): a smooth pointed pyramid of sandstone ----
    const gz = new THREE.Mesh(new THREE.ConeGeometry(46 * Math.SQRT2, 58, 4, 1), adobe("gizaStone", "#e3c48f"));
    gz.rotation.y = Math.PI / 4; gz.position.set(GIZA[0], 29, GIZA[2]); gz.castShadow = true; gz.receiveShadow = true;
    const sand = new THREE.Mesh(new THREE.CircleGeometry(80, 40).rotateX(-Math.PI / 2), lam("sand", () => ({ color: "#e8d1a0" })));
    sand.position.set(GIZA[0], 0.04, GIZA[2]); sand.receiveShadow = true;
    this.giza.add(gz, sand); this.giza.visible = false; O.add(this.giza);
  }

  // ---------------- underground: the tunnel (T) and the mural corridor (M) ----------------
  private buildUnderground() {
    const U = this.underground, b = new Batch();
    const wall = adobe("tunnelWall", "#9c6b45"), floor = lam("tunnelFloor", () => ({ color: "#6e4d36" })), ceil = lam("tunnelCeil", () => ({ color: "#5a3f2d" }));
    const wood = lam("tunnelWood", () => ({ color: "#8a5a3c" }));
    const corridor = (x0: number, z0: number, z1: number) => {
      b.add(boxGeo(V(x0 - 1.4, -0.2, z1), V(x0 + 1.4, 0, z0), 2), floor);
      b.add(boxGeo(V(x0 - 1.6, 0, z1), V(x0 - 1.3, 2.7, z0), 2), wall);
      b.add(boxGeo(V(x0 + 1.3, 0, z1), V(x0 + 1.6, 2.7, z0), 2), wall);
      b.add(boxGeo(V(x0 - 1.6, 2.7, z1), V(x0 + 1.6, 3.0, z0), 2), ceil);
      for (let z = z0 - 1.5; z > z1; z -= 3.2) { // timber frames
        b.add(boxGeo(V(x0 - 1.3, 0, z - 0.12), V(x0 - 1.12, 2.55, z + 0.12)), wood);
        b.add(boxGeo(V(x0 + 1.12, 0, z - 0.12), V(x0 + 1.3, 2.55, z + 0.12)), wood);
        b.add(boxGeo(V(x0 - 1.3, 2.45, z - 0.14), V(x0 + 1.3, 2.7, z + 0.14)), wood);
      }
    };
    corridor(TUNNEL[0], 6, -46);
    corridor(MURAL[0], 6, -60);
    // the buried stair at the end of the tunnel: older steps with a red stucco band, rising into the ceiling
    const stuccoR = lam("stuccoRed", () => ({ color: "#b8453a" })), stuccoW = lam("stuccoCream", () => ({ color: "#efe0c2" }));
    for (let i = 0; i < 9; i++) {
      const z = -44.2 - i * 0.42, y = (i + 1) * 0.33;
      b.add(boxGeo(V(TUNNEL[0] - 1.3, 0, z - 0.42), V(TUNNEL[0] + 1.3, y, z)), i % 3 === 2 ? stuccoR : stuccoW);
    }
    b.build(U, false);
    // the mural: a long painted strip of party-goers on the corridor's right wall (lit, two-tone)
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.5), lam("mural", () => ({ map: muralTex() })));
    mural.position.set(MURAL[0] + 1.28, 1.35, -17); mural.rotation.y = -Math.PI / 2; mural.receiveShadow = true;
    U.add(mural);
    // lanterns: HDR emissive bulbs (bloom picks them up) in small iron cages
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 3.0, 1.3), fog: false });
    const cage = lam("cage", () => ({ color: "#2b2622" }));
    for (const [x0, z0, z1] of [[TUNNEL[0], 4, -44], [MURAL[0], 4, -58]] as const) {
      for (let z = z0, k = 0; z > z1; z -= 6.4, k++) {
        const s = k % 2 ? 1 : -1, x = x0 + s * 1.12;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow); bulb.position.set(x, 2.05, z); bulb.layers.set(NOINK);
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), cage); c.position.set(x, 2.05, z);
        (c.material as THREE.Material).transparent = false; c.scale.set(1, 1, 1);
        U.add(bulb);
      }
    }
    U.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  }

  /** camera-relative sun, frozen per shot (as in the bridge world) */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.az ?? L.az), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = P[s.light], K = LK[s.light], st = stateAt(id, f), under = s.light === "tunnel";
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.15; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 140) * (s.light === "golden" ? 1.3 : 1);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 600; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog ----
    const su = this.skyMat.uniforms;
    SKYCOL[s.light].forEach((h, i) => untone(h, su["c" + i].value));
    const e = SKYE[s.light].map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const cl = s.light === "golden" ? "golden" : "day";
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i]; m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[cl][i % 4];
    }
    // ---- set pieces ----
    this.outside.visible = !under; this.underground.visible = under;
    // under a full-grown, unlifted hill the stages are hidden (their summit temple and corners would poke through)
    const buried = st.hill > 0.97 && st.lift[5] < 0.5;
    STAGES.forEach((_, k) => {
      const g = this.stages[k], gr = st.grow[k];
      g.visible = gr > 0.001 && !buried;
      g.scale.set(0.9 + 0.1 * Math.min(gr, 1.1), Math.max(gr, 0.001), 0.9 + 0.1 * Math.min(gr, 1.1));
      g.position.y = st.lift[k];
    });
    this.hill.visible = st.hill > 0.001; this.hill.scale.set(1, Math.max(0.001, st.hill), 1); this.hill.position.y = st.lift[5];
    for (const tr of this.trees) {
      const show = clamp01((st.trees - tr.k * 0.85) / 0.15);
      tr.o.visible = show > 0.001 && st.hill > 0.5;
      const y = hillY(tr.r) * st.hill + st.lift[5];
      tr.o.position.set(Math.cos(tr.a) * tr.r, y - 0.2, Math.sin(tr.a) * tr.r);
      tr.o.scale.setScalar(Math.max(0.001, popIn(show)));
    }
    this.church.visible = st.church > 0.001;
    this.church.scale.set(1, Math.max(0.001, st.church), 1);
    this.church.position.y = CHURCH_Y + st.lift[5];
    this.town.visible = st.town; this.giza.visible = st.giza;
    // the volcano is painted, not lit: a step from the horizon colour toward the upper sky
    const hz = new THREE.Color(), up = new THREE.Color();
    untone(SKYCOL[s.light][0], hz); untone(SKYCOL[s.light][2], up);
    (this.volc.material as THREE.MeshBasicMaterial).color.copy(hz).lerp(up, 0.55);
    (this.snow.material as THREE.MeshBasicMaterial).color.copy(hz).lerp(new THREE.Color(1, 1, 1), 0.6);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const sx = sunDir.dot(right), light2 = Math.round(Math.atan2(-sunDir.y, sx) / (Math.PI / 4)) * (Math.PI / 4);
    const places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; mirror?: boolean; size: [number, number, number] }[] = [];
    const fxs: FxP[] = [];
    castFor(id, f).forEach((w, i) => {
      const d = cam.position.distanceTo(this.v.set(w.x, w.y + 1.2, w.z)) / (w.scale ?? 1);
      const [cw, ch, k] = tier(d);
      const blink = lidAt(f, w.seed);
      if (w.side) {
        const mirror = (w.dir ?? 1) * right.x < 0;
        const so = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: "march" as const, blink, light: light2, seed: w.seed, stride: 0.8 };
        places.push({ key: `S|${JSON.stringify(w.o)}|${JSON.stringify(so)}|${cw}`, draw: (p) => bodySide(p, w.o, so), x: w.x, y: w.y, z: w.z, mirror, size: [cw, ch, k] });
      } else {
        const fo: FrontOpts = { phase: q(((w.phase ?? 0) % 1 + 1) % 1, 30), expr: w.expr, mode: w.mode ?? "stand", blink, light: light2, seed: w.seed,
          wave: w.wave, prop: w.prop ?? null, look: w.look ?? 0 };
        places.push({ key: `F|${JSON.stringify(w.o)}|${JSON.stringify(fo)}|${cw}`, draw: (p) => bodyFront(p, w.o, fo), x: w.x, y: w.y, z: w.z, size: [cw, ch, k] });
      }
      const cc = under ? "#7a6a6a" : "#9aa0c0";
      fxs.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: w.x, y: w.y + 0.025, z: w.z, w: 0.6, h: 0.45, flat: true });
      void i;
    });
    // dust puffs where a new stage lands
    const puff = (f0: number, k: number) => {
      const u = (f - f0) / 26;
      if (u < 0 || u > 1) return;
      const a = STAGES[k].a, qq = q(u, 26);
      for (const [x, z] of [[-a, a], [a, a], [0, a + 2], [-a * 0.6, a + 1], [a * 0.6, a + 1]])
        fxs.push({ key: `puff${qq}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, qq), x, y: 1.5 + a * 0.05, z, w: a * 0.5, h: a * 0.5, soft: true });
    };
    if (id === 3) puff(396, 1);
    if (id === 4) { puff(452, 2); puff(490, 3); puff(522, 4); }
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
      a.mesh.scale.set(p.mirror ? -1 : 1, 1, 1);
      a.mesh.castShadow = L.actorShadow;
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
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, 0); else e2.mesh.quaternion.copy(cam.quaternion);
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

// ---------------- painted textures ----------------
/** maize field rows seen from above: green rows on brown soil */
function fieldTex() {
  return ctex("maizeField", 256, 256, (g) => {
    g.fillStyle = "#a7834f"; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
      g.fillStyle = "#6f9a45"; g.fillRect(0, y + 6, 256, 18);
      g.fillStyle = "#86ad55"; for (let x = 0; x < 256; x += 16) g.fillRect(x + 4, y + 9, 8, 12);
    }
  });
}

/** talavera-like dome tiles: yellow and blue diamonds on cream */
function domeTex() {
  return ctex("domeTiles", 512, 256, (g) => {
    g.fillStyle = "#f4ead4"; g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
      const cx = x * 64 + 32 + (y % 2) * 32, cy = y * 64 + 32;
      g.fillStyle = (x + y) % 2 ? "#2f5fae" : "#f2c230";
      g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx + 26, cy); g.lineTo(cx, cy + 26); g.lineTo(cx - 26, cy); g.closePath(); g.fill();
    }
    g.strokeStyle = "#7a6a5a"; g.lineWidth = 3;
    for (let x = 0; x <= 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  });
}

/** the drinking-party mural: a cream band with red borders and a row of our cartoon figures raising cups */
function muralTex() {
  return ctex("mural", 4096, 440, (g) => {
    g.fillStyle = "#e9d3a6"; g.fillRect(0, 0, 4096, 440);
    g.fillStyle = "#a8402f"; g.fillRect(0, 0, 4096, 34); g.fillRect(0, 406, 4096, 34);
    g.fillStyle = "#c98a4a"; for (let x = 0; x < 4096; x += 90) g.fillRect(x, 40, 44, 10);
    const pal = ["#c0533a", "#2f6a8a", "#d99a3a", "#5a7a3a", "#8a3a5a"];
    for (let i = 0; i < 26; i++) {
      g.save();
      const k = 0.34, x = 30 + i * 156, flip = i % 2 === 1;
      g.translate(flip ? x + 600 * k : x, 50);
      g.scale(flip ? -k : k, k);
      const o: Outfit = { jacket: pal[i % 5], pants: "#efe4cc", boots: "#8a5a3c", hat: "hair", hair: "#1e1714", skin: SKINS[i % 4], build: i % 5 === 3 ? "stout" : "adult" };
      bodyFront(new Pen(g), o, { expr: (["laugh", "grin", "smile_closed", "laugh", "lick"] as Expr[])[i % 5], mode: "stand", prop: "icecream", seed: i + 3, wave: i % 4 === 0 ? 1 : 0 });
      g.restore();
    }
    // aged plaster: soft patches and cracks
    g.globalAlpha = 0.18; g.fillStyle = "#8a6a4a";
    for (let i = 0; i < 60; i++) { const x = (i * 977) % 4096, y = 60 + ((i * 331) % 320); g.beginPath(); g.ellipse(x, y, 40 + (i % 5) * 18, 14 + (i % 3) * 8, 0, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
  });
}
