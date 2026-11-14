// The cast of "The Shoe Computer" (1961 Las Vegas and MIT, plus a 2026 trading desk). Built on ../bridge/toon.ts.
import type { Outfit } from "../bridge/toon";
import { folk } from "../houdini/people";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#c99067", "#a8714c"];

/** Ed Thorp: a young maths professor, grey suit, red tie, round glasses, brown hair */
export const THORP: Outfit = {
  jacket: "#56606e", pants: "#3a3a44", boots: "#2a2226", hat: "hair", hair: "#7a5430", tie: "#b8323a", glasses: "#2a2226",
  skin: SK[1], nose: true, buttons: "#d8d6cc", build: "adult",
};
/** Claude Shannon: a tweed jacket, red bow tie, thinning dark hair, glasses */
export const SHANNON: Outfit = {
  jacket: "#6a5a40", pants: "#4a4238", boots: "#2a2226", hat: "hair", hair: "#3a2a20", bow: "#c8323a", glasses: "#2a2226",
  skin: SK[0], nose: true, build: "stout", buttons: "#4a3426", pockets: true,
};
/** the croupier: a white shirt, a black waistcoat, a bow tie, a thin moustache */
export const CROUPIER: Outfit = {
  jacket: "#25222c", pants: "#25222c", boots: "#1a1a1e", hat: "hair", hair: "#1e1616", bow: "#e8463c", moustache: "#2a1a14", coat: undefined,
  skin: SK[2], nose: true, buttons: "#d8d6cc", sleeves: "#fbfbf8",
};
/** the casino security guard: peaked cap, dark uniform, dark glasses */
export const GUARD: Outfit = {
  jacket: "#25252c", pants: "#25252c", boots: "#1a1a1e", hat: "peaked", cap: "#25252c", buttons: "#e8c45a", belt: "#1e1e24",
  hair: "#3a2a20", glasses: "#111114", skin: SK[2], nose: true, build: "stout", moustache: "#3a2a20",
};
/** a Vegas high roller: a loud plum jacket, a slouch hat, a gold tie, a fat moustache */
export const ROLLER: Outfit = {
  jacket: "#8a2a6a", pants: "#3a3a44", boots: "#2a2226", hat: "slouch", cap: "#e8dcc0", badge: false, hair: "#5a3a26", tie: "#e8b84a",
  moustache: "#3a2a20", skin: SK[2], nose: true, build: "stout",
};
/** a tourist at the MIT museum: a green sweater and a scarf */
export const KID: Outfit = { jacket: "#3aa86a", pants: "#3a5a8a", boots: "#2a2226", hat: "cap", cap: "#e2453c", hair: "#5a3a26", skin: SK[1], nose: true };
/** a 2026 quant: a grey hoodie, big glasses */
export const QUANT: Outfit = { jacket: "#6a6a78", pants: "#2a2a30", boots: "#e8e8ee", hat: "hair", hair: "#2a1a14", glasses: "#2a2226", skin: SK[2], nose: true };
export const QUANT2: Outfit = { jacket: "#2ab0b8", pants: "#2a2a30", boots: "#2a2226", hat: "hair", hair: "#d9b46a", skin: SK[0], dress: "#2ab0b8", nose: true };
export { folk };
