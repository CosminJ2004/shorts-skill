// Test sheet: "The Last Escape" cast drawn flat, plus the effect drawings, for the stills check before the 3D world.
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen, bodyFront, Expr, FrontOpts, Outfit } from "../bridge/toon";
import { HOUDINI, SWIM, DISGUISE, GHOST, BESS, DOYLE, COP, STUDENT, MEDIUM20, MEDIUM26, AUTHOR, ASSIST, psychic, folk } from "./people";
import { fxCuffs, fxWatch, fxThermo, fxPumpkin, fxLock, fxSheet, fxCamera, fxTumble, fxFairy, fxAxe } from "./painth";

type Cell = [Outfit, Expr, Partial<FrontOpts>];
const CELLS: Cell[] = [
  [HOUDINI, "smug", { pose: "hips" }], [GHOST, "whistle", { pose: "cross" }], [DISGUISE, "stern", { pose: "point" }],
  [BESS, "smile", {}], [DOYLE, "proud", { pose: "point" }], [COP, "stern", { pose: "point" }],
  [STUDENT, "grin", { pose: "fist" }], [MEDIUM20, "relief", { mode: "sit" }], [MEDIUM26, "smug", {}],
  [AUTHOR, "smug", { pose: "point" }], [ASSIST, "nervous", {}], [psychic(0), "laugh", { wave: 1 }],
  [SWIM, "stern", {}], [folk(21, true), "shock", { mode: "sit" }], [HOUDINI, "queasy", { mode: "sit", prop: "scroll" }],
];

export const HoudiniCastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("cast"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach((c, i) => {
      g.save();
      const k = 0.5, x = (i % 3) * 360 + 30, y = Math.floor(i / 3) * 330 - 40;
      g.translate(x, y); g.scale(k, k);
      bodyFront(new Pen(g), c[0], { expr: c[1], mode: "stand", seed: 3 + i, facing: i % 2 ? -1 : 1, ...c[2] });
      g.restore();
    });
    const fx: [(p: Pen) => void, number, number, number][] = [
      [(p) => fxCuffs(p, 0), 300, 160, 0.5], [(p) => fxWatch(p, 1), 400, 460, 0.3], [(p) => fxThermo(p, 0.7), 160, 520, 0.25], [(p) => fxPumpkin(p, 1), 300, 260, 0.4],
      [(p) => fxLock(p, 1), 200, 240, 0.4], [(p) => fxSheet(p, 0.2), 240, 340, 0.35], [(p) => fxCamera(p, 1), 260, 220, 0.4], [(p) => fxTumble(p, 1), 200, 200, 0.5],
      [(p) => fxFairy(p, 0.3), 120, 110, 0.8], [fxAxe, 140, 420, 0.3],
    ];
    fx.forEach(([d, , , s], i) => { g.save(); g.translate(20 + i * 105, 1700); g.scale(s, s); d(new Pen(g)); g.restore(); });
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
