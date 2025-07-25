import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useApp } from "@playcanvas/react/hooks";

const LogSceneState = forwardRef((_, ref) => {
  const app = useApp();

  const logCameraPosition = () => {
    console.log("logCameraPosition");
    if (!app) return;
    const camera = app.root.findByName("camera");
    console.log("camera", camera);
    const position = camera?.getPosition();
    console.log(
      `new Vec3(${position?.x.toFixed(3)}, ${position?.y.toFixed(3)}, ${
        position?.z.toFixed(3)
      })`,
    );
    // console.log(camera?.getPosition(), camera?.getTarget());
  };

  const logSceneState = () => {
    console.log("logSceneState");
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );
    const stats = app.stats;
    console.log("splatAssets", splatAssets[0]);
    console.log("stats", stats);
  };

  useImperativeHandle(ref, () => {
    return { logCameraPosition, logSceneState };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s") {
        logSceneState();
      }
      if (e.key === "c") {
        logCameraPosition();
      }
    };

    console.log("loggg");

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [app]);

  return null;
});

export default LogSceneState;
