import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useRef } from "react";

import CameraControlsScript from "../../scripts/camera-controls";
// import { CamState } from "../../../../state/store";

const CameraControls = (
  { camState }: {
    camState: {
      activeCameraPosition: [number, number, number];
      activeCameraTarget: [number, number, number];
      delay?: number;
    };
  },
) => {
  console.log("camState", camState);
  // const app = useApp();
  // const { activeCameraPosition, activeCameraTarget, delay = 0 } = camState;
  const entityRef = useRef<any>(null);

  // useEffect(() => {
  //   if (entityRef.current) {
  //     const scriptComponent = entityRef.current.script;
  //     const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

  //     if (!cameraControlsScript) return;

  //     setTimeout(() => {
  //       cameraControlsScript.focus(
  //         activeCameraTarget,
  //         activeCameraPosition,
  //       );
  //     }, delay);

  //     app.autoRender = false;
  //   }
  // }, [activeCameraTarget, activeCameraPosition, delay, app]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
      position={[10, 10, 10]}
    >
      <Script
        script={CameraControlsScript}
      />
      <Camera
        nearClip={2}
        farClip={100}
        clearColor="#ffffff"
      />
    </Entity>
  );
};

export default CameraControls;
