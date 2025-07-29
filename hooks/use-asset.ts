/* eslint-disable @typescript-eslint/no-explicit-any */
import { Asset, TEXTURETYPE_RGBP } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { fetchAsset } from "@playcanvas/react/utils";
import { useEffect } from "react";

/**
 * Loads an asset using react-query
 *
 * @param {string} src - The URL of the texture asset.
 * @param {Object} [props] - Additional properties to pass to the asset loader.
 * @returns {{ data: Asset, isPending: boolean }} - The texture asset and its loading state.
 */
export const useAsset = (src: string, type: string, props: any) => {
  const app = useApp();
  const queryKey = [src, type, props];

  // Construct a query for the asset
  return useQuery({
    queryKey,
    // @ts-ignore
    queryFn: () => app && fetchAsset(app, src, type, props),
  });
};

/**
 * Loads a texture asset as an environment atlas
 *
 * @param {string} src - The URL of the texture asset.
 * @param {Object} [props] - Additional properties to pass to the asset loader.
 * @returns {{ data: Asset, isPending: boolean, release: Function }} - The texture asset and its loading state.
 */
export const useEnvAtlas = (src: string, props = {}) =>
  useAsset(src, "texture", {
    ...props,
    type: TEXTURETYPE_RGBP,
    mipmaps: false,
  });

export const useSplat = (src: string, props = {}) =>
  useAsset(src, "gsplat", props);

export const useSplatWithId = (
  src: string,
  id: number,
  props = {},
  shouldLoad = true,
) => {
  const app = useApp();
  const queryKey = [src, "gsplat", JSON.stringify(props), id];

  console.log("useSplatWithId - queryKey:", queryKey);
  console.log("useSplatWithId - app instance:", app);

  const queryOptions: UseQueryOptions<
    Asset | null,
    Error,
    Asset | null,
    (string | number | {} | null)[]
  > = {
    queryKey,
    queryFn: async () => {
      if (!app) return null;

      try {
        // Create the asset manually using the correct Asset constructor
        const asset = new Asset(src, "gsplat", {
          url: src,
        }, props);

        // Set the custom ID BEFORE loading starts
        (asset as any).id = id;

        // Add to asset registry
        app.assets.add(asset);

        // Return a promise that resolves when the asset is loaded
        return new Promise<Asset>((resolve, reject) => {
          asset.on("load", () => resolve(asset));
          asset.on("error", (err: any) => reject(err));

          // Start loading the asset
          app.assets.load(asset);
        });
      } catch (error) {
        console.warn(
          "Manual asset creation failed, falling back to fetchAsset:",
          error,
        );
        // Fallback to the original method
        // @ts-ignore
        const asset = await fetchAsset(app, src, "gsplat", props) as Asset;
        if (asset) {
          (asset as any).id = id;
        }
        return asset;
      }
    },
    enabled: shouldLoad,
  };

  const query = useQuery(queryOptions);

  // Handle cleanup when shouldLoad changes or component unmounts
  useEffect(() => {
    if (!shouldLoad && query.data) {
      // If we have an asset and shouldLoad is false, clean it up
      query.data.unload();
      app.assets.remove(query.data);
      console.log("rendernextframe - use-asset");
      app.renderNextFrame = true;
    }
  }, [shouldLoad, query.data, app]);

  return query;
};

// Alternative approach that uses array indexing but still sets proper IDs
export const useSplatWithArrayIndex = (src: string, id: number, props = {}) => {
  const app = useApp();
  const queryKey = [src, "gsplat", props, id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!app) return null;
      // @ts-ignore
      const asset = await fetchAsset(app, src, "gsplat", props) as Asset;
      if (asset) {
        // Set the custom ID after loading
        (asset as any).id = id;
      }
      return asset;
    },
  });
};

/**
 * Loads a glb asset
 *
 * @param {string} src - The URL of the glb.
 * @param {Object} [props] - Additional properties to pass to the asset loader.
 * @returns {{ data: Asset, isPending: boolean, release: Function }} - The GLB asset and its loading state.
 */
export const useModel = (src: string, props = {}) =>
  useAsset(src, "container", props);

/**
 * Loads a texture asset
 *
 * @param {string} src - The URL of the texture asset.
 * @param {Object} [props] - Additional properties to pass to the asset loader.
 */
export const useTexture = (src: string, props = {}) =>
  useAsset(src, "texture", props);
