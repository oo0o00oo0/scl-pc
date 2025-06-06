import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useShaderMaterial } from "@/libs/hooks/use-shaderMaterial";
import { Script } from "@playcanvas/react/components";
import Animations from "@/libs/scripts/animations";
import starterVert from "@/libs/shaders/starter/starter.vert?raw";
import starterFrag from "@/libs/shaders/starter/starter.frag?raw";
import { useEffect, useRef } from "react";
import { Color } from "playcanvas";

const ShaderSphere = ({ color }: { color: Color }) => {
  const material = useShaderMaterial({
    vertexGLSL: starterVert,
    fragmentGLSL: starterFrag,
  }) as any;

  const entityRef = useRef<any>(null);

  useEffect(() => {
    // if (material && material.setParameter) {
    //   material.setParameter("uColor", [color.r, color.g, color.b, 1.0]);
    // }
    if (entityRef.current) {
      const animScript = entityRef.current.script?.animations as Animations;
      if (animScript) {
        animScript.animateToColor(
          new Color(color.r, color.g, color.b),
        );
      }
    }
    // const interval = setInterval(() => {
    //   if (entityRef.current) {
    //     const animScript = entityRef.current.script?.animations as Animations;
    //     if (animScript) {
    //       animScript.animateToColor(
    //         new Color(Math.random(), Math.random(), Math.random()),
    //       );
    //     }
    //   }
    // }, 6000);

    // return () => clearInterval(interval as any);
  }, [material, color]);

  return (
    <Entity ref={entityRef}>
      <Script script={Animations} />
      <Render type="sphere" material={material} />
    </Entity>
  );
};

export default ShaderSphere;
