import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { Application, Asset } from "playcanvas";
import type { AssetMeta } from "./use-splat-with-id";

interface PausableLoadingOptions {
  /**
   * Whether loading should be enabled at all
   */
  enabled: boolean;

  /**
   * Whether it's safe to load (camera not moving, no user interaction)
   */
  isSafeToLoad: boolean;

  /**
   * Maximum time to wait when paused before forcing load (ms)
   */
  maxPauseTime?: number;

  /**
   * Priority level - higher priority loads can run even when not completely safe
   */
  priority?: "low" | "normal" | "high";
}

/**
 * Enhanced splat loading that can be paused during camera movement/interaction
 */
const fetchSplatWithPause = async (
  app: Application,
  src: string,
  onProgress?: (meta: AssetMeta, key: string) => void,
  pauseController?: { isPaused: boolean },
): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    let propsKey = src;
    let asset = app.assets.find(propsKey, "gsplat");

    if (!asset) {
      asset = new Asset(propsKey, "gsplat", { url: src });
      (asset as any).id = propsKey;
      app.assets.add(asset);
    }

    if (asset.loaded) {
      onProgress?.({ progress: 1 }, propsKey);
      resolve(asset);
      return;
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

    const handleProgress = (totalReceived: number, totalRequired: number) => {
      if (
        typeof totalReceived !== "number" || typeof totalRequired !== "number"
      ) {
        return;
      }

      // Check if we should pause loading during progress
      if (pauseController?.isPaused) {
        console.log("Paused");
        console.log(
          `Pausing loading for ${src.split("/").pop()} at ${
            Math.round((totalReceived / totalRequired) * 100)
          }%`,
        );
        // Note: We can't actually pause the network request once started,
        // but we can delay processing and avoid starting new chunks
        return;
      }

      onProgress?.({
        progress: totalReceived / totalRequired,
        totalReceived,
        totalRequired,
      }, propsKey);
    };

    const cleanup = () => {
      if (onProgress) asset.off("progress", handleProgress);
      asset.off("load", handleLoaded);
      asset.off("error", handleError);
    };

    if (onProgress) {
      asset.on("progress", handleProgress);
    }

    asset.once("load", handleLoaded);
    asset.once("error", handleError);

    // Start loading only if not paused
    if (!asset.loading && !pauseController?.isPaused) {
      app.assets.load(asset);
    } else if (pauseController?.isPaused) {
      // Schedule a retry when unpaused
      const retryInterval = setInterval(() => {
        if (!pauseController.isPaused && !asset.loading && !asset.loaded) {
          clearInterval(retryInterval);
          app.assets.load(asset);
        }
      }, 100);

      // Clean up interval if asset loads or errors
      const originalCleanup = cleanup;
      cleanup = () => {
        clearInterval(retryInterval);
        originalCleanup();
      };
    }
  });
};

export const usePausableLoading = (
  src: string,
  options: PausableLoadingOptions,
  onProgress?: (meta: AssetMeta, key: string) => void,
  app?: Application,
) => {
  const { enabled, isSafeToLoad, maxPauseTime = 5000, priority = "normal" } =
    options;

  const pauseStartTime = useRef<number | null>(null);
  const pauseController = useRef({ isPaused: false });
  const [shouldForceLoad, setShouldForceLoad] = useState(false);

  // Determine if we should pause loading
  const shouldPause = !isSafeToLoad && priority !== "high" && !shouldForceLoad;

  useEffect(() => {
    if (shouldPause) {
      if (pauseStartTime.current === null) {
        pauseStartTime.current = Date.now();
        console.log(`Pausing loading for ${src.split("/").pop()}`);
      }
      pauseController.current.isPaused = true;
    } else {
      if (pauseStartTime.current !== null) {
        console.log(`Resuming loading for ${src.split("/").pop()}`);
        pauseStartTime.current = null;
      }
      pauseController.current.isPaused = false;
    }
  }, [shouldPause, src]);

  // Force load after max pause time
  useEffect(() => {
    if (!shouldPause || maxPauseTime <= 0) return;

    const timeout = setTimeout(() => {
      if (
        pauseStartTime.current &&
        Date.now() - pauseStartTime.current >= maxPauseTime
      ) {
        console.log(
          `Force loading ${src.split("/").pop()} after ${maxPauseTime}ms pause`,
        );
        setShouldForceLoad(true);
        // Reset force load after a short delay
        setTimeout(() => setShouldForceLoad(false), 1000);
      }
    }, maxPauseTime);

    return () => clearTimeout(timeout);
  }, [shouldPause, maxPauseTime, src]);

  const queryKey = [app?.root?.getGuid(), src, "gsplat", "pausable"];

  const queryOptions: UseQueryOptions<
    Asset | null,
    Error,
    Asset | null,
    (string | number | {} | null)[]
  > = {
    queryKey,
    queryFn: async () => {
      if (!app) throw new Error("App not available");
      return fetchSplatWithPause(app, src, onProgress, pauseController.current);
    },
    enabled: enabled &&
      (isSafeToLoad || priority === "high" || shouldForceLoad),
    // Retry with exponential backoff
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        console.log(
          `Retrying load for ${src.split("/").pop()}, attempt ${
            failureCount + 1
          }`,
        );
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  };

  return useQuery(queryOptions);
};
