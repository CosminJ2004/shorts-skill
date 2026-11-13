// The cast of "The Last Escape" (1912-1936, plus a séance in 2026). Uses ../bridge/toon.ts with its 1932 and 1960
// detail passes (spectacles, ties, bow ties, lab coat, peaked cap). Iteration 4 quality bar: faces, clothes and
// bodies read in close-ups.
import type { Outfit } from "../bridge/toon";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#c99067", "#a8714c"];

/** Harry Houdini: black slicked hair, strong jaw, evening suit with a white bow tie */
export const HOUDINI: Outfit = {
  jacket: "#25222c", pants: "#25222c", boots: "#1a1a1e", hat: "hair", hair: "#1e1616", bow: "#f4efe2", buttons: "#d8d6cc",
  skin: SK[1], nose: true, build: "stout",
};
/** Houdini in his bathing suit for the water cell */
export const SWIM: Outfit = { ...HOUDINI, jacket: "#2a3a6a", pants: "#2a3a6a", bow: undefined, buttons: undefined, boots: SK[1] };
/** Houdini in disguise at a séance: grey beard, spectacles, a brown overcoat */
export const DISGUISE: Outfit = { ...HOUDINI, jacket: "#6a5a4a", pants: "#4a4038", beard: "#9a9894", moustache: "#9a9894", glasses: "#2a2226", bow: undefined, tie: "#3a5a3a", hair: "#9a9894" };
/** Houdini's ghost: everything in pale blue */
export const GHOST: Outfit = {
  jacket: "#8fbce6", pants: "#7aa8d8", boots: "#6a96c4", hat: "hair", hair: "#5a82b4", bow: "#e8f4ff", buttons: "#e8f4ff",
  skin: "#d2eaff", nose: true, build: "stout",
};
/** Bess Houdini: tiny, a dark bob, a plum dress with a pale collar */
export const BESS: Outfit = {
  jacket: "#7a3a8a", pants: "#3a2a3a", boots: "#2a2226", dress: "#7a3a8a", hat: "hair", hair: "#2a1a14",
  skin: SK[0], nose: true,
};
/** Arthur Conan Doyle: big, a walrus moustache, tweed suit */
export const DOYLE: Outfit = {
  jacket: "#8a6a4a", pants: "#6a5a44", boots: "#3a2a20", hat: "hair", hair: "#7a5a3a", moustache: "#9a6a40", tie: "#3a5a3a",
  skin: SK[0], nose: true, build: "stout", buttons: "#4a3426", pockets: true,
};
/** the cop Houdini brought to séances */
export const COP: Outfit = {
  jacket: "#2a3a6a", pants: "#2a3a6a", boots: "#1a1a1e", hat: "peaked", cap: "#2a3a6a", buttons: "#e8c45a", belt: "#1e1e24",
  hair: "#5a3a26", skin: SK[2], nose: true, moustache: "#3a2a20",
};
/** the McGill student: red sweater, a flat cap */
export const STUDENT: Outfit = {
  jacket: "#c8323a", pants: "#3a3a44", boots: "#2a2226", hat: "cap", cap: "#6a6a72", hair: "#d9b46a", skin: SK[0], nose: true,
};
/** a 1920s medium: a turban and a purple robe */
export const MEDIUM20: Outfit = {
  jacket: "#5a2a7a", pants: "#3a2a4a", boots: "#2a2226", dress: "#5a2a7a", hat: null, hood: "#e8b84a", skin: SK[2], nose: true,
};
/** the 2026 medium: teal shawl, a violet turban, big glasses */
export const MEDIUM26: Outfit = {
  jacket: "#2ab0b8", pants: "#3a3a44", boots: "#2a2226", dress: "#2ab0b8", hat: null, hood: "#7a3a9a", glasses: "#e8463c", cat: true,
  skin: SK[3], nose: true,
};
/** the 2026 author who blames the sour cream: a retired surgeon, white coat */
export const AUTHOR: Outfit = {
  jacket: "#3a6a9a", pants: "#3a3a44", boots: "#2a2226", dress: "#3a6a9a", coat: "#fbfbf8", hat: "hair", hair: "#d9d4cc", glasses: "#2a2226",
  skin: SK[0], nose: true,
};
/** the stage assistant (with the axe, in case) */
export const ASSIST: Outfit = { jacket: "#3a5a8a", pants: "#3a3a44", boots: "#2a2226", hat: "cap", cap: "#3a5a8a", hair: "#3a2a20", skin: SK[1], nose: true, braces: "#c8323a" };
/** the reporter: a light suit, a hat */
export const REPORTER: Outfit = { jacket: "#b8a888", pants: "#6a5e52", boots: "#2a2226", hat: "slouch", badge: false, cap: "#6a5a4a", hair: "#3a2a20", skin: SK[1], nose: true, tie: "#c8323a" };
/** séance sitters and psychics of any decade */
export const folk = (v: number, modern = false): Outfit => {
  const J = modern ? ["#e2453c", "#3b6fd2", "#f2b33a", "#3aa86a", "#9a5ac9", "#f08a2c", "#2ab0b8", "#e86e9a"] : ["#6a4a6a", "#3a5a6a", "#7a5a3a", "#4a6a4a", "#8a3a3a", "#5a5a7a", "#9a7a4a", "#4a4a5a"];
  const H = ["#2a1a14", "#5a3a26", "#a8743a", "#d9b46a", "#1a1a1a", "#7a3a2a", "#c9c2b8"];
  const o: Outfit = { jacket: J[v % J.length], pants: "#3a3a44", boots: "#2a2226", hat: "hair", hair: H[(v * 5) % H.length], skin: SK[(v * 3) % SK.length],
    nose: v % 2 === 0, glasses: v % 4 === 1 ? "#2a2226" : undefined, tie: !modern && v % 3 === 0 ? "#2a2a33" : undefined, build: v % 5 === 2 ? "stout" : "adult" };
  if (v % 2 === 1) o.dress = J[(v + 3) % J.length];
  return o;
};
/** a fake psychic: turban and robe in a loud colour */
export const psychic = (v: number): Outfit => ({
  ...folk(v + 7), dress: ["#9a5ac9", "#e86e9a", "#2ab0b8"][v % 3], jacket: ["#9a5ac9", "#e86e9a", "#2ab0b8"][v % 3], hat: null,
  hood: ["#f2b33a", "#3aa86a", "#e2453c"][v % 3], glasses: undefined, tie: undefined,
});
