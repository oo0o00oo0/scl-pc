import { useMemo } from "react";
import {
  SEMANTIC_POSITION,
  SEMANTIC_TEXCOORD0,
  ShaderMaterial,
} from "playcanvas";
import { useApp } from "@playcanvas/react/hooks";

export const useShaderMaterial = () => {
  const app = useApp();

  const material = useMemo(() => {
    if (!app) return null;
    console.log("app", app.autoRender);
    const material = new ShaderMaterial({
      uniqueName: "MyShader",
      attributes: {
        aPosition: SEMANTIC_POSITION,
        aUv0: SEMANTIC_TEXCOORD0,
      },
      vertexGLSL: /* glsl */ `
      attribute vec3 aPosition;
      attribute vec2 aUv0;

      uniform mat4 matrix_model;
      uniform mat4 matrix_viewProjection;

      varying vec2 vUv0;

        void main(void)
        {
            vUv0 = aUv0;
            gl_Position = matrix_viewProjection * matrix_model * vec4(aPosition, 1.0);
        }`,
      fragmentGLSL: /* glsl */ `
      precision mediump float;
      varying vec2 vUv0;
        void main(void) {

            gl_FragColor = vec4(1.0, vUv0.x, vUv0.y, 1.0);
        }`,
    });

    app.renderNextFrame = true;

    return material;
  }, [app]);

  return material;
};
