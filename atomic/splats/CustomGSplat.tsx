import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
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
    const parent: PcEntity = useParent();
    const assetRef = useRef<PcEntity | null>(null);
    const activeRef = useRef(active);
    const app = useApp();

    // Keep activeRef in sync with current active state
    activeRef.current = active;

    useImperativeHandle(ref, () => ({
      destroyEntity: () => {
        if (assetRef.current) {
          console.log("Destroying entity via ref");
          assetRef.current.destroy();
          parent.removeChild(assetRef.current);
          assetRef.current = null;
        }
      },
    }));

    const createEntity = () => {
      if (!asset?.resource || !activeRef.current || assetRef.current) return;

      const resource = asset.resource as any;
      if (resource && typeof resource.instantiate === "function") {
        try {
          console.log("🎯 Creating GSplat entity");
          assetRef.current = resource.instantiate({ vertex });
          parent.addChild(assetRef.current!);
          app.renderNextFrame = true;

          // Notify parent that entity is ready
          onEntityReady?.();
        } catch (error) {
          console.error("Error creating splat entity:", error);
        }
      }
    };

    useEffect(() => {
      if (!asset) return;

      // Function to handle when asset resource becomes available
      const handleAssetReady = () => {
        console.log("🎯 Asset ready event fired");
        createEntity();
      };

      // Function to handle resource changes
      const handleResourceChange = (
        _changedAsset: Asset,
        property: string,
        newValue: any,
        oldValue: any,
      ) => {
        if (property === "resource") {
          console.log("🎯 Asset resource changed", {
            oldResource: !!oldValue,
            newResource: !!newValue,
          });
          createEntity();
        }
      };

      // Use asset's built-in event system
      asset.ready(handleAssetReady);
      asset.on("change", handleResourceChange);

      // Also check if already ready
      if (asset.loaded && asset.resource) {
        handleAssetReady();
      }

      return () => {
        asset.off("change", handleResourceChange);
      };
    }, [asset]);

    useEffect(() => {
      if (active && asset?.loaded && asset?.resource && !assetRef.current) {
        console.log("🎯 Active state changed to true with ready asset");
        createEntity();
      }
    }, [active]);

    return null;
  },
);
