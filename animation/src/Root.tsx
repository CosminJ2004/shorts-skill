import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { BoxTest } from "./videos/test/Box";
import { PyramidShort, PYRAMID_FRAMES } from "./videos/pyramid/Pyramid";
import { CaptionsLayer, CaptionZone, Word } from "./lib/Captions";
import pyramidWords from "../shorts/pyramid/voice/words.json";

// close-ups whose faces sit in the caption band: the line moves to the upper third there
const PYRAMID_CAPTION_ZONES: CaptionZone[] = [[247, 362, 0.36], [424, 555, 0.36], [1044, 1104, 0.36], [1556, 1634, 0.36]];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PyramidShort" component={PyramidShort} durationInFrames={PYRAMID_FRAMES} fps={30} width={1080} height={1920} />
    {/* captions as their own transparent layer: tune and re-render them in minutes, composite with ffmpeg */}
    <Composition id="PyramidCaptions" component={CaptionsLayer} defaultProps={{ words: pyramidWords as Word[], zones: PYRAMID_CAPTION_ZONES }}
      durationInFrames={PYRAMID_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BoxTest" component={BoxTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
