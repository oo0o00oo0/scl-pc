import { Entity } from "@playcanvas/react";
import { type Asset } from "playcanvas";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
import LandscapeScript from "../scripts/landscape";
import { Vec3 } from "playcanvas";
import { useSplatLoading } from "../hooks/use-splat-loading";

const Landscape = ({
  id,
  url,
  active,
  updateProgress,
  onReady,
  position = new Vec3(0, 0, 0),
  rotation = new Vec3(0, 0, 0),
  load = false,
  opacityOverride = 1,
  delay = 1000,
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
  load: boolean;
  onReady: (id: number) => void;
  delay?: number;
  position?: Vec3;
  rotation?: Vec3;
  opacityOverride?: number;
}) => {
  const { splat, gsplatRef, scriptRef } = useSplatLoading(
    id,
    url,
    load,
    updateProgress,
    onReady,
    active,
    opacityOverride,
    delay,
  );

  return (
    <Entity
      rotation={[rotation.x, rotation.y, rotation.z]}
      position={[position.x, position.y, position.z]}
      name="splat"
      ref={gsplatRef}
    >
      <CustomGSplat
        id={id}
        asset={splat as Asset}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
};

export default Landscape;
