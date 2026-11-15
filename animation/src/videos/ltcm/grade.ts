// Colour grade presets for "The Nickel Trap": BRIGHT and clean (user feedback 2026-11-15: "too dark, colours too closed").
// Lifted shadows, strong mids, saturated colour, almost no vignette. GradeEffect itself is the skill's (../bridge/grade.ts).
import type { GradeEffect, GradeParams } from "../bridge/grade";
import type { Light } from "./story";

export const LTC_GRADES: Record<Light, GradeParams> = {
  day: {
    ky: [0.03, 0.14, 0.33, 0.68, 0.9, 0.985, 1.0],
    sat: [1.1, 1.2, 1.15],
    tintS: [-0.01, 0.01], tintM: [0.01, 0.012], tintH: [0.012, 0.0],
    vig: [0.12, 0.5],
  },
  stage: {
    ky: [0.03, 0.14, 0.34, 0.68, 0.9, 0.985, 1.0],
    sat: [1.1, 1.2, 1.15],
    tintS: [0.0, 0.01], tintM: [0.0, 0.0], tintH: [0.0, 0.0],
    vig: [0.1, 0.5],
  },
};

/** Apply the preset of a light (uniforms change only when the light changes). */
export function gradeLight(fx: GradeEffect, light: Light) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(LTC_GRADES[light]); tag._light = light; }
  fx.amount = 1;
}
