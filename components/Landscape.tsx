import { Entity } from "@playcanvas/react";
import { Entity as PcEntity, Script } from "playcanvas";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
// import { GSplat } from "@playcanvas/react/components";
import { useSplatWithId } from "../hooks/use-asset";
import LandscapeScript from "../scripts/landscape";

// hello subby

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
  material: any; // Add material property
};

const Landscape = forwardRef(({
  id,
  url,
  active,
  updateProgress,
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
}, ref) => {
  const app = useApp();

  const scriptRef = useRef<LandscapeScript | null>(null);

  const [dataReady, setDataReady] = useState(false);

  const { data: splat } = useSplatWithId(url, id);

  const gsplatRef = useRef<PcEntity | null>(null);

  useImperativeHandle(ref, () => ({
    isLoaded: dataReady,
    animateIn: () => {
      const landscapeScript = scriptRef.current as LandscapeScript;
      landscapeScript.animateToOpacity(1, 500, true);
    },
    animateOut: () => {
      const landscapeScript = scriptRef.current as LandscapeScript;
      landscapeScript.animateToOpacity(0, 500, true);
    },
  }));

  useEffect(() => {
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );
    console.log("splatAssets", splatAssets);

    if (!splatAssets.length) return;

    const splatAsset = splatAssets.find((a) => (a as any).id === id);
    if (!splatAsset) return;

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

      console.log("GSplatComponent", gsplatComponent);
      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }
  }, [splat, app]);

  useEffect(() => {
    const landscapeScript = scriptRef.current as LandscapeScript;
    if (active) {
      landscapeScript.animateToOpacity(1, 500);
    } else {
      landscapeScript.animateToOpacity(0, 500);
    }
  }, [active]);

  return (
    <Entity name="splat" ref={gsplatRef}>
      <CustomGSplat
        id={id}
        active={active}
        asset={splat as Asset}
        dataReady={dataReady}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
});

export default Landscape;
