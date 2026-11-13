// Colour grade presets for "The Last Escape", one per light (start: the doomsday fit; re-fit with fit_grade.py).
// GradeEffect itself is the skill's (../bridge/grade.ts).
import type { GradeEffect, GradeParams } from "../bridge/grade";
import type { Light } from "./story";

// __FIT__ (fit_grade.py replaces everything up to __END__)
export const HOU_GRADES: Record<Light, GradeParams> = {
  inside: {
    ky: [0.0046, 0.0505, 0.1371, 0.4649, 0.8047, 0.9750, 1.0000],
    sat: [1.1951, 1.0102, 0.9792],
    tintS: [-0.0568, -0.0120], tintM: [0.0140, 0.0208], tintH: [0.0103, 0.0027],
    vig: [0.5000, 0.4143],
  },
  candle: {
    ky: [0.0060, 0.0480, 0.1300, 0.4500, 0.7950, 0.9700, 1.0000],
    sat: [1.15, 1.04, 1.0],
    tintS: [-0.03, -0.045], tintM: [0.018, 0.01], tintH: [0.02, 0.0],
    vig: [0.55, 0.40],
  },
  stage: {
    ky: [0.0000, 0.0732, 0.2514, 0.6014, 0.8640, 0.9750, 1.0000],
    sat: [0.6, 1.15, 1.2],
    tintS: [-0.03, 0.02], tintM: [0.0, 0.0], tintH: [0.0, 0.0],
    vig: [0.3, 0.4],
  },
  night: {
    ky: [0.0060, 0.0550, 0.1500, 0.4700, 0.8000, 0.9700, 1.0000],
    sat: [1.0, 1.05, 1.0],
    tintS: [-0.06, -0.03], tintM: [-0.01, 0.0], tintH: [0.02, 0.01],
    vig: [0.5, 0.42],
  },
};
// __END__

/** Apply the preset of a light (uniforms change only when the light changes). */
export function gradeLight(fx: GradeEffect, light: Light) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(HOU_GRADES[light]); tag._light = light; }
  fx.amount = 1;
}
