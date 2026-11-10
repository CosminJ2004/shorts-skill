// Remotion renders a <ThreeCanvas> frame with one R3F advance() that runs before @react-three/postprocessing has
// built its EffectComposer, so the composited image never reaches the canvas and frames come out empty. This
// component waits one animation frame after each Remotion frame, advances R3F once more (now with the composer
// in place) and only then lets Remotion take the screenshot. Put it inside the <ThreeCanvas>, after the composer.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

export const PostKick: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  useEffect(() => {
    const handle = delayRender(`post-processing kick for frame ${frame}`);
    const raf = requestAnimationFrame(() => {
      advance(performance.now());
      continueRender(handle);
    });
    return () => {
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, advance]);
  return null;
};
