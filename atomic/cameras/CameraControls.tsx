import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";

// @ts-ignore
// import { CameraControls as CameraControlsScript } from "playcanvas/scripts/esm/camera-controls.mjs";
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-pc.mjs";
console.log("CameraControlsScript", CameraControlsScript);

import type { CameraConstraints, CamState } from "@/state/store";
import { Vec2 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";

const defaultCameraConstraints: CameraConstraints = {
  pitchRange: new Vec2(-90, 90),
  zoomMin: 0.1,
  zoomMax: 0.4,
  sceneSize: 100,
};

// const mode = "fly";

const CameraControls = (
  { camState, clearColor }: {
    camState: CamState;
    clearColor: string;
  },
) => {
  const app = useApp();
  const { position, target, delay = 0, cameraConstraints, mode = "orbit" } =
    camState;
  const entityRef = useRef<any>(null);

  useRenderOnCameraChange(entityRef.current);

  const { pitchRange, zoomMin, zoomMax, sceneSize } = cameraConstraints ||
    defaultCameraConstraints;

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      if (pitchRange) {
        cameraControlsScript.pitchRange.set(pitchRange.x, pitchRange.y);
      }
      if (zoomMin) {
        cameraControlsScript.zoomMin = zoomMin;
      }
      if (zoomMax) {
        cameraControlsScript.zoomMax = zoomMax;
      }
      if (sceneSize) {
        cameraControlsScript.sceneSize = sceneSize;
      }

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

  console.log("MODE", mode);

  return (
    <Entity
      ref={entityRef}
      name="camera"
    >
      <Script
        rotateDamping={0.96}
        // zoomDamping={0.994}
        // enablePivot={true}
        // enableZoom={false}
        enablePan={mode === "fly"}
        enableOrbit={mode === "orbit"}
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
