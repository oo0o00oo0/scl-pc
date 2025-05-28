import "./SplatViewer.css";
import { GSplat } from "./CustomGSplat";

import { type Asset } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { useSplat } from "./hooks/use-asset";

type ViewerProps = {
  src: string;
  fov?: number;
  swirl: number;
  rotation: [number, number, number];
  position: [number, number, number];
};

function SplatViewer({
  src,
  position,
  rotation,
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
        <GSplat
          asset={splat as Asset}
          swirl={swirl}
          id={0}
          dataReady={!!splat}
        />
      </Entity>
    </Entity>
  );
}

export default SplatViewer;
