import { Entity } from "@playcanvas/react";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import LandscapeScript from "../scripts/landscape";
import { type AssetMeta } from "../hooks/fetch-splat";
import useSplat from "../hooks/use-splat";

type Transform = [number, number, number];

const Landscape = ({
  url,
  active,
  updateProgress,
  onReady,
  load = false,
  scriptKey,
  position,
  rotation,
  scale,
}: {
  active: boolean;
  updateProgress: (meta: AssetMeta, key: string) => void;
  url: string;
  load: boolean;
  onReady: (url: string) => void;
  scriptKey?: string;
  //
  position?: Transform;
  rotation?: Transform;
  scale?: Transform;
}) => {
  const { parent_ref, script_ref } = useSplat(
    url,
    load,
    updateProgress,
    onReady,
    active,
    scriptKey,
  );

  console.log("URL", url);

  return (
    <Entity
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <Entity
        ref={parent_ref}
        rotation={[0, 0, 180]}
      >
        <ScriptComponent
          ref={script_ref}
          url={url.split("/").pop()}
          script={LandscapeScript}
        />
      </Entity>
    </Entity>
  );
};

export default Landscape;
