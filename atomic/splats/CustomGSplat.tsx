import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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
      if (!asset?.resource || !active || assetRef.current) return;

      const resource = asset.resource as any;
      if (resource && typeof resource.instantiate === "function") {
        try {
          console.log("🎯 Creating GSplat entity using asset event");
          assetRef.current = resource.instantiate({ vertex });
          parent.addChild(assetRef.current!);
          app.renderNextFrame = true;
        } catch (error) {
          console.error("Error creating splat entity:", error);
        }
      }
    };

    useEffect(() => {
      if (!asset) return;

      // Function to handle when asset resource becomes available
      const handleAssetReady = () => {
        console.log("🎯 Asset ready event fired", {
          assetId: asset.id,
          hasResource: !!asset.resource,
          active,
          currentEntity: !!assetRef.current,
        });
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
            assetId: asset.id,
            oldResource: !!oldValue,
            newResource: !!newValue,
            active,
            currentEntity: !!assetRef.current,
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
    }, [asset]); // Remove 'active' from deps so callbacks don't get recreated when active changes

    // Handle active state changes
    useEffect(() => {
      if (active && asset?.loaded && asset?.resource && !assetRef.current) {
        createEntity();
      }
    }, [active]);

    return null;
  },
);
