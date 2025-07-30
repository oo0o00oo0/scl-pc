import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect } from "react";
//
// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls.mjs";

import type { CamState } from "@/libs/types/camera.ts";
import { clampAzimuthAngle } from "@/libs/atomic/utils/cameraUtils";
import { Mat4, Vec2, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";

const CameraControls = (
  { camState, clearColor, onChange = () => {} }: {
    camState: CamState;
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
  } = camState || {};

  const { entity: entityRef } = useRenderOnCameraChange(onChange);

  const { pitchRange, azimuth } = cameraConstraints;

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

        angles.y = clampAzimuthAngle(angles.y, azimuth);
      };

      cameraControlsScript.on("clamp:angles", clampAnglesHandler);

      setTimeout(() => {
        //@ts-ignore
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      setInterval(() => {
        //@ts-ignore
        cameraControlsScript.customEvent();
      }, 1000);

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
      position={[position.x, position.y, position.z]}
    >
      <Script
        pitchRange={new Vec2(pitchRange.min, pitchRange.max)}
        enableZoom={true}
        // enableFly={false}
        // enablePan={false}
        // enableOrbit={false}
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
