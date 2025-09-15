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
        if (onReady) onReady();
      });
    });
  });
};

const unmountAsset = (asset: any, _parent: any, script: any) => {
  script.animateToOpacity(0, 1800, () => {
    _parent.removeComponent("gsplat");
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
  const isInstantiated = useRef<boolean>(false);
  const currentUrl = useRef<string>("");

  const app = useApp();

  const { data: asset } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (!app || !parent_ref.current || !asset) return;

    const parent = parent_ref.current;
    const script = script_ref.current;

    if (isInstantiated.current && currentUrl.current !== url) {
      unmountAsset(asset, parent, script);
      isInstantiated.current = false;
    }

    currentUrl.current = url;

    if (active && !isInstantiated.current) {
      instantiateAsset(app, asset, parent, script, () => {
        onReady(url);
      });
      isInstantiated.current = true;
    } else if (!active && isInstantiated.current) {
      unmountAsset(asset, parent, script);
      isInstantiated.current = false;
    }

    return () => {
      if (isInstantiated.current && asset) {
        unmountAsset(asset, parent, script);
        isInstantiated.current = false;
      }
    };
  }, [app, asset, active, url, onReady]);

  return { parent_ref, script_ref };
};

export default useSplat;
