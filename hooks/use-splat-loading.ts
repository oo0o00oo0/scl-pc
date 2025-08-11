import { useEffect, useRef, useState } from "react";
import { type AssetMeta, useDelayedSplat } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";
import { usePausableLoading } from "./use-pausable-loading";
import { useCameraInteractionState } from "./use-camera-interaction-state";
import camStore from "@/state/camStore";

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
  priority: "low" | "normal" | "high" = "normal",
  useCameraAwareLoading: boolean = true,
) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();
  const cameraEntity = camStore((state) => state.cameraEntity);

  const [hasLoaded, setHasLoaded] = useState(false);

  // Use camera interaction state for smart loading
  const cameraState = useCameraInteractionState(
    useCameraAwareLoading ? cameraEntity : null,
    1e-4, // movement threshold
    800, // wait 800ms after movement stops
  );

  // Choose loading strategy based on configuration
  const { data: pausableSplat } = usePausableLoading(
    url,
    {
      enabled: load && useCameraAwareLoading,
      isSafeToLoad: cameraState.isSafeToLoad,
      maxPauseTime: priority === "high"
        ? 2000
        : priority === "normal"
        ? 5000
        : 10000,
      priority,
    },
    updateProgress,
    app,
  );

  const { data: regularSplat } = useDelayedSplat(
    url,
    load && !useCameraAwareLoading,
    updateProgress,
  );

  // Use the appropriate splat based on loading strategy
  const splat = useCameraAwareLoading ? pausableSplat : regularSplat;

  useEffect(() => {
    if (splat) {
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
      }
    }
  }, [splat, app, url]);

  useEffect(() => {
    // console.log("RERAN", url.split("/").pop());
    const landscapeScript = scriptRef.current;

    const currentOpacity = landscapeScript?.opacity;

    if (!landscapeScript) return;
    const handleUnload = () => {
      const splatAsset = splat;
      if (splatAsset && splatAsset.loaded) {
        splatAsset.unload();
        app.assets.remove(splatAsset);
      }
      // setHasLoaded(false);
    };

    // if (!load && hasLoaded && currentOpacity !== 0) {
    //   console.log("unload", url.split("/").pop());
    //   const handleUnload = () => {
    //     const splatAsset = splat;
    //     if (splatAsset && splatAsset.loaded) {
    //       splatAsset.unload();
    //       app.assets.remove(splatAsset);
    //     }
    //     setHasLoaded(false);
    //   };
    //   landscapeScript.animateToOpacity(0, 300, () => {
    //     console.log("ANIMATE TO OFF FROM UNLOAD", url.split("/").pop());
    //     handleUnload();
    //   });
    // } else {
    if (active) {
      setTimeout(() => {
        console.log("animate to on from active", url.split("/").pop());
        landscapeScript.animateToOpacity(1, 1800, () => {
          onReady(url);
        });
      }, 800);
    } else if (currentOpacity !== 0) {
      console.log("animate to off from not active", url.split("/").pop());
      setTimeout(() => {
        landscapeScript.animateToOpacity(0, 1000, () => {
          handleUnload();
        });
      }, 0);
    }
    // }
  }, [active, splat, load, app, url, hasLoaded]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
