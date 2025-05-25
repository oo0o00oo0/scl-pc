import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";

import CameraControlsScript from "./scripts/camera-controls";

const CameraControls = () => {
  return (
    <Entity
      name="camera"
      position={[
        -7.741541385650635,
        6.938564777374268,
        -13.669482231140137,
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
