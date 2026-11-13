// Painted textures for "Doomsday Is Today" (ours). No lettering anywhere (the skill's rule: captions are the only text):
// the chalkboard carries axes, dots and the curve; the calendar carries a grid and a red circle; the journal a seal.
import { ctex } from "../bridge/paint";

/** 1960 office wallpaper: mint stripes with a small diamond print */
export const wallpaperTex = () => ctex("wallpaper60", 512, 512, (g, r) => {
  g.fillStyle = "#cfe3cf"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#b9d4bd"; g.fillRect(x, 0, 26, 512); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 30, 0, 3, 512); }
  g.fillStyle = "#8ab09a";
  for (let y = 16; y < 512; y += 48) for (let x = 45; x < 512; x += 64) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 5, y); g.lineTo(x, y + 6); g.lineTo(x - 5, y); g.fill(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,110,90,${0.03 + r() * 0.05})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 8, 2 + r() * 8); }
});

/** chalkboard: dark green slate, smudges, axes with ticks, data dots and the hyperbola shooting up; k = 0..1 drawn */
export const boardTex = (k: number) => ctex("board" + k.toFixed(2), 1024, 512, (g, r) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(230,240,230,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 30 + r() * 120, 10 + r() * 40, r() * 3, 0, 6.3); g.fill(); }
  g.strokeStyle = "rgba(245,245,235,0.92)"; g.lineCap = "round"; g.lineWidth = 7;
  g.beginPath(); g.moveTo(110, 440); g.lineTo(940, 440); g.moveTo(110, 440); g.lineTo(110, 50); g.stroke();
  for (let x = 170; x < 940; x += 70) { g.beginPath(); g.moveTo(x, 440); g.lineTo(x, 456); g.stroke(); }
  for (let y = 380; y > 60; y -= 60) { g.beginPath(); g.moveTo(94, y); g.lineTo(110, y); g.stroke(); }
  // the vertical "doomsday" line, dashed red chalk
  g.strokeStyle = "rgba(240,110,100,0.95)"; g.lineWidth = 6; g.setLineDash([22, 16]);
  g.beginPath(); g.moveTo(860, 450); g.lineTo(860, 40); g.stroke(); g.setLineDash([]);
  // data dots and the curve
  const X = (u: number) => 120 + u * 730, Y = (u: number) => 430 - Math.min(400, 9 / Math.max(0.012, 1.0 - u) - 9);
  g.fillStyle = "#fff8e8";
  for (let i = 0; i < 24; i++) { const u = (i / 24) ** 0.6 * 0.96; g.beginPath(); g.arc(X(u), Y(u) + (r() - 0.5) * 6, 7, 0, 6.3); g.fill(); }
  g.strokeStyle = "#ffe98a"; g.lineWidth = 9; g.beginPath();
  for (let i = 0; i <= 200 * k; i++) { const u = (i / 200) * 0.985; if (i) g.lineTo(X(u), Y(u)); else g.moveTo(X(u), Y(u)); }
  g.stroke();
  // a big chalk circle round the asymptote's top
  if (k > 0.95) { g.strokeStyle = "rgba(240,110,100,0.95)"; g.lineWidth = 6; g.beginPath(); g.ellipse(862, 70, 60, 34, 0, 0, 6.3); g.stroke(); }
});

/** night window: deep blue sky, stars, a city skyline with lit windows */
export const nightTex = () => ctex("nightCity", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0e1a40"); gr.addColorStop(1, "#3a3a6a");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,230,${0.4 + r() * 0.6})`; g.fillRect(r() * 512, r() * 260, 2, 2); }
  g.fillStyle = "#f6f0d0"; g.beginPath(); g.arc(400, 90, 34, 0, 6.3); g.fill();
  for (let x = 0; x < 512;) {
    const w = 30 + r() * 60, h = 120 + r() * 240;
    g.fillStyle = "#151a30"; g.fillRect(x, 512 - h, w, h);
    for (let y = 512 - h + 10; y < 500; y += 18) for (let xx = x + 6; xx < x + w - 8; xx += 14) if (r() < 0.45) { g.fillStyle = r() < 0.8 ? "#ffd27a" : "#9ad0ff"; g.fillRect(xx, y, 7, 9); }
    x += w + 4;
  }
});

/** wall calendar page: a red header band with rings, a grid of day squares, one of them circled in red with a skull */
export const calTex = (seed: number, doom: boolean) => ctex("cal" + seed + (doom ? "d" : ""), 512, 640, (g, r) => {
  g.fillStyle = "#fbf7ec"; g.fillRect(0, 0, 512, 640);
  g.fillStyle = ["#c8323a", "#2c56b8", "#3a8a5a", "#e08a2a"][seed % 4]; g.fillRect(0, 0, 512, 150);
  g.fillStyle = "rgba(255,255,255,0.85)"; for (let k = 0; k < 3; k++) g.fillRect(70 + k * 140, 55, 90, 40); // abstract "title" blocks, no letters
  g.strokeStyle = "#2a2226"; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) {
    const x = 20 + j * 68, y = 175 + i * 74;
    g.strokeRect(x, y, 64, 70);
    if (r() < 0.8) { g.fillStyle = "#c9c2b0"; g.fillRect(x + 8, y + 8, 14, 12); }
  }
  if (doom) {
    const x = 20 + 5 * 68 + 32, y = 175 + 1 * 74 + 35; // a Friday
    g.fillStyle = "rgba(200,40,40,0.25)"; g.fillRect(x - 32, y - 35, 64, 70);
    g.strokeStyle = "#d8282a"; g.lineWidth = 9; g.beginPath(); g.ellipse(x, y, 52, 46, -0.2, 0, 6.3); g.stroke();
    g.fillStyle = "#2a2226"; g.beginPath(); g.arc(x, y - 6, 17, 0, 6.3); g.fill(); g.fillRect(x - 10, y + 6, 20, 12);
    g.fillStyle = "#fbf7ec"; g.beginPath(); g.arc(x - 6, y - 7, 5, 0, 6.3); g.arc(x + 6, y - 7, 5, 0, 6.3); g.fill();
  }
  for (let k = 0; k < 2; k++) { g.fillStyle = "#8a8a8a"; g.beginPath(); g.arc(150 + k * 212, 20, 14, 0, 6.3); g.fill(); }
});

/** the journal's cover: deep red cloth, a gold border and a gold seal (an atom), no lettering */
export const journalTex = () => ctex("journalCover", 512, 680, (g, r) => {
  g.fillStyle = "#8a1e22"; g.fillRect(0, 0, 512, 680);
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * 512, r() * 680, 2, 2); }
  g.strokeStyle = "#e8c45a"; g.lineWidth = 12; g.strokeRect(30, 30, 452, 620); g.lineWidth = 4; g.strokeRect(52, 52, 408, 576);
  g.lineWidth = 7; const cx = 256, cy = 300;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy, 110, 38, (k * Math.PI) / 3, 0, 6.3); g.stroke(); }
  g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(cx, cy, 18, 0, 6.3); g.fill();
  for (let k = 0; k < 3; k++) g.fillRect(150 + k * 80, 500, 52, 14); // title rule blocks
});

/** red velvet stage curtain */
export const curtainTex = () => ctex("curtain", 512, 512, (g) => {
  for (let x = 0; x < 512; x += 64) {
    const gr = g.createLinearGradient(x, 0, x + 64, 0);
    gr.addColorStop(0, "#5a0e16"); gr.addColorStop(0.5, "#c8283a"); gr.addColorStop(1, "#5a0e16");
    g.fillStyle = gr; g.fillRect(x, 0, 64, 512);
  }
});

/** a letter envelope; 200 x 140 */
export const envTex = () => ctex("envelope", 256, 180, (g) => {
  g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 256, 180);
  g.strokeStyle = "#8a7a5a"; g.lineWidth = 5; g.strokeRect(3, 3, 250, 174);
  g.beginPath(); g.moveTo(3, 3); g.lineTo(128, 100); g.lineTo(253, 3); g.stroke();
  g.fillStyle = "#c8323a"; g.beginPath(); g.arc(128, 100, 18, 0, 6.3); g.fill();
});

/** facades for the time-lapse towers (1970s-2020s): grid of windows on concrete or glass */
export const towerTex = (k: number) => ctex("tower" + k, 256, 512, (g, r) => {
  const base = ["#d9d2c2", "#9ab4c8", "#c9a88a", "#b8c4cc"][k % 4];
  g.fillStyle = base; g.fillRect(0, 0, 256, 512);
  for (let y = 12; y < 512; y += 32) for (let x = 12; x < 256; x += 32) { g.fillStyle = r() < 0.15 ? "#ffe2a0" : k % 2 ? "#3a5a7a" : "#4a5468"; g.fillRect(x, y, 20, 22); }
  g.fillStyle = "rgba(0,0,0,0.15)"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 256, 3);
});
