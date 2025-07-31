import { useEffect, useRef } from "react";
import type { CamState } from "@/libs/types/camera";
import { Script, Vec2 } from "playcanvas";
import { clampAzimuthAngle } from "@/libs/atomic/utils/cameraUtils";

const useCameraControls = (
  camState: CamState,
) => {
  const scriptRef = useRef<Script>(null);

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
    const cameraControlsScript = scriptRef.current!;

    const {
      position,
      target,
      delay = 0,
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
  }, [
    camState,
  ]);

  return scriptRef;
};

export default useCameraControls;
