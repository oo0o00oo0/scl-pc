import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";

// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-pc.mjs";

import type { CameraConstraints, CamState } from "@/state/store";
import { Vec2, Vec3 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";

const defaultCameraConstraints: CameraConstraints = {
  pitchRange: new Vec2(-90, 90),
  azimouthRange: new Vec2(-10, 10),
};

const defaultCamState: CamState = {
  position: new Vec3(1, 1, 1),
  target: new Vec3(0, 0, 0),
  delay: 0,
  cameraConstraints: defaultCameraConstraints,
};

const CameraControls = (
  { camState = defaultCamState, clearColor }: {
    camState: CamState | null;
    clearColor: string;
  },
) => {
  const app = useApp();
  const {
    position,
    target,
    delay = 0,
    cameraConstraints,
    // damping = 0.96,
    // mode = "orbit",
  } = camState || defaultCamState;
  const entityRef = useRef<any>(null);

  useRenderOnCameraChange(entityRef.current);

  const { pitchRange, azimouthRange } = cameraConstraints;

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      const clampAnglesHandler = (angles: Vec2) => {
        angles.y = Math.max(
          azimouthRange.x,
          Math.min(azimouthRange.y, angles.y),
        );
      };

      cameraControlsScript.on("clamp:angles", clampAnglesHandler);

      setTimeout(() => {
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      if (azimouthRange.x === Infinity) {
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      }

      // Cleanup: remove the handler
      return () => {
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    }
  }, [
    app,
    camState,
    position,
    target,
    delay,
    pitchRange,
    azimouthRange,
  ]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
    >
      <Script
        pitchRange={pitchRange}
        enableZoom={false}
        enableFly={false}
        enablePan={false}
        enableOrbit={true}
        //
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
