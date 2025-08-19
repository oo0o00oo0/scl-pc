import { useEffect, useRef } from "react";
import type { CamState } from "@/libs/types/camera";
import { Script, Vec3 } from "playcanvas";
import camStore from "@/state/camStore";
import sceneStore from "@/state/sceneState";
import {
  getCameraInterpolationData,
  getCurrentSectionIndex,
} from "@/libs/utils/scrollUtils";
import SceneConfig from "@/data/articles/3DUXD/3DUXD-config";

const useScrollCamera = (
  camState: CamState,
) => {
  const scriptRef = useRef<Script>(null);
  const setScriptRef = camStore((s) => s.setScriptRef);
  const setActive = sceneStore((s) => s.setActive);
  const layoutData = sceneStore((state) => state.layoutData);

  // Section index tracking - independent of camera movement
  useEffect(() => {
    if (!layoutData?.heights) return;

    const sub = camStore.subscribe(
      (state) => state.scrollPosition,
      (scrollPosition: number) => {
        const currentSectionIndex = getCurrentSectionIndex(
          scrollPosition,
          layoutData.heights,
        );

        setActive(currentSectionIndex);
      },
    );

    return () => {
      sub();
    };
  }, [layoutData, setActive]);

  useEffect(() => {
    if (!camState || !layoutData?.heights) return;

    const {
      position,
      target,
      delay = 0,
      isScroll = false,
      cameraConstraints,
    } = camState;

    // const { pitchRange, azimuth } = cameraConstraints;

    // const clampAnglesHandler = (angles: Vec2) => {
    //   angles.x = Math.max(
    //     pitchRange.min,
    //     Math.min(pitchRange.max, angles.x),
    //   );
    //   angles.y = clampAzimuthAngle(angles.y, azimuth);
    // };

    const cameraControlsScript = scriptRef.current!;
    // cameraControlsScript.on("clamp:angles", clampAnglesHandler);
    setScriptRef(scriptRef.current);

    if (isScroll) {
      // For scroll-enabled sections, interpolate based on scroll progress within the section
      const sub = camStore.subscribe(
        (state) => state.scrollPosition,
        (scrollPosition: number) => {
          const { camStateTest } = SceneConfig;

          const interpolationData = getCameraInterpolationData(
            scrollPosition,
            layoutData.heights,
            camStateTest,
          );

          const { fromCamState, toCamState, progress, shouldInterpolate } =
            interpolationData;

          // console.log("Camera interpolation:", {
          //   shouldInterpolate,
          //   progress: progress.toFixed(2),
          //   from: fromCamState
          //     ? getCurrentSectionIndex(scrollPosition, layoutData.heights)
          //     : null,
          //   to: toCamState
          //     ? getCurrentSectionIndex(scrollPosition, layoutData.heights) + 1
          //     : null,
          // });

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

            //@ts-ignore
            cameraControlsScript.focus(
              interpolatedTarget,
              interpolatedPos,
              true,
            );
          } else if (fromCamState) {
            // Use current section's camera position
            //@ts-ignore
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
        // cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    } else {
      // For non-scroll sections, move directly to position after delay
      setTimeout(() => {
        //@ts-ignore
        cameraControlsScript.focus(target, position);
      }, delay);

      return () => {
        // cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    }
  }, [camState, layoutData]);

  return scriptRef;
};

export default useScrollCamera;
