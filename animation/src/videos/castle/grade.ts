// Colour grade presets for the castle short (start: the pyramid fit; re-fit with fit_grade.py), one per light. GradeEffect itself is the skill's (../bridge/grade.ts).
// The values between the markers are written by the skill's fit_grade.py: it grades pre-grade stills in numpy with
// the shader's exact maths and fits curve, saturation, split-tone and vignette to the reference medians of
// reports/grade.md (day -> ref day, golden -> ref golden, tunnel -> ref interior). Re-run it whenever lights,
// albedos or the world change:
//   node scripts/stills.mjs out/castle/pregrade/x_ <frames> 0.5   (with PROPS='{"post":{"grade":false}}')
//   python <skill>/templates/scripts/fit_grade.py out/castle/pregrade shorts/castle/shots.json src/videos/castle/grade.ts
import type { GradeEffect, GradeParams } from "../bridge/grade";
import { GRADE_DAY2, GRADE_GOLDEN2 } from "../bridge/grade";
import type { Light } from "./story";

// __FIT__ (fit_grade.py replaces everything up to __END__)
export const CASTLE_GRADES: Record<Light, GradeParams> = {
  golden: {
    ky: [0.0000, 0.0212, 0.1827, 0.5173, 0.8311, 0.9750, 1.0000],
    sat: [0.5205, 1.0600, 1.0934],
    tintS: [0.0480, 0.0223], tintM: [0.0033, 0.0001], tintH: [0.0007, -0.0367],
    vig: [0.4648, 0.4406],
  },
  inside: {
    ky: [0.0046, 0.0505, 0.1371, 0.4649, 0.8047, 0.9750, 1.0000],
    sat: [1.1951, 1.0102, 0.9792],
    tintS: [-0.0568, -0.0120], tintM: [0.0140, 0.0208], tintH: [0.0103, 0.0027],
    vig: [0.5000, 0.4143],
  },
  day: {
    ky: [0.0000, 0.0732, 0.2514, 0.6014, 0.8640, 0.9750, 1.0000],
    sat: [0.5002, 1.2793, 1.3615],
    tintS: [-0.0600, 0.0499], tintM: [0.0223, -0.0400], tintH: [-0.0282, 0.0054],
    vig: [0.3534, 0.3357],
  },
};
// __END__

/** Apply the preset of a light (uniforms change only when the light changes). */
export function gradeLight(fx: GradeEffect, light: Light) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(CASTLE_GRADES[light]); tag._light = light; }
  fx.amount = 1;
}
