import { useEffect, useRef } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

import { clearSplatCaches, getSplatCacheStats } from "./use-splat-with-id";

export const getBinaryDataCacheStats = getSplatCacheStats;
export const clearBinaryDataCache = clearSplatCaches;

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
  const entityRef = useRef<
    { destroyEntity: () => void } | null
  >(null);

  const app = useApp();

  const { data: splat } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (splat) {
      if (!splat.loaded && !splat.loading) {
        console.log("Loading asset (from blob URL):", url.split("/").pop());
        app.assets.load(splat);
        return;
      }

      const entity = gsplatRef.current;

      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;

      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        // setHasLoaded(true);

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }
  }, [splat, splat?.loaded, app, url]);

  useEffect(() => {
    if (!splat) return;
    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;

    let activateTimeout: ReturnType<typeof setTimeout> | null = null;
    let deactivateTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleUnload = () => {
      const splatAsset = splat;

      if (splatAsset && splatAsset.loaded) {
        splatAsset.unload();
      }
    };

    if (active) {
      activateTimeout = setTimeout(() => {
        if (active) {
          landscapeScript.animateToOpacity(1, 1800, () => {
            if (active) {
              onReady(url);
              app.renderNextFrame = true;
            }
          });
        }
      }, 400);
    } else {
      if (!splat.loaded) return;
      deactivateTimeout = setTimeout(() => {
        if (!active) {
          landscapeScript.animateToOpacity(0, 1000, () => {
            // Destroy the entity using the forward ref
            if (entityRef.current) {
              entityRef.current.destroyEntity();
            }
            handleUnload();

            app.renderNextFrame = true;
          });
        }
      }, 0);
    }

    // Cleanup function to cancel pending timeouts
    return () => {
      if (activateTimeout) {
        clearTimeout(activateTimeout);
      }
      if (deactivateTimeout) {
        clearTimeout(deactivateTimeout);
      }
    };
  }, [active, splat, load, app, url]);

  return {
    entityRef,
    splat,
    gsplatRef,
    scriptRef,
  };
};
