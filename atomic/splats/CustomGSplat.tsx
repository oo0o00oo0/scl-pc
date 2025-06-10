import { type FC, useEffect, useLayoutEffect, useRef } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import gsap from "gsap";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  id: number;
  dataReady: boolean;
  active: boolean;
}

export const CustomGSplat: FC<GsplatProps> = (
  { asset, id, dataReady, active },
) => {
  const parent: PcEntity = useParent();

  const assetRef = useRef<PcEntity | null>(null);

  const app = useApp();

  useLayoutEffect(() => {
    if (asset) {
      assetRef.current = (asset.resource as any).instantiate({
        vertex,
        // uniforms: {
        //   uSplatOpacity: 0,
        // },
        // id: id,
      });

      parent.addChild(assetRef.current!);

      setTimeout(() => {
        parent.fire("gsplat:ready", assetRef.current);
      }, 0);

      app.autoRender = false;
    }

    return () => {
      if (!assetRef.current) return;
      parent.removeChild(assetRef.current);
    };
  }, [asset, parent]);

  return null;
};
