import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  active: boolean;
}

interface CustomGSplatRef {
  destroyEntity: () => void;
}

export const CustomGSplat = forwardRef<CustomGSplatRef, GsplatProps>(
  ({ asset, active }, ref) => {
    const parent: PcEntity = useParent();
    const assetRef = useRef<PcEntity | null>(null);
    const app = useApp();
    const lastAssetResourceState = useRef<boolean>(false);
    const [resourceVersion, setResourceVersion] = useState(0);
    const [forceUpdate, setForceUpdate] = useState(0);

    useImperativeHandle(ref, () => ({
      destroyEntity: () => {
        if (assetRef.current) {
          assetRef.current.destroy();
          parent.removeChild(assetRef.current);
          assetRef.current = null;
        }
      },
    }));

    // Track asset resource changes more explicitly
    useEffect(() => {
      const hasResource = !!(asset && asset.resource);

      console.log("hasResource", hasResource);

      if (hasResource !== lastAssetResourceState.current) {
        lastAssetResourceState.current = hasResource;
        setResourceVersion((prev) => prev + 1);
      }
    }, [asset, asset?.resource, asset?.loaded]);

    // Polling mechanism to detect resource changes when React's dependency detection fails
    useEffect(() => {
      if (!asset) return;

      const interval = setInterval(() => {
        const hasResource = !!(asset && asset.resource);
        if (hasResource !== lastAssetResourceState.current) {
          lastAssetResourceState.current = hasResource;
          setForceUpdate((prev) => prev + 1);
        }
      }, 100); // Check every 100ms

      return () => clearInterval(interval);
    }, [asset, active]);

    useLayoutEffect(() => {
      const timestamp = Date.now();
      const hasResource = !!(asset && asset.resource);

      // Update the resource state tracking
      lastAssetResourceState.current = hasResource;

      // Clean up existing entity first if it exists and create new one if conditions are met
      if (asset && asset.resource && active) {
        // Additional safety checks for the resource
        const resource = asset.resource as any;
        console.log("RESOURCE", resource);

        // Only proceed if resource looks valid and we don't already have an entity
        if (
          resource && typeof resource.instantiate === "function" &&
          !assetRef.current
        ) {
          try {
            console.log("INSTANTIATING");
            assetRef.current = resource.instantiate({
              vertex,
            });

            parent.addChild(assetRef.current!);
          } catch (error) {
            console.error(`[${timestamp}] Error creating splat entity:`, error);
          }
        }
      }
    }, [
      asset,
      asset?.resource,
      asset?.loaded,
      active,
      parent,
      app,
      resourceVersion,
      forceUpdate,
    ]);

    return null;
  },
);
