import { useEffect, useRef } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { Entity as PcEntity } from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";
import vertex from "../shaders/vert.vert?raw";
import type LandscapeScript from "../scripts/landscape";

const instantiateAsset = async (
  app: any,
  asset: any,
  parent: any,
  script: any,
) => {
  if (!asset.loaded && !asset.loading) app.assets.load(asset);

  if (!parent.gsplat) {
    parent.addComponent("gsplat", { asset });
  }

  await Promise.resolve();
  const mat = parent.gsplat?.material;
  if (mat && script) {
    script.initializeMaterial(vertex);
  }
};

const unmountAsset = (asset: any, _parent: any, script: any) => {
  if (asset?.loaded) asset.unload();
  script?.animateToOpacity(0, 1800, () => {
    console.log("ANIAMTED OUT");
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

    console.log(asset.loaded);

    if (active) {
      instantiateAsset(app, asset, parent, script).then(() => {
        console.log("script", script);
        script?.animateToOpacity(1, 1800, () => {
          console.log("ANIAMTEDIN", url.split("/").pop());
          onReady(url);
          app.renderNextFrame = true;
        });
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
