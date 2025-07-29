import { useEffect, useRef } from "react";
import { useSplatWithId } from "./use-splat-with-id";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";
import type LandscapeScript from "../scripts/landscape";

type GSplatComponent = {
  instance: {
    sorter: {
      on: (event: string, callback: () => void) => void;
    };
  };
};

export const useSplatLoading = (
  id: number,
  url: string,
  load: boolean,
  updateProgress: (id: number, progress: number) => void,
  onReady: (id: number) => void,
  active: boolean,
  opacityOverride: number,
  delay: number,
) => {
  const scriptRef = useRef<LandscapeScript | null>(null);
  const gsplatRef = useRef<PcEntity | null>(null);

  const app = useApp();

  const { data: splat } = useSplatWithId(url, id, {}, load);

  useEffect(() => {
    const splatAssets = app.assets.filter(
      (a) => (a.type as string) === "gsplat",
    );

    if (!splatAssets.length) return;

    let splatAsset = splatAssets.find((a) => (a as any).id === id);

    if (!splatAsset) {
      splatAsset = splatAssets[id];
    }

    if (!splatAsset) return;

    splatAsset.on("progress", (received, length) => {
      const percent = Math.min(1, received / length) * 100;
      updateProgress(id, percent);
    });

    if (splat) {
      const entity = gsplatRef.current;

      const gsplatComponent = entity?.findComponent("gsplat") as
        | GSplatComponent
        | undefined;

      const gsplatInstance = gsplatComponent?.instance;

      if (gsplatInstance) {
        app.renderNextFrame = true;

        gsplatInstance.sorter.on("updated", () => {
          app.renderNextFrame = true;
        });
      }
    }

    return () => {
      if (splatAsset) {
        splatAsset.off("progress");
      }
    };
  }, [splat, app, id, updateProgress]);

  // Separate effect for handling onReady
  useEffect(() => {
    if (!splat) return;

    const entity = gsplatRef.current;
    const gsplatComponent = entity?.findComponent("gsplat") as
      | GSplatComponent
      | undefined;
    const gsplatInstance = gsplatComponent?.instance;

    if (gsplatInstance) {
      const timeoutId = setTimeout(() => {
        onReady(id);
      });
      return () => clearTimeout(timeoutId);
    }
  }, [splat, id, onReady]);

  useEffect(() => {
    let didUnload = false;

    if (!splat) return;

    const landscapeScript = scriptRef.current;

    if (!landscapeScript) return;

    if (!load) {
      const handleUnload = () => {
        const splatAssets = app.assets.filter(
          (a) => (a.type as string) === "gsplat",
        );
        let i = 0;
        let splatAsset = splatAssets.find((a) => {
          i++;
          return (a as any).id === id;
        });
        if (splatAsset && splatAsset.loaded) {
          splatAsset.unload();
          app.assets.remove(splatAsset);
          app.renderNextFrame = true;
          didUnload = true;
        }
      };
      handleUnload();
    } else if (active) {
      setTimeout(() => {
        landscapeScript.animateToOpacity(1 * opacityOverride, 1000);
      }, delay);
    } else {
      landscapeScript.animateToOpacity(0, 1000);
    }

    return () => {
      if (!didUnload && !load) {
        const splatAssets = app.assets.filter(
          (a) => (a.type as string) === "gsplat",
        );
        const splatAsset = splatAssets.find((a) => (a as any).id === id);
        if (splatAsset && splatAsset.loaded) {
          splatAsset.unload();
          app.assets.remove(splatAsset);
          app.renderNextFrame = true;
        }
      }
    };
  }, [active, id, splat, load, app, opacityOverride]);

  return {
    splat,
    gsplatRef,
    scriptRef,
  };
};
