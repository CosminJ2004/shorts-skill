// Painted textures and effect cards for the castle short (ours). Textures go through the skill's ctex cache; effect
// cards are drawn with the shared Pen API on their own canvases.
import { ctex } from "../bridge/paint";
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** chalk cliff face: white with grey-blue strata, flint seams, vertical cracks and green moss streaks from the top
 *  (v runs down the face: v 0 = cliff top) */
export const cliffTex = () => ctex("chalkCliff", 1024, 1024, (g, r) => {
  g.fillStyle = "#ece6d8"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 10 + r() * 22) { // strata: thin, low-contrast bands
    g.fillStyle = `rgba(${160 + r() * 30},${158 + r() * 30},${160 + r() * 30},${0.1 + r() * 0.12})`;
    g.fillRect(0, y, 1024, 3 + r() * 6);
  }
  for (let i = 0; i < 260; i++) { // blocky chalk faces: soft light and shade patches
    const x = r() * 1024, y = r() * 1024, w = 30 + r() * 90, h = 14 + r() * 40;
    g.fillStyle = r() < 0.5 ? "rgba(255,252,244,0.35)" : "rgba(170,165,160,0.22)"; g.fillRect(x, y, w, h);
  }
  g.fillStyle = "rgba(90,86,96,0.55)";
  for (let k = 0; k < 6; k++) { const y = 80 + k * 170 + r() * 40; for (let x = 0; x < 1024; x += 14 + r() * 30) { g.beginPath(); g.ellipse(x, y + (r() - 0.5) * 8, 4 + r() * 6, 2 + r() * 3, 0, 0, 6.3); g.fill(); } }
  g.strokeStyle = "rgba(110,100,95,0.45)"; g.lineCap = "round";
  for (let i = 0; i < 46; i++) { // cracks
    let x = r() * 1024, y = r() * 900; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 30; y += 20 + r() * 30; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 40; i++) { // moss streaks from the top
    const x = r() * 1024, w = 6 + r() * 20, h = 60 + r() * 200;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(110,150,80,0.55)"); gr.addColorStop(1, "rgba(110,150,80,0)");
    g.fillStyle = gr; g.fillRect(x, 0, w, h);
  }
});

// ---------------- textures ----------------
/** soft speckle multiplied over the terrain's vertex colours (chalk, grass, dirt) */
export const terrainTex = () => ctex("terrainSpeckle", 512, 512, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 512, y = r() * 512, s = 2 + r() * 7, v = 200 + Math.floor(r() * 50);
    g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.5), r() * 3, 0, 6.3); g.fill();
  }
  g.strokeStyle = "rgba(150,150,150,0.35)"; g.lineWidth = 2;
  for (let i = 0; i < 90; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 20, y + 8 + r() * 26); g.stroke(); }
});

/** butter: pale gold with lighter smears, a few darker streaks and knife marks */
export const butterTex = () => ctex("butter", 512, 512, (g, r) => {
  g.fillStyle = "#f6dc6a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = r() < 0.6 ? "rgba(255,240,170,0.55)" : "rgba(226,186,70,0.35)";
    g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 8 + r() * 18, r() * 3, 0, 6.3); g.fill();
  }
  g.strokeStyle = "rgba(205,160,50,0.45)"; g.lineWidth = 4;
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y + 6, x + 70 + r() * 40, y + (r() - 0.5) * 10); g.stroke(); }
});

/** the Seine: blue with light crest dashes */
export const waterTex = () => ctex("seine", 512, 512, (g, r) => {
  g.fillStyle = "#2f7fb3"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(20,70,120,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 60 + r() * 80, 10 + r() * 14, 0, 0, 6.3); g.fill(); }
  g.strokeStyle = "rgba(190,235,245,0.8)"; g.lineWidth = 3; g.lineCap = "round";
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, w = 10 + r() * 24; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 4, x + w, y); g.stroke(); }
});

/** striped canvas for tents */
export const tentTex = (a: string, b: string) => ctex("tent" + a + b, 256, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, 128); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 112, 256, 16);
});

/** the chute's back wall: dark stone with brown streaks running down */
export const chuteTex = () => ctex("chuteStain", 128, 512, (g, r) => {
  g.fillStyle = "#8a7a68"; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 9; i++) {
    const x = 10 + r() * 108, w = 6 + r() * 16;
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(96,70,36,0.85)"); gr.addColorStop(1, "rgba(96,70,36,0.1)");
    g.fillStyle = gr; g.fillRect(x, 0, w, 300 + r() * 212);
  }
  g.strokeStyle = "rgba(20,14,12,0.5)"; g.lineWidth = 3;
  for (let y = 40; y < 512; y += 64) { g.beginPath(); g.moveTo(0, y + r() * 6); g.lineTo(128, y + r() * 6); g.stroke(); }
});

/** brown stain streaks below the chute on the wall face (a decal) */
export const stainTex = () => ctex("wallStain", 128, 512, (g, r) => {
  g.clearRect(0, 0, 128, 512);
  for (let i = 0; i < 7; i++) {
    const x = 16 + r() * 96, w = 5 + r() * 12, h = 200 + r() * 300;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(110,80,40,0.55)"); gr.addColorStop(1, "rgba(110,80,40,0)");
    g.fillStyle = gr; g.fillRect(x, 0, w, h);
  }
});

/** cut face of the cutaway wall: pale stone with diagonal section hatching */
export const sectionTex = () => ctex("sectionCut", 512, 512, (g, r) => {
  g.fillStyle = "#efe4cf"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(200,180,150,0.45)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 40, 12 + r() * 20, r() * 3, 0, 6.3); g.fill(); }
  g.strokeStyle = "rgba(150,120,95,0.55)"; g.lineWidth = 3;
  for (let k = -512; k < 512; k += 26) { g.beginPath(); g.moveTo(k, 512); g.lineTo(k + 512, 0); g.stroke(); }
});

/** brushed steel panels with rivets (the vault) */
export const steelTex = () => ctex("steelPanels", 512, 512, (g, r) => {
  g.fillStyle = "#9aa4b0"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; g.fillRect(r() * 512, r() * 512, 40 + r() * 120, 2); }
  g.strokeStyle = "#5a6470"; g.lineWidth = 6;
  for (let x = 0; x <= 512; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 256) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.fillStyle = "#3e4650";
  for (let x = 20; x < 512; x += 54) for (const y of [16, 240, 272, 496]) { g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill(); }
});

/** marble checkerboard floor (the bank) */
export const marbleTex = () => ctex("marbleFloor", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#e9e2d4" : "#4a5468"; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 2;
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20, y + 10, x + 30, y + 30, x + 60, y + 34); g.stroke(); }
});

/** stained glass: lead lines over bright panes (used on emissive planes) */
export const glassTex = (seed: number) => ctex("glass" + seed, 128, 256, (g, r) => {
  const pal = ["#d8443a", "#3a6fd8", "#f2c230", "#3aa85a", "#9a4ad8"];
  g.fillStyle = "#1a1418"; g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 248; y += 40) for (let x = 8; x < 120; x += 38) { g.fillStyle = pal[Math.floor(r() * 5)]; g.fillRect(x, y, 34, 36); }
  g.fillStyle = "#1a1418"; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 60); g.quadraticCurveTo(64, -30, 128, 60); g.lineTo(128, 0); g.fill();
});

/** a heraldic flag: France (gold lilies on blue) or England (gold lions on red) */
export const flagTex = (kind: "fr" | "en") => ctex("flag" + kind, 256, 160, (g) => {
  const c = document.createElement("canvas"); void c;
  g.fillStyle = kind === "fr" ? "#2c56b8" : "#c8323a"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#f2c230";
  const p = new Pen(g); p.ol = 3;
  if (kind === "fr") for (const [x, y] of [[64, 50], [192, 50], [128, 110], [40, 130], [216, 130]] as P2[]) lily(p, x, y, 22);
  else for (const y of [36, 82, 128]) lion(p, 128, y, 30);
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 6; g.strokeRect(0, 0, 256, 160);
});

/** a woven tapestry with England's lions (chapel wall) */
export const tapestryTex = () => ctex("tapestry", 256, 384, (g) => {
  g.fillStyle = "#a8282e"; g.fillRect(0, 0, 256, 384);
  g.fillStyle = "#e8c45a"; g.fillRect(0, 0, 256, 16); g.fillRect(0, 368, 256, 16); g.fillRect(0, 0, 14, 384); g.fillRect(242, 0, 14, 384);
  const p = new Pen(g); p.ol = 3;
  for (const y of [90, 190, 290]) lion(p, 128, y, 46);
  for (let x = 20; x < 240; x += 24) { g.fillStyle = "#e8c45a"; g.fillRect(x, 384 - 4, 10, 4); }
});

const lily = (p: Pen, cx: number, y: number, s: number) => {
  const c = "#f2c230";
  p.poly([[cx, y - s], [cx + s * 0.3, y - s * 0.2], [cx, y + s * 0.15], [cx - s * 0.3, y - s * 0.2]], c);
  for (const sd of [-1, 1]) p.poly([[cx + sd * s * 0.15, y - s * 0.05], [cx + sd * s * 0.8, y - s * 0.6], [cx + sd * s * 0.75, y + s * 0.05], [cx + sd * s * 0.25, y + s * 0.3]], c);
  p.poly([[cx - s * 0.45, y + s * 0.12], [cx + s * 0.45, y + s * 0.12], [cx + s * 0.45, y + s * 0.3], [cx - s * 0.45, y + s * 0.3]], c);
};
const lion = (p: Pen, cx: number, y: number, s: number) => {
  const c = "#f2c230";
  p.ell(cx, y, s * 1.05, s * 0.42, c);
  p.ell(cx - s * 1.0, y - s * 0.32, s * 0.42, s * 0.4, c);
  p.line([[cx + s * 1.0, y - s * 0.1], [cx + s * 1.35, y - s * 0.55], [cx + s * 1.15, y - s * 0.8]], c, s * 0.12, false);
  for (const lx of [-0.6, -0.2, 0.3, 0.7]) p.line([[cx + lx * s, y + s * 0.3], [cx + lx * s, y + s * 0.62]], c, s * 0.12, false);
};

// ---------------- effect cards ----------------
/** a coin sack on a 200 x 220 canvas */
export const fxSack = (p: Pen) => {
  p.poly([[60, 70], [140, 70], [176, 150], [160, 205], [40, 205], [24, 150]], "#b98a52", 7);
  p.poly([[78, 40], [122, 40], [132, 74], [68, 74]], "#a8784a", 6);
  p.line([[66, 72], [134, 72]], "#6b4226", 8);
  for (const [x, y] of [[80, 120], [118, 140], [92, 165], [130, 178]] as P2[]) { p.ell(x, y, 16, 9, "#f2c230", 4); p.arc(x, y - 1, 8, 4, 200, 340, 2.5, "#c99a2a"); }
};
/** a golden coin, spinning: k 0..1 */
export const fxCoin = (p: Pen, k: number) => { const w = 34 * Math.abs(Math.cos(k * Math.PI)); p.ell(50, 50, Math.max(5, w), 34, "#f2c230", 6); if (w > 14) p.ell(50, 50, w * 0.6, 22, null, 3); };
/** Richard's crown on its own, 260 x 160 */
export const fxCrown = (p: Pen) => {
  const pts: P2[] = [[30, 140], [230, 140], [230, 90]];
  for (let i = 5; i >= 0; i--) { const x = 30 + 40 * i; pts.push([x, 30]); if (i) pts.push([x - 20, 90]); }
  p.poly(pts, "#f2c230", 8);
  for (let i = 0; i < 3; i++) p.ell(80 + i * 50, 112, 10, 10, i === 1 ? "#d23a3a" : "#3a6fd2", 4);
  for (let i = 0; i <= 5; i++) p.ell(30 + 40 * i, 30, 8, 8, "#f2c230", 4);
};
/** a pink heart, 120 x 120 */
export const fxHeart = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); pts.push([60 + x * 3, 60 + y * 3]); }
  p.poly(pts, "#ff6f9a", 6);
  p.ell(44, 44, 7, 5, "#ffd0de", 0, 0, 360, -30);
};
/** a cartoon fly, 120 x 90: wings flap with the phase */
export const fxFly = (p: Pen, ph: number) => {
  const w = 0.5 + 0.5 * Math.sin(ph * Math.PI * 2);
  p.ell(46, 30 - 6 * w, 20, 12 + 6 * w, "rgba(220,235,255,0.85)", 3, 0, 360, -30);
  p.ell(74, 30 - 6 * w, 20, 12 + 6 * w, "rgba(220,235,255,0.85)", 3, 0, 360, 30);
  p.ell(60, 52, 22, 15, "#2a2a30", 4);
  p.ell(40, 50, 11, 11, "#2a2a30", 4);
  p.dot(36, 46, 3, "#c03030");
};
/** stink lines rising: three wavy green strokes, 200 x 300, t 0..1 loops */
export const fxStink = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const x0 = 50 + k * 50, pts: P2[] = [];
    const tt = (t + k * 0.33) % 1;
    for (let i = 0; i <= 14; i++) { const y = 280 - i * 16 - tt * 40; pts.push([x0 + 14 * Math.sin(i * 0.8 + tt * 6.28 + k), y]); }
    p.g.globalAlpha = Math.min(1, 1.6 * (1 - tt));
    p.line(pts, "#8fd16a", 10, true);
    p.g.globalAlpha = 1;
  }
};
/** flames, 200 x 300, flickering with the phase */
export const fxFlame = (p: Pen, ph: number) => {
  const j = (k: number) => 12 * Math.sin(ph * 6.28 * 2 + k);
  p.poly([[40, 290], [160, 290], [176 + j(1), 190], [130 + j(2), 140], [124, 40 + j(3)], [96 + j(4), 120], [70 + j(5), 70], [36 + j(6), 180]], "#ff8a2a", 7);
  p.poly([[70, 286], [134, 286], [146 + j(2), 210], [112 + j(3), 150], [100, 120 + j(4)], [84 + j(5), 190], [60, 220]], "#ffd34a", 0);
};
/** a brown drop falling (the "plop"), 80 x 110 */
export const fxDrop = (p: Pen) => p.poly([[40, 8], [62, 60], [58, 88], [40, 100], [22, 88], [18, 60]], "#7a5228", 5);
/** dark smoke puff, 300 x 300, t 0..1 */
export const fxSmoke = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(200 + i * 35), d = 30 + 60 * t, r = (40 + 16 * (i % 2)) * (0.7 + 0.6 * t);
    p.ell(150 + d * Math.cos(a) * 0.6, 200 - 90 * t + d * 0.5 * Math.sin(a), r, r * 0.85, `rgba(70,62,66,${(0.75 * (1 - t)).toFixed(3)})`, 0);
  }
};
/** Normandy on a parchment, 400 x 300: red (English) giving way to blue (French) from the east as k goes 0..1 */
export const fxMap = (p: Pen, k: number) => {
  p.poly([[10, 14], [390, 8], [394, 290], [6, 294]], "#efe0bc", 8);
  const land: P2[] = [[40, 150], [70, 92], [120, 60], [150, 96], [196, 84], [240, 60], [300, 72], [350, 120], [360, 196], [300, 252], [200, 262], [120, 246], [60, 220]];
  p.clip(land, () => {
    p.g.fillStyle = "#c8323a"; p.g.fillRect(0, 0, 400, 300);
    const x = 400 - 400 * k;
    p.g.fillStyle = "#2c56b8"; p.g.beginPath(); p.g.moveTo(x, 0);
    for (let y = 0; y <= 300; y += 20) p.g.lineTo(x - 18 * Math.sin(y * 0.05 + k * 9), y);
    p.g.lineTo(400, 300); p.g.lineTo(400, 0); p.g.fill();
  });
  p.poly(land, null, 6);
  p.line([[150, 300], [180, 220], [230, 160], [300, 110]], "#4a8ad8", 6, false); // the Seine
  // the castle mark: a little tower
  p.poly([[214, 150], [236, 150], [236, 186], [214, 186]], "#f4efe2", 4);
  for (const x of [214, 222, 230]) p.poly([[x, 142], [x + 6, 142], [x + 6, 150], [x, 150]], "#f4efe2", 3);
  p.g.strokeStyle = INK;
};
/** spark burst (reuse of the skill's burst idea): t 0..1, 500 x 500 */
export const fxSpark = (p: Pen, t: number, col = "#fff3b0") => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45 + 10), r0 = 30 + 60 * e, ra = r0 + 150 * e * (0.7 + 0.3 * (i % 2));
    p.poly([[c + r0 * Math.cos(a + 0.28), c + r0 * Math.sin(a + 0.28)], [c + ra * Math.cos(a), c + ra * Math.sin(a)], [c + r0 * Math.cos(a - 0.28), c + r0 * Math.sin(a - 0.28)]], col, 6);
  }
};
