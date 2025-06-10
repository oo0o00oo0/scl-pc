import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
import { Vec2, Vec3 } from "playcanvas";

import CameraControlsScript from "../../scripts/camera-controls";

interface CameraConstraints {
  /** Pitch angle range in degrees [min, max]. Default: [-90, 90] */
  pitchRange?: Vec2;
  /** Minimum zoom distance (multiplied by sceneSize). Default: 0 */
  zoomMin?: number;
  /** Maximum zoom distance (multiplied by sceneSize). Default: unlimited */
  zoomMax?: number;
  /** Scene size - affects movement and zoom speeds. Default: 100 */
  sceneSize?: number;
}

const CameraControls = (
  { camState, clearColor, constraints = {}, ...props }: {
    camState: {
      position: Vec3;
      target: Vec3;
      delay?: number;
    };
    clearColor: string;
    constraints?: CameraConstraints;
    enablePan?: boolean;
    enableFly?: boolean;
    enableZoom?: boolean;
  },
) => {
  const app = useApp();
  const { position, target, delay = 0 } = camState;
  const {
    pitchRange = new Vec2(-90, 90),
    zoomMin = .1,
    zoomMax = .4,
    sceneSize = 100,
  } = constraints;
  const entityRef = useRef<any>(null);

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      cameraControlsScript.pitchRange.set(pitchRange.x, pitchRange.y);
      cameraControlsScript.zoomMin = zoomMin;
      cameraControlsScript.zoomMax = zoomMax;
      cameraControlsScript.sceneSize = sceneSize;

      setTimeout(() => {
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      app.autoRender = false;
    }
  }, [
    app,
    position,
    target,
    delay,
    pitchRange,
    zoomMin,
    zoomMax,
    sceneSize,
  ]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
    >
      <Script
        {...props}
        script={CameraControlsScript}
      />
      <Camera
        nearClip={2}
        farClip={100}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
