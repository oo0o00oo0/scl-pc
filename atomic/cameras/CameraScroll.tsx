import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
// @ts-ignore
// import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls.mjs";
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-scroll.mjs";

import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
// import useCameraControls from "./useCameraControls";
import useScrollCamera from "./use-scroll-camera";

const CameraScroll = (
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

  // const scriptRef = useCameraControls(camState);
  const scriptRef = useScrollCamera(camState);

  return (
    <Entity
      ref={entity}
      name="camera"
    >
      <Script
        ref={scriptRef}
        script={CameraControlsScript}
        enableZoom={false}
        enablePan={false}
        enableOrbit={false}
      />
      <Camera
        nearClip={1}
        farClip={100}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraScroll;
