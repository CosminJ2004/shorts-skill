// The cast of "The War Australia Lost to Birds" (Western Australia, 1932). The outfits use the 1932 detail pass in
// ../bridge/toon.ts: slouch hats with the rising-sun badge, a peaked officer's cap, four-pocket khaki tunics, a Sam
// Browne belt, braces and neckerchiefs (iteration 4 quality bar: faces, clothes and bodies must read in close-ups).
import type { Outfit } from "../bridge/toon";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#d9a57e"];
const KHAKI = "#a48f5f", KHAKI_D = "#8c7a50", PUTTEE = "#7d6a46";

/** Major Meredith, Royal Australian Artillery: peaked cap, moustache, Sam Browne belt, khaki tunic */
export const MAJOR: Outfit = {
  jacket: KHAKI, pants: KHAKI_D, boots: "#4a2e1e", hat: "peaked", cap: "#9a8558", moustache: "#5a3a26", skin: SK[0], nose: true,
  sam: "#6a3e22", pockets: true, build: "stout",
};
/** the gunners: slouch hats with the badge, khaki tunics with pockets, puttees */
export const gunner = (v: number): Outfit => ({
  jacket: KHAKI, pants: KHAKI_D, boots: PUTTEE, hat: "slouch", cap: "#97835a", badge: true, pockets: true,
  belt: v % 2 ? "#6b5a3a" : null, moustache: v === 1 ? "#4a3020" : undefined, skin: SK[(v + 1) % 4], nose: true,
  build: v === 2 ? "stout" : "adult",
});
/** wheat farmers (WWI veterans): rolled shirt sleeves, braces, dungarees, felt hats, neckerchiefs */
export const farmer = (v: number): Outfit => ({
  jacket: ["#e9e1cf", "#c9d6e2", "#d9b48a", "#b8c8a8"][v % 4], pants: ["#4a5a7a", "#6b5a44", "#3e4a5e", "#5a4a3a"][v % 4],
  boots: "#4a3426", hat: "slouch", cap: ["#7a6a52", "#5e5246", "#8a7650", "#6a5a48"][v % 4], braces: v % 2 ? "#8a3a2a" : "#3a3a3a",
  scarf: v % 3 === 0 ? "#c8423a" : v % 3 === 1 ? "#3a6ab0" : undefined, moustache: v === 2 ? "#6a4a2a" : undefined,
  beard: v === 3 ? "#7a5a3a" : undefined, skin: SK[v % 4], nose: true, build: v === 1 ? "stout" : "adult",
});
