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

  // useEffect(() => {
  //   if (!dataReady) return;
  //   const material = assetRef.current?.gsplat?.material;
  // material?.setParameter("uSplatSize", 1.0);

  //   const uniforms = {
  //     splatOpacity: active ? 0 : 1,
  //   };

  //   gsap.to(uniforms, {
  //     onStart: () => {
  //       if (!assetRef.current) return;
  //       assetRef.current.enabled = true;
  //     },

  //     splatOpacity: active ? 1 : 0,
  //     duration: 0.4,
  //     ease: "power2.inOut",
  //     delay: active ? .3 : 0,
  //     onUpdate: () => {
  //       app.renderNextFrame = true;
  //       material?.setParameter("uSplatOpacity", uniforms.splatOpacity);
  //     },
  //     onComplete: () => {
  //       if (!assetRef.current) return;
  //       if (!active) {
  //         assetRef.current.enabled = false;
  //       } else {
  //         assetRef.current.enabled = true;
  //       }
  //     },
  //   });
  // }, [app, id, active, dataReady]);

  useEffect(() => {
    const material = assetRef.current?.gsplat?.material;
    material?.setParameter("uSplatSize", 1.0);
    material?.setParameter("uSplatOpacity", active ? 1 : 0);

    if (!assetRef.current || !dataReady) return;
    if (active) {
      console.log("active", id);
      assetRef.current.enabled = true;
    } else {
      console.log("inactive", id);
      assetRef.current.enabled = false;
    }
  }, [active, id, dataReady]);

  useLayoutEffect(() => {
    if (asset) {
      assetRef.current = (asset.resource as any).instantiate({ vertex });
      parent.addChild(assetRef.current!);
    }

    return () => {
      if (!assetRef.current) return;
      parent.removeChild(assetRef.current);
    };
  }, [asset, parent]);

  return null;
};
