import { forwardRef, useEffect, useImperativeHandle } from "react";
import { type Asset, Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";
interface GsplatProps {
  asset: Asset;
  active: boolean;
  opacityOverride?: number;
  onEntityReady?: () => void;
}

interface CustomGSplatRef {
  destroyEntity: () => void;
}

export const CustomGSplat = forwardRef<CustomGSplatRef, GsplatProps>(
  ({ asset, active, onEntityReady, opacityOverride = 1 }, ref) => {
    const parent = useParent() as PcEntity;
    const app = useApp();

    const destroyChild = () => {
      if (!parent.gsplat) return;
      parent.removeComponent("gsplat");
    };

    useImperativeHandle(ref, () => ({
      destroyEntity: destroyChild,
    }), [app]);

    const attachGSplat = () => {
      if (!asset || !asset.loaded || !active) return;

      const comp = parent.gsplat;

      if (!comp) {
        parent.addComponent("gsplat", { asset });
      } else {
        comp.asset = asset;
      }

      const material = parent.gsplat?.material;

      if (material) {
        material.getShaderChunks("glsl").set("gsplatVS", vertex);
        material.setParameter("uOpacityOverride", opacityOverride);
      }

      onEntityReady?.();
    };

    useEffect(() => {
      if (!active || !asset) {
        return;
      }

      let cancelled = false;

      const onReady = () => {
        if (!cancelled) attachGSplat();
      };

      if (asset.loaded) {
        onReady();
      } else {
        asset.ready(onReady);
      }

      return () => {
        cancelled = true;
      };
    }, [asset, active, parent, app]);

    return null;
  },
);
