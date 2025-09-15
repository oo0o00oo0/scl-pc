// import { Entity } from "@playcanvas/react";
// import { Camera, Script } from "@playcanvas/react/components";
// import type { CamState } from "@/libs/types/camera.ts";
// import { Mat4, Script as PcScript, Vec4 } from "playcanvas";
// import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";
// import useScrollCamera from "./use-scroll-camera";

// const CameraControls = (
//   {
//     camState,
//     clearColor,
//     enableOrbit = true,
//     enableZoom = true,
//     enablePan = true,
//     onChange = () => {},
//     CameraControlsScript,
//     layoutData = null,
//   }: {
//     camState: CamState;
//     clearColor: string;
//     enableOrbit: boolean;
//     enableZoom: boolean;
//     enablePan: boolean;
//     onChange: (camData: {
//       viewProjMatrix: Mat4;
//       cameraRect: Vec4;
//       canvasWidth: number;
//       canvasHeight: number;
//     }) => void;
//     layoutData?: any;
//     CameraControlsScript: PcScript;
//   },
// ) => {
//   const { entity } = useRenderOnCameraChange(onChange);

//   const scriptRef = useScrollCamera(camState, layoutData);

//   return (
//     <Entity
//       ref={entity}
//       position={[camState.position.x, camState.position.y, camState.position.z]}
//       name="camera"
//     >
//       <Script
//         ref={scriptRef}
//         script={CameraControlsScript}
//         enableZoom={enableZoom}
//         enablePan={enablePan}
//         enableOrbit={enableOrbit}
//       />
//       <Camera
//         nearClip={1}
//         farClip={1000}
//         clearColor={clearColor}
//       />
//     </Entity>
//   );
// };

// export default CameraControls;
