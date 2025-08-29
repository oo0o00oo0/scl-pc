// import { useEffect, useLayoutEffect, useRef } from "react";
// import type { CamState } from "@/libs/types/camera";
// import { Script, Vec2, Vec3 } from "playcanvas";
// import camStore from "@/state/camStore";
// import sceneStore from "@/state/sceneState";
// import {
//   getCameraInterpolationData,
//   getCurrentSectionIndex,
// } from "@/libs/utils/scrollUtils";
// import { SCENE_CONFIG } from "@/data/articles/3DUXD/3DUXD-config";
// import { clampAzimuthAngle } from "../utils/cameraUtils";

// const useScrollCamera = (
//   camState: CamState,
// ) => {
//   const scriptRef = useRef<Script>(null);
//   const setScriptRef = camStore((s) => s.setScriptRef);
//   const layoutData = sceneStore((state) => state.layoutData);

//   useLayoutEffect(() => {
//     setScriptRef(scriptRef.current);
//   }, []);

//   useEffect(() => {
//     if (!camState || !layoutData?.heights) return;

//     const {
//       position,
//       target,
//       delay = 0,
//       isScrollTarget = false,
//       cameraConstraints,
//     } = camState;

//     const { pitchRange, azimuth } = cameraConstraints;

//     const clampAnglesHandler = (angles: Vec2) => {
//       if (!pitchRange || !azimuth) return;
//       angles.x = Math.max(
//         pitchRange.min,
//         Math.min(pitchRange.max, angles.x),
//       );
//       angles.y = clampAzimuthAngle(angles.y, azimuth);
//     };

//     const cameraControlsScript = scriptRef.current!;
//     cameraControlsScript.on("clamp:angles", clampAnglesHandler);

//     if (isScrollTarget) {
//       const sub = camStore.subscribe(
//         (state) => state.scrollPosition,
//         (scrollPosition: number) => {
//           const interpolationData = getCameraInterpolationData(
//             scrollPosition,
//             layoutData.heights,
//             SCENE_CONFIG,
//           );

//           const { fromCamState, toCamState, progress, shouldInterpolate } =
//             interpolationData;

//           if (shouldInterpolate && fromCamState && toCamState) {
//             // Interpolate position between sections
//             const fromPos = fromCamState.position;
//             const toPos = toCamState.position;
//             const interpolatedPos = new Vec3();
//             interpolatedPos.lerp(fromPos, toPos, progress);

//             // Interpolate target between sections
//             const fromTarget = fromCamState.target;
//             const toTarget = toCamState.target;
//             const interpolatedTarget = new Vec3();
//             interpolatedTarget.lerp(fromTarget, toTarget, progress);

//             //@ts-ignore
//             cameraControlsScript.focus(
//               interpolatedTarget,
//               interpolatedPos,
//               true,
//             );
//           } else if (fromCamState) {
//             //@ts-ignore
//             cameraControlsScript.focus(
//               fromCamState.target,
//               fromCamState.position,
//               true,
//             );
//           }
//         },
//       );

//       return () => {
//         sub();
//         cameraControlsScript.off("clamp:angles", clampAnglesHandler);
//       };
//     } else {
//       // For non-scroll sections, move directly to position after delay
//       setTimeout(() => {
//         //@ts-ignore
//         cameraControlsScript.focus(target, position);
//       }, delay);

//       return () => {
//         cameraControlsScript.off("clamp:angles", clampAnglesHandler);
//       };
//     }
//   }, [camState, layoutData]);

//   return scriptRef;
// };

// export default useScrollCamera;
