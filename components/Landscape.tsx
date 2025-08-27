import { Entity } from "@playcanvas/react";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import LandscapeScript from "../scripts/landscape";
import { type AssetMeta } from "../hooks/fetch-splat";
import useSplat from "../hooks/use-splat";

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
  const { parent_ref, script_ref } = useSplat(
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
