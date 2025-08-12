import { useEffect, useRef, useState } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

// Global cache for binary data to avoid refetching
const binaryDataCache = new Map<string, ArrayBuffer>();

// Track pending requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<ArrayBuffer>>();

// Utility function to clear cached binary data (for memory management)
export const clearBinaryDataCache = () => {
  console.log(`Clearing binary data cache with ${binaryDataCache.size} items`);
  binaryDataCache.clear();
  pendingRequests.clear();
};

// Utility function to get cache stats
export const getBinaryDataCacheStats = () => ({
  size: binaryDataCache.size,
  keys: Array.from(binaryDataCache.keys()),
  totalSizeMB: Array.from(binaryDataCache.values()).reduce(
    (total, buffer) => total + buffer.byteLength,
    0,
  ) / (1024 * 1024),
});

// Utility function to debug PlayCanvas app asset state
export const debugPlayCanvasAssets = (app: any) => {
  const loadedAssets = app.assets.filter((asset: any) => asset.loaded);
  const gsplatAssets = loadedAssets.filter((asset: any) =>
    asset.type === "gsplat"
  );

  console.log("PlayCanvas Asset Debug:", {
    totalAssets: app.assets.list().length,
    loadedAssets: loadedAssets.length,
    gsplatAssets: gsplatAssets.length,
    gsplatDetails: gsplatAssets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      loaded: asset.loaded,
      hasResource: !!asset.resource,
      resourceType: asset.resource?.constructor?.name,
    })),
  });

  return {
    totalAssets: app.assets.list().length,
    loadedAssets: loadedAssets.length,
    gsplatAssets: gsplatAssets.length,
  };
};

// Function to fetch and cache binary data
const fetchAndCacheBinaryData = async (url: string): Promise<ArrayBuffer> => {
  // Check if already cached
  const cached = binaryDataCache.get(url);
  if (cached) {
    console.log("✅ Using cached binary data for:", url);
    return cached;
  }

  // Check if already being fetched
  const pendingRequest = pendingRequests.get(url);
  if (pendingRequest) {
    console.log("⏳ Waiting for pending request for:", url);
    return pendingRequest;
  }

  console.log("🌐 Fetching binary data for:", url);
  console.trace("📍 Fetch called from:"); // This will show the call stack

  // Create and store the promise to prevent duplicate requests
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("arrayBuffer::::::::::::::", arrayBuffer);
      binaryDataCache.set(url, arrayBuffer);
      console.log(
        `💾 Cached binary data for ${url} (${
          (arrayBuffer.byteLength / 1024 / 1024).toFixed(2)
        }MB)`,
      );

      return arrayBuffer;
    } finally {
      // Remove from pending requests when done (success or failure)
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, fetchPromise);
  return fetchPromise;
};

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
    console.log(`🔍 [${hookId}] useSplatLoading first useEffect:`, {
      hasSplat: !!splat,
      splatLoaded: splat?.loaded,
      splatLoading: splat?.loading,
      splatId: splat?.id,
      hasResource: !!splat?.resource,
      resourceType: splat?.resource?.constructor?.name,
      hasInstantiate:
        typeof (splat?.resource as any)?.instantiate === "function",
      url: url.split("/").pop(),
    });

    if (splat) {
      // If asset was unloaded, check if we have cached binary data
      if (!splat.loaded && !splat.loading) {
        const cachedBinaryData = binaryDataCache.get(url);

        if (cachedBinaryData) {
          console.log(
            "Restoring asset from cached binary data:",
            url.split("/").pop(),
          );

          // Create a new asset from the cached binary data
          try {
            // Create a Blob from the cached binary data
            const blob = new Blob([cachedBinaryData]);
            const blobUrl = URL.createObjectURL(blob);

            // Update the asset's file data to use the cached binary
            (splat as any).file = {
              url: blobUrl,
              size: cachedBinaryData.byteLength,
            };

            // Add load event listener
            splat.once("load", () => {
              console.log(
                `Asset restored from cached binary data for ${
                  url.split("/").pop()
                }, hasResource: ${!!splat.resource}`,
              );
              // Clean up the blob URL
              URL.revokeObjectURL(blobUrl);
            });

            // Load the asset with the cached data
            app.assets.load(splat);
            return; // Exit early, let the load event trigger this effect again
          } catch (error) {
            console.error("Error restoring from cached binary data:", error);
            // Fall back to network fetch
            binaryDataCache.delete(url);
          }
        }

        // No cached data or restoration failed, load normally
        console.log(
          "No cached binary data, loading asset normally:",
          url.split("/").pop(),
        );
        // Add load event listener to track when reload completes
        splat.once("load", () => {
          console.log("LOADEDDAATAAAA:", splat.resource);
          console.log(
            `Asset load completed for ${
              url.split("/").pop()
            }, hasResource: ${!!splat.resource}`,
          );
        });
        app.assets.load(splat);
        return; // Exit early, let the load event trigger this effect again
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

        // Don't cache binary data on first load - only cache when needed for unloading
        // This avoids duplicate network requests during initial loading
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

    const handleUnload = async () => {
      const splatAsset = splat;
      console.log("handleUnload called for:", {
        hasAsset: !!splatAsset,
        assetLoaded: splatAsset?.loaded,
        assetId: splatAsset?.id,
        url: url.split("/").pop(),
      });

      if (splatAsset && splatAsset.loaded) {
        console.log("Caching binary data and unloading asset:", splatAsset.id);

        // Cache the binary data if not already cached
        if (!binaryDataCache.has(url)) {
          try {
            console.log(
              `🔄 [${hookId}] Fetching and caching binary data before unload:`,
              url,
            );
            await fetchAndCacheBinaryData(url);
          } catch (error) {
            console.error(
              `❌ [${hookId}] Failed to cache binary data before unload:`,
              error,
            );
          }
        } else {
          console.log(
            `✅ [${hookId}] Binary data already cached, skipping fetch for:`,
            url,
          );
        }

        // Debug asset state before unloading
        console.log("Asset state before unload:", {
          loaded: splatAsset.loaded,
          loading: splatAsset.loading,
          hasResource: !!splatAsset.resource,
          resourceType: splatAsset.resource?.constructor?.name,
        });

        // Unload from PlayCanvas app to free VRAM
        splatAsset.unload();

        // Debug asset state after unloading
        console.log("Asset state after unload:", {
          loaded: splatAsset.loaded,
          loading: splatAsset.loading,
          hasResource: !!splatAsset.resource,
          resourceType: splatAsset.resource?.constructor?.name,
        });

        console.log("Asset unloaded, VRAM should be freed for:", splatAsset.id);

        // Debug PlayCanvas app state after unloading
        debugPlayCanvasAssets(app);

        // DO NOT remove from registry - this breaks React Query cache consistency
        // app.assets.remove(splatAsset);
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
