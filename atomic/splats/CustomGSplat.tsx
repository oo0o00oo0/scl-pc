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
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for asset load events to trigger re-renders
  useEffect(() => {
    if (!asset) return;

    const handleAssetLoad = () => {
      console.log(`Asset load event received for ${asset.id}, forcing update`);

      console.log("asset:::::::::::::::", asset.resource);
      setForceUpdate((prev) => prev + 1);
    };

    asset.on("load", handleAssetLoad);

    return () => {
      asset.off("load", handleAssetLoad);
    };
  }, [asset]);

  useLayoutEffect(() => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] CustomGSplat useLayoutEffect:`, {
      hasAsset: !!asset,
      hasResource: !!asset?.resource,
      assetLoaded: asset?.loaded,
      assetLoading: asset?.loading,
      assetId: asset?.id,
      active,
      currentEntity: !!assetRef.current,
      parentChildren: parent.children.length,
    });

    // Clean up existing entity first if it exists
    if (assetRef.current) {
      console.log(
        `[${timestamp}] Removing existing entity before creating new one`,
      );
      parent.removeChild(assetRef.current);
      assetRef.current = null;
    }

    // Only create entity if asset has resource AND landscape is active
    if (asset && asset.resource && active && assetRef) {
      console.log(
        `[${timestamp}] Creating new splat entity for asset:`,
        asset.id,
      );

      // Additional safety checks for the resource
      const resource = asset.resource as any;
      console.log(`[${timestamp}] Resource validation:`, {
        hasResource: !!resource,
        hasInstantiate: typeof resource.instantiate === "function",
        isCompressed: resource.isCompressed,
        resourceType: resource.constructor?.name,
      });

      // Only proceed if resource looks valid
      if (resource && typeof resource.instantiate === "function") {
        try {
          assetRef.current = resource.instantiate({
            vertex,
          });

          parent.addChild(assetRef.current!);
          console.log(
            `[${timestamp}] Successfully added entity to parent. Parent now has ${parent.children.length} children`,
          );
        } catch (error) {
          console.error(`[${timestamp}] Error creating splat entity:`, error);
          console.error(`[${timestamp}] Resource state during error:`, {
            resource: resource,
            isCompressed: resource?.isCompressed,
            keys: Object.keys(resource || {}),
          });
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
      const cleanupTimestamp = Date.now();
      console.log(
        `[${cleanupTimestamp}] Cleaning up splat entity for asset:`,
        asset?.id,
      );

      // More thorough entity cleanup
      const entity = assetRef.current;
      console.log(`[${cleanupTimestamp}] Entity cleanup details:`, {
        entityName: entity.name,
        childrenCount: entity.children.length,
        entityEnabled: entity.enabled,
      });

      // Destroy the entity completely to free GPU resources
      entity.destroy();
      assetRef.current = null;

      console.log(
        `[${cleanupTimestamp}] Entity destroyed, parent has ${parent.children.length} children`,
      );
    };
  }, [asset, asset?.resource, asset?.loaded, active, parent, app, forceUpdate]);

  return null;
};
