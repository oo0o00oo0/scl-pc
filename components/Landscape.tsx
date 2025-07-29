import { Entity } from "@playcanvas/react";
import { type Asset } from "playcanvas";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
import LandscapeScript from "../scripts/landscape";
import { Vec3 } from "playcanvas";
import { useSplatLoading } from "../hooks/use-splat-loading";
import { type AssetMeta } from "../hooks/use-splat-with-id";

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
}: {
  id: number;
  active: boolean;
  updateProgress: (meta: AssetMeta) => void;
  url: string;
  load: boolean;
  onReady: (id: number) => void;
  delay?: number;
  position?: Vec3;
  rotation?: Vec3;
  opacityOverride?: number;
}) => {
  console.log("LANDSCAPEEE", url);
  console.log("PRODUCTION DEBUG:", {
    id,
    url,
    load,
    isProduction: import.meta.env.PROD,
    environment: import.meta.env.MODE,
  });
  const { splat, gsplatRef, scriptRef } = useSplatLoading(
    id,
    url,
    load,
    updateProgress,
    onReady,
    active,
    opacityOverride,
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
