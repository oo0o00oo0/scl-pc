import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { Mat4, Vec3, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
import { CameraPath } from "@/libs/scripts/camerapath";
import { useEffect, useRef } from "react";
// @ts-ignore
import { CameraControls } from "@/libs/scripts/camera-controls-scroll.mjs";
// import { getSectionProgress, getCameraTrackProgress } from "@/utils/scrollUtils";
import {
  getCameraTrackProgress,
  getSectionProgress,
} from "@/utils/scrollUtils";
import { scrollStore } from "@/components/ScrollListener";

interface SplineCameraProps {
  camStore: any;
  camSettings: any;
  controlsSettings: any;
  points?: any;
  ghData?: any;
  cameraTrackData?: Array<{
    cameraTrack: number;
    sections: any[];
    span: number;
    startIndex: number;
    endIndex: number;
  }>;
  onChange?: (camData: {
    viewProjMatrix: Mat4;
    cameraRect: Vec4;
    canvasWidth: number;
    canvasHeight: number;
    cameraPosition: Vec3;
  }) => void;
  layoutData?: any;
}

const SplineCamera = ({
  camStore,
  points,
  camSettings,
  ghData,
  controlsSettings,
  cameraTrackData,
  onChange = () => {},
}: SplineCameraProps) => {
  const { entity } = useRenderOnCameraChange(onChange);
  const scriptRef = useRef<CameraPath | null>(null);

  const currentSectionIndex = scrollStore((s) => s.currentSectionIndex);
  const layoutData = scrollStore((s) => s.layoutData);

  const controlsScriptRef = useRef<CameraControls | null>(null);

  const camState = camStore((s: any) => s.camState);
  const setControlsScript = camStore((s: any) => s.setControlsScript);

  useEffect(() => {
    if (camState) {
      const controls = controlsScriptRef.current;
      if (!controls) return;
      const { position, target } = camState;
      controls.focus(target, position);
    }
  }, [camState]);

  useEffect(() => {
    if (!layoutData) return;
    if (ghData) {
      setControlsScript(controlsScriptRef.current);

      const controls = controlsScriptRef.current;
      const path = scriptRef.current;
      if (!controls || !path) return;

      path.setPathFromGhChunks(ghData);

      const unsubscribe = scrollStore.subscribe(
        (state: any) => state.scrollPosition,
        (scrollPosition: number) => {
          if (
            currentSectionIndex === null || currentSectionIndex === undefined
          ) return;

          // Use camera track progress if available (for AlUla), otherwise use section progress
          let sectionProgress;
          let currentTrack = 0;

          if (cameraTrackData && cameraTrackData.length > 0) {
            const trackResult = getCameraTrackProgress(
              scrollPosition,
              currentSectionIndex,
              layoutData,
              cameraTrackData,
            );

            sectionProgress = trackResult.progress;
            currentTrack = trackResult.trackNumber;
          } else {
            sectionProgress = getSectionProgress(
              scrollPosition,
              currentSectionIndex,
              layoutData,
            );
            console.log("Section Progress: ", sectionProgress);
          }

          // Use camera track number if available, otherwise use section index
          let i; // which track/chunk you want
          if (cameraTrackData && cameraTrackData.length > 0) {
            i = currentTrack; // Use the camera track number
          } else {
            i = Number(currentSectionIndex.split("-")[2]); // Use section index for non-track mode
          }
          const t = sectionProgress; // 0..1

          const { position, target } = path.getPose(i, t);

          controls.focus(target, position, true);
        },
      );

      return () => {
        unsubscribe();
      };
    }
  }, [camStore, setControlsScript, layoutData, currentSectionIndex]);

  return (
    <Entity
      ref={entity}
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

// if (points) {
//   setControlsScript(controlsScriptRef.current);

//   const { position, target } = camState;
//   const cameraControlsScript = controlsScriptRef.current;

//   if (!cameraControlsScript) return;

//   cameraControlsScript.focus(target, position, true);

//   const unsubscribe = camStore.subscribe(
//     (state: any) => state.normalizedScrollPosition,
//     (scrollPosition: number) => {
//       if (scriptRef.current) {
//         const curvePoint = scriptRef.current.getCurvePointFromTime(
//           scrollPosition,
//         );
//         cameraControlsScript.focus(target, curvePoint, true);
//       }
//     },
//   );

//   return unsubscribe;
// }
