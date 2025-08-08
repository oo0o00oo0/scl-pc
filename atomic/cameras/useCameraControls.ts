import { useEffect, useRef } from "react";
import type { CamState } from "@/libs/types/camera";
import { Script, Vec2, Vec3 } from "playcanvas";
import { clampAzimuthAngle } from "@/libs/atomic/utils/cameraUtils";
import camStore from "@/state/camStore";
import { remap } from "@/libs/utils";
import sceneStore from "@/state/sceneState";

const useCameraControls = (
  camState: CamState,
) => {
  const scriptRef = useRef<Script>(null);
  const domData = sceneStore((state) => state.domData);

  const currentStartRef = useRef<number>(0);

  const scrollPositionRef = useRef<number>(0);

  const setScriptRef = camStore((s) => s.setScriptRef);

  const currentCamPos = useRef<Vec3>(new Vec3(0, 0, 0));

  useEffect(() => {
    if (!camState) return;

    setScriptRef;

    const {
      position,
      target,
      delay = 0,
      isScroll = true,
      cameraConstraints,
    } = camState;

    const { pitchRange, azimuth } = cameraConstraints;

    const clampAnglesHandler = (angles: Vec2) => {
      angles.x = Math.max(
        pitchRange.min,
        Math.min(pitchRange.max, angles.x),
      );

      angles.y = clampAzimuthAngle(angles.y, azimuth);
    };
    const cameraControlsScript = scriptRef.current!;
    cameraControlsScript.on("clamp:angles", clampAnglesHandler);

    setScriptRef(scriptRef.current);

    if (isScroll) {
      const p1 = currentCamPos.current;
      const p2 = position;

      const targ = target;

      if (domData?.height) {
        currentStartRef.current = scrollPositionRef.current;
      }

      const sub = camStore.subscribe(
        (state) => state.scrollPosition,
        (scrollPosition: number) => {
          scrollPositionRef.current = scrollPosition;

          if (!domData?.height) return;

          if (!domData) return;

          const isUp = domData.direction === "up";
          const start = currentStartRef.current;
          const end = domData.height + currentStartRef.current;

          let remapped: number;

          if (isUp) {
            remapped = 1 -
              Math.abs(1 - remap(scrollPosition, start, end, 1, 0));
          } else {
            remapped = Math.abs(remap(scrollPosition, start, end, 0, 1));
          }

          const interpolated = new Vec3();
          interpolated.lerp(p1, p2, remapped);
          //@ts-ignore
          cameraControlsScript.focus(targ, interpolated, true);
        },
      );

      currentCamPos.current = camState.position;
      return () => {
        sub();
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    } else {
      cameraControlsScript.on("clamp:angles", clampAnglesHandler);

      setTimeout(() => {
        //@ts-ignore
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      return () => {
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    }
  }, [domData, camState]);

  return scriptRef;
};

export default useCameraControls;
