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
  active,
  updateProgress,
  onReady,
  position = new Vec3(0, 0, 0),
  rotation = new Vec3(0, 0, 0),
  load = false,
  opacityOverride = 1,
}: {
  id: number;
  active: boolean;
  updateProgress: (id: number, progress: number) => void;
  url: string;
  load: boolean;
  onReady: (id: number) => void;
  position?: Vec3;
  rotation?: Vec3;
  opacityOverride?: number;
}) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();

  const { data: splat } = useSplatWithId(url, id, {}, load);

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
        // [RENDER:INIT] Request render after gsplat initialization
        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          // [RENDER:SORT] Request render after sorter update
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

  // Effect for opacity animation and cleanup
  useEffect(() => {
    // Remove this line as it's handled by CustomGSplat
    // app.autoRender = false;
    let didUnload = false;

    if (!splat) return;

    const landscapeScript = scriptRef.current as LandscapeScript;

    if (!load) {
      const handleUnload = () => {
        const splatAssets = app.assets.filter(
          (a) => (a.type as string) === "gsplat",
        );
        let i = 0;
        let splatAsset = splatAssets.find((a) => {
          i++;
          return (a as any).id === id;
        });
        if (splatAsset && splatAsset.loaded) {
          // First unload the asset
          splatAsset.unload();
          // Then remove it from the registry
          app.assets.remove(splatAsset);
          // [RENDER:UNLOAD] Request render after unloading asset
          app.renderNextFrame = true;
          didUnload = true;
        }
      };
      handleUnload();
    } else if (active) {
      console.log("active", opacityOverride);
      setTimeout(() => {
        landscapeScript.animateToOpacity(1 * opacityOverride, 1000);
      }, 1000);
    } else {
      landscapeScript.animateToOpacity(0, 1000);
    }

    return () => {
      if (!didUnload && !load) {
        const splatAssets = app.assets.filter(
          (a) => (a.type as string) === "gsplat",
        );
        const splatAsset = splatAssets.find((a) => (a as any).id === id);
        if (splatAsset && splatAsset.loaded) {
          splatAsset.unload();
          app.assets.remove(splatAsset);
          // [RENDER:CLEANUP] Request render after cleanup
          app.renderNextFrame = true;
        }
      }
    };
  }, [active, id, splat, load, app, opacityOverride]);

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
