import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";

import CameraControlsScript from "../../scripts/camera-controls";
import type { CameraConstraints, CamState } from "@/state/store";
import { Vec2 } from "playcanvas";

const defaultCameraConstraints: CameraConstraints = {
  pitchRange: new Vec2(-90, 90),
  zoomMin: 0.1,
  zoomMax: 0.4,
  sceneSize: 100,
};

const CameraControls = (
  { camState, clearColor }: {
    camState: CamState;
    clearColor: string;
  },
) => {
  const app = useApp();
  const { position, target, delay = 0, cameraConstraints } = camState;

  const { pitchRange, zoomMin, zoomMax, sceneSize } = cameraConstraints ||
    defaultCameraConstraints;

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
    camState,
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
