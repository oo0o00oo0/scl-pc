import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { Script as ScriptType } from "playcanvas";

// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls.mjs";
import { CameraPath as CameraPathScript } from "@/libs/scripts/camerapath.ts";
// import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-scroll.mjs";

import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
import { useEffect, useRef } from "react";
import { points } from "@/data/splinetest";

const useCameraCurvePath = () => {
  const scriptRef = useRef<ScriptType>(null);

  useEffect(() => {
  }, []);
  return scriptRef;
};

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
  const { entity } = useRenderOnCameraChange(onChange);

  const scriptRef = useCameraCurvePath();

  // const scriptRef = useCameraControls(camState);

  return (
    <Entity
      ref={entity}
      position={[camState.position.x, camState.position.y, camState.position.z]}
      name="camera"
    >
      <Script
        // ref={scriptRef}
        script={CameraPathScript}
        points={points}
      />
      {
        /* <Script
        ref={scriptRef}
        script={CameraControlsScript}
        enableZoom={true}
        enablePan={true}
        enableOrbit={true}
      /> */
      }
      <Camera
        nearClip={1}
        farClip={1000}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
