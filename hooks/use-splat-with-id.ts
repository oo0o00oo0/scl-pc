/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from "@playcanvas/react/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { Application, Asset } from "playcanvas";

// TODO - dynamic logic for cache size based on device memory
const getMaxCacheSize = () => {
  const memory = (navigator as any).deviceMemory || 4; // GB
  const isMobile = /Mobile|Tablet/.test(navigator.userAgent);

  if (memory <= 2) return 50; // Low-end: 50MB
  if (memory <= 4 || isMobile) return 100; // Mid-range: 100MB
  return 200; // High-end: 200MB
};

// const checkMemoryPressure = () => {
//   if ('memory' in performance) {
//     const mem = (performance as any).memory;
//     const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;

//     if (usage > 0.8) {
//       // Aggressively clear cache
//       clearOldestAssets();
//     }
//   }
// };

// // LRU eviction when approaching limits
// const evictLeastRecentlyUsed = () => {
//   // Remove oldest assets first
//   // Keep currently active assets
//   // Free up memory before it becomes critical
// };

// const cleanupBlobUrl = (url: string) => {
//   const blobUrl = blobUrlCache.get(url);
//   if (blobUrl) {
//     URL.revokeObjectURL(blobUrl);
//     blobUrlCache.delete(url);
//   }
// };

//
export type AssetMeta = {
  /**
   * The normalized progress of the asset loading.
   */
  progress: number;
} & Record<string, unknown>;

export type FetchAssetOptions = {
  /**
   * The PlayCanvas application instance. When loading an asset it will be scoped to this application.
   * The asset can't be re-used across different applications.
   */
  app: Application;
  /**
   * The URL of the asset to fetch.
   */
  url: string;
  /**
   * The type of the asset to fetch.
   */
  type: string;
  /**
   * Props passed to the asset. This is spread into the `file` `data` and `options` properties of the asset.
   * @defaultValue {}
   */
  props?: Record<string, unknown>;
  /**
   * A callback function that is called to provide loading progress.
   * @param {AssetMeta} meta - The progress of the asset loading.
   * @returns void
   */
  onProgress?: (meta: AssetMeta) => void;
};

// Global cache for binary data and blob URLs
const binaryDataCache = new Map<string, ArrayBuffer>();
const blobUrlCache = new Map<string, string>();

const fetchSplat = async (
  app: Application,
  src: string,
  onProgress?: (meta: AssetMeta, key: string) => void,
): Promise<Asset> => {
  return new Promise(async (resolve, reject) => {
    let propsKey = src;

    let asset = app.assets.find(propsKey, "gsplat");

    if (!asset) {
      try {
        // Single fetch: get binary data first
        console.log("🌐 Single fetch for binary data:", src);

        let arrayBuffer: ArrayBuffer;
        let blobUrl: string;

        // Check if we have cached binary data
        const cachedBinary = binaryDataCache.get(src);
        if (cachedBinary) {
          console.log("✅ Using cached binary data for:", src);
          arrayBuffer = cachedBinary;
        } else {
          // Fetch binary data with progress tracking
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${src}: ${response.statusText}`);
          }

          const contentLength = response.headers.get("content-length");
          const total = contentLength ? parseInt(contentLength, 10) : 0;

          if (total && onProgress) {
            // Stream with progress tracking
            const reader = response.body?.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                received += value.length;

                onProgress({
                  progress: received / total,
                  totalReceived: received,
                  totalRequired: total,
                }, propsKey);
              }

              // Combine chunks into ArrayBuffer
              const combinedArray = new Uint8Array(received);
              let offset = 0;
              for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
              }
              arrayBuffer = combinedArray.buffer;
            } else {
              arrayBuffer = await response.arrayBuffer();
            }
          } else {
            arrayBuffer = await response.arrayBuffer();
          }

          // Cache the binary data
          binaryDataCache.set(src, arrayBuffer);
          console.log(
            `💾 Cached binary data for ${src} (${
              (arrayBuffer.byteLength / 1024 / 1024).toFixed(2)
            }MB)`,
          );
        }

        // Check if we have a cached blob URL
        const cachedBlobUrl = blobUrlCache.get(src);
        if (cachedBlobUrl) {
          blobUrl = cachedBlobUrl;
        } else {
          // Create blob URL from binary data
          const blob = new Blob([arrayBuffer]);
          blobUrl = URL.createObjectURL(blob);
          blobUrlCache.set(src, blobUrl);
          console.log("🔗 Created blob URL for:", src);
        }

        // Create asset using blob URL
        asset = new Asset(
          propsKey,
          "gsplat",
          { url: blobUrl },
        );

        (asset as any).id = propsKey;
        (asset as any).originalUrl = src; // Keep reference to original URL
        (asset as any).blobUrl = blobUrl; // Keep reference to blob URL

        app.assets.add(asset);
      } catch (error) {
        console.error("Error in single fetch approach:", error);
        reject(error);
        return;
      }
    }

    const handleLoaded = () => {
      cleanup();
      onProgress?.({ progress: 1 }, propsKey);
      resolve(asset);
    };

    const handleError = (err: string) => {
      console.error("Asset loading error:", err, "for URL:", src);
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      asset.off("load", handleLoaded);
      asset.off("error", handleError);
    };

    if (asset.loaded) {
      handleLoaded();
    } else {
      asset.once("load", handleLoaded);
      asset.once("error", handleError);

      if (!asset.loading) {
        app.assets.load(asset);
      }
    }
  });
};

// Utility functions for cache management
export const clearSplatCaches = () => {
  console.log(
    `Clearing splat caches: ${binaryDataCache.size} binary, ${blobUrlCache.size} blob URLs`,
  );

  // Clean up blob URLs before clearing cache
  for (const blobUrl of blobUrlCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }

  binaryDataCache.clear();
  blobUrlCache.clear();
};

export const getSplatCacheStats = () => ({
  binaryCache: {
    size: binaryDataCache.size,
    keys: Array.from(binaryDataCache.keys()),
    totalSizeMB: Array.from(binaryDataCache.values()).reduce(
      (total, buffer) => total + buffer.byteLength,
      0,
    ) / (1024 * 1024),
  },
  blobUrlCache: {
    size: blobUrlCache.size,
    keys: Array.from(blobUrlCache.keys()),
  },
});

export const useDelayedSplat = (
  src: string,
  shouldLoad = true,
  onProgress?: (meta: AssetMeta, key: string) => void,
) => {
  const app = useApp();

  const queryKey = [app.root?.getGuid(), src, "gsplat-blob"];

  const queryOptions: UseQueryOptions<
    Asset | null,
    Error,
    Asset | null,
    (string | number | {} | null)[]
  > = {
    queryKey,
    queryFn: async () => {
      return fetchSplat(app, src, onProgress);
    },
    enabled: shouldLoad,
  };

  return useQuery(queryOptions);
};
