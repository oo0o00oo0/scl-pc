import { Entity } from "@playcanvas/react";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import LandscapeScript from "../scripts/landscape";
import { type AssetMeta } from "../hooks/fetch-splat";
import useSplat from "../hooks/use-splat";

type Transform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

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
  //
  delay?: number;
  transform?: Transform | undefined;
  opacityOverride?: number;
}) => {
  const { parent_ref, script_ref } = useSplat(
    url,
    load,
    updateProgress,
    onReady,
    active,
  );

  const { position, rotation, scale } = transform || {};

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
