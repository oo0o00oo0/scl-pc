import { useEffect, useRef } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import type LandscapeScript from "../scripts/landscape";
import sceneStore from "@/state/sceneStore";

export const useSplatLoading = (
  url: string,
  load: boolean,
  updateProgress: (meta: AssetMeta, key: string) => void,
  onReady: (url: string) => void,
  active: boolean,
) => {
  const setIsTransitioning = sceneStore((state) => state.setIsTransitioning);

  const scriptRef = useRef<LandscapeScript | null>(null);
  const entityRef = useRef<
    { destroyEntity: () => void } | null
  >(null);

  const app = useApp();

  const { data: splat } = useDelayedSplat(url, load, updateProgress);

  useEffect(() => {
    if (splat && active) {
      if (!splat.loaded && !splat.loading) {
        console.log("🔄 Loading asset (from blob URL):", url.split("/").pop());
        app.assets.load(splat);
        return;
      }
    }
  }, [splat, app, url, splat?.loaded, active]);

  const handleEntityReady = () => {
    if (!scriptRef.current) return;

    scriptRef.current.animateToOpacity(1, 1800, () => {
      onReady(url);
      app.renderNextFrame = true;
    });
  };

  useEffect(() => {
    if (!splat) return;

    setIsTransitioning(true);

    const landscapeScript = scriptRef.current;
    if (!landscapeScript) return;

    let animationTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!active) {
      animationTimeout = setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1500, () => {
          if (entityRef.current) {
            console.log("CALLED HERE?");
            entityRef.current.destroyEntity();
          }
          if (splat && splat.loaded) {
            splat.unload();
          }
        });
      }, 0);
    }
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2200);

    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [active, splat]);

  return {
    entityRef,
    splat,
    handleEntityReady,
    scriptRef,
  };
};
