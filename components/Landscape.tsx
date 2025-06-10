import { Entity } from "@playcanvas/react";
import { Entity as PcEntity } from "playcanvas";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import {
  GSplat,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
// import { GSplat } from "@playcanvas/react/components";
// import { useSplatWithId } from "../hooks/use-asset";
import { useSplatWithId } from "../hooks/use-asset";
import LandscapeScript from "../scripts/landscape";
import { Vec3 } from "playcanvas";

// hello subby

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
  material: any; // Add material property
};

const Landscape = ({
  id,
  url,
  active,
  updateProgress,
  position = new Vec3(0, 0, 0),
  onReady,
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
  onReady: () => void;
  position?: Vec3;
}) => {
  const app = useApp();

  const scriptRef = useRef<LandscapeScript | null>(null);

  const { data: splat } = useSplatWithId(url, id);

  const gsplatRef = useRef<PcEntity | null>(null);

  useEffect(() => {
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    let splatAsset = splatAssets.find((a) => (a as any).id === id);
    console.log("splatAsset", splatAsset);

    if (!splatAsset) {
      splatAsset = splatAssets[id];
    }

    if (!splatAsset) return;

    splatAsset.on("progress", (received, length) => {
      const percent = Math.min(1, received / length) * 100;
      updateProgress(id, percent);
    });

    if (splat) {
      onReady();
      console.log("SPLAT EXIST");
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
  }, [splat, app, id, updateProgress]);

  useEffect(() => {
    const landscapeScript = scriptRef.current as LandscapeScript;
    if (active) {
      setTimeout(() => {
        landscapeScript.animateToOpacity(1, 500);
      }, 200);
    } else {
      landscapeScript.animateToOpacity(0, 100);
    }
  }, [active]);

  return (
    <Entity
      position={[position.x, position.y, position.z]}
      name="splat"
      ref={gsplatRef}
    >
      <CustomGSplat
        id={id}
        active={active}
        asset={splat as Asset}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
};

export default Landscape;
