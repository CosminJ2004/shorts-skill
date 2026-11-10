import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { PostKick } from "../../lib/PostKick";
const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });

export const BoxTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#223" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ preserveDrawingBuffer: true }} camera={{ fov: 40, position: [0, 0, 6] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <mesh rotation={[0.4, f * 0.05, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <EffectComposer multisampling={0}>
          <primitive object={tone} dispose={null} />
        </EffectComposer>
        <PostKick />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
