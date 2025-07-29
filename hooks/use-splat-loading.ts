import { useEffect, useRef } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
};

export const useSplatLoading = (
  id: number,
  url: string,
  load: boolean,
  updateProgress: (meta: AssetMeta) => void,
  onReady: (id: number) => void,
  active: boolean,
  opacityOverride: number,
) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();

  const { data: splat } = useDelayedSplat(url, updateProgress, load);

  useEffect(() => {
    if (splat) {
      const entity = gsplatRef.current;

      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;

      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        onReady(id);
        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }
  }, [splat, app, id, updateProgress, url]);

  useEffect(() => {
    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;

    // if (!active) {
    if (!load) {
      const handleUnload = () => {
        const splatAsset = app.assets.find(url, "gsplat");
        if (splatAsset && splatAsset.loaded) {
          splatAsset.unload();
          app.assets.remove(splatAsset);
          app.renderNextFrame = true;
        }
      };
      landscapeScript.animateToOpacity(0, 1000, () => {
        handleUnload();
      });
    } else {
      landscapeScript.animateToOpacity(1 * opacityOverride, 1000, () => {
        app.renderNextFrame = true;
      });
    }
  }, [active, id, splat, load, app, opacityOverride]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
