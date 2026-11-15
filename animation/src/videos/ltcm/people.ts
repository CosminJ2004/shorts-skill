// The cast of "The Nickel Trap" (1998 Greenwich fund, a Fed hall, plus Ed Thorp again). Built on ../bridge/toon.ts.
// Bright, saturated outfits (user feedback 2026-11-15).
import type { Outfit } from "../bridge/toon";
import { folk } from "../houdini/people";
import { THORP } from "../thorp/people";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#c99067", "#a8714c"];

/** professor A: white beard, round glasses, a mustard tweed jacket */
export const PROF_A: Outfit = {
  jacket: "#d9a441", pants: "#4a4a5a", boots: "#2a2226", hat: "hair", hair: "#e8e4dc", beard: "#e8e4dc", glasses: "#2a2226",
  bow: "#d8383c", skin: SK[0], nose: true, build: "stout", buttons: "#4a3426", pockets: true,
};
/** professor B: balding, big glasses, a teal cardigan and a bow tie */
export const PROF_B: Outfit = {
  jacket: "#2fb6a8", pants: "#4a4a5a", boots: "#2a2226", hat: "hair", hair: "#8a6a4a", glasses: "#2a2226", bow: "#f2b33a",
  skin: SK[1], nose: true, build: "adult", buttons: "#f4f0e0",
};
/** the star bond trader: slick hair, a bright blue suit, red braces, a yellow tie */
export const TRADER: Outfit = {
  jacket: "#3b78e0", pants: "#2c4a8a", boots: "#2a2226", hat: "hair", hair: "#2a1a14", tie: "#f2c43a", braces: "#d8383c",
  skin: SK[2], nose: true, build: "adult", buttons: "#f4f0e0", sleeves: "#fbfbf8",
};
/** bankers: bright suits */
export const BANKER = (v: number): Outfit => ({
  jacket: ["#e2563c", "#3aa86a", "#9a5ac9", "#f08a2c", "#2ab0b8", "#e86e9a"][v % 6], pants: "#3a3a4a", boots: "#2a2226", hat: "hair",
  hair: ["#2a1a14", "#5a3a26", "#c9c2b8", "#a8743a", "#1a1a1a", "#7a3a2a"][(v * 5) % 6], tie: ["#f2c43a", "#fbfbf8", "#2c56b8"][v % 3],
  glasses: v % 3 === 1 ? "#2a2226" : undefined, skin: SK[(v * 3) % SK.length], nose: v % 2 === 0, build: v % 4 === 2 ? "stout" : "adult",
  moustache: v % 4 === 0 ? "#3a2a20" : undefined,
});
/** Thorp is back for the callback (same look as his own short, brighter tie) */
export const THORP_B: Outfit = { ...THORP, jacket: "#7a8ab0", tie: "#e2453c" };
export { folk };
