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
  opacityOverride = 1,
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
    opacityOverride,
  );

  return (
    <Entity
      position={transform?.position}
      rotation={transform?.rotation}
      scale={transform?.scale}
      name="splat"
      ref={gsplatRef}
    >
      <CustomGSplat
        asset={splat as Asset}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
};

export default Landscape;
