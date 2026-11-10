import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { BoxTest } from "./videos/test/Box";
import { PyramidShort, PYRAMID_FRAMES } from "./videos/pyramid/Pyramid";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PyramidShort" component={PyramidShort} durationInFrames={PYRAMID_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BoxTest" component={BoxTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
