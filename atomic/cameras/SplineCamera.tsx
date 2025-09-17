import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { Mat4, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
import { CameraPath } from "@/libs/scripts/camerapath";
import { useEffect, useRef } from "react";
// @ts-ignore
import { CameraControls } from "@/libs/scripts/camera-controls-scroll.mjs";

interface SplineCameraProps {
  camStore: any;
  points: any;
  scrollableElement: any;
  camSettings: any;
  controlsSettings: any;
  onChange?: (camData: {
    viewProjMatrix: Mat4;
    cameraRect: Vec4;
    canvasWidth: number;
    canvasHeight: number;
  }) => void;
  layoutData?: any;
}

const SplineCamera = ({
  camStore,
  points,
  camSettings,
  controlsSettings,
  scrollableElement,
  onChange = () => {},
}: SplineCameraProps) => {
  const { entity } = useRenderOnCameraChange(onChange);
  const scriptRef = useRef<CameraPath | null>(null);
  const controlsScriptRef = useRef<CameraControls | null>(null);

  const camState = camStore((state: any) => state.camState);
  const setControlsScript = camStore((state: any) => state.setControlsScript);

  useEffect(() => {
    setControlsScript(controlsScriptRef.current);

    const { position, target } = camState;
    const cameraControlsScript = controlsScriptRef.current;

    if (!cameraControlsScript) return;

    cameraControlsScript.focus(target, position, true);

    const unsubscribe = camStore.subscribe(
      (state: any) => state.normalizedScrollPosition,
      (scrollPosition: number) => {
        if (scriptRef.current && scrollableElement) {
          const curvePoint = scriptRef.current.getCurvePointFromTime(
            scrollPosition,
          );
          cameraControlsScript.focus(target, curvePoint, true);
        }
      },
    );

    return unsubscribe;
  }, [camState, scrollableElement]);

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
        enableOrbit={controlsSettings.enableOrbit}
        enableZoom={controlsSettings.enableZoom}
        enablePan={controlsSettings.enablePan}
      />
      <Camera
        {...camSettings}
      />
    </Entity>
  );
};

export default SplineCamera;
