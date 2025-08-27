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
  transform,
}: {
  active: boolean;
  updateProgress: (meta: AssetMeta, key: string) => void;
  url: string;
  load: boolean;
  onReady: (url: string) => void;
  delay?: number;
  transform?: {
    position?: Transform;
    rotation?: Transform;
    scale?: Transform;
  };
  opacityOverride?: number;
}) => {
  const { parent_ref, script_ref } = useSplat(
    url,
    load,
    updateProgress,
    onReady,
    active,
  );

  const { position, rotation, scale } = transform ||
    { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };

  return (
    <Entity
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <Entity
        ref={parent_ref}
        name={url.split("/").pop() || "splat"}
        rotation={[0, 0, 180]}
      >
        <ScriptComponent
          ref={script_ref}
          script={LandscapeScript}
        />
      </Entity>
    </Entity>
  );
};

export default Landscape;
