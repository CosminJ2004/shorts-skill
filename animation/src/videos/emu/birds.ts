// The emus of "The War Australia Lost to Birds" (ours): flat cartoon cards drawn with the shared Pen API, in the same
// ink style as the people (plum outline, thick-thin rings, painted crescents, no eye highlights).
// - Side view (profile, facing screen right; mirrored for left): a shaggy feather body, an S-neck with blue skin, a
//   small dark head with an amber eye and a flat beak, and two-bone legs solved with IK so the feet plant on the
//   ground: stand, walk, run (with a flight phase and a forward neck), peck.
// - Front view (looking at the lens) for close-ups: wide body, straight neck, two eyes, a foreshortened beak.
// Design space is the people's: 600 x 1000 units, soles at y = 975 (cast.ts BODY: 1000 units = 2.16 m), so an emu
// about 790 units tall stands ~1.7 m, the real height (Wikipedia: up to 1.9 m).
import { Pen, INK, mul, mix } from "../bridge/toon";

type P2 = [number, number];
type C3 = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const TWO = Math.PI * 2;
const SHADE: C3 = [0.62, 0.64, 0.74];
const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export type EmuMode = "stand" | "walk" | "run" | "peck" | "front";
export type EmuExpr = "calm" | "smug" | "alarm" | "happy" | "wink" | "squint";
export type EmuOpts = {
  mode: EmuMode; phase?: number; expr?: EmuExpr; blink?: number; dark?: boolean; seed?: number;
  /** canvas angle the key light comes FROM */
  light?: number;
  /** 1 = faces screen right, -1 = left (side views) */
  dir?: 1 | -1;
  /** head yaw in the front view (-1..1) */
  look?: number;
  /** extra neck stretch 0..1 (the lookout standing tall) */
  tall?: number;
  /** puffed feathers 0..1 (alarm) */
  puff?: number;
  /** front view: wearing a soldier's slouch hat (the hook's punchline) */
  hat?: boolean;
};

const PAL = (dark: boolean) => dark
  ? { body: "#3b3431", body2: "#252020", streak: "#5a504a", neck: "#6f86a8", head: "#1f1b1b", leg: "#4f4842", beak: "#2a2522" }
  : { body: "#86704f", body2: "#5e4b38", streak: "#a88d64", neck: "#8ea3c2", head: "#3c3330", leg: "#5f5246", beak: "#3a332e" };

const thickOf = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));

/** shaggy outline: an ellipse whose lower/back half is cut into feather points */
const shag = (cx: number, cy: number, rx: number, ry: number, rot: number, seed: number, from = 20, to = 200, depth = 0.11, n = 90): P2[] => {
  const pts: P2[] = [], c = Math.cos(rad(rot)), s = Math.sin(rad(rot));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360;
    let r = 1;
    const inShag = a > from && a < to;
    if (inShag) r += (i % 2 ? depth : -depth * 0.25) * (0.7 + 0.6 * hash(i, seed));
    const x = rx * r * Math.cos(rad(a)), y = ry * r * Math.sin(rad(a));
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return pts;
};

/** two-bone leg: hip H, foot F, ankle bent BACKWARD (toward -x) like a real emu's */
const ik = (H: P2, F: P2, l1: number, l2: number): P2 => {
  let dx = F[0] - H[0], dy = F[1] - H[1], d = Math.hypot(dx, dy);
  const dmax = l1 + l2 - 2;
  if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const px = H[0] + (a * dx) / d, py = H[1] + (a * dy) / d;
  // perpendicular (-dy, dx): for a leg pointing down it points to -x, behind the line
  return [px + (h * -dy) / d, py + (h * dx) / d];
};

const quadPts = (a: P2, c: P2, b: P2, n = 16): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, r = 1 - t; out.push([r * r * a[0] + 2 * r * t * c[0] + t * t * b[0], r * r * a[1] + 2 * r * t * c[1] + t * t * b[1]]); }
  return out;
};

/** a tapered tube along a polyline (the neck): width w0 at the start, w1 at the end */
const tube = (pts: P2[], w0: number, w1: number): P2[] => {
  const L: P2[] = [], R: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...L, ...R.reverse()];
};

/** the eye and its "brow" for an expression; (x, y) eye centre, s = scale */
const emuEye = (p: Pen, x: number, y: number, s: number, expr: EmuExpr, blink: number, skin: string, side = 1, wink = false) => {
  const rx = 9 * s, ry = 10.5 * s;
  const shut = blink > 0.6 || expr === "happy" || (wink && expr === "wink");
  if (shut) {
    if (expr === "happy" || (wink && expr === "wink")) p.arc(x, y + 2 * s, rx, 6 * s, 200, 340, 3.2 * s);
    else p.stroke([[x - rx, y + 1 * s], [x + rx, y + 1 * s]], 3.2 * s);
  } else {
    const big = expr === "alarm" ? 1.35 : 1;
    p.ell(x, y, rx * big, ry * big, "#f2e9d8", 2.6 * s);
    p.ell(x + 1.5 * s * side, y + 0.5 * s, 5.6 * s * big, 6.4 * s * big, "#d98a2c", 0);
    p.dot(x + 2 * s * side, y + 0.5 * s, 3.2 * s * big, INK);
    // upper lid: half closed when smug, a third when calm or squinting
    const lid = expr === "smug" || expr === "wink" ? 0.55 : expr === "squint" ? 0.62 : expr === "calm" ? 0.3 : 0;
    const k = Math.max(lid, blink > 0.2 ? 0.5 : 0);
    if (k > 0) {
      const top = y - ry * big, cut = top + 2 * ry * big * k;
      p.poly([[x - rx * big - 1, top - 1], [x + rx * big + 1, top - 1], [x + rx * big + 1, cut], [x - rx * big - 1, cut]], skin, 0);
      p.stroke([[x - rx * big, cut + 0.5 * s * side], [x + rx * big, cut - 0.5 * s * side]], 3 * s);
    }
    p.ell(x, y, rx * big, ry * big, null, 2.6 * s);
  }
  // brow (cartoon): smug tilts down to the beak, alarm arches high, squint pinches
  const by = y - (expr === "alarm" ? 19 : 14) * s;
  if (expr === "smug" || expr === "wink") p.stroke([[x - 10 * s * side, by - 3 * s], [x + 10 * s * side, by + 3 * s]], 4 * s);
  else if (expr === "alarm") p.arc(x, by, 10 * s, 4 * s, 200, 340, 3.6 * s);
  else if (expr === "squint") p.stroke([[x - 10 * s * side, by + 4 * s], [x + 10 * s * side, by - 1 * s]], 4.4 * s);
};

/** side-view emu, facing screen right (the caller mirrors for dir = -1) */
const emuSide = (p: Pen, o: EmuOpts) => {
  const C = PAL(!!o.dark), seed = o.seed ?? 1, light = o.light ?? rad(-120), thick = thickOf(light);
  const mode = o.mode, ph = ((o.phase ?? 0) % 1 + 1) % 1, puff = o.puff ?? (o.expr === "alarm" ? 0.6 : 0);
  // ---- gait: foot paths and body bob ----
  const run = mode === "run", walk = mode === "walk", peck = mode === "peck";
  const S = run ? 330 : walk ? 190 : 0, LIFT = run ? 140 : walk ? 80 : 0, stance = run ? 0.38 : 0.55;
  const foot = (u: number): P2 => {
    if (!S) return [0, 0];
    if (u < stance) { const k = u / stance; return [S / 2 - S * k, 0]; }
    const k = (u - stance) / (1 - stance);
    return [-S / 2 + S * (0.5 - 0.5 * Math.cos(Math.PI * k)), -LIFT * Math.sin(Math.PI * k)];
  };
  const bob = run ? -26 * Math.abs(Math.sin(TWO * ph)) + 8 : walk ? -8 * Math.cos(2 * TWO * ph) : peck ? 10 : 0;
  const lean = run ? 12 : walk ? 4 : peck ? 16 : 0; // body tilt (deg, front down)
  const bx = 280, by = 515 + bob + (run ? 30 : 0);
  const rx = 170 * (1 + 0.06 * puff), ry = 118 * (1 + 0.1 * puff);
  const H: P2 = [bx + 20, by + 88];
  // ---- legs (far one first, behind the body) ----
  const legs: [number, string][] = [[0.5, mul(C.leg, [0.72, 0.72, 0.8])], [0, C.leg]];
  const drawLeg = (off: number, col: string) => {
    const u = (ph + off) % 1, [fx, fy] = foot(u);
    const F: P2 = [H[0] + 18 + fx, 966 + fy + (peck ? 0 : 0)];
    const A = ik(H, F, 205, 205);
    p.band([H, A], col, 28, 4, "round");
    p.band([A, F], col, 19, 3.6, "round");
    // scaly rings on the shank
    for (let k = 1; k < 5; k++) { const t = k / 5, x = A[0] + (F[0] - A[0]) * t, y = A[1] + (F[1] - A[1]) * t; p.stroke([[x - 6, y], [x + 6, y + 1]], 2, mul(col, [0.7, 0.7, 0.75])); }
    p.dot(A[0], A[1], 14, col); p.ell(A[0], A[1], 14, 14, null, 3.4);
    // toes: flat forward when planted, curled down-back in the air
    const air = fy < -6, tw = 11;
    const toes: P2[] = air ? [[F[0] + 22, F[1] + 26], [F[0] + 6, F[1] + 30], [F[0] - 16, F[1] + 14]] : [[F[0] + 52, F[1] + 9], [F[0] + 38, F[1] + 12], [F[0] - 18, F[1] + 6]];
    for (const t of toes) p.band([F, t], col, tw, 2.8, "round");
    p.dot(F[0], F[1], 9, col);
  };
  drawLeg(...legs[0]);
  // ---- body ----
  const body = shag(bx, by, rx, ry, -lean, seed, 10, 215, 0.12 + 0.05 * puff);
  p.gradFill(body, C.body, mul(C.body, SHADE), light, 0.3);
  p.clip(body, () => {
    // feather streaks: rows of hanging double strokes, lighter on top
    for (let i = 0; i < 70; i++) {
      const x = bx - rx + 2 * rx * hash(i, seed + 3), y = by - ry * 0.8 + 1.7 * ry * hash(i, seed + 5), l = 26 + 30 * hash(i, seed + 7);
      const col = y < by - 20 ? C.streak : C.body2;
      p.stroke(quadPts([x, y], [x - 8, y + l * 0.5], [x - 4, y + l], 6), 4.5, col);
    }
    // the back is darker
    p.ell(bx - 40, by + ry * 0.75, rx * 1.2, ry * 0.55, mul(C.body2, [1, 1, 1.05]) + "", 0);
  });
  p.inkRing(body, 10, thick, 0.5);
  // ---- neck + head ----
  const N0: P2 = [bx + rx * 0.55, by - ry * 0.55];
  const tall = o.tall ?? 0, bobN = walk ? 14 * Math.sin(TWO * ph) : run ? 10 * Math.sin(2 * TWO * ph) : 0;
  let Hd: P2, Cn: P2;
  if (peck) { const k = 0.5 + 0.5 * Math.sin(TWO * ph); Hd = [bx + 285, 905 - 30 * (1 - k)]; Cn = [bx + 270, by - 40]; }
  else if (run) { Hd = [bx + 300 + bobN, by - 175 + bobN * 0.4]; Cn = [bx + 195, by - 205]; }
  else { Hd = [bx + 190 + bobN, 262 - 70 * tall + bob * 0.3]; Cn = [bx + 215 + bobN * 0.5, by - 200 - 40 * tall]; }
  const neckLine = quadPts(N0, Cn, Hd, 18);
  const neck = tube(neckLine, 96 + 16 * puff, 50);
  p.gradFill(neck, C.neck, mul(C.neck, SHADE), light, 0.3);
  p.clip(neck, () => { // feather wisps on the back of the neck
    for (let i = 0; i < 16; i++) { const q = neckLine[Math.min(17, 1 + i)]; p.stroke([[q[0] - 22, q[1] + 4], [q[0] - 40, q[1] + 20]], 5, C.body2); }
  });
  p.inkRing(neck, 7.5, thick, 0.45);
  // body feathers overlap the neck root
  p.poly(shag(N0[0] - 14, N0[1] + 26, 62, 44, -30, seed + 9, 0, 360, 0.18, 30), C.body, 0);
  // head: dark crown feathers, blue face skin, beak, eye
  const hx = Hd[0], hy = Hd[1], s = 1.75;
  const head = shag(hx, hy, 36 * s, 27 * s, peck ? 60 : run ? 18 : 0, seed + 11, 160, 330, 0.18, 40);
  p.shadedFill(head, C.head, mul(C.head, SHADE), light, 36 * s);
  p.clip(head, () => p.ell(hx + 20, hy + 12, 36, 24, C.neck, 0));
  p.inkRing(head, 7, thick, 0.4);
  const ang = rad(peck ? 70 : run ? 16 : 0), ca = Math.cos(ang), sa = Math.sin(ang);
  const R = (x0: number, y0: number): P2 => { const x = x0 * 1.4, y = y0 * 1.4; return [hx + x * ca - y * sa, hy + x * sa + y * ca]; };
  const smile = o.expr === "smug" || o.expr === "happy" || o.expr === "wink" ? -4 : 0;
  p.poly([R(30, -10), R(84, -2), R(88, 5), R(80, 10), R(30, 14)], C.beak, 5);
  p.stroke([R(34, 4), R(64, 4 + smile * 0.3), R(82, 3 + smile)], 4);
  p.dot(...R(66, -3), 4);
  emuEye(p, ...R(8, -8), 1.6, o.expr ?? "calm", o.blink ?? 0, C.neck, 1, true);
  drawLeg(...legs[1]);
};

/** front-view emu looking at the lens (close-ups, the lookout, the coat of arms) */
const emuFront = (p: Pen, o: EmuOpts) => {
  const C = PAL(!!o.dark), seed = o.seed ?? 1, light = o.light ?? rad(-120), thick = thickOf(light), look = o.look ?? 0;
  const puff = o.puff ?? (o.expr === "alarm" ? 0.6 : 0), tall = o.tall ?? 0, ph = o.phase ?? 0;
  const shift = 6 * Math.sin(TWO * ph);
  // legs straight down, slightly apart, toes splayed toward the lens
  for (const sx of [-1, 1]) {
    const hx = 300 + sx * 40, fx = 300 + sx * 52;
    p.band([[hx, 640], [hx + sx * 6, 805]], C.leg, 28, 4, "round");
    p.band([[hx + sx * 6, 805], [fx, 958]], C.leg, 20, 3.6, "round");
    p.dot(hx + sx * 6, 805, 12, C.leg); p.ell(hx + sx * 6, 805, 12, 12, null, 3);
    for (const t of [-28, 0, 26]) p.band([[fx, 958], [fx + t * 1.2 + sx * 6, 978]], C.leg, 10, 2.8, "round");
  }
  const by = 545 - 20 * tall;
  const body = shag(300 + shift, by, 175 * (1 + 0.06 * puff), 150 * (1 + 0.1 * puff), 0, seed, 20, 160, 0.13 + 0.05 * puff);
  p.gradFill(body, C.body, mul(C.body, SHADE), light, 0.3);
  p.clip(body, () => {
    for (let i = 0; i < 80; i++) {
      const x = 130 + 340 * hash(i, seed + 3), y = by - 130 + 280 * hash(i, seed + 5), l = 26 + 34 * hash(i, seed + 7);
      p.stroke(quadPts([x, y], [x + (x - 300) * 0.06, y + l * 0.5], [x + (x - 300) * 0.1, y + l], 6), 4.5, y < by - 30 ? C.streak : C.body2);
    }
  });
  p.inkRing(body, 10, thick, 0.5);
  // neck
  const top: P2 = [300 + 26 * look, 290 - 80 * tall], base: P2 = [300 + shift * 0.5, by - 110];
  const neckLine = quadPts(base, [300 + 10 * look, (base[1] + top[1]) / 2], top, 14);
  const neck = tube(neckLine, 118 + 16 * puff, 66);
  p.gradFill(neck, C.neck, mul(C.neck, SHADE), light, 0.3);
  p.clip(neck, () => { for (let i = 0; i < 14; i++) { const q = neckLine[i]; for (const sx of [-1, 1]) p.stroke([[q[0] + sx * 16, q[1]], [q[0] + sx * 26, q[1] + 16]], 4, C.body2); } });
  p.inkRing(neck, 8, thick, 0.45);
  p.poly(shag(base[0], base[1] + 30, 86, 50, 0, seed + 9, 0, 360, 0.16, 34), C.body, 0);
  // head
  const hx = top[0], hy = top[1] - 40;
  const head = shag(hx, hy, 70, 62, 0, seed + 11, 180, 360, 0.18, 44);
  p.shadedFill(head, C.head, mul(C.head, SHADE), light, 70);
  p.clip(head, () => p.ell(hx + 8 * look, hy + 20, 56, 36, C.neck, 0));
  p.inkRing(head, 7.5, thick, 0.4);
  const ex = 30, ey = hy + 2;
  emuEye(p, hx - ex + 6 * look, ey, 1.7, o.expr ?? "calm", o.blink ?? 0, C.neck, -1, false);
  emuEye(p, hx + ex + 6 * look, ey, 1.7, o.expr ?? "calm", o.blink ?? 0, C.neck, 1, true);
  // beak seen from the front: a short rounded wedge below the eyes, the gape a shallow curve
  const bx = hx + 8 * look, smile = o.expr === "smug" || o.expr === "happy" || o.expr === "wink" ? 1 : 0;
  p.poly([[bx - 28, hy + 26], [bx + 28, hy + 26], [bx + 18, hy + 58], [bx, hy + 66], [bx - 18, hy + 58]], C.beak, 6);
  p.arc(bx, hy + 38 - 5 * smile, 21, 8 + 5 * smile, 20, 160, 4);
  p.dot(bx - 9, hy + 32, 3.4); p.dot(bx + 9, hy + 32, 3.4);
  if (o.hat) { // the gunner's slouch hat, a size too big, tipped over one eye
    const col = "#97835a", yb = hy - 34, g = p.g;
    g.save(); g.translate(hx, yb); g.rotate(-0.12); g.translate(-hx, -yb);
    p.ell(hx, yb, 112, 17, mul(col, SHADE), 6, 180, 360);
    const crown: P2[] = [[hx - 62, yb], [hx - 60, yb - 52], [hx - 34, yb - 74], [hx - 6, yb - 62], [hx, yb - 58], [hx + 6, yb - 62], [hx + 34, yb - 74], [hx + 60, yb - 52], [hx + 62, yb]];
    p.gradFill(crown, col, mul(col, SHADE), light, 0.3);
    p.clip(crown, () => p.band([[hx - 70, yb - 15], [hx + 70, yb - 15]], "#c9b88a", 24, 2));
    p.poly(crown, null, 6);
    p.ell(hx, yb, 112, 17, mul(col, [0.92, 0.9, 0.86]), 6, 0, 180);
    const up: P2[] = [[hx + 50, yb + 2], [hx + 112, yb - 2], [hx + 108, yb - 60], [hx + 62, yb - 66]];
    p.gradFill(up, mul(col, [0.95, 0.93, 0.9]), mul(col, SHADE), light, 0.3); p.poly(up, null, 6);
    const sx = hx + 84, sy = yb - 30;
    for (let k = 0; k < 9; k++) { const t = rad(180 + k * 22.5); p.stroke([[sx + 9 * Math.cos(t), sy + 9 * Math.sin(t)], [sx + 19 * Math.cos(t), sy + 19 * Math.sin(t)]], 3.4, "#f2c230"); }
    p.ell(sx, sy, 9, 9, "#f2c230", 2.4, 180, 360);
    g.restore();
  }
};

/** draw an emu card (600 x 1000 design units, soles at 975) */
export const emuCard = (p: Pen, o: EmuOpts) => {
  const g = p.g;
  g.save();
  if (o.mode !== "front" && o.dir === -1) g.transform(-1, 0, 0, 1, 600, 0);
  if (o.mode === "front") emuFront(p, o); else emuSide(p, o);
  g.restore();
};

/** red kangaroo, standing on its tail, facing screen left (the coat-of-arms partner) */
export const roo = (p: Pen, o: { light?: number; blink?: number; expr?: EmuExpr }) => {
  const light = o.light ?? rad(-120), thick = thickOf(light), col = "#c06a3e", belly = "#e8b48a";
  // tail
  p.poly(quadPts([330, 760], [470, 850], [560, 960], 12).concat(quadPts([548, 975], [450, 905], [300, 830], 12)), mul(col, [0.85, 0.85, 0.9]), 8);
  // big feet
  for (const dx of [0, 40]) p.poly([[200 + dx, 975], [330 + dx, 975], [330 + dx, 945], [250 + dx, 930]], mul(col, [0.8, 0.8, 0.86]), 7);
  // body: pear shape
  const body: P2[] = [];
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TWO, r = 1 + 0.25 * Math.max(0, Math.sin(a)); body.push([300 + 120 * r * Math.cos(a), 700 + 210 * Math.sin(a) * (Math.sin(a) > 0 ? 1.05 : 1)]); }
  p.gradFill(body, col, mul(col, SHADE), light, 0.3);
  p.clip(body, () => p.ell(260, 740, 70, 170, belly, 0));
  p.inkRing(body, 9, thick, 0.5);
  // little arms, crossed proudly
  p.band([[225, 600], [190, 660], [240, 670]], col, 18, 3.4, "round");
  // head: long snout to the left, tall ears
  for (const ex of [330, 290]) p.poly([[ex, 380], [ex + 28, 270], [ex + 40, 390]], col, 7);
  p.poly([[230, 420], [330, 380], [370, 430], [360, 500], [250, 530], [175, 505], [168, 480], [230, 440]], col, 8);
  p.dot(176, 492, 6);
  emuEye(p, 270, 455, 1.0, o.expr ?? "calm", o.blink ?? 0, col, -1, false);
};

/** a big cartoon hand seen from above, fingers spread (open) or clenched (closed); 400 x 400 canvas */
export const fxHand = (p: Pen, close: number, skin = "#f2c9a2") => {
  const c = Math.max(0, Math.min(1, close));
  const palm: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TWO; palm.push([200 + 95 * Math.cos(a), 250 + 85 * Math.sin(a)]); }
  // wrist
  p.poly([[150, 300], [250, 300], [262, 400], [138, 400]], mix(skin, "#000000", 0.08), 9);
  for (let k = 0; k < 4; k++) {
    const a = rad(-125 + k * 24), L = 120 * (1 - 0.55 * c) - (k === 3 ? 20 : 0), x0 = 200 + 70 * Math.cos(a), y0 = 250 + 70 * Math.sin(a);
    p.line([[x0, y0], [x0 + L * Math.cos(a), y0 + L * Math.sin(a)]], skin, 46 - 6 * c);
  }
  p.line([[120, 270], [70 - 20 * (1 - c), 200 + 40 * c]], skin, 46);
  p.poly(palm, skin, 9);
  p.arc(200, 255, 50, 30, 200, 340, 4, mul(skin, [0.75, 0.7, 0.7]));
};

/** speed lines behind a runner; 600 x 300 canvas, k = 0..1 flicker phase */
export const fxSpeed = (p: Pen, k: number) => {
  for (let i = 0; i < 9; i++) {
    const y = 30 + i * 30 + 10 * hash(i, 4), x0 = 40 + 200 * hash(i + Math.floor(k * 4) * 9, 2), l = 160 + 240 * hash(i, 3);
    p.stroke([[x0, y], [x0 + l, y]], 7, "rgba(255,250,235,0.85)");
  }
};

/** a ring target painted on the ground; 512 x 512 canvas */
export const fxTarget = (p: Pen, k: number) => {
  const r = 230 * k;
  for (const [f, col] of [[1, "#d8402e"], [0.75, "#fff3df"], [0.5, "#d8402e"], [0.25, "#fff3df"]] as const) p.ell(256, 256, r * f, r * f, col, 10);
};

/** muzzle flash; 300 x 300 canvas */
export const fxFlash = (p: Pen, k: number) => {
  const pts: P2[] = [];
  for (let i = 0; i < 16; i++) { const r = i % 2 ? 40 : 120 * (1 - 0.4 * k), a = (i / 16) * TWO + k; pts.push([150 + r * Math.cos(a), 150 + r * Math.sin(a)]); }
  p.poly(pts, "#ffe27a", 7);
  p.ell(150, 150, 34, 34, "#fff8d8", 0);
};

/** "jammed": a little grey smoke curl plus a spring; 300 x 300 canvas */
export const fxJam = (p: Pen, k: number) => {
  for (let i = 0; i < 4; i++) { const r = 26 + 10 * i, a = k * 3 + i; p.ell(150 + 30 * Math.sin(a), 230 - 45 * i - 30 * k, r, r * 0.8, `rgba(120,120,128,${(0.9 - 0.2 * i) * (1 - k * 0.6)})`, 0); }
  const sp: P2[] = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; sp.push([150 + 26 * Math.cos(t * 6 * TWO), 120 - 90 * t - 60 * k + 10 * Math.sin(t * 6 * TWO)]); }
  p.stroke(sp, 6, "#c9ccd2"); p.stroke(sp, 2, INK);
};

/** a dust cloud kicked up by running feet (soft); 300 x 300, t = 0..1 */
export const fxDust = (p: Pen, t: number, col = "214,170,120") => {
  for (let i = 0; i < 6; i++) {
    const a = rad(150 + i * 40), d = 30 + 90 * t, r = (40 + 18 * (i % 3)) * (0.6 + 0.6 * t);
    p.ell(150 + d * Math.cos(a), 200 + 0.4 * d * Math.sin(a), r, r * 0.75, `rgba(${col},${(0.75 * (1 - t)).toFixed(3)})`, 0);
  }
};
