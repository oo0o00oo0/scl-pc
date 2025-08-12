import {
  type FC,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  active: boolean;
}

interface CustomGSplatRef {
  getEntity: () => PcEntity | null;
  destroyEntity: () => void;
}

export const CustomGSplat = forwardRef<CustomGSplatRef, GsplatProps>(
  ({ asset, active }, ref) => {
    const parent: PcEntity = useParent();
    const assetRef = useRef<PcEntity | null>(null);

    useImperativeHandle(ref, () => ({
      getEntity: () => assetRef.current,
      destroyEntity: () => {
        if (assetRef.current) {
          console.log("Destroying entity via ref");
          parent.removeChild(assetRef.current);
          assetRef.current.destroy();
          assetRef.current = null;
        }
      },
    }));

    useLayoutEffect(() => {
      const timestamp = Date.now();

      // Only create entity if asset has resource AND landscape is active
      if (asset && asset.resource && active && assetRef) {
        // Additional safety checks for the resource
        const resource = asset.resource as any;

        // Only proceed if resource looks valid
        if (resource && typeof resource.instantiate === "function") {
          try {
            assetRef.current = resource.instantiate({
              vertex,
            });

            parent.addChild(assetRef.current!);
          } catch (error) {
            console.error(`[${timestamp}] Error creating splat entity:`, error);
          }
        }
      }
    }, [asset, asset?.resource, asset?.loaded, active, parent]);

    return null;
  },
);
