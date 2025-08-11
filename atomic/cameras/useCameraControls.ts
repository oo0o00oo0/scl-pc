import { useEffect, useRef } from "react";
import type { CamState } from "@/libs/types/camera";
import { Script, Vec2 } from "playcanvas";
import { clampAzimuthAngle } from "@/libs/atomic/utils/cameraUtils";

const useCameraControls = (
  camState: CamState,
) => {
  const scriptRef = useRef<Script>(null);

  useEffect(() => {
    if (!camState) return;
    const cameraControlsScript = scriptRef.current!;

    const {
      position,
      target,
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
    setTimeout(() => {
      //@ts-ignore
      cameraControlsScript.focus(target, position);
    }, 550);

    return () => {
      cameraControlsScript.off("clamp:angles", clampAnglesHandler);
    };
  }, [camState]);

  return scriptRef;
};

export default useCameraControls;
