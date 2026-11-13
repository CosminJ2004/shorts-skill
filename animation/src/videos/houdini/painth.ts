// Painted textures and effect drawings for "The Last Escape" (ours). No lettering anywhere: the captions are the only
// text (skill rule). Effect drawings take a Pen on a canvas of the size given in each comment.
import { ctex } from "../bridge/paint";
import type { Pen } from "../bridge/toon";

const TWO = Math.PI * 2;
type P2 = [number, number];

/** séance-room wallpaper: deep plum with a gold damask lozenge */
export const damaskTex = () => ctex("damask", 512, 512, (g, r) => {
  g.fillStyle = "#4a2440"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(214,170,90,0.55)"; g.lineWidth = 4;
  for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) {
    const cx = x + 64 + ((y / 128) % 2) * 0, cy = y + 64;
    g.beginPath(); g.moveTo(cx, cy - 48); g.quadraticCurveTo(cx + 40, cy, cx, cy + 48); g.quadraticCurveTo(cx - 40, cy, cx, cy - 48); g.stroke();
    g.beginPath(); g.arc(cx, cy, 10, 0, TWO); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 18, cy); g.quadraticCurveTo(cx + s * 50, cy - 30, cx + s * 60, cy); g.stroke(); }
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.06})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 10, 3 + r() * 10); }
});

/** parlour / dressing-room wallpaper: warm cream with sage stripes and small roses */
export const parlourTex = () => ctex("parlour20", 512, 512, (g, r) => {
  g.fillStyle = "#efe2c4"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#c9d2a8"; g.fillRect(x, 0, 18, 512); g.fillStyle = "rgba(120,140,90,0.5)"; g.fillRect(x + 22, 0, 3, 512); }
  for (let y = 20; y < 512; y += 64) for (let x = 44; x < 512; x += 64) {
    g.fillStyle = "#c8606a"; g.beginPath(); g.arc(x, y + ((x / 64) % 2) * 32, 6, 0, TWO); g.fill();
    g.fillStyle = "#7a9a5a"; g.beginPath(); g.ellipse(x + 8, y + 6 + ((x / 64) % 2) * 32, 6, 3, 0.6, 0, TWO); g.fill();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,100,70,${0.03 + r() * 0.05})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 8, 2 + r() * 8); }
});

/** velvet table cloth with a gold fringe band at the bottom */
export const clothTex = () => ctex("seanceCloth", 512, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 0);
  for (let k = 0; k <= 8; k++) gr.addColorStop(k / 8, k % 2 ? "#5a1830" : "#7a2440");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#d8a84a"; g.fillRect(0, 206, 512, 16);
  for (let x = 0; x < 512; x += 10) { g.fillStyle = "#c89a3a"; g.fillRect(x, 222, 5, 30); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.1})`; g.fillRect(r() * 512, r() * 200, 2, 6); }
});

/** theatre back wall: dark red panels with gold mouldings */
export const theatreTex = () => ctex("theatreWall", 512, 512, (g) => {
  g.fillStyle = "#4a1420"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c89a3a"; g.lineWidth = 6;
  for (let x = 16; x < 512; x += 128) g.strokeRect(x, 40, 96, 420);
  g.fillStyle = "rgba(0,0,0,0.25)"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 10, 512);
});

/** red velvet stage curtain */
export const curtainTex = () => ctex("curtainH", 512, 512, (g) => {
  for (let x = 0; x < 512; x += 64) {
    const gr = g.createLinearGradient(x, 0, x + 64, 0);
    gr.addColorStop(0, "#5a0e16"); gr.addColorStop(0.5, "#c8283a"); gr.addColorStop(1, "#5a0e16");
    g.fillStyle = gr; g.fillRect(x, 0, 64, 512);
  }
  g.fillStyle = "#d8a84a"; g.fillRect(0, 490, 512, 22);
});

/** Los Angeles at night from a hotel roof: deep blue sky, stars, a moon, low skyline and palm silhouettes */
export const nightLATex = () => ctex("nightLA", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0b1436"); gr.addColorStop(0.75, "#2a3266"); gr.addColorStop(1, "#5a4a7a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,235,${0.35 + r() * 0.65})`; const s = r() < 0.1 ? 3 : 2; g.fillRect(r() * 1024, r() * 330, s, s); }
  for (let x = 0; x < 1024;) {
    const w = 30 + r() * 70, h = 40 + r() * 120;
    g.fillStyle = "#141a34"; g.fillRect(x, 512 - h, w, h);
    for (let y = 512 - h + 8; y < 505; y += 14) for (let xx = x + 5; xx < x + w - 6; xx += 11) if (r() < 0.4) { g.fillStyle = r() < 0.85 ? "#ffd27a" : "#ff9a6a"; g.fillRect(xx, y, 5, 7); }
    x += w + 3;
  }
  for (const px of [120, 300, 640, 880]) { // palms
    g.strokeStyle = "#0e1226"; g.lineWidth = 7; g.beginPath(); g.moveTo(px, 512); g.quadraticCurveTo(px + 14, 380, px + 6, 300); g.stroke();
    g.fillStyle = "#0e1226";
    for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI; g.beginPath(); g.ellipse(px + 6 + Math.cos(a) * 30, 300 + Math.sin(a) * 10 + 10, 34, 7, a, 0, TWO); g.fill(); }
  }
});

/** the new book's cover (2026): navy cloth, a gold magnifying glass over a coffin outline, no lettering */
export const bookTex = () => ctex("bookCover26", 512, 680, (g, r) => {
  g.fillStyle = "#1e2a4a"; g.fillRect(0, 0, 512, 680);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * 512, r() * 680, 2, 2); }
  g.strokeStyle = "#e8c45a"; g.lineWidth = 10; g.strokeRect(28, 28, 456, 624);
  g.lineWidth = 8; g.beginPath(); g.moveTo(206, 180); g.lineTo(306, 180); g.lineTo(336, 260); g.lineTo(296, 470); g.lineTo(216, 470); g.lineTo(176, 260); g.closePath(); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.arc(300, 330, 90, 0, TWO); g.stroke();
  g.beginPath(); g.moveTo(364, 394); g.lineTo(440, 470); g.stroke();
  for (let k = 0; k < 3; k++) g.fillRect(140 + k * 84, 560, 60, 14);
});

/** the sour-cream tub's label: a white band with a blue cow-free swirl */
export const tubTex = () => ctex("tubLabel", 512, 128, (g) => {
  g.fillStyle = "#fbfbf6"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#2c56b8"; g.fillRect(0, 0, 512, 22); g.fillRect(0, 106, 512, 22);
  g.strokeStyle = "#2c56b8"; g.lineWidth = 10; g.beginPath();
  for (let x = 0; x <= 512; x += 8) g.lineTo(x, 64 + 18 * Math.sin(x * 0.05));
  g.stroke();
});

// ---------------- effect drawings ----------------
/** a framed portrait backdrop (the face is drawn on top by bodyFront in world.ts); 600 x 600 */
export const frameRim = (p: Pen) => {
  const g = p.g;
  g.save(); g.lineWidth = 46; g.strokeStyle = "#a8782a"; g.strokeRect(23, 23, 554, 554);
  g.lineWidth = 8; g.strokeStyle = "#e8c45a"; g.strokeRect(10, 10, 580, 580); g.strokeRect(46, 46, 508, 508);
  g.strokeStyle = "#241726"; g.lineWidth = 7; g.strokeRect(4, 4, 592, 592); g.restore();
};
/** handcuffs, 300 x 160, open k = 0..1 */
export const fxCuffs = (p: Pen, k: number) => {
  const ring = (cx: number, a: number) => { p.ell(cx, 90, 52, 52, null, 16); p.g.save(); p.g.globalCompositeOperation = "source-over"; p.arc(cx, 90, 52, 52, a, a + 300 * (1 - 0.35 * k), 12, "#c8ccd4"); p.g.restore(); };
  p.stroke([[100, 90], [200, 90]], 10, "#2a2a30"); for (let i = 0; i < 4; i++) p.ell(116 + i * 22, 90, 10, 7, null, 5);
  ring(70, 30 + 60 * k); ring(230, 210 - 60 * k);
};
/** a giant stopwatch, 400 x 460; hand angle a (rad) */
export const fxWatch = (p: Pen, a: number) => {
  p.poly([[180, 10], [220, 10], [220, 50], [180, 50]], "#c8ccd4", 7);
  p.ell(200, 250, 180, 180, "#c8ccd4", 9); p.ell(200, 250, 150, 150, "#fbf8ee", 6);
  for (let i = 0; i < 12; i++) { const b = (i / 12) * TWO; p.stroke([[200 + 128 * Math.sin(b), 250 - 128 * Math.cos(b)], [200 + 142 * Math.sin(b), 250 - 142 * Math.cos(b)]], i % 3 ? 5 : 10); }
  p.stroke([[200, 250], [200 + 120 * Math.sin(a), 250 - 120 * Math.cos(a)]], 10, "#d8282a"); p.dot(200, 250, 14);
};
/** a big thermometer, 160 x 520; level k = 0..1, burst when k >= 1 */
export const fxThermo = (p: Pen, k: number) => {
  p.poly([[50, 30], [110, 30], [110, 400], [50, 400]], "#eef6fb", 7); p.ell(80, 30, 30, 22, "#eef6fb", 7, 180, 360);
  p.ell(80, 440, 62, 62, "#e2323a", 8);
  const top = 400 - 360 * Math.min(1, k);
  p.poly([[64, top], [96, top], [96, 420], [64, 420]], "#e2323a", 0);
  for (let y = 60; y < 400; y += 34) p.stroke([[110, y], [130, y]], 5);
};
/** a sweat drop, 80 x 110 */
export const fxSweat = (p: Pen) => { p.poly([[40, 6], [66, 62], [60, 92], [40, 104], [20, 92], [14, 62]], "#9ad8ff", 6); p.ell(30, 70, 7, 12, "#e8f8ff", 0); };
/** rising bubbles, 200 x 400, t 0..1 loops */
export const fxBubbles = (p: Pen, t: number) => {
  for (let i = 0; i < 9; i++) { const u = (t + i / 9) % 1, x = 100 + 60 * Math.sin(i * 2.1 + u * 6), y = 390 - 380 * u, r = 8 + 10 * (i % 3); p.ell(x, y, r, r, "rgba(230,248,255,0.55)", 4); }
};
/** a fire axe, 140 x 420 */
export const fxAxe = (p: Pen) => {
  p.poly([[60, 60], [80, 60], [82, 410], [58, 410]], "#a8743a", 6);
  p.poly([[40, 30], [70, 50], [70, 120], [40, 140], [8, 120], [4, 60]], "#d8282a", 7);
  p.poly([[4, 60], [8, 120], [22, 112], [20, 68]], "#e8eef4", 0);
};
/** a jack-o'-lantern face, 300 x 260 (drawn over a 3D pumpkin or alone), glow k */
export const fxPumpkin = (p: Pen, k: number) => {
  for (const [x, w] of [[150, 120], [95, 70], [205, 70]] as const) p.ell(x, 140, w, 110, "#f08a2c", 8);
  p.poly([[140, 30], [160, 30], [166, 4], [146, 8]], "#3a7a3a", 6);
  const glow = `rgb(255,${Math.round(200 + 50 * k)},${Math.round(60 + 80 * k)})`;
  p.poly([[90, 110], [124, 110], [107, 78]], glow, 6); p.poly([[176, 110], [210, 110], [193, 78]], glow, 6);
  p.poly([[80, 160], [220, 160], [204, 200], [176, 186], [150, 206], [124, 186], [96, 200]], glow, 6);
};
/** a padlock, 200 x 240, shut k = 0..1 (shackle drops in) */
export const fxLock = (p: Pen, k: number) => {
  const dy = 40 * (1 - k);
  p.arc(100, 100 - dy, 52, 62, 180, 360, 18, "#c8ccd4"); p.stroke([[48, 100 - dy], [48, 130 - dy]], 18, "#c8ccd4"); p.stroke([[152, 100 - dy], [152, 120]], 18, "#c8ccd4");
  p.poly([[30, 110], [170, 110], [170, 230], [30, 230]], "#e8b84a", 8);
  p.ell(100, 160, 14, 14, "#241726", 0); p.poly([[94, 166], [106, 166], [110, 200], [90, 200]], "#241726", 0);
};
/** a ghost sheet on a stick (the fake medium's prop), 240 x 340, wobble k */
export const fxSheet = (p: Pen, k: number) => {
  const pts: P2[] = [[120, 20]];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); pts.push([120 + 100 * Math.cos(Math.PI - a), 120 - 100 * Math.sin(a) * 0.9]); }
  pts.splice(0, 1);
  const hem: P2[] = []; for (let i = 0; i <= 8; i++) hem.push([220 - i * 25, 300 + (i % 2 ? -18 : 12) + 8 * Math.sin(k * TWO + i)]);
  p.poly([...pts, [220, 300], ...hem, [20, 300]], "#f4f2ee", 7);
  p.ell(88, 110, 13, 20, "#241726", 0); p.ell(152, 110, 13, 20, "#241726", 0); p.ell(120, 170, 16, 22, "#241726", 0);
  p.stroke([[120, 300], [120, 340]], 10, "#8a5a34");
};
/** a press camera with its flash pan, 260 x 220; flash k > 0 */
export const fxCamera = (p: Pen, k: number) => {
  p.poly([[40, 90], [220, 90], [220, 200], [40, 200]], "#2a2a30", 7); p.ell(130, 145, 40, 40, "#4a4e5a", 7); p.ell(130, 145, 22, 22, "#9ad0ff", 4);
  p.stroke([[60, 90], [40, 30]], 7, "#2a2a30"); p.poly([[10, 20], [80, 20], [70, 34], [20, 34]], "#c8ccd4", 5);
  if (k > 0) { for (let i = 0; i < 10; i++) { const a = (i / 10) * TWO; p.stroke([[45 + 20 * Math.cos(a), 20 + 20 * Math.sin(a)], [45 + (40 + 40 * k) * Math.cos(a), 20 + (40 + 40 * k) * Math.sin(a)]], 6, "#ffe27a"); } }
};
/** a tumbleweed, 200 x 200, spin a */
export const fxTumble = (p: Pen, a: number) => {
  for (let i = 0; i < 9; i++) { const b = a + i * 0.7; p.arc(100 + 14 * Math.cos(b), 100 + 14 * Math.sin(b), 70 - (i % 3) * 12, 60 - (i % 2) * 14, (i * 40) % 360, (i * 40) % 360 + 250, 6, "#a8743a"); }
};
/** a fairy, 120 x 110, wing phase ph */
export const fxFairy = (p: Pen, ph: number) => {
  const w = 0.5 + 0.5 * Math.sin(ph * TWO);
  p.ell(40, 40 - 8 * w, 26, 16 + 8 * w, "rgba(200,240,255,0.8)", 4, 0, 360, -30); p.ell(80, 40 - 8 * w, 26, 16 + 8 * w, "rgba(200,240,255,0.8)", 4, 0, 360, 30);
  p.poly([[60, 50], [74, 96], [46, 96]], "#ff9ad0", 5); p.ell(60, 40, 12, 12, "#f6d2b0", 5);
  p.dot(92, 30, 4, "#fff3b0"); p.dot(26, 70, 3, "#fff3b0");
};
/** a little candle stub with its flame (portrait-side candle, for close shots), 80 x 200; h = wax height 0..1 */
export const fxStub = (p: Pen, h: number) => {
  const top = 190 - 120 * h;
  p.poly([[26, top], [54, top], [54, 190], [26, 190]], "#f4efe2", 5);
};
/** the photo in a little standing frame (Houdini), 160 x 200: the face is drawn by world.ts */
export const photoRim = (p: Pen) => { const g = p.g; g.save(); g.lineWidth = 16; g.strokeStyle = "#c89a3a"; g.strokeRect(8, 8, 144, 184); g.lineWidth = 5; g.strokeStyle = "#241726"; g.strokeRect(2, 2, 156, 196); g.restore(); };
