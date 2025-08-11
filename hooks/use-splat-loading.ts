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
  url: string,
  load: boolean,
  updateProgress: (meta: AssetMeta, key: string) => void,
  onReady: (url: string) => void,
  active: boolean,
  opacityOverride: number,
) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();

  const { data: splat } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (splat) {
      const entity = gsplatRef.current;

      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;

      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        onReady(url);

        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }
  }, [splat, app, updateProgress, url]);

  useEffect(() => {
    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;
    // console.log("EFFECT", load, id);

    if (!load) {
      const handleUnload = () => {
        const splatAsset = app.assets.find(url, "gsplat");
        if (splatAsset && splatAsset.loaded) {
          splatAsset.unload();
          app.assets.remove(splatAsset);
          app.renderNextFrame = true;
        }
      };
      setTimeout(() => {
        landscapeScript.animateToOpacity(0, 400, () => {
          handleUnload();
        });
      }, 100);
    } else {
      if (active) {
        setTimeout(() => {
          landscapeScript.animateToOpacity(1 * opacityOverride, 400, () => {
            app.renderNextFrame = true;
          });
        }, 1000);
        // }, 400);
      } else {
        setTimeout(() => {
          landscapeScript.animateToOpacity(0, 400, () => {});
        }, 100);
      }
    }

    // console.log("---------");
  }, [active, splat, load, app, opacityOverride]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
