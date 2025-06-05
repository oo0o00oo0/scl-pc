import { Entity } from "@playcanvas/react";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef, useState } from "react";
import { GSplat } from "../atomic/splats/CustomGSplat";
// import { GSplat } from "@playcanvas/react/components";
import { useSplat } from "../hooks/use-asset";

// hello subby

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
  updateProgress,
  url,
}: {
  id: number;
  swirl: any;
  updateProgress: (id: number, progress: number) => void;
  url: string;
}) => {
  const app = useApp();

  const [dataReady, setDataReady] = useState(false);

  const { data: splat } = useSplat(url);

  const gsplatRef = useRef<React.ElementRef<typeof Entity>>(null);

  useEffect(() => {
    // app.autoRender = false;

    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    const splatAsset = splatAssets[id];
    splatAsset.on("progress", (received, length) => {
      const percent = Math.min(1, received / length) * 100;
      updateProgress(id, percent);
      if (percent === 100) {
        // app.autoRender = false;
        setDataReady(true);
      }
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
        });
      }
    }
  }, [splat, app, updateProgress, id, swirl, url]);

  return (
    <Entity name="splat" ref={gsplatRef}>
      <GSplat
        id={id}
        swirl={swirl}
        asset={splat as Asset}
        dataReady={dataReady}
      />
    </Entity>
  );
};

export default Landscape;
