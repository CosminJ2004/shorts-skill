// The cast of "The Castle That Fell Through Its Toilet". The outfits use the medieval detail pass in ../bridge/toon.ts:
// crowns, helms, mail coifs, heraldic tabards, capes, beards, noses, cloth folds and girdles. This follows the
// iteration 4 quality bar: faces, clothes and bodies must read in close-ups.
import type { Outfit } from "../bridge/toon";

const SK = ["#f6d2b0", "#efc39c", "#e2b48c", "#d9a57e"];

/** Richard the Lionheart: ginger hair and beard, gold crown, red surcoat with the three gold lions, dark cape with an
 *  ermine collar, mail sleeves */
export const RICHARD: Outfit = {
  jacket: "#9aa3ad", mail: true, tabard: "#c8323a", charge: "lions", trim: "#f2c230", pants: "#6b4a3a", boots: "#3a2a22",
  hat: "crown", hair: "#c4602e", beard: "#c4602e", cape: "#2f3f8c", collar: "#f4efe2", skin: SK[0], nose: true, build: "stout",
};
/** Philip II of France: dark beard, crown, blue surcoat with gold lilies, purple cape */
export const PHILIP: Outfit = {
  jacket: "#9aa3ad", mail: true, tabard: "#2c56b8", charge: "lilies", trim: "#f2c230", pants: "#3a3550", boots: "#2a2228",
  hat: "crown", hair: "#3a2a20", beard: "#3a2a20", cape: "#6a3a8c", collar: "#f4efe2", skin: SK[1], nose: true,
};
/** John: skinny and nervous, green tunic with a gold belt, a crown that is too big for him, a wispy beard */
export const JOHN: Outfit = {
  jacket: "#4f8a4a", girdle: "#6b4226", trim: "#e8c45a", pants: "#6b5a3a", boots: "#3a2a22", hat: "crown_big", hair: "#5a3a26",
  beard: "#5a3a26", skin: SK[2], nose: true, build: "kid",
};
/** the French soldier who climbs the chute: nasal helm over a mail coif, blue tabard with gold lilies, moustache */
export const CLIMBER: Outfit = {
  jacket: "#9aa3ad", mail: true, tabard: "#2c56b8", charge: "lilies", pants: "#5a4a3a", boots: "#3a2a22", hat: "helm",
  moustache: "#3a2a1a", skin: SK[1], nose: true,
};
/** French infantry (spears, kettle hats or helms, blue and white tabards) */
export const french = (v: number): Outfit => ({
  jacket: "#9aa3ad", mail: true, tabard: v % 3 === 2 ? "#e9e3d2" : "#2c56b8", charge: v % 3 === 2 ? "cross" : null,
  pants: "#5a4a3a", boots: "#3a2a22", hat: v % 2 ? "kettle" : "helm", moustache: v % 4 === 1 ? "#3a2a1a" : undefined,
  beard: v % 4 === 3 ? "#5a3a26" : undefined, skin: SK[v % 4], nose: true, spear: v % 3 !== 1,
});
/** English garrison (red tabards with a white cross, helms, spears) */
export const english = (v: number): Outfit => ({
  jacket: "#9aa3ad", mail: true, tabard: "#c8323a", charge: v % 2 ? "cross" : null, pants: "#5a4a3a", boots: "#3a2a22",
  hat: "helm", beard: v % 3 === 0 ? "#7a4a2a" : undefined, moustache: v % 3 === 1 ? "#4a3020" : undefined, skin: SK[(v + 1) % 4],
  nose: true, spear: v % 2 === 0, build: v % 4 === 3 ? "stout" : "adult",
});
/** builders and miners: hooded tunics, belts, sleeves rolled */
export const worker = (v: number): Outfit => ({
  jacket: ["#a8784a", "#8a6a4a", "#b89a6a", "#7a5a3a"][v % 4], girdle: "#5a3a22", pants: "#6b5a3a", boots: "#4a3426",
  hood: v % 2 ? ["#6a8a5a", "#8a4a3a"][v % 4 >> 1] : undefined, hat: v % 2 ? null : "hair", hair: ["#3a2a1a", "#7a4a2a", "#2a1a12", "#5a3a26"][v % 4],
  beard: v % 3 === 0 ? "#5a3a26" : undefined, skin: SK[v % 4], nose: true, build: v === 2 ? "stout" : "adult",
});
/** Richard's treasurer: a dark robe with a gold trim and a money pouch belt */
export const TREASURER: Outfit = {
  jacket: "#4a3a5a", trim: "#e8c45a", girdle: "#8a5a34", pants: "#3a3040", boots: "#2a2228", hat: "hair", hair: "#d9d4cc",
  beard: "#d9d4cc", skin: SK[0], nose: true, build: "stout",
};
