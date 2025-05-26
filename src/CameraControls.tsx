import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useEffect, useRef } from "react";

import CameraControlsScript from "./scripts/camera-controls";
import { Vec3 } from "playcanvas";

const CameraControls = () => {
  const entityRef = useRef<any>(null);

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);
      console.log("cameraControlsScript", cameraControlsScript.focus);

      if (cameraControlsScript) {
        const intervalId = setInterval(() => {
          const target = new Vec3(
            Math.random() * 10 - 5 * 2,
            0,
            Math.random() * 10 - 5,
          );

          const position = new Vec3(
            (Math.random() * 10 - 5) * 3,
            5,
            (Math.random() * 10 - 5) * 3,
          );
          cameraControlsScript.focus(target, position);
        }, 3000);

        return () => {
          clearInterval(intervalId);
        };
      }
    }
  }, []);

  return (
    <Entity
      ref={entityRef}
      name="camera"
      position={[
        -10.862204551696777,
        2.429239273071289,
        -10.834569931030273,
      ]}
    >
      <Script
        script={CameraControlsScript}
      />
      <Camera
        nearClip={2}
        farClip={100}
        clearColor="#F1F1F1"
      />
    </Entity>
  );
};

export default CameraControls;
