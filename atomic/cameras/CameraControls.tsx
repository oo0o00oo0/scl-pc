import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
import { Vec3 } from "playcanvas";

import CameraControlsScript from "../../scripts/camera-controls";

const CameraControls = (
  { camState }: {
    camState: {
      activeCameraPosition: Vec3;
      activeCameraTarget: Vec3;
      delay?: number;
    };
  },
) => {
  const app = useApp();
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

      app.autoRender = false;
    }
  }, [app, activeCameraPosition, activeCameraTarget, delay]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
    >
      <Script
        script={CameraControlsScript}
      />
      <Camera
        nearClip={2}
        farClip={100}
        clearColor="#ffffff"
      />
    </Entity>
  );
};

export default CameraControls;
