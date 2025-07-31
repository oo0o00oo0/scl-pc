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

  useEffect(() => {
    // const cameraControlsScript = scriptRef.current!;

    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (!isMobile) {
      // const handlePassivePointerMove = (event: PointerEvent) => {
      //   if (isMobile && event.pointerType === "touch" && event.pressure > 0) {
      //     return;
      //   }

      //   const pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      //   const pointerY = (event.clientY / window.innerHeight) * 2 - 1;

      //   const xOffset = pointerX * 10;
      //   const yOffset = -pointerY * 10;

      //   //@ts-ignore
      //   cameraControlsScript.setGentleMovement(xOffset, yOffset);
      // };
      // window.addEventListener("pointermove", handlePassivePointerMove);
      return () => {
        // window.removeEventListener("pointermove", handlePassivePointerMove);
      };
    }
  }, []);

  useEffect(() => {
    const p1 = new Vec3(1, 4., -10);
    const p2 = new Vec3(-0.1, 4, 0);
    const targ = new Vec3(-1.1, 4, 9);

    const cameraControlsScript = scriptRef.current!;

    if (domData?.top) {
      currentStartRef.current = scrollPositionRef.current;
      console.log("domData", domData.top);
    }

    const sub = camStore.subscribe(({ scrollPosition }) => {
      scrollPositionRef.current = scrollPosition;

      if (!domData?.top) return;

      const endPointer = domData?.top + currentStartRef.current;

      const remapped = remap(
        scrollPosition,
        currentStartRef.current,
        endPointer,
        0,
        1,
      );

      // console.log("REMAP", remapped);
      //
      const interpolated = new Vec3();
      interpolated.lerp(p1, p2, remapped);

      //  console.log(interpolated);

      // console.log("SCROLL POSITION", interpolated);
      // console.log("FOCUSING", interpolated);
      //@ts-ignore
      cameraControlsScript.focus(targ, interpolated, true);
    });

    return () => {
      sub();
    };
  }, [domData]);

  // useEffect(() => {
  //   const cameraControlsScript = scriptRef.current!;

  //   const {
  //     position,
  //     target,
  //     delay = 0,
  //     cameraConstraints,
  //   } = camState;

  //   const { pitchRange, azimuth } = cameraConstraints;

  //   const clampAnglesHandler = (angles: Vec2) => {
  //     angles.x = Math.max(
  //       pitchRange.min,
  //       Math.min(pitchRange.max, angles.x),
  //     );

  //     angles.y = clampAzimuthAngle(angles.y, azimuth);
  //   };

  //   cameraControlsScript.on("clamp:angles", clampAnglesHandler);

  //   setTimeout(() => {
  //     //@ts-ignore
  //     cameraControlsScript.focus(
  //       target,
  //       position,
  //     );
  //   }, delay);

  //   return () => {
  //     cameraControlsScript.off("clamp:angles", clampAnglesHandler);
  //   };
  // }, [
  //   camState,
  // ]);

  return scriptRef;
};

export default useCameraControls;
