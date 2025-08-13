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
      console.log("Asset state check:", {
        url: url.split("/").pop(),
        loaded: splat.loaded,
        loading: splat.loading,
        hasResource: !!splat.resource,
      });

      if (!splat.loaded && !splat.loading) {
        console.log("🔄 Loading asset (from blob URL):", url.split("/").pop());
        app.assets.load(splat);
        return;
      }
    }
  }, [splat, splat?.loaded, app, url, active]); // Add active to deps

  const handleEntityReady = () => {
    console.log("🎬 Entity ready - starting animation");
    if (!scriptRef.current) return;

    scriptRef.current.animateToOpacity(1, 1800, () => {
      onReady(url);
      app.renderNextFrame = true;
    });
  };

  // console.log(app.assets);

  useEffect(() => {
    if (!splat) return;

    const landscapeScript = scriptRef.current;
    if (!landscapeScript) return;

    let animationTimeout: ReturnType<typeof setTimeout> | null = null;

    if (active) {
      // console.log("🎬 Landscape activated");
      // Entity creation will trigger handleEntityReady which starts animation
    } else {
      // console.log("🎬 Landscape deactivated");
      animationTimeout = setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1000, () => {
          // console.log("🎬 Deactivation animation complete - cleaning up");
          // Destroy entity first
          if (entityRef.current) {
            console.log("🗑️ Destroying entity");
            entityRef.current.destroyEntity();
          }
          // Then unload asset
          if (splat && splat.loaded) {
            console.log("🗑️ Unloading asset");
            splat.unload();
            console.log("🗑️ Asset unloaded, loaded state:", splat.loaded);
          }
        });
      }, 0);
    }

    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [active, splat]);

  return {
    entityRef,
    splat,
    gsplatRef,
    handleEntityReady,
    scriptRef,
  };
};
