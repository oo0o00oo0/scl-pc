import { useEffect, useLayoutEffect, useRef } from "react";
import { type Asset, type Entity as PcEntity } from "playcanvas";
import { useApp, useParent } from "@playcanvas/react/hooks";
import gsap from "gsap";
import vertex from "../../shaders/vert.vert?raw";

interface GsplatProps {
  asset: Asset;
  swirl: number;
  id: number;
  dataReady: boolean;
  gradientMix?: number; // 0.0 = original colors, 1.0 = full gradient
}

export const GSplat = (
  { asset, swirl, id, dataReady, gradientMix = 0 }: GsplatProps,
) => {
  const parent: PcEntity = useParent();

  const assetRef = useRef<PcEntity | null>(null);
  const currentGradientMixRef = useRef<number>(0);

  const app = useApp();

  useEffect(() => {
    if (!dataReady) return;
    const material = assetRef.current?.gsplat?.material;

    const uniforms = {
      gradientMix: currentGradientMixRef.current, // Start from current value
    };

    gsap.to(uniforms, {
      gradientMix: gradientMix, // Animate to target value
      duration: 0.4,
      ease: "power2.inOut",
      onUpdate: () => {
        material?.setParameter("uGradientMix", uniforms.gradientMix);
        app.renderNextFrame = true;
      },
      onComplete: () => {
        currentGradientMixRef.current = gradientMix; // Update current value
      },
    });
  }, [app, gradientMix, dataReady]);

  useEffect(() => {
    if (!dataReady) return;
    const material = assetRef.current?.gsplat?.material;
    material?.setParameter("uSplatSize", 1.0);

    const uniforms = {
      splatOpacity: swirl ? 0 : 1,
    };

    gsap.to(uniforms, {
      onStart: () => {
        if (!assetRef.current) return;
        assetRef.current.enabled = true;
      },

      splatOpacity: swirl ? 1 : 0,
      duration: 0.4,
      ease: "power2.inOut",
      delay: swirl === 1 ? .3 : 0,
      onUpdate: () => {
        app.renderNextFrame = true;
        material?.setParameter("uSplatOpacity", uniforms.splatOpacity);
      },
      onComplete: () => {
        if (!assetRef.current) return;
        if (swirl === 0) {
          assetRef.current.enabled = false;
        } else {
          assetRef.current.enabled = true;
        }
      },
    });
  }, [app, id, swirl, dataReady]);

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
