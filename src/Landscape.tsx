import { Entity } from "@playcanvas/react";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
import { GSplat } from "./CustomGSplat";
// import { GSplat } from "@playcanvas/react/components";
import { useSplat } from "./hooks/use-asset";

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
};

const Landscape = ({
  id,
  swirl,
  setProgress,
  setLoaded,
  url,
}: {
  id: number;
  swirl: any;
  setProgress: (id: string, progress: string) => void;
  url: string;
  setLoaded: (loaded: boolean) => void;
}) => {
  const app = useApp();
  const { data: splat } = useSplat(url);

  const gsplatRef = useRef<React.ElementRef<typeof Entity>>(null);

  useEffect(() => {
    // app.autoRender = false;

    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    const splatAsset = splatAssets[id];
    console.log("splatAsset", id, ":", splatAsset);
    splatAsset.on("progress", (received, length) => {
      const percent = (Math.min(1, received / length) * 100).toFixed(0);

      setProgress(id, percent);
    });

    if (splat) {
      const entity = gsplatRef.current;
      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;
      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
          console.log("updated");
        });
      }
    }
  }, [splat, app, setProgress]);

  return (
    <Entity name="splat" ref={gsplatRef}>
      <GSplat swirl={swirl} asset={splat as Asset} />
    </Entity>
  );
};

export default Landscape;
