import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
// @ts-ignore
import { CameraPath } from "@/libs/scripts/camerapath";
import { points } from "@/data/splinetest";
import { useEffect, useRef } from "react";
import camStore from "@/state/camStore";

const SplineCamera = (
  {
    camState,
    clearColor,
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
    layoutData?: any;
  },
) => {
  const { entity } = useRenderOnCameraChange(onChange);

  const scriptRef = useRef<CameraPath | null>(null);

  useEffect(() => {
    const sub = camStore.subscribe(
      (state) => state.scrollPosition,
      (scrollPosition) => {
        if (scriptRef.current) {
          // Get the total scrollable height
          const scrollableElement = document.querySelector(
            ".h-screen.overflow-auto",
          ) as HTMLElement;
          if (scrollableElement) {
            const totalHeight = scrollableElement.scrollHeight -
              scrollableElement.clientHeight;
            // Normalize scroll position to 0-1 range
            const normalizedTime = totalHeight > 0
              ? Math.min(scrollPosition / totalHeight, 1)
              : 0;
            scriptRef.current.setTime(normalizedTime);
          }
        }
      },
    );
    return () => {
      sub();
    };
  }, [camState]);

  return (
    <Entity
      ref={entity}
      position={[camState.position.x, camState.position.y, camState.position.z]}
      name="camera"
    >
      <Script
        ref={scriptRef}
        script={CameraPath}
        points={points}
      />

      <Camera
        nearClip={1}
        fov={30}
        farClip={1000}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default SplineCamera;
