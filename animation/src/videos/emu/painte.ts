// Painted textures for the emu short (ours): Western Australian wheatbelt in 1932. Everything goes through the
// skill's ctex cache (HD canvases, mipmaps, anisotropy) and is drawn by hand in Canvas2D: golden wheat, pale
// stubble, red-ochre dirt, corrugated iron, weatherboards, granite, gum bark, tent canvas, wheat tufts (alpha cards).
import { ctex } from "../bridge/paint";

const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** ground detail multiplied over the terrain's vertex colours: stalk strokes, soil flecks (white = no change) */
export const fieldTex = () => ctex("wheatGround", 1024, 1024, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1024, 1024);
  g.lineCap = "round";
  for (let i = 0; i < 9000; i++) { // short upright stalk strokes, light and dark
    const x = r() * 1024, y = r() * 1024, l = 6 + r() * 16, k = r();
    g.strokeStyle = k < 0.5 ? `rgba(255,248,220,${0.25 + r() * 0.3})` : `rgba(150,110,60,${0.12 + r() * 0.22})`;
    g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - l); g.stroke();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,80,50,${0.1 + r() * 0.15})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 2 + r() * 4, 1 + r() * 2, 0, 0, 6.3); g.fill(); }
});

/** wheat tuft card (alpha): a clump of thin stalks with slim bearded ears; RGBA, transparent background */
export const tuftTex = (seed: number) => ctex("wheatTuft" + seed, 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  g.lineCap = "round";
  for (let i = 0; i < 38; i++) {
    const x0 = 30 + r() * 196, lean = (r() - 0.5) * 46, top = 26 + r() * 80, lit = 58 + r() * 16;
    g.strokeStyle = hsl(36, 50, 36, 0.8); g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(x0, 256); g.quadraticCurveTo(x0 + lean * 0.3, 170, x0 + lean, top + 22); g.stroke();
    g.strokeStyle = hsl(42 + r() * 6, 60, lit); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x0, 256); g.quadraticCurveTo(x0 + lean * 0.3, 170, x0 + lean, top + 22); g.stroke();
    const hx = x0 + lean, hy = top + 8, rot = lean * 0.008;
    g.fillStyle = hsl(36, 55, 40); g.beginPath(); g.ellipse(hx, hy, 4.6, 14, rot, 0, 6.3); g.fill();
    g.fillStyle = hsl(44 + r() * 6, 82, 64 + r() * 10); g.beginPath(); g.ellipse(hx, hy, 3.4, 12.5, rot, 0, 6.3); g.fill();
    g.strokeStyle = hsl(46, 80, 80, 0.85); g.lineWidth = 0.9;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(hx, hy - 8 + k * 4); g.lineTo(hx + (k % 2 ? 7 : -7), hy - 20 + k * 4); g.stroke(); }
  }
});

/** red-ochre dirt road / bare soil with wheel ruts */
export const dirtTex = () => ctex("redDirt", 1024, 1024, (g, r) => {
  g.fillStyle = "#c97f4e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,60,30" : "235,170,120"},${0.1 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 2 + r() * 6, 1 + r() * 3, r() * 3, 0, 6.3); g.fill(); }
  for (const x of [330, 690]) { // ruts along v
    const gr = g.createLinearGradient(x - 40, 0, x + 40, 0);
    gr.addColorStop(0, "rgba(110,50,25,0)"); gr.addColorStop(0.5, "rgba(110,50,25,0.28)"); gr.addColorStop(1, "rgba(110,50,25,0)");
    g.fillStyle = gr; g.fillRect(x - 40, 0, 80, 1024);
  }
});

/** corrugated iron: vertical ribs with highlights, rust streaks; tint by material colour */
export const ironTex = (key: string, base: string, rust = 0.3) => ctex("iron" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 16) {
    const gr = g.createLinearGradient(x, 0, x + 16, 0);
    gr.addColorStop(0, "rgba(0,0,0,0.18)"); gr.addColorStop(0.4, "rgba(255,255,255,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0.18)");
    g.fillStyle = gr; g.fillRect(x, 0, 16, 512);
  }
  for (let i = 0; i < 26 * rust; i++) {
    const x = r() * 512, h = 60 + r() * 220, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(150,70,30,0.5)"); gr.addColorStop(1, "rgba(150,70,30,0)"); g.fillStyle = gr; g.fillRect(x, r() * 200, 6 + r() * 10, h);
  }
  g.fillStyle = "rgba(40,30,30,0.5)"; for (let y = 120; y < 512; y += 128) g.fillRect(0, y, 512, 3); // sheet laps
});

/** weatherboards: horizontal lapped boards, painted cream, with shadow lines and a little wear */
export const boardsTex = (key: string, paint: string) => ctex("boards" + key, 512, 512, (g, r) => {
  g.fillStyle = paint; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    const gr = g.createLinearGradient(0, y, 0, y + 32);
    gr.addColorStop(0, "rgba(255,255,255,0.12)"); gr.addColorStop(0.85, "rgba(0,0,0,0.06)"); gr.addColorStop(1, "rgba(40,30,30,0.5)");
    g.fillStyle = gr; g.fillRect(0, y, 512, 32);
  }
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(140,110,80,${0.08 + r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 10 + r() * 50, 2 + r() * 3); }
});

/** granite: pink-grey with speckles, lichen and rounded weathering bands */
export const graniteTex = () => ctex("granite", 1024, 1024, (g, r) => {
  g.fillStyle = "#c2aea0"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 12000; i++) { const k = r(); g.fillStyle = k < 0.4 ? "rgba(70,60,60,0.35)" : k < 0.7 ? "rgba(255,240,230,0.4)" : "rgba(200,140,120,0.3)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "190,170,90" : "120,140,90"},${0.25 + r() * 0.25})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 40, 6 + r() * 26, r() * 3, 0, 6.3); g.fill(); }
  for (let y = 0; y < 1024; y += 90 + r() * 80) { g.fillStyle = "rgba(90,70,70,0.14)"; g.fillRect(0, y, 1024, 6 + r() * 10); }
});

/** smooth gum bark: white-grey with salmon and olive patches peeling in vertical strips */
export const barkTex = () => ctex("gumBark", 256, 512, (g, r) => {
  g.fillStyle = "#e4dccd"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 70; i++) {
    const x = r() * 256, y = r() * 512, w = 8 + r() * 30, h = 30 + r() * 120;
    g.fillStyle = [`rgba(220,160,130,0.45)`, `rgba(160,160,120,0.4)`, `rgba(180,180,190,0.45)`, `rgba(250,248,240,0.6)`][i % 4];
    g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, 6.3); g.fill();
  }
  g.strokeStyle = "rgba(90,80,70,0.35)"; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const x = r() * 256; g.beginPath(); g.moveTo(x, r() * 512); g.lineTo(x + (r() - 0.5) * 8, r() * 512); g.stroke(); }
});

/** army tent canvas: khaki-cream with seams and guy-line stains */
export const canvasTex = () => ctex("tentCanvas", 512, 256, (g, r) => {
  g.fillStyle = "#d8c9a0"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(120,100,60,0.35)"; g.fillRect(x, 0, 3, 256); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,100,60,${0.05 + r() * 0.1})`; g.fillRect(r() * 512, r() * 256, 4 + r() * 20, 2); }
  const gr = g.createLinearGradient(0, 180, 0, 256); gr.addColorStop(0, "rgba(140,90,50,0)"); gr.addColorStop(1, "rgba(140,90,50,0.45)");
  g.fillStyle = gr; g.fillRect(0, 180, 512, 76);
});

/** an ammunition crate side: planks, rope handle shadow, an army-green stencil band (no lettering) */
export const crateTex = () => ctex("ammoCrate", 256, 256, (g, r) => {
  g.fillStyle = "#9a7448"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) { g.fillStyle = "rgba(60,35,20,0.6)"; g.fillRect(0, y, 256, 4); for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(70,45,25,${0.1 + r() * 0.15})`; g.fillRect(r() * 256, y + 6 + r() * 54, 20 + r() * 60, 2); } }
  g.fillStyle = "#5a6a3e"; g.fillRect(0, 100, 256, 56);
  g.fillStyle = "#e8dcb8"; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(70 + k * 50, 112); g.lineTo(90 + k * 50, 128); g.lineTo(70 + k * 50, 144); g.fill(); } // chevrons
  g.strokeStyle = "#3a2a1a"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248);
});

/** dam water: muddy green-brown with a pale rim and ripples */
export const damTex = () => ctex("damWater", 512, 512, (g, r) => {
  g.fillStyle = "#6f8a6a"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(220,235,210,0.35)"; g.lineWidth = 3;
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, w = 20 + r() * 50; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 4, x + w, y); g.stroke(); }
});

/** a marble's swirl: white glass with two coloured ribbons */
export const marbleTex = (k: number) => ctex("marbleSwirl" + k, 128, 64, (g) => {
  const cols = [["#e8432e", "#ffd34a"], ["#2e7de8", "#9be0ff"], ["#2eb85a", "#e8f25a"], ["#c03ae8", "#ff9ad0"], ["#ff8a2e", "#2e5ae8"], ["#18a8a8", "#f2f2f2"]][k % 6];
  g.fillStyle = "#f4f6f8"; g.fillRect(0, 0, 128, 64);
  for (const [i, c] of cols.entries()) { g.strokeStyle = c; g.lineWidth = 12; g.beginPath(); for (let x = 0; x <= 128; x += 4) g.lineTo(x, 32 + 18 * Math.sin((x / 128) * 6.28 * 2 + i * 2.2)); g.stroke(); }
});

/** heraldic shield face: four quarters, a gold border and a white star (a stylised arms, not an official copy) */
export const shieldTex = () => ctex("shieldFace", 512, 640, (g) => {
  const q = [["#c8323a", "#f4efe2"], ["#2c56b8", "#e8b84a"]];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = q[i][j]; g.fillRect(j * 256, i * 320, 256, 320); }
  g.fillStyle = "#1e3a8a"; g.beginPath(); g.ellipse(256, 320, 70, 70, 0, 0, 6.3); g.fill();
  g.fillStyle = "#ffffff"; g.beginPath();
  for (let k = 0; k < 14; k++) { const r = k % 2 ? 22 : 56, a = (k / 14) * 6.283 - 1.57; g.lineTo(256 + r * Math.cos(a), 320 + r * Math.sin(a)); }
  g.fill();
  g.strokeStyle = "#e8b84a"; g.lineWidth = 34; g.strokeRect(0, 0, 512, 640);
});

/** sandstone plinth blocks */
export const sandstoneTex = () => ctex("sandstone", 512, 512, (g, r) => {
  g.fillStyle = "#e2c08e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "160,110,60" : "255,240,210"},${0.1 + r() * 0.2})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  g.fillStyle = "rgba(110,70,40,0.55)";
  for (let y = 0; y < 512; y += 128) { g.fillRect(0, y, 512, 5); for (let x = (y / 128) % 2 ? 0 : 128; x < 512; x += 256) g.fillRect(x, y, 5, 128); }
});
