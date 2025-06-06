import { useLayoutEffect, useMemo } from "react";
import {
  SEMANTIC_POSITION,
  SEMANTIC_TEXCOORD0,
  ShaderMaterial,
} from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";

export const useShaderMaterial = ({
  vertexGLSL,
  fragmentGLSL,
}: {
  vertexGLSL: string;
  fragmentGLSL: string;
}) => {
  const app = useApp();

  const material = useMemo(() => {
    if (!app) return null;

    const material = new ShaderMaterial({
      uniqueName: "MyShader",
      attributes: {
        aPosition: SEMANTIC_POSITION,
        aUv0: SEMANTIC_TEXCOORD0,
      },
      vertexGLSL,
      fragmentGLSL,
    });

    return material;
  }, [app]);

  useLayoutEffect(() => {
    return () => {
      if (material) {
        material.destroy();
      }
    };
  }, [material]);

  return material;
};
