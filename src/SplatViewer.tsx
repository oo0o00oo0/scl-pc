import "./SplatViewer.css";
import { GSplat } from "./CustomGSplat";

import { type Asset } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { Camera } from "@playcanvas/react/components";
import { useSplat } from "./hooks/use-asset";
import { MotionValue } from "motion/react";

type Splat = {
  src: string;
  fov: number;
  swirl: MotionValue;
  rotation: [number, number, number];
  position: [number, number, number];
};

type ViewerProps = Splat;

function SplatViewer({
  src,
  position,
  rotation,
  fov = 90,
  swirl,
}: ViewerProps) {
  const { data: splat } = useSplat(src);

  return (
    <Entity>
      {
        /* <Entity>
        <Camera distanceMin={3} distanceMax={5} />
        <PostEffects />
      </Entity> */
      }
      <Entity scale={[2, 2, 2]} rotation={rotation} position={position}>
        <GSplat asset={splat as Asset} swirl={swirl} />
      </Entity>
    </Entity>
  );
}

export default SplatViewer;
