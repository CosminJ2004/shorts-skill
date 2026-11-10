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
  day: GRADE_DAY2,
  golden: GRADE_GOLDEN2,
  tunnel: GRADE_DAY2,
};
// __END__

/** Apply the preset of a light (uniforms change only when the light changes). */
export function gradeLight(fx: GradeEffect, light: Light) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(PYR_GRADES[light]); tag._light = light; }
  fx.amount = 1;
}
