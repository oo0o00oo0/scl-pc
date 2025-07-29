import { type FC, useLayoutEffect, useRef } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  id: number;
}

export const CustomGSplat: FC<GsplatProps> = (
  { asset },
) => {
  const parent: PcEntity = useParent();
  const assetRef = useRef<PcEntity | null>(null);
  const app = useApp();

  useLayoutEffect(() => {
    if (asset) {
      assetRef.current = (asset.resource as any).instantiate({
        vertex,
      });

      parent.addChild(assetRef.current!);
    }

    return () => {
      if (!assetRef.current) return;
      parent.removeChild(assetRef.current);
    };
  }, [asset, parent, app]);

  return null;
};
