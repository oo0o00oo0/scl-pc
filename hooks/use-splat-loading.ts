import { useEffect, useRef, useState } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

// Import the new cache utilities
import { clearSplatCaches, getSplatCacheStats } from "./use-splat-with-id";

// Re-export for backward compatibility
export const getBinaryDataCacheStats = getSplatCacheStats;
export const clearBinaryDataCache = clearSplatCaches;

// Utility function to debug PlayCanvas app asset state

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
    { getEntity: () => PcEntity | null; destroyEntity: () => void } | null
  >(null);

  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const hookId = `${url.split("/").pop()}-${instanceId.current}`;

  const app = useApp();

  const { data: splat } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (splat) {
      // With the new single-fetch approach, assets are always created from blob URLs
      // No need for complex restoration logic
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
        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });

        console.log(
          "✅ GSplat instance ready - binary data was cached during fetch",
        );
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
        // Unload from PlayCanvas app to free VRAM
        splatAsset.unload();
        entityRef.current?.destroyEntity();
        app.renderNextFrame = true;

        console.log(
          `✅ [${hookId}] Asset unloaded, VRAM freed. Binary data remains cached.`,
        );
      }
    };

    if (active) {
      activateTimeout = setTimeout(() => {
        landscapeScript.animateToOpacity(1, 1800, () => {
          console.log(`Animation completed for ${url.split("/").pop()}`);
          onReady(url);
          app.renderNextFrame = true;
        });
      }, 400);
    } else {
      console.log(
        "animate to OFF from not active",
        splat,
        url.split("/").pop(),
      );

      if (!splat.loaded) return;
      deactivateTimeout = setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1000, () => {
          handleUnload();
        });
      }, 0);
    }

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
