import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useEffect, useRef } from "react";

import CameraControlsScript from "./scripts/camera-controls";
import { Vec3 } from "playcanvas";

const CameraControls = (
  { activeCameraTarget, activeCameraPosition }: {
    activeCameraTarget: Vec3 | null;
    activeCameraPosition: Vec3 | null;
  },
) => {
  const entityRef = useRef<any>(null);

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);
      console.log("cameraControlsScript", cameraControlsScript.focus);

      if (activeCameraTarget) {
        setTimeout(() => {
          cameraControlsScript.focus(
            activeCameraTarget,
          );
        }, 500);
      }
      if (activeCameraPosition) {
        setTimeout(() => {
          cameraControlsScript.focus(
            new Vec3(0, 0, 0),
            activeCameraPosition,
          );
        }, 500);
      }
    }
  }, [activeCameraTarget, activeCameraPosition]);

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
