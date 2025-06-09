import { Entity } from "@playcanvas/react";
import { Entity as PcEntity } from "playcanvas";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef, useState } from "react";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
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
  active,
  updateProgress,
  url,
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
}) => {
  const app = useApp();

  const [dataReady, setDataReady] = useState(false);

  const { data: splat } = useSplat(url);

  const gsplatRef = useRef<PcEntity | null>(null);

  useEffect(() => {
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    const splatAsset = splatAssets[id];
    splatAsset.on("progress", (received, length) => {
      const percent = Math.min(1, received / length) * 100;
      updateProgress(id, percent);
      if (percent === 100) {
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
  }, [splat, app, updateProgress, id, active, url]);

  return (
    <Entity name="splat" ref={gsplatRef}>
      <CustomGSplat
        id={id}
        active={active}
        asset={splat as Asset}
        dataReady={dataReady}
      />
    </Entity>
  );
};

export default Landscape;
