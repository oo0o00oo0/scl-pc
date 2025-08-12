import { useEffect, useRef } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

import { clearSplatCaches, getSplatCacheStats } from "./use-splat-with-id";

export const getBinaryDataCacheStats = getSplatCacheStats;
export const clearBinaryDataCache = clearSplatCaches;

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
    }
  }, [splat, splat?.loaded, app, url]);

  const handleEntityReady = () => {
    console.log("🎬 Entity ready - starting animation");
    if (!scriptRef.current) return;
    scriptRef.current.animateToOpacity(1, 1800, () => {
      if (active) {
        onReady(url);
        app.renderNextFrame = true;
      }
    });
  };

  useEffect(() => {
    if (!splat) return;
    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;

    let deactivateTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleUnload = () => {
      const splatAsset = splat;

      if (splatAsset && splatAsset.loaded) {
        splatAsset.unload();
      }
      if (entityRef.current) {
        entityRef.current.destroyEntity();
      }
    };

    if (active) {
      // Animation is triggered by onEntityReady callback from CustomGSplat
      // No timeout needed - entity creation drives the animation
      console.log("🎬 Landscape activated - waiting for entity creation");
    } else {
      if (!splat.loaded) return;
      deactivateTimeout = setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1000, () => {
          handleUnload();
        });
      }, 0);
    }

    // Cleanup function to cancel pending timeouts
    return () => {
      if (deactivateTimeout) {
        clearTimeout(deactivateTimeout);
      }
    };
  }, [active, splat, splat?.loaded, load, app, url]);

  return {
    entityRef,
    splat,
    gsplatRef,
    handleEntityReady,
    scriptRef,
  };
};
