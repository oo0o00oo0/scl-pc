import { useEffect } from "react";
import { useApp } from "@playcanvas/react/hooks";

const UnloadScene = () => {
  const app = useApp();

  useEffect(() => {
    const handleUnload = (e: KeyboardEvent) => {
      if (e.key === "u") {
        app.assets.filter(function (asset: any) {
          if (asset.loaded === true) asset.unload();

          return false;
        });

        console.log("rendernextframe - unload scene");
        app.renderNextFrame = true;
      }
    };

    window.addEventListener("keydown", handleUnload);

    return () => {
      window.removeEventListener("keydown", handleUnload);
    };
  }, []);

  return (
    <div>
      <h1>Unload Scene</h1>
    </div>
  );
};

export default UnloadScene;
