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

const CameraControls = (
  { camState, clearColor }: {
    camState: CamState;
    clearColor: string;
  },
) => {
  const app = useApp();
  const {
    position,
    target,
    delay = 0,
    cameraConstraints,
    damping = 0.96,
    mode = "orbit",
  } = camState;
  const entityRef = useRef<any>(null);

  useRenderOnCameraChange(entityRef.current);

  const { pitchRange, zoomMin, zoomMax, sceneSize } = cameraConstraints ||
    defaultCameraConstraints;

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      cameraControlsScript.on("clamp:angles", (angles: Vec2) => {
        angles.y = Math.max(-60, Math.min(70, angles.y));
      });

      if (!cameraControlsScript) return;

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
        rotateDamping={damping}
        zoomMin={zoomMin}
        zoomMax={zoomMax}
        pitchRange={pitchRange}
        enableZoom={false}
        // enablePan={mode === "fly"}
        // enableOrbit={mode === "orbit"}
        script={CameraControlsScript}
      />
      <Camera
        nearClip={0.1}
        farClip={100}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
