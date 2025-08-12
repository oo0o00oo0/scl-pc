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
  const activeRef = useRef(active);

  // Create a unique identifier for this hook instance for debugging
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const hookId = `${url.split("/").pop()}-${instanceId.current}`;

  const app = useApp();

  const [hasLoaded, setHasLoaded] = useState(false);

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
        setHasLoaded(true);

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
    // console.log("RERAN", url.split("/").pop());
    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;

    // Store timeout IDs for cleanup
    let activateTimeout: ReturnType<typeof setTimeout> | null = null;
    let deactivateTimeout: ReturnType<typeof setTimeout> | null = null;

    // Update ref to track current active state to avoid stale closures
    activeRef.current = active;

    const handleUnload = () => {
      const splatAsset = splat;

      if (splatAsset && splatAsset.loaded) {
        // Unload from PlayCanvas app to free VRAM
        splatAsset.unload();

        console.log(
          `✅ [${hookId}] Asset unloaded, VRAM freed. Binary data remains cached.`,
        );
      }
    };

    if (active) {
      console.log("Setting up activation timeout for:", {
        url: url.split("/").pop(),
        splatLoaded: splat?.loaded,
        splatLoading: splat?.loading,
        hasResource: !!splat?.resource,
      });

      activateTimeout = setTimeout(() => {
        // Check if still active when timeout executes
        if (activeRef.current) {
          console.log("Activation timeout fired - animate to ON from active", {
            url: url.split("/").pop(),
            splatLoaded: splat?.loaded,
            splatLoading: splat?.loading,
            hasResource: !!splat?.resource,
          });

          // Cancel any ongoing animation before starting new one
          if (landscapeScript.isAnimating()) {
            console.log(
              "Canceling ongoing animation before activating",
              url.split("/").pop(),
            );
          }
          landscapeScript.animateToOpacity(1, 1800, () => {
            // Double-check active state before calling onReady
            if (activeRef.current) {
              console.log(
                `Animation completed for ${
                  url.split("/").pop()
                }, calling onReady`,
              );
              onReady(url);
              app.renderNextFrame = true;
            }
          });
        }
      }, 400);
    } else {
      console.log("animate to OFF from not active", url.split("/").pop());
      deactivateTimeout = setTimeout(() => {
        // Check if still inactive when timeout executes
        if (!activeRef.current) {
          // Cancel any ongoing animation before starting new one
          if (landscapeScript.isAnimating()) {
            console.log(
              "Canceling ongoing animation before deactivating",
              url.split("/").pop(),
            );
          }
          landscapeScript.animateToOpacity(0, 1000, () => {
            // Double-check inactive state before unloading
            if (!activeRef.current) {
              handleUnload();
              app.renderNextFrame = true;
            }
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
  }, [active, splat, load, app, url, hasLoaded]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
