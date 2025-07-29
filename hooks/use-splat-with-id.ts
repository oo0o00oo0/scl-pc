/* eslint-disable @typescript-eslint/no-explicit-any */
import { Asset } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { fetchAsset } from "@playcanvas/react/utils";
import { useEffect } from "react";

export const useSplatWithId = (
  src: string,
  id: number,
  props = {},
  shouldLoad = true,
) => {
  const app = useApp();
  const queryKey = [app.root?.getGuid(), src, "gsplat", props, id];

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
