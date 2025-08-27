import { useEffect, useRef } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { AssetMeta } from "./fetch-splat";
import { Asset, Entity as PcEntity } from "playcanvas";
import vertex from "../shaders/vert.vert?raw";
import type LandscapeScript from "../scripts/landscape";
import fetchBlobSplat from "./fetch-splat";

export const useDelayedSplat = (
  src: string,
  shouldLoad = true,
  onProgress?: (meta: AssetMeta, key: string) => void,
) => {
  const app = useApp();

  const queryKey = [app.root?.getGuid(), src];

  const queryOptions: UseQueryOptions<
    Asset | null,
    Error,
    Asset | null,
    (string | number | {} | null)[]
  > = {
    queryKey,
    queryFn: async () => {
      return fetchBlobSplat(app, src, onProgress);
    },
    enabled: shouldLoad,
  };

  return useQuery(queryOptions);
};

const instantiateAsset = async (
  app: any,
  asset: any,
  parent: any,
  script: any,
  onReady?: () => void,
) => {
  app.assets.load(asset);

  asset.ready(() => {
    parent.addComponent("gsplat", { asset });
    script.initializeMaterial(vertex, () => {
      script.animateToOpacity(1, 1800, () => {
        app.renderNextFrame = true;
        onReady?.();
      });
    });
  });
};

const unmountAsset = (asset: any, _parent: any, script: any) => {
  script.animateToOpacity(0, 1800, () => {
    asset.unload();
  });
};

const useSplat = (
  url: string,
  load: boolean,
  updateProgress: (meta: AssetMeta, key: string) => void,
  onReady: (url: string) => void,
  active: boolean,
) => {
  const parent_ref = useRef<PcEntity | null>(null);
  const script_ref = useRef<LandscapeScript | null>(null);
  const app = useApp();
  const { data: asset } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (!app || !parent_ref.current || !asset) return;

    const parent = parent_ref.current;
    const script = script_ref.current;

    if (active) {
      instantiateAsset(app, asset, parent, script, () => {
        onReady(url);
      });
    } else {
      unmountAsset(asset, parent, script);
    }

    return () => {
      if (!active && asset) unmountAsset(asset, parent, script);
    };
  }, [app, asset, active, url, onReady]);

  return { parent_ref, script_ref };
};

export default useSplat;
