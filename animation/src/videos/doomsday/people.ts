// The cast of "Doomsday Is Today" (1960, then 1960-2026). Uses the 1960 detail pass in ../bridge/toon.ts: spectacles,
// cat-eye glasses, neckties, bow ties, lab coats. Iteration 4 quality bar: faces, clothes and bodies read in close-ups.
import type { Outfit } from "../bridge/toon";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#c99067", "#a8714c"];

/** Heinz von Foerster (lead author): Viennese, dark slicked hair, round spectacles, bow tie, grey suit */
export const HEINZ: Outfit = {
  jacket: "#6a7280", pants: "#4a505c", boots: "#2a2226", hat: "hair", hair: "#3a2a20", glasses: "#2a2226", bow: "#c8323a",
  skin: SK[0], nose: true, pockets: false, trim: undefined,
};
/** Heinz on stage as a magician: tailcoat, top hat */
export const MAGICIAN: Outfit = { ...HEINZ, jacket: "#25222c", pants: "#25222c", hat: "tophat", bow: "#f4efe2", collar: undefined };
/** Patricia Mora: cat-eye glasses, a teal dress, a lab coat, a dark bob */
export const MORA: Outfit = {
  jacket: "#3a8a8a", pants: "#3a3a44", boots: "#2a2226", dress: "#3a8a8a", hat: "hair", hair: "#2a1a14", glasses: "#7a2a3a", cat: true,
  skin: SK[1], nose: true,
};
/** Lawrence Amiot: the young one, white shirt, narrow tie, lab coat, crew cut */
export const AMIOT: Outfit = {
  jacket: "#f2efe6", pants: "#3e4656", boots: "#2a2226", hat: "hair", hair: "#a8743a", tie: "#2c56b8", coat: "#fbfbf8",
  skin: SK[0], nose: true,
};
/** experts in suits (the "ridiculous" crowd) */
export const expert = (v: number): Outfit => ({
  jacket: ["#4a4e5a", "#5a4a3e", "#3e4a5a", "#6a5e52"][v % 4], pants: "#3a3a42", boots: "#2a2226", hat: v % 3 === 0 ? "tophat" : "hair",
  hair: ["#d9d4cc", "#3a2a20", "#7a5a3a", "#b0aaa2"][v % 4], tie: ["#c8323a", "#2c56b8", "#3a7a4a", "#8a6a2a"][v % 4],
  glasses: v % 2 ? "#2a2226" : undefined, moustache: v % 4 === 2 ? "#5a3a26" : undefined, beard: v % 4 === 3 ? "#b0aaa2" : undefined,
  skin: SK[v % 3], nose: true, build: v % 3 === 1 ? "stout" : "adult",
});
/** townsfolk of any decade 1960-2026: varied colours, skin tones, builds; dresses for some */
export const folk = (v: number): Outfit => {
  const J = ["#e2453c", "#3b6fd2", "#f2b33a", "#3aa86a", "#9a5ac9", "#f08a2c", "#2ab0b8", "#e86e9a", "#6a7280", "#c9c2a8"];
  const P = ["#3b3f52", "#4a5a7a", "#5a4a3a", "#2a2a33", "#6b5a44"];
  const H = ["#2a1a14", "#5a3a26", "#a8743a", "#d9b46a", "#1a1a1a", "#7a3a2a"];
  const o: Outfit = { jacket: J[v % J.length], pants: P[(v >> 1) % P.length], boots: "#2a2226", hat: v % 7 === 3 ? "cap" : "hair",
    cap: J[(v + 3) % J.length], hair: H[(v * 7) % H.length], skin: SK[(v * 3) % SK.length], nose: v % 2 === 0,
    build: v % 5 === 2 ? "stout" : v % 9 === 4 ? "kid" : "adult", glasses: v % 6 === 1 ? "#2a2226" : undefined,
    tie: v % 8 === 5 ? "#2a2a33" : undefined };
  if (v % 3 === 1) o.dress = J[(v + 5) % J.length];
  return o;
};
/** the family (line 12): parents and kids */
export const MUM: Outfit = { jacket: "#e86e9a", pants: "#3a3a44", boots: "#2a2226", dress: "#e86e9a", hat: "hair", hair: "#a8743a", skin: SK[1], nose: true };
export const DAD: Outfit = { jacket: "#3b6fd2", pants: "#3b3f52", boots: "#2a2226", hat: "hair", hair: "#3a2a20", tie: "#f2b33a", skin: SK[1], nose: true };
export const kid = (v: number): Outfit => ({ ...folk(v * 3 + 1), build: "kid", tie: undefined, glasses: undefined });
