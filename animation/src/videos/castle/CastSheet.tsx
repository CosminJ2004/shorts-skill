// Test sheet: every castle character drawn flat with the shared toon code, for the stills check (quality bar).
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen, bodyFront, Expr, FrontOpts, Outfit } from "../bridge/toon";
import { RICHARD, PHILIP, JOHN, CLIMBER, TREASURER, french, english, worker } from "./people";

const ROWS: [Outfit, Expr, Partial<FrontOpts>][] = [
  [RICHARD, "proud", { pose: "hips" }], [PHILIP, "sneer", { pose: "point" }], [JOHN, "nervous", {}], [CLIMBER, "queasy", { pose: "climb" }],
  [TREASURER, "smile", { prop: "scroll" }], [french(0), "stern", {}], [french(2), "grin", { prop: "torch" }], [english(0), "smug", { pose: "cross" }],
  [english(1), "scared", {}], [worker(0), "grin", { prop: ["hammer", 0.3] }], [worker(1), "smile_closed", {}], [RICHARD, "smug", { pose: "cradle" }],
];

export const CastleCastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("cast"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#cfd8e6"; g.fillRect(0, 0, 1080, 1920);
    ROWS.forEach(([o, expr, opt], i) => {
      g.save();
      const k = 0.58, x = (i % 3) * 360 + 5, y = Math.floor(i / 3) * 480 + 5;
      g.translate(x, y); g.scale(k, k);
      bodyFront(new Pen(g), o, { expr, mode: "stand", seed: 3 + i, facing: i % 2 ? -1 : 1, ...opt });
      g.restore();
    });
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
