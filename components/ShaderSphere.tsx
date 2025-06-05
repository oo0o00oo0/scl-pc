import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useShaderMaterial } from "@/libs/hooks/use-shaderMaterial";
import { useApp, useMaterial } from "@playcanvas/react/hooks";
import { useEffect } from "react";

const ShaderSphere = () => {
  const material = useShaderMaterial() as any;
  const test = useMaterial({});

  const app = useApp();
  useEffect(() => {
    console.log("test", test);
    console.log("material", material);
    console.log("app", app.autoRender);

    app.renderNextFrame = true;
  }, [test, app]);

  return (
    <Entity>
      <Render type="sphere" material={material} />
    </Entity>
  );
};

export default ShaderSphere;
