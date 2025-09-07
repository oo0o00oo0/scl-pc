import { useEffect, useRef } from "react";
import type { CamState } from "@/libs/types/camera";
import { Script, Vec2, Vec3 } from "playcanvas";
import camStore from "@/state/camStore";
import sceneStore from "@/state/sceneState";
import { getCameraInterpolationData } from "@/libs/utils/scrollUtils";
import { SCENE_CONFIG } from "@/data/articles/3DUXD/3DUXD-config";
import { clampAzimuthAngle } from "../utils/cameraUtils";

type ScrollCameraScript = Script & {
  focus: (target: Vec3, position: Vec3, immediate?: boolean) => void;
};

const useScrollCamera = (
  camState: CamState,
) => {
  const scriptRef = useRef<ScrollCameraScript>(null);
  const layoutData = sceneStore((state) => state.layoutData);

  console.log("layoutData", layoutData);

  useEffect(() => {
    if (!camState) return;

    const cameraControlsScript = scriptRef.current!;

    const {
      position,
      target,
      isScrollTarget = false,
      cameraConstraints,
    } = camState;

    const { pitchRange, azimuth } = cameraConstraints;

    const clampAnglesHandler = (angles: Vec2) => {
      if (!pitchRange || !azimuth) return;
      angles.x = Math.max(
        pitchRange.min,
        Math.min(pitchRange.max, angles.x),
      );
      angles.y = clampAzimuthAngle(angles.y, azimuth);
    };

    cameraControlsScript.on("clamp:angles", clampAnglesHandler);

    if (isScrollTarget && layoutData?.heights) {
      const sub = camStore.subscribe(
        (state) => state.scrollPosition,
        (scrollPosition: number) => {
          const interpolationData = getCameraInterpolationData(
            scrollPosition,
            layoutData.heights,
            SCENE_CONFIG,
          );

          const { fromCamState, toCamState, progress, shouldInterpolate } =
            interpolationData;

          if (shouldInterpolate && fromCamState && toCamState) {
            // Interpolate position between sections
            const fromPos = fromCamState.position;
            const toPos = toCamState.position;
            const interpolatedPos = new Vec3();
            interpolatedPos.lerp(fromPos, toPos, progress);

            // Interpolate target between sections
            const fromTarget = fromCamState.target;
            const toTarget = toCamState.target;
            const interpolatedTarget = new Vec3();
            interpolatedTarget.lerp(fromTarget, toTarget, progress);

            // console.log("interpolatedTarget", interpolatedTarget);

            cameraControlsScript.focus(
              interpolatedTarget,
              interpolatedPos,
              true,
            );
          } else if (fromCamState) {
            cameraControlsScript.focus(
              fromCamState.target,
              fromCamState.position,
              true,
            );
          }
        },
      );

      return () => {
        sub();
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    } else {
      cameraControlsScript.focus(target, position);
      return () => {
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    }
  }, [camState, layoutData]);

  return scriptRef;
};

export default useScrollCamera;
