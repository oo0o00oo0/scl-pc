import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { Script } from "@playcanvas/react/components";
import Animations from "../scripts/animations";
import starterVert from "../shaders/starter/starter.vert?raw";
import starterFrag from "../shaders/starter/starter.frag?raw";
import { useEffect, useRef } from "react";
import { Color } from "playcanvas";
import { useShaderMaterial } from "../hooks/use-shaderMaterial";

const ShaderSphere = ({ color }: { color: Color }) => {
  const material = useShaderMaterial({
    vertexGLSL: starterVert,
    fragmentGLSL: starterFrag,
  }) as any;

  const entityRef = useRef<any>(null);

  // useEffect(() => {
  //   if (entityRef.current) {
  //     const animScript = entityRef.current.script?.animations as Animations;
  //     if (animScript) {
  //       animScript.animateToColor(
  //         // new Color(color.r, color.g, color.b),
  //         new Color(1, 0, 0),
  //       );
  //     }
  //   }
  // }, [material, color]);

  return (
    <Entity scale={[10, 10, 10]} ref={entityRef}>
      {/* <Script script={Animations} /> */}
      <Render type="box" material={material} />
    </Entity>
  );
};

export default ShaderSphere;
