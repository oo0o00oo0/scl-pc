import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
//
// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-pc.mjs";

import type { CameraConstraints, CamState } from "@/types/camera";
import { AZIMUTH_PRESETS, clampAzimuthAngle } from "@/utils/cameraUtils";
import { Mat4, Vec2, Vec3, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";

const defaultCameraConstraints: CameraConstraints = {
  pitchRange: { min: -90, max: 90 },
  azimuth: AZIMUTH_PRESETS.unlimited(),
  enableZoom: false,
};

const defaultCamState: CamState = {
  position: new Vec3(1, 1, 1),
  target: new Vec3(0, 0, 0),
  delay: 0,
  cameraConstraints: defaultCameraConstraints,
};

const CameraControls = (
  { camState = defaultCamState, clearColor, onChange = () => {} }: {
    camState: CamState | null;
    clearColor: string;
    onChange: (camData: {
      viewProjMatrix: Mat4;
      cameraRect: Vec4;
      canvasWidth: number;
      canvasHeight: number;
    }) => void;
  },
) => {
  const app = useApp();
  const {
    position,
    target,
    delay = 0,
    cameraConstraints,
  } = camState || defaultCamState;
  const entityRef = useRef<any>(null);

  useRenderOnCameraChange(entityRef.current, onChange);

  const { pitchRange, azimuth, enableZoom } = cameraConstraints;

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      const clampAnglesHandler = (angles: Vec2) => {
        // Clamp pitch (X component)
        angles.x = Math.max(
          pitchRange.min,
          Math.min(pitchRange.max, angles.x),
        );

        // Clamp azimuth (Y component) using new system
        angles.y = clampAzimuthAngle(angles.y, azimuth);
      };

      cameraControlsScript.on("clamp:angles", clampAnglesHandler);

      setTimeout(() => {
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      // Always apply clamping with new system
      // (no more Infinity check needed)

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
    azimuth,
  ]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
    >
      <Script
        pitchRange={new Vec2(pitchRange.min, pitchRange.max)}
        enableZoom={enableZoom}
        enableFly={false}
        enablePan={false}
        enableOrbit={true}
        //
        script={CameraControlsScript}
      />
      <Camera
        nearClip={0.1}
        farClip={1000}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
