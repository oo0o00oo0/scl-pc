import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls-scroll.mjs";
import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
import useScrollCamera from "./use-scroll-camera";

const CameraControls = (
  {
    camState,
    clearColor,
    enableOrbit = true,
    enableZoom = true,
    enablePan = true,
    onChange = () => {},
  }: {
    camState: CamState;
    clearColor: string;
    enableOrbit: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    onChange: (camData: {
      viewProjMatrix: Mat4;
      cameraRect: Vec4;
      canvasWidth: number;
      canvasHeight: number;
    }) => void;
  },
) => {
  const { entity } = useRenderOnCameraChange(onChange);

  const scriptRef = useScrollCamera(camState);

  return (
    <Entity
      ref={entity}
      position={[camState.position.x, camState.position.y, camState.position.z]}
      name="camera"
    >
      {
        /* <Script
        // ref={scriptRef}
        script={CameraPathScript}
        points={points}
      /> */
      }
      <Script
        ref={scriptRef}
        script={CameraControlsScript}
        enableZoom={enableZoom}
        enablePan={enablePan}
        enableOrbit={enableOrbit}
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
