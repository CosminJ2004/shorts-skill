// Painted textures and effect drawings for "The Nickel Trap" (ours). BRIGHT palette. No lettering anywhere: the captions are
// the only text (skill rule), so numbers are shown as blocks, bars and shapes. Effect drawings take a Pen on a canvas of
// the size given in each comment.
import { ctex } from "../bridge/paint";
import type { Pen } from "../bridge/toon";

const TWO = Math.PI * 2;
type P2 = [number, number];

// ---------------- textures ----------------
/** the trading room wall: sunny cream with a mint dado */
export const officeWallTex = () => ctex("ltcOfficeWall", 256, 512, (g, r) => {
  g.fillStyle = "#fdf0c4"; g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x, 0, 14, 330); }
  g.fillStyle = "#7fd8c4"; g.fillRect(0, 330, 256, 182); g.fillStyle = "#ffffff"; g.fillRect(0, 322, 256, 10);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(120,100,60,${r() * 0.04})`; g.fillRect(r() * 256, r() * 512, 6, 6); }
});
/** light parquet */
export const parquetTex = () => ctex("ltcParquet", 512, 512, (g, r) => {
  const cols = ["#f0c88a", "#e8bc7a", "#f6d49c", "#ecc080"];
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 128) {
    g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + ((y / 64) % 2) * 64 - 64, y, 126, 62);
    g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + ((y / 64) % 2) * 64, y, 126, 62);
  }
  g.strokeStyle = "rgba(150,100,50,0.35)"; g.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
/** a sunny sky through the window: blue to white with clouds */
export const skyWindowTex = () => ctex("ltcSkyWin", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#58b8ff"); gr.addColorStop(1, "#dff2ff");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.95)";
  for (let i = 0; i < 9; i++) { const x = r() * 512, y = 120 + r() * 300; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * 34, y + (k % 2) * 8, 34 + r() * 14, 0, TWO); g.fill(); } }
  g.fillStyle = "#9ad0f0"; for (let i = 0; i < 10; i++) { const x = i * 60, h = 70 + r() * 110; g.fillRect(x, 512 - h, 50, h); }
});
/** the bank hall wall: pale blue panels with white pilasters */
export const hallWallTex = () => ctex("ltcHallWall", 512, 512, (g, r) => {
  g.fillStyle = "#cfe6ff"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 256) { g.fillStyle = "#ffffff"; g.fillRect(x, 0, 28, 512); g.fillStyle = "#e8f2ff"; g.fillRect(x + 28, 0, 8, 512); g.strokeStyle = "#a8c8ec"; g.lineWidth = 5; g.strokeRect(x + 56, 60, 144, 380); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,110,150,${r() * 0.04})`; g.fillRect(r() * 512, r() * 512, 6, 6); }
});
/** checker marble floor: cream and rose */
export const marbleTex = () => ctex("ltcMarble", 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#f6e6e2" : "#fffaf0"; g.fillRect(x * 128, y * 128, 128, 128); }
  for (let i = 0; i < 120; i++) { g.strokeStyle = `rgba(190,150,150,${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + 40 * (r() - 0.5), y + 40 * (r() - 0.5)); g.stroke(); }
  g.strokeStyle = "rgba(160,120,120,0.35)"; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
});

// ---------------- effect drawings ----------------
/** a money sack, 200 x 220 (a gold coin on the belly, no lettering) */
export const fxBag = (p: Pen) => {
  p.poly([[70, 52], [130, 52], [150, 84], [188, 150], [178, 200], [100, 214], [22, 200], [12, 150], [50, 84]], "#6fcf8a", 9);
  p.poly([[64, 44], [136, 44], [128, 70], [72, 70]], "#4fb06a", 7);
  p.stroke([[66, 70], [134, 70]], 9, "#f2c43a");
  p.ell(100, 150, 38, 38, "#f6cf4a", 8); p.ell(100, 150, 22, 22, "#fbe58a", 5);
  p.stroke([[40, 118], [60, 100]], 6, "#a8ecb8");
};
const BAGS: [number, number, number][] = [[200, 318, 1], [112, 318, 1], [288, 318, 1], [156, 238, 0.95], [244, 238, 0.95], [200, 160, 0.9], [200, 84, 0.8]];
/** a pile of money sacks (and loose coins), 400 x 420: level 1 = full pile, 0 = one coin */
export const fxMoneyPile = (p: Pen, level: number) => {
  const n = level <= 0.02 ? 0 : Math.max(1, Math.round(level * BAGS.length));
  const order = [0, 1, 2, 3, 4, 5, 6];
  for (let k = 0; k < n; k++) {
    const [x, y, s] = BAGS[order[k]], w = 84 * s, h = 92 * s;
    p.poly([[x - w * 0.3, y - h * 0.5], [x + w * 0.3, y - h * 0.5], [x + w * 0.55, y - h * 0.15], [x + w * 0.82, y + h * 0.3], [x + w * 0.72, y + h * 0.5], [x, y + h * 0.56], [x - w * 0.72, y + h * 0.5], [x - w * 0.82, y + h * 0.3], [x - w * 0.55, y - h * 0.15]], "#6fcf8a", 8);
    p.stroke([[x - w * 0.34, y - h * 0.26], [x + w * 0.34, y - h * 0.26]], 8, "#f2c43a");
    p.ell(x, y + h * 0.18, w * 0.3, w * 0.3, "#f6cf4a", 6);
  }
  const coins = Math.min(5, Math.round(1 + level * 4));
  for (let k = 0; k < coins; k++) p.ell(120 + k * 44, 392 - (k % 2) * 10, 24, 12, "#f6cf4a", 5);
};
/** a Nobel-style medal on a ribbon, 200 x 260 */
export const fxMedal = (p: Pen) => {
  p.poly([[62, 6], [104, 6], [128, 140], [88, 150]], "#3b78e0", 7); p.poly([[96, 6], [138, 6], [112, 150], [72, 140]], "#e2453c", 7);
  p.ell(100, 188, 66, 66, "#f2b830", 9); p.ell(100, 188, 48, 48, "#fbe28a", 6);
  p.poly([[100, 154], [110, 180], [138, 182], [116, 198], [124, 224], [100, 208], [76, 224], [84, 198], [62, 182], [90, 180]], "#f2b830", 5);
};
/** a bond certificate, 300 x 200 (ornate border and a seal, no lettering): col is the band colour */
export const fxBond = (p: Pen, col = "#2c56b8") => {
  p.poly([[14, 16], [286, 12], [290, 186], [10, 190]], "#fffaf0", 9);
  p.poly([[28, 30], [272, 28], [274, 172], [26, 174]], null, 5);
  p.poly([[14, 16], [286, 12], [288, 54], [12, 58]], col, 8);
  for (let i = 0; i < 4; i++) p.stroke([[44, 84 + i * 16], [180 - (i % 2) * 24, 84 + i * 16]], 5, "#c8b896");
  p.ell(228, 124, 34, 34, "#f2c43a", 7); p.ell(228, 124, 18, 18, "#fbe58a", 4);
};
/** a bracket showing a gap of width w px, 400 x 100 */
export const fxGap = (p: Pen, w: number, col = "#e2453c") => {
  const a = 200 - w / 2, b = 200 + w / 2;
  p.stroke([[a, 20], [a, 80]], 9, col); p.stroke([[b, 20], [b, 80]], 9, col); p.stroke([[a, 50], [b, 50]], 7, col);
  p.poly([[a + 14, 38], [a, 50], [a + 14, 62]], col, 0); p.poly([[b - 14, 38], [b, 50], [b - 14, 62]], col, 0);
};
/** a silver nickel, 100 x 100 */
export const fxCoin = (p: Pen) => { p.ell(50, 50, 40, 40, "#cdd6df", 7); p.ell(50, 50, 28, 28, "#e8eef4", 4); p.stroke([[36, 36], [50, 28]], 4, "#fbfdff"); };
/** a tower: 1 gold block (what they owned) under n blue blocks (what they borrowed, max 25), 260 x 720, wobble in px at the top */
export const fxBlocks = (p: Pen, n: number, wob = 0, red = 0) => {
  p.poly([[40, 704], [220, 704], [220, 662], [40, 662]], "#f2c43a", 8);
  for (let i = 0; i < n; i++) {
    const t = i / 25, dx = wob * t * t, y = 662 - (i + 1) * 25;
    p.poly([[56 + dx, y + 25], [204 + dx, y + 25], [204 + dx, y], [56 + dx, y]], i < red ? "#ff6a4a" : i % 2 ? "#4aa8f0" : "#3b88e0", 6);
  }
};
/** a flag of three horizontal stripes (white, blue, red; no lettering) on a pole, 400 x 300; rip 0..1 tears it */
export const fxFlag = (p: Pen, rip = 0) => {
  p.stroke([[40, 290], [40, 10]], 12, "#8a6a4a"); p.ell(40, 10, 12, 12, "#f2c43a", 5);
  const d = rip * 38;
  const top: P2[] = [[52, 24], [380, 28 + d * 0.3], [376, 100 + d * 0.3], [52, 96]];
  p.poly(top, "#fbfbf8", 8);
  p.poly([[52, 96], [376, 100 + d * 0.3], [372, 176 + d], [52, 172]], "#2c56b8", 8);
  const jag: P2[] = [[52, 172], [372, 176 + d], [368, 252 + d * 2.2], [52, 248]];
  p.poly(jag, "#e2453c", 8);
  if (rip > 0) { const pts: P2[] = []; for (let i = 0; i <= 10; i++) pts.push([60 + i * 30, 98 + (i % 2 ? 14 : -10) + d * 0.2]); p.stroke(pts, 7, "#3a2a20"); }
};
/** a green safe with a dial, 300 x 300 */
export const fxSafe = (p: Pen) => {
  p.poly([[30, 30], [270, 30], [270, 276], [30, 276]], "#5aa88a", 11); p.poly([[52, 52], [248, 52], [248, 254], [52, 254]], "#7cc8aa", 7);
  p.ell(150, 152, 46, 46, "#d8e0e8", 8); p.ell(150, 152, 24, 24, "#8a98a8", 5); p.stroke([[150, 152], [168, 130]], 7, "#2a2226");
  p.poly([[34, 276], [66, 276], [66, 296], [34, 296]], "#3a5a4a", 5); p.poly([[234, 276], [266, 276], [266, 296], [234, 296]], "#3a5a4a", 5);
};
/** a big red falling arrow, 200 x 300 */
export const fxArrowDown = (p: Pen) => p.poly([[70, 10], [130, 10], [130, 150], [180, 150], [100, 290], [20, 150], [70, 150]], "#ff5a4a", 10);
/** a classic bank building, 600 x 420: pediment, six columns, steps, a flag-less roof */
export const fxBankFront = (p: Pen) => {
  p.poly([[20, 120], [300, 14], [580, 120]], "#fff4dc", 11); p.poly([[60, 120], [540, 120], [540, 150], [60, 150]], "#f2e2c0", 9);
  for (let i = 0; i < 6; i++) { const x = 80 + i * 86; p.poly([[x, 150], [x + 52, 150], [x + 52, 340], [x, 340]], "#fffaf0", 8); p.stroke([[x + 18, 160], [x + 18, 330]], 4, "#e6d8b8"); }
  for (let i = 0; i < 3; i++) p.poly([[30 + i * 14, 340 + i * 22], [570 - i * 14, 340 + i * 22], [570 - i * 14, 362 + i * 22], [30 + i * 14, 362 + i * 22]], i % 2 ? "#f2e2c0" : "#fffaf0", 8);
  p.ell(300, 92, 26, 26, "#f2c43a", 7);
};
/** a trampoline-style rescue net between two poles, 700 x 320: sag px (0..90) and the poles */
export const fxNet = (p: Pen, sag: number) => {
  p.stroke([[40, 300], [40, 40]], 12, "#8a6a4a"); p.stroke([[660, 300], [660, 40]], 12, "#8a6a4a");
  const top: P2[] = [], bot: P2[] = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, y = 50 + sag * Math.sin(t * Math.PI); top.push([40 + t * 620, y]); bot.push([40 + t * 620, y + 26 + sag * 0.15]); }
  for (let i = 0; i <= 14; i++) p.stroke([top[i], bot[i]], 4, "#ffffff");
  p.stroke(top, 8, "#ff5a4a"); p.stroke(bot, 6, "#ffffff");
  for (let k = 1; k < 4; k++) { const mid: P2[] = top.map((q, i) => [q[0], q[1] + ((bot[i][1] - q[1]) * k) / 4]); p.stroke(mid, 3, "#ffffff"); }
};
/** an old desk phone ringing, 200 x 200, phase ph 0..1 (wobble and rings) */
export const fxPhoneRing = (p: Pen, ph: number) => {
  const w = Math.sin(ph * TWO * 3) * 5;
  p.poly([[30, 130], [170, 130], [180, 170], [20, 170]], "#e2453c", 9);
  p.poly([[36 + w, 100], [164 + w, 100], [172 + w, 128], [28 + w, 128]], "#2a2226", 8);
  p.poly([[20 + w, 86], [58 + w, 86], [58 + w, 112], [20 + w, 112]], "#2a2226", 7); p.poly([[142 + w, 86], [180 + w, 86], [180 + w, 112], [142 + w, 112]], "#2a2226", 7);
  for (let i = 0; i < 2; i++) { const u = (ph + i / 2) % 1; p.arc(100, 80, 30 + 56 * u, 22 + 40 * u, 215, 325, 7 * (1 - u) + 2, `rgba(255,200,40,${1 - u})`); }
};
/** a gauge from green to red with a needle, 400 x 260, value v 0..1 */
export const fxDial = (p: Pen, v: number) => {
  const seg = [["#3acf6a", 180, 228], ["#c8e03a", 228, 276], ["#f2b830", 276, 324], ["#ff5a4a", 324, 360]] as const;
  for (const [c, a0, a1] of seg) p.arc(200, 220, 150, 150, a0, a1, 40, c);
  p.ell(200, 220, 150, 150, null, 0);
  const a = Math.PI * (1 + Math.max(0, Math.min(1, v)));
  p.stroke([[200, 220], [200 + 118 * Math.cos(a), 220 + 118 * Math.sin(a)]], 14, "#2a2226"); p.ell(200, 220, 20, 20, "#2a2226", 4);
};
/** a steamroller, side view facing right, 700 x 400: roller rotation rot (rad) */
export const fxSteam = (p: Pen, rot: number) => {
  p.poly([[40, 140], [140, 90], [380, 90], [420, 150], [420, 280], [40, 280]], "#f2b830", 11);
  p.poly([[110, 20], [300, 20], [310, 90], [110, 90]], "#ffe58a", 9); p.poly([[130, 36], [286, 36], [290, 82], [130, 82]], "#bfe6ff", 5);
  p.poly([[318, 0], [352, 0], [356, 92], [314, 92]], "#6a7a8a", 8);
  p.ell(480, 280, 120, 120, "#7a8a9a", 11);
  for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * TWO; p.stroke([[480, 280], [480 + 100 * Math.cos(a), 280 + 100 * Math.sin(a)]], 7, "#566472"); }
  p.ell(480, 280, 24, 24, "#ffd84a", 6);
  p.ell(110, 300, 62, 62, "#3a3a44", 10); p.ell(110, 300, 28, 28, "#c8ccd4", 5);
  p.stroke([[340, 220], [480, 280]], 14, "#d0961e");
};
/** a sheet of paper (loose), 120 x 150 */
export const fxPaper = (p: Pen) => { p.poly([[10, 14], [104, 8], [110, 136], [14, 142]], "#fffdf6", 7); for (let i = 0; i < 4; i++) p.stroke([[26, 40 + i * 24], [90 - (i % 2) * 14, 38 + i * 24]], 4, "#c8c0a8"); };
/** a green tick in a circle, 200 x 200 */
export const fxCheck = (p: Pen) => { p.ell(100, 100, 82, 82, "#3acf6a", 11); p.stroke([[52, 104], [88, 140], [150, 62]], 18, "#ffffff"); };
/** a magnifying glass, 220 x 260 */
export const fxMagnifier = (p: Pen) => { p.stroke([[150, 150], [200, 240]], 22, "#8a5a34"); p.ell(100, 100, 74, 74, "#e8f6ff", 12); p.stroke([[60, 80], [84, 54]], 7, "#ffffff"); };
/** a stack of coin-like chips (the callback to the shoe short) re-uses the shoe: a small shoe with a blinking LED, 360 x 240 */
export const fxShoeB = (p: Pen, led: number) => {
  p.poly([[20, 150], [60, 90], [170, 90], [250, 130], [330, 150], [346, 190], [330, 214], [20, 214]], "#c8602a", 9);
  p.poly([[20, 196], [346, 196], [346, 222], [20, 222]], "#2a1a12", 8);
  p.poly([[60, 90], [170, 90], [190, 150], [40, 150]], "#e07a3a", 6);
  p.ell(70, 130, 9, 9, led ? "#ff3a3a" : "#5a1a1a", 4);
};
/** a puffing smoke ball (for the steamroller), reuse the castle smoke instead; this is a sparkle star, 120 x 120 */
export const fxStar = (p: Pen) => { const pts: P2[] = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 54, a = (i / 10) * TWO - Math.PI / 2; pts.push([60 + r * Math.cos(a), 60 + r * Math.sin(a)]); } p.poly(pts, "#ffe03a", 6); };
