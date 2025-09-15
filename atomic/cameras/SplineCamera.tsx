import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import type { CamState } from "@/libs/types/camera.ts";
import { Mat4, Vec3, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
// @ts-ignore
import { CameraPath } from "@/libs/scripts/camerapath";
// @ts-ignore
import { points } from "@/data/splinetest";
import { useEffect, useRef } from "react";
import camStore from "@/state/camStore";
// @ts-ignore
import { CameraControls } from "@/libs/scripts/camera-controls-scroll.mjs";

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

  // @ts-ignore
  const setTempCamPosition = camStore((state) => state.setTempCamPosition);

  const controlsScriptRef = useRef<CameraControls | null>(null);

  useEffect(() => {
    const {
      position,
      target,
      // isScrollTarget = false,
      // cameraConstraints,
    } = camState;

    const cameraControlsScript = controlsScriptRef.current;
    const sub = camStore.subscribe(
      // @ts-ignore
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
            // scriptRef.current.setTime(normalizedTime);
            const curvePoint = scriptRef.current.getCurvePointFromTime(
              normalizedTime,
            );
            setTempCamPosition(curvePoint);
            cameraControlsScript.focus(
              new Vec3(2.749073, 4, 5.169055),
              curvePoint,
              true,
            );
          }
        }
      },
    );

    cameraControlsScript.focus(
      target,
      position,
      true,
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
      <Script
        ref={controlsScriptRef}
        script={CameraControls}
        enableOrbit={true}
        enableZoom={true}
        enablePan={true}
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
