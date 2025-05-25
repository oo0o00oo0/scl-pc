import { type FC, useEffect, useLayoutEffect, useRef } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import gsap from "gsap";
import vertex from "./shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  swirl: number;
}

export const GSplat: FC<GsplatProps> = ({ asset, swirl }) => {
  const parent: PcEntity = useParent();
  const assetRef = useRef<PcEntity | null>(null);
  const localTime = useRef(0);
  const app = useApp();
  useEffect(() => {
    console.log("swirl", swirl);
    const material = assetRef.current?.gsplat?.material;
    material?.setParameter("uSplatSize", 1.0);

    // Set the entity visibility based on swirl
    if (assetRef.current) {
      assetRef.current.enabled = true; // Make sure it's visible
    }

    // Create a proxy object for GSAP to animate
    const uniforms = {
      splatOpacity: swirl ? 0 : 1,
    };

    gsap.to(uniforms, {
      splatOpacity: swirl ? 1 : 0,
      duration: 0.4,
      ease: "power2.inOut",
      onStart: () => {
        app.autoRender = true;
      },
      onUpdate: () => {
        material?.setParameter("uTime", localTime.current);
        material?.setParameter("uSplatOpacity", uniforms.splatOpacity);
      },
      onComplete: () => {
        if (swirl === 0 && assetRef.current) {
          assetRef.current.enabled = false;
        }
        app.autoRender = false;
      },
    });
  }, [app, swirl]);

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
