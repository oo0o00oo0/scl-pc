import { Entity } from "@playcanvas/react";
import { type Asset } from "playcanvas";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
import LandscapeScript from "../scripts/landscape";
import { useSplatLoading } from "../hooks/use-splat-loading";
import { type AssetMeta } from "../hooks/use-splat-with-id";

const Landscape = ({
  url,
  active,
  updateProgress,
  onReady,
  load = false,
  transform,
}: {
  active: boolean;
  updateProgress: (meta: AssetMeta, key: string) => void;
  url: string;
  load: boolean;
  onReady: (url: string) => void;
  delay?: number;
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  opacityOverride?: number;
}) => {
  const { splat, gsplatRef, scriptRef } = useSplatLoading(
    url,
    load,
    updateProgress,
    onReady,
    active,
  );

  return (
    <Entity
      position={transform?.position || [0, 0, 0]}
      rotation={transform?.rotation || [0, 0, 0]}
      scale={transform?.scale || [1, 1, 1]}
      name="splat"
      ref={gsplatRef}
    >
      <CustomGSplat
        asset={splat as Asset}
        active={active}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
};

export default Landscape;
