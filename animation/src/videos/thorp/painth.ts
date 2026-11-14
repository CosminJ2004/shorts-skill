// Painted textures and effect drawings for "The Shoe Computer" (ours). No lettering anywhere: the captions are the only
// text (skill rule), so numbers are shown as bars, dots and shapes. Effect drawings take a Pen on a canvas of the size
// given in each comment.
import { ctex } from "../bridge/paint";
import type { Pen } from "../bridge/toon";

const TWO = Math.PI * 2;
type P2 = [number, number];

/** casino carpet: deep red with gold diamonds */
export const carpetTex = () => ctex("casinoCarpet", 512, 512, (g, r) => {
  g.fillStyle = "#6a1424"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(232,184,74,0.6)"; g.lineWidth = 5;
  for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) {
    const cx = x + 64, cy = y + 64;
    g.beginPath(); g.moveTo(cx, cy - 50); g.lineTo(cx + 50, cy); g.lineTo(cx, cy + 50); g.lineTo(cx - 50, cy); g.closePath(); g.stroke();
    g.beginPath(); g.arc(cx, cy, 12, 0, TWO); g.stroke();
  }
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.07})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 8, 3 + r() * 8); }
});

/** casino wall: dark teal panels with gold beads */
export const casinoWallTex = () => ctex("casinoWall", 512, 512, (g, r) => {
  g.fillStyle = "#1e3a44"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c89a3a"; g.lineWidth = 6;
  for (let x = 12; x < 512; x += 128) g.strokeRect(x, 36, 104, 440);
  for (let y = 48; y < 470; y += 36) for (let x = 14; x < 512; x += 128) { g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(x + 52, y, 4, 0, TWO); g.fill(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.1})`; g.fillRect(r() * 512, r() * 512, 3, 7); }
});

/** green baize felt */
export const feltTex = () => ctex("feltGreen", 256, 256, (g, r) => {
  g.fillStyle = "#1f7a4a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.1})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
});

/** the basement lab wall: pale green painted breeze block */
export const labWallTex = () => ctex("labWall", 512, 512, (g, r) => {
  g.fillStyle = "#a9bfae"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(60,80,66,0.5)"; g.lineWidth = 4;
  for (let y = 0; y < 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); for (let x = (y / 64) % 2 ? 0 : 64; x < 512; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(40,60,50,${0.03 + r() * 0.06})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 9, 3 + r() * 9); }
});

/** a chalkboard slate with faint smudges (the drawings are fx) */
export const slateTex = () => ctex("slateBoard", 512, 320, (g, r) => {
  g.fillStyle = "#1e3a30"; g.fillRect(0, 0, 512, 320);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; g.fillRect(r() * 512, r() * 320, 30 + r() * 80, 4 + r() * 10); }
});

/** museum gallery wall: warm off-white with a dado rail */
export const museumTex = () => ctex("museumWall", 256, 512, (g, r) => {
  g.fillStyle = "#e8e0cc"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#5a6a7a"; g.fillRect(0, 330, 256, 182); g.fillStyle = "#c8c0a8"; g.fillRect(0, 322, 256, 10);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(100,90,70,${r() * 0.05})`; g.fillRect(r() * 256, r() * 512, 6, 6); }
});

/** Las Vegas at night: a purple sky, a skyline of casinos with neon, no lettering */
export const vegasTex = () => ctex("vegasNight", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#14083a"); gr.addColorStop(0.7, "#4a1a6a"); gr.addColorStop(1, "#c8326a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,235,${0.3 + r() * 0.7})`; g.fillRect(r() * 1024, r() * 280, 2, 2); }
  const neon = ["#ff3a8a", "#3affc8", "#ffe03a", "#4a8aff", "#ff7a3a"];
  for (let x = 0; x < 1024;) {
    const w = 50 + r() * 90, h = 120 + r() * 220;
    g.fillStyle = "#12082a"; g.fillRect(x, 512 - h, w, h);
    const c = neon[Math.floor(r() * neon.length)];
    g.strokeStyle = c; g.lineWidth = 6; g.strokeRect(x + 6, 512 - h + 8, w - 12, 36);
    for (let y = 512 - h + 60; y < 505; y += 18) for (let xx = x + 8; xx < x + w - 10; xx += 14) if (r() < 0.5) { g.fillStyle = r() < 0.8 ? "#ffd27a" : c; g.fillRect(xx, y, 6, 8); }
    x += w + 4;
  }
});

// ---------------- effect drawings ----------------
/** a shoe with a hidden computer, 360 x 240: the heel flap opens k = 0..1 to show a circuit board, an LED blinks (led 0/1),
 *  a big toe pokes up and presses the switch (press 0..1) */
export const fxShoe = (p: Pen, k: number, led: number, press = 0) => {
  p.poly([[20, 150], [60, 90], [170, 90], [250, 130], [330, 150], [346, 190], [330, 214], [20, 214]], "#6a3a1e", 9);
  p.poly([[20, 196], [346, 196], [346, 222], [20, 222]], "#2a1a12", 8);
  p.poly([[60, 90], [170, 90], [190, 150], [40, 150]], "#8a4a26", 6);
  for (let i = 0; i < 4; i++) p.stroke([[80 + i * 24, 112 + i * 4], [122 + i * 24, 108 + i * 4]], 7, "#e8dcc0");
  if (k > 0) {
    const h = 48 * k;
    p.poly([[20, 160 - h], [110, 160 - h], [110, 196], [20, 196]], "#1e5a3a", 7);
    for (let i = 0; i < 5; i++) p.poly([[28 + i * 16, 168 - h], [38 + i * 16, 168 - h], [38 + i * 16, 184 - h * 0.4], [28 + i * 16, 184 - h * 0.4]], i % 2 ? "#e8c45a" : "#c8ccd4", 3);
    p.stroke([[110, 190 - h * 0.4], [210, 196], [290, 170]], 5, "#d8282a");
    p.ell(60, 150 - h, 9, 9, led ? "#ff3a3a" : "#5a1a1a", 4);
  }
  p.ell(300, 160 - 22 * press, 20, 16, "#f6d2b0", 6);
};

/** a roulette wheel seen from above, 500 x 500: wheel angle a (rad), the ball at ball-angle b and radius rb (0..1),
 *  highlighted slice index hl (-1 none) of 16 */
export const fxWheel = (p: Pen, a: number, b: number, rb: number, hl = -1) => {
  p.ell(250, 250, 240, 240, "#5a3418", 12); p.ell(250, 250, 214, 214, "#2a1a12", 6);
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a0 = a + (i / N) * TWO, a1 = a + ((i + 1) / N) * TWO, col = i === hl ? "#ffe03a" : i % 2 ? "#1a1a1e" : "#c8323a";
    const pts: P2[] = [[250 + 120 * Math.cos(a0), 250 + 120 * Math.sin(a0)]];
    for (let j = 0; j <= 4; j++) { const t = a0 + ((a1 - a0) * j) / 4; pts.push([250 + 208 * Math.cos(t), 250 + 208 * Math.sin(t)]); }
    pts.push([250 + 120 * Math.cos(a1), 250 + 120 * Math.sin(a1)]);
    p.poly(pts, col, 3);
  }
  p.ell(250, 250, 118, 118, "#6a4a2a", 8); p.ell(250, 250, 70, 70, "#d8a84a", 7); p.ell(250, 250, 18, 18, "#e8eef4", 5);
  p.stroke([[250, 250], [250 + 70 * Math.cos(a), 250 + 70 * Math.sin(a)]], 8, "#e8eef4");
  const r = 214 - 90 * (1 - rb) - 14, bx = 250 + r * Math.cos(b), by = 250 + r * Math.sin(b);
  p.ell(bx, by, 13, 13, "#fbfbf6", 5);
};

/** a pile of casino chips, 200 x 260, n chips (0..12), sway s (px) for the top */
export const fxChips = (p: Pen, n: number, s = 0, col = "#d8282a") => {
  for (let i = 0; i < n; i++) {
    const y = 236 - i * 17, dx = i > n - 3 ? (s * (i - (n - 3) + 1)) / 3 : 0, c = i % 3 === 2 ? "#fbfbf6" : col;
    p.ell(100 + dx, y, 70, 20, c, 6); p.stroke([[40 + dx, y], [160 + dx, y]], 3, "#fbfbf6");
  }
};

/** a bar comparison, 520 x 420: the big bar (the edge) height h0 and a tiny red bar (the house edge) h1, both 0..1 */
export const fxBars = (p: Pen, h0: number, h1: number) => {
  p.stroke([[20, 400], [500, 400]], 10, "#3a2a20");
  const hh = Math.max(4, 340 * h0);
  p.poly([[60, 394], [220, 394], [220, 394 - hh], [60, 394 - hh]], "#3aa86a", 9);
  for (let i = 1; i < 5; i++) p.stroke([[60, 394 - (hh * i) / 5], [220, 394 - (hh * i) / 5]], 3, "#1e6a3a");
  const hs = Math.max(4, 340 * h1);
  p.poly([[300, 394], [460, 394], [460, 394 - hs], [300, 394 - hs]], "#d8282a", 9);
};

/** a market screen, 480 x 360: a jagged chart line and probability bars (no digits), phase t 0..1 shifts the line */
export const fxScreen = (p: Pen, t: number, bars = true) => {
  p.poly([[10, 10], [470, 10], [470, 350], [10, 350]], "#14182a", 12);
  p.poly([[26, 26], [454, 26], [454, 334], [26, 334]], "#0e2a3a", 0);
  const pts: P2[] = []; for (let i = 0; i <= 20; i++) pts.push([40 + i * 19, 250 - 70 * Math.sin(i * 0.5 + t * 6) - 6 * i + 18 * Math.sin(i * 1.7 + t * 11)]);
  p.stroke(pts, 8, "#3affc8");
  if (bars) for (let i = 0; i < 4; i++) { const h = 30 + 60 * (0.5 + 0.5 * Math.sin(t * 6 + i * 1.7)); p.poly([[60 + i * 90, 326], [100 + i * 90, 326], [100 + i * 90, 326 - h], [60 + i * 90, 326 - h]], i % 2 ? "#ffe03a" : "#ff3a8a", 0); }
};

/** a smartwatch with a happy face, 300 x 360: heart eyes when love = 1 */
export const fxSmartwatch = (p: Pen, love: number) => {
  p.poly([[100, 10], [200, 10], [210, 90], [90, 90]], "#3a3a44", 8); p.poly([[100, 350], [200, 350], [210, 270], [90, 270]], "#3a3a44", 8);
  p.poly([[40, 80], [260, 80], [260, 280], [40, 280]], "#c8ccd4", 10); p.poly([[58, 98], [242, 98], [242, 262], [58, 262]], "#12121a", 0);
  if (love > 0) { for (const x of [110, 190]) p.poly([[x, 140], [x + 22, 124], [x + 34, 144], [x, 176], [x - 34, 144], [x - 22, 124]], "#ff3a5a", 4); }
  else { p.ell(110, 150, 12, 14, "#e8f4ff", 0); p.ell(190, 150, 12, 14, "#e8f4ff", 0); }
  p.arc(150, 190, 40, 28, 20, 160, 9, "#e8f4ff");
};

/** a phone with signal waves, 200 x 300 */
export const fxPhoneWaves = (p: Pen, ph: number) => {
  p.poly([[50, 90], [150, 90], [150, 290], [50, 290]], "#1e1e24", 8); p.poly([[60, 110], [140, 110], [140, 262], [60, 262]], "#9ad0ff", 0);
  for (let i = 0; i < 3; i++) { const u = (ph + i / 3) % 1; p.arc(100, 80, 20 + 70 * u, 20 + 70 * u, 215, 325, 8 * (1 - u) + 2, `rgba(255,224,58,${1 - u})`); }
};

/** a falling apple on a dashed path, 300 x 300, fall progress u */
export const fxApple = (p: Pen, u: number) => {
  const y = 40 + 200 * u * u;
  for (let i = 0; i < 6; i++) p.stroke([[150, 60 + i * 38], [150, 76 + i * 38]], 5, "#e8e0cc");
  p.ell(150, y, 34, 32, "#d8282a", 8); p.poly([[148, y - 30], [160, y - 52], [168, y - 48], [156, y - 28]], "#3a7a3a", 5);
};

/** a stubby cartoon jet, 360 x 160 */
export const fxJet = (p: Pen) => {
  p.poly([[20, 80], [80, 54], [280, 54], [340, 80], [280, 106], [80, 106]], "#f4f2ee", 9);
  p.poly([[150, 56], [200, 56], [160, 4], [130, 4]], "#c8ccd4", 7); p.poly([[150, 104], [200, 104], [160, 156], [130, 156]], "#c8ccd4", 7);
  for (let i = 0; i < 6; i++) p.ell(100 + i * 28, 70, 7, 8, "#9ad0ff", 4);
};

/** a calendar page, 220 x 240 (dots only), colour by k */
export const fxCalendar = (p: Pen, k: number) => {
  p.poly([[20, 30], [200, 30], [200, 220], [20, 220]], "#fbf7ec", 8); p.poly([[20, 30], [200, 30], [200, 70], [20, 70]], k % 2 ? "#d8282a" : "#2c56b8", 8);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) p.ell(46 + x * 32, 108 + y * 32, 5, 5, "#3a2a20", 0);
};

/** a gold rosette with ribbons (the Guinness record), 240 x 280 */
export const fxRosette = (p: Pen) => {
  for (const x of [80, 160]) p.poly([[x - 20, 150], [x + 20, 150], [x + 30, 270], [x, 244], [x - 30, 270]], x < 120 ? "#2c56b8" : "#d8282a", 7);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TWO; p.poly([[120 + 70 * Math.cos(a - 0.12), 110 + 70 * Math.sin(a - 0.12)], [120 + 104 * Math.cos(a), 110 + 104 * Math.sin(a)], [120 + 70 * Math.cos(a + 0.12), 110 + 70 * Math.sin(a + 0.12)]], "#e8c45a", 5); }
  p.ell(120, 110, 66, 66, "#d8a84a", 8); p.ell(120, 110, 42, 42, "#f4d68a", 5);
};

/** a chalk drawing (wheel, arrow, clock) on the slate, 480 x 300, no lettering, draw progress u 0..1 */
export const fxChalk = (p: Pen, u: number) => {
  const g = p.g; g.save(); g.lineCap = "round";
  const c = "rgba(244,244,236,0.92)";
  const arc = (cx: number, cy: number, r: number, f: number) => { if (f <= 0) return; g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r, 0, TWO * Math.min(1, f)); g.stroke(); };
  arc(130, 150, 90, u * 2); arc(130, 150, 50, u * 2 - 0.5);
  for (let i = 0; i < 8; i++) if (u > 0.3 + i * 0.05) { g.beginPath(); g.moveTo(130 + 50 * Math.cos(i * 0.785), 150 + 50 * Math.sin(i * 0.785)); g.lineTo(130 + 90 * Math.cos(i * 0.785), 150 + 90 * Math.sin(i * 0.785)); g.stroke(); }
  if (u > 0.7) { g.beginPath(); g.moveTo(250, 150); g.lineTo(410, 150); g.lineTo(386, 130); g.moveTo(410, 150); g.lineTo(386, 170); g.stroke(); }
  if (u > 0.8) { arc(330, 60, 36, 1); g.beginPath(); g.moveTo(330, 60); g.lineTo(330, 36); g.moveTo(330, 60); g.lineTo(350, 70); g.stroke(); }
  g.restore();
};

/** the "computer" box on the bench with blinking lights, 300 x 160 */
export const fxBox = (p: Pen, led: number) => {
  p.poly([[30, 40], [270, 40], [270, 130], [30, 130]], "#4a5a6a", 9);
  for (let i = 0; i < 6; i++) p.poly([[48 + i * 38, 56], [68 + i * 38, 56], [68 + i * 38, 90], [48 + i * 38, 90]], i % 2 ? "#e8c45a" : "#c8ccd4", 4);
  p.ell(60, 112, 8, 8, led ? "#ff3a3a" : "#5a1a1a", 3); p.ell(90, 112, 8, 8, led ? "#5a1a1a" : "#3aff7a", 3);
  p.stroke([[30, 80], [10, 90], [4, 140]], 6, "#d8282a"); p.stroke([[270, 80], [296, 90], [298, 148]], 6, "#2c56b8");
};

/** sweat drop, 80 x 110 */
export const fxSweat = (p: Pen) => { p.poly([[40, 6], [66, 62], [60, 92], [40, 104], [20, 92], [14, 62]], "#9ad8ff", 6); p.ell(30, 70, 7, 12, "#e8f8ff", 0); };

/** a green banknote (no lettering), 160 x 90 */
export const fxNote = (p: Pen) => { p.poly([[6, 8], [154, 4], [156, 82], [4, 86]], "#7acc8a", 5); p.ell(80, 45, 22, 22, "#4a9a5a", 3); };

/** neon chevrons, 240 x 160, phase ph 0..1 */
export const fxNeon = (p: Pen, ph: number) => {
  for (let i = 0; i < 3; i++) p.poly([[20 + i * 70, 20], [70 + i * 70, 80], [20 + i * 70, 140], [40 + i * 70, 80]], (Math.floor(ph * 3) + i) % 3 === 0 ? "#ffe03a" : "#7a5a1a", 6);
};
