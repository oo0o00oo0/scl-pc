import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  active: boolean;
}

export const CustomGSplat: FC<GsplatProps> = (
  { asset, active },
) => {
  const parent: PcEntity = useParent();
  const assetRef = useRef<PcEntity | null>(null);
  const app = useApp();

  useLayoutEffect(() => {
    const timestamp = Date.now();

    // Clean up existing entity first if it exists
    if (assetRef.current) {
      parent.removeChild(assetRef.current);
      assetRef.current = null;
    }

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
      if (!assetRef.current) return;

      // More thorough entity cleanup
      const entity = assetRef.current;

      // Destroy the entity completely to free GPU resources
      entity.destroy();
      assetRef.current = null;
    };
  }, [asset, asset?.resource, asset?.loaded, active, parent, app]);

  return null;
};
