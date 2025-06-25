import { Entity } from "@playcanvas/react";
import { Entity as PcEntity } from "playcanvas";
import { type Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { Script as ScriptComponent } from "@playcanvas/react/components";
import { useEffect, useRef } from "react";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
import { useSplatWithId } from "../hooks/use-asset";
import LandscapeScript from "../scripts/landscape";
import { Vec3 } from "playcanvas";

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
};

const Landscape = ({
  id,
  url,
  currentSceneId,
  updateProgress,
  onReady,
  position = new Vec3(0, 0, 0),
  rotation = new Vec3(0, 0, 0),
  load = false,
}: {
  id: number;
  currentSceneId: number | null;
  updateProgress: (id: number, progress: number) => void;
  url: string;
  load: boolean;
  onReady: (id: number) => void;
  position?: Vec3;
  rotation?: Vec3;
}) => {
  const app = useApp();

  const scriptRef = useRef<LandscapeScript | null>(null);

  const { data: splat } = useSplatWithId(url, id, {}, load);

  const gsplatRef = useRef<PcEntity | null>(null);

  useEffect(() => {
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    let splatAsset = splatAssets.find((a) => (a as any).id === id);

    if (!splatAsset) {
      splatAsset = splatAssets[id];
    }

    if (!splatAsset) return;

    splatAsset.on("progress", (received, length) => {
      const percent = Math.min(1, received / length) * 100;
      updateProgress(id, percent);
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

    return () => {
      if (splatAsset) {
        splatAsset.off("progress");
      }
    };
  }, [splat, app, id, updateProgress]);

  // Separate effect for handling onReady
  useEffect(() => {
    if (!splat) return;

    const entity = gsplatRef.current;
    const gsplatComponent = entity?.findComponent("gsplat") as
      | GSplatComponent
      | undefined;
    const gsplatInstance = gsplatComponent?.instance;

    if (gsplatInstance) {
      const timeoutId = setTimeout(() => {
        onReady(id);
      });
      return () => clearTimeout(timeoutId);
    }
  }, [splat, id, onReady]);

  // Effect for opacity animation
  useEffect(() => {
    if (!splat) return;

    const landscapeScript = scriptRef.current as LandscapeScript;
    if (currentSceneId === id) {
      setTimeout(() => {
        landscapeScript.animateToOpacity(1, 1000);
      }, 1000);
    } else {
      landscapeScript.animateToOpacity(0, 1000);
    }
  }, [currentSceneId, id, splat]);

  useEffect(() => {
    let didUnload = false;

    const handleUnload = () => {
      const splatAssets = app.assets.filter(
        (a) => (a.type as string) === "gsplat",
      );
      let splatAsset = splatAssets.find((a) => (a as any).id === id);
      if (splatAsset && splatAsset.loaded) {
        splatAsset.unload();
        app.renderNextFrame = true;
        didUnload = true;
        console.log("unloaded", splatAsset);
      }
    };

    if (!load) {
      handleUnload();
    }

    return () => {
      if (!didUnload) {
        handleUnload();
      }
    };
  }, [load, id, app]);

  return (
    <Entity
      rotation={[rotation.x, rotation.y, rotation.z]}
      position={[position.x, position.y, position.z]}
      name="splat"
      ref={gsplatRef}
    >
      <CustomGSplat
        id={id}
        asset={splat as Asset}
      />
      <ScriptComponent ref={scriptRef} script={LandscapeScript} />
    </Entity>
  );
};

export default Landscape;
