import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useEffect, useRef } from "react";

import CameraControlsScript from "./scripts/camera-controls";
import { CamState } from "../../state/store";

const CameraControls = (
  { camState }: {
    camState: CamState;
  },
) => {
  const { activeCameraPosition, activeCameraTarget, delay = 0 } = camState;
  const entityRef = useRef<any>(null);

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      setTimeout(() => {
        cameraControlsScript.focus(
          activeCameraTarget,
          activeCameraPosition,
        );
      }, delay);
    }
  }, [activeCameraTarget, activeCameraPosition, delay]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
      position={[
        -10.862204551696777,
        2.429239273071289,
        -10.834569931030273,
      ]}
    >
      <Script
        script={CameraControlsScript}
      />
      <Camera
        nearClip={2}
        farClip={100}
        clearColor="#F1F1F1"
      />
    </Entity>
  );
};

export default CameraControls;
