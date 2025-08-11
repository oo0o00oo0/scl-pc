import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls.mjs";
// import { CameraControls as CameraControlsOriginal } from "@/libs/scripts/camera-controls-pc.mjs";

console.log("CameraControlsScript", CameraControlsScript);

import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
import useCameraControls from "./useCameraControls";

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

  const scriptRef = useCameraControls(camState);

  return (
    <Entity
      ref={entity}
      name="camera"
    >
      <Script
        ref={scriptRef}
        script={CameraControlsScript}
        // script={CameraControlsOriginal}
        enableZoom={true}
        enablePan={true}
        enableOrbit={true}
      />
      <Camera
        nearClip={1}
        farClip={1000}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
