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
  getEntity: () => PcEntity | null;
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

    // Track asset resource changes more explicitly
    useEffect(() => {
      const hasResource = !!(asset && asset.resource);
      const isLoaded = !!(asset && asset.loaded);

      console.log("Resource tracking effect:", {
        assetId: asset?.id,
        hasResource,
        isLoaded,
        previousResourceState: lastAssetResourceState.current,
        resourceObj: asset?.resource,
      });

      if (hasResource !== lastAssetResourceState.current) {
        console.log(
          `🔄 Resource state changed: ${lastAssetResourceState.current} -> ${hasResource}`,
        );
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
          console.log(
            `🔄 [POLLING] Resource state changed: ${lastAssetResourceState.current} -> ${hasResource}`,
          );
          lastAssetResourceState.current = hasResource;
          setForceUpdate((prev) => prev + 1);
        }
      }, 100); // Check every 100ms

      return () => clearInterval(interval);
    }, [asset, active]);

    useLayoutEffect(() => {
      const timestamp = Date.now();
      const hasResource = !!(asset && asset.resource);
      const resourceChanged = hasResource !== lastAssetResourceState.current;

      // Update the resource state tracking
      lastAssetResourceState.current = hasResource;

      console.log(`[${timestamp}] GSplat effect triggered:`, {
        assetId: asset?.id,
        hasResource,
        resourceChanged,
        resourceVersion,
        forceUpdate,
        active,
        hasEntity: !!assetRef.current,
        loaded: asset?.loaded,
      });

      // Clean up existing entity first if it exists and create new one if conditions are met
      if (asset && asset.resource && active) {
        // Additional safety checks for the resource
        const resource = asset.resource as any;

        // Only proceed if resource looks valid and we don't already have an entity
        if (
          resource && typeof resource.instantiate === "function" &&
          !assetRef.current
        ) {
          try {
            console.log(
              `[${timestamp}] Creating new GSplat entity for:`,
              asset.id,
            );
            assetRef.current = resource.instantiate({
              vertex,
            });

            parent.addChild(assetRef.current!);
            console.log(
              `[${timestamp}] GSplat entity created and added to parent`,
            );
          } catch (error) {
            console.error(`[${timestamp}] Error creating splat entity:`, error);
          }
        } else if (!resource || typeof resource.instantiate !== "function") {
          console.warn(`[${timestamp}] Resource not ready for instantiation:`, {
            hasResource: !!resource,
            hasInstantiate: typeof resource?.instantiate === "function",
          });
        } else if (assetRef.current) {
          console.log(
            `[${timestamp}] Entity already exists, skipping creation`,
          );
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
