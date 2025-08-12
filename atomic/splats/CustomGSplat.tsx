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
    const app = useApp();

    useImperativeHandle(ref, () => ({
      getEntity: () => assetRef.current,
      destroyEntity: () => {
        if (assetRef.current) {
          console.log("Destroying entity via ref");
          assetRef.current.destroy();
          parent.removeChild(assetRef.current);
          console.log("cleaning up existing entity");
          assetRef.current = null;
        }
      },
    }));

    useLayoutEffect(() => {
      const timestamp = Date.now();

      // Clean up existing entity first if it exists
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
        } else {
          console.warn(`[${timestamp}] Resource not ready for instantiation:`, {
            hasResource: !!resource,
            hasInstantiate: typeof resource?.instantiate === "function",
          });
        }
      } else if (asset && !asset.resource) {
        console.log(
          `[${timestamp}] Asset exists but no resource - asset may be unloaded:`,
          asset.id,
        );
      } else if (asset && asset.resource && !active) {
        console.log(
          `[${timestamp}] Asset loaded but landscape inactive - not creating entity:`,
          asset.id,
        );
      }

      return () => {
        // Don't cleanup here - let the animation callback handle entity destruction
        // This prevents the entity from being destroyed before the fade-out animation completes
        console.log("CustomGSplat cleanup - skipping entity destruction");
      };
    }, [asset, asset?.resource, asset?.loaded, active, parent, app]);

    return null;
  },
);
