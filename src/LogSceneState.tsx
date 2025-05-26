import { forwardRef, useImperativeHandle } from "react";
import { useApp } from "@playcanvas/react/hooks";

const LogSceneState = forwardRef((_, ref) => {
  const app = useApp();

  const logCameraPosition = () => {
    if (!app) return;
    const camera = app.root.findByName("camera");
    console.log("camera", camera);
    // console.log(camera?.getPosition(), camera?.getTarget());
  };

  const logSceneState = () => {
    console.log("scene state", app);
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );
    console.log("splatAssets", splatAssets[0]);
  };

  useImperativeHandle(ref, () => {
    return { logCameraPosition, logSceneState };
  });

  return null;
});

export default LogSceneState;
