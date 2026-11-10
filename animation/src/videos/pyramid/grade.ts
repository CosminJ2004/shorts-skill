// Colour grade presets for the pyramid short, one per light. GradeEffect itself is the skill's (../bridge/grade.ts).
// The values between the markers are written by the skill's fit_grade.py: it grades pre-grade stills in numpy with
// the shader's exact maths and fits curve, saturation, split-tone and vignette to the reference medians of
// reports/grade.md (day -> ref day, golden -> ref golden, tunnel -> ref interior). Re-run it whenever lights,
// albedos or the world change:
//   node scripts/stills.mjs out/pyramid/pregrade/x_ <frames> 0.5   (with PROPS='{"post":{"grade":false}}')
//   python <skill>/templates/scripts/fit_grade.py out/pyramid/pregrade shorts/pyramid/shots.json src/videos/pyramid/grade.ts
import type { GradeEffect, GradeParams } from "../bridge/grade";
import { GRADE_DAY2, GRADE_GOLDEN2 } from "../bridge/grade";
import type { Light } from "./story";

// __FIT__ (fit_grade.py replaces everything up to __END__)
export const PYR_GRADES: Record<Light, GradeParams> = {
  day: {
    ky: [0.0129, 0.0927, 0.2758, 0.5717, 0.8349, 0.9741, 1.0000],
    sat: [0.5031, 0.5000, 1.0762],
    tintS: [0.0358, 0.0558], tintM: [-0.0093, -0.0319], tintH: [0.0299, 0.0016],
    vig: [0.2198, 0.5536],
  },
  tunnel: {
    ky: [0.0763, 0.1851, 0.3116, 0.6299, 0.8650, 0.9750, 1.0000],
    sat: [0.6657, 0.9236, 0.5000],
    tintS: [0.0460, -0.0051], tintM: [0.0047, 0.0064], tintH: [0.0388, -0.0400],
    vig: [0.0119, 0.6580],
  },
  golden: {
    ky: [0.0391, 0.0732, 0.2465, 0.5943, 0.9023, 0.9605, 1.0000],
    sat: [0.5000, 0.6825, 1.0431],
    tintS: [0.0592, 0.0600], tintM: [0.0132, -0.0208], tintH: [-0.0171, 0.0319],
    vig: [0.2092, 0.3115],
  },
};
// __END__

/** Apply the preset of a light (uniforms change only when the light changes). */
export function gradeLight(fx: GradeEffect, light: Light) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(PYR_GRADES[light]); tag._light = light; }
  fx.amount = 1;
}
