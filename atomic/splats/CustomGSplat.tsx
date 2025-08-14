import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

    // we own this child entity; destroy it in cleanup
    const childRef = useRef<PcEntity | null>(null);

    const destroyChild = () => {
      if (childRef.current) {
        childRef.current.destroy();
        childRef.current = null;
        if (app) app.renderNextFrame = true;
      }
    };

    useImperativeHandle(ref, () => ({
      destroyEntity: destroyChild,
    }), [app]);

    const attachGSplat = () => {
      if (!asset || !asset.loaded || !active) return;

      // ensure child entity
      if (!childRef.current) {
        const child = new PcEntity("gsplat-entity");
        childRef.current = child;
        parent.addChild(child);
      }

      const child = childRef.current!;
      const comp = (child as any).gsplat;

      if (!comp) {
        // add gsplat with default material/shader
        child.addComponent("gsplat", { asset });
      } else {
        // component exists; just swap/assign asset
        comp.asset = asset;
      }

      // if you later want to override shaders, do it AFTER material exists:
      const material = (child as any).gsplat?.material;
      console.log("material", material);
      if (material) material.getShaderChunks("glsl").set("gsplatVS", vertex);

      app.renderNextFrame = true;
      onEntityReady?.();
    };

    // main effect: react to asset / active
    useEffect(() => {
      // turn off → destroy our child and exit
      if (!active) {
        destroyChild();
        return;
      }

      if (!asset) return;

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

    // unmount cleanup
    useEffect(() => {
      return () => {
        destroyChild();
      };
    }, []);

    return null;
  },
);
