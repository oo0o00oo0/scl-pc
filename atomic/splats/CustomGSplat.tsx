import { forwardRef, useEffect, useImperativeHandle } from "react";
import { type Asset, Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";
interface GsplatProps {
  asset: Asset;
  active: boolean;
  onEntityReady?: () => void;
}

interface CustomGSplatRef {
  destroyEntity: () => void;
}

export const CustomGSplat = forwardRef<CustomGSplatRef, GsplatProps>(
  ({ asset, active, onEntityReady }, ref) => {
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
        // add gsplat with default material/shader
        parent.addComponent("gsplat", { asset });
      } else {
        // component exists; just swap/assign asset
        comp.asset = asset;
      }

      // if you later want to override shaders, do it AFTER material exists:
      const material = parent.gsplat?.material;

      if (material) {
        material.getShaderChunks("glsl").set("gsplatVS", vertex);
        material.setParameter("uSplatOpacity", 0);
      }

      // onEntityReady?.();
      const timeout = setTimeout(() => {
        onEntityReady?.();
      }, 500);

      return () => clearTimeout(timeout);
    };

    // main effect: react to asset / active
    useEffect(() => {
      // turn off → destroy our child and exit
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
        // fires once when the asset is ready; safe with StrictMode
        asset.ready(onReady);
      }

      return () => {
        cancelled = true; // avoid running onReady after unmount/prop change
      };
      // parent/app are stable from hooks; including them is fine but not required
    }, [asset, active, parent, app]);

    return null;
  },
);
