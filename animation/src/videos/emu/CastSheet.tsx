// Test sheet: the emu short's cast drawn flat (people + emus in every gait), for the stills check before the 3D world.
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { Pen, bodyFront, Expr, FrontOpts, Outfit } from "../bridge/toon";
import { MAJOR, gunner, farmer } from "./people";
import { emuCard, EmuOpts, roo } from "./birds";

type Cell = ["p", Outfit, Expr, Partial<FrontOpts>] | ["e", EmuOpts] | ["r"];
const CELLS: Cell[] = [
  ["p", MAJOR, "proud", { pose: "salute" }], ["p", gunner(0), "grin", { pose: "aim" }], ["p", gunner(1), "shock", { pose: "shrug" }],
  ["p", farmer(0), "stern", { pose: "fist" }], ["p", farmer(1), "smile", { mode: "run", phase: 0.25 }], ["p", MAJOR, "stern", { pose: "binoc" }],
  ["e", { mode: "stand", expr: "calm" }], ["e", { mode: "walk", phase: 0.3, expr: "calm", dir: -1 }], ["e", { mode: "run", phase: 0.1, expr: "smug" }],
  ["e", { mode: "run", phase: 0.6, expr: "alarm" }], ["e", { mode: "peck", phase: 0.2 }], ["e", { mode: "front", expr: "smug" }],
  ["e", { mode: "front", expr: "squint", dark: true, tall: 1 }], ["e", { mode: "stand", expr: "wink", dark: true, tall: 1 }], ["r"],
];

export const EmuCastSheet: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("cast"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach((c, i) => {
      g.save();
      const k = 0.58, x = (i % 3) * 360 + 5, y = Math.floor(i / 3) * 384 - 60;
      g.translate(x, y); g.scale(k, k);
      const p = new Pen(g);
      if (c[0] === "p") bodyFront(p, c[1], { expr: c[2], mode: "stand", seed: 3 + i, facing: i % 2 ? -1 : 1, ...c[3] });
      else if (c[0] === "e") emuCard(p, { seed: i, ...c[1], phase: (c[1].phase ?? 0) + f / 20 });
      else roo(p, {});
      g.restore();
    });
    continueRender(h);
  }, [h, f]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
