import { useEffect, useRef, useState } from "react";
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
) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();

  const [hasLoaded, setHasLoaded] = useState(false);

  const { data: splat } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (splat) {
      const entity = gsplatRef.current;

      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;

      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        setHasLoaded(true);

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }
  }, [splat, app, url]);

  useEffect(() => {
    // console.log("RERAN", url.split("/").pop());
    const landscapeScript = scriptRef.current;

    const currentOpacity = landscapeScript?.opacity;

    if (!landscapeScript) return;
    const handleUnload = () => {
      const splatAsset = splat;
      if (splatAsset && splatAsset.loaded) {
        splatAsset.unload();
        app.assets.remove(splatAsset);
      }
    };

    if (active) {
      setTimeout(() => {
        console.log("animate to on from active", url.split("/").pop());
        landscapeScript.animateToOpacity(1, 1800, () => {
          onReady(url);
          app.renderNextFrame = true;
        });
      }, 400);
    } else if (currentOpacity === 1) {
      console.log("animate to off from not active", url.split("/").pop());
      setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1000, () => {
          handleUnload();
          app.renderNextFrame = true;
        });
      }, 0);
    }
  }, [active, splat, load, app, url, hasLoaded]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
