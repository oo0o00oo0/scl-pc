import { Entity } from "@playcanvas/react";
import { Entity as PcEntity } from "playcanvas";
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

const Landscape = forwardRef(({
  id,
  url,
  active,
  updateProgress,
  position = new Vec3(0, 0, 0),
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
  position?: Vec3;
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

    if (!splatAssets.length) return;

    // Try to find by custom ID first
    let splatAsset = splatAssets.find((a) => (a as any).id === id);

    // If not found by ID, fall back to array indexing
    if (!splatAsset) {
      splatAsset = splatAssets[id];
    }

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
        dataReady={dataReady}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
});

export default Landscape;
