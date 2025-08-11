/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from "@playcanvas/react/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { Application, Asset } from "playcanvas";

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

const fetchSplat = async (
  app: Application,
  src: string,
  onProgress?: (meta: AssetMeta, key: string) => void,
): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    let propsKey = src;

    let asset = app.assets.find(propsKey, "gsplat");

    if (!asset) {
      asset = new Asset(
        propsKey,
        "gsplat",
        { url: src },
      );

      (asset as any).id = propsKey;

      app.assets.add(asset);
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

export const useDelayedSplat = (
  src: string,
  shouldLoad = true,
  onProgress?: (meta: AssetMeta, key: string) => void,
) => {
  const app = useApp();

  const queryKey = [app.root?.getGuid(), src, "gsplat"];

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
