import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useShaderMaterial } from "@/libs/hooks/use-shaderMaterial";
import { useMaterial } from "@playcanvas/react/hooks";
import { useEffect } from "react";

const ShaderSphere = () => {
  const material = useShaderMaterial() as any;
  const test = useMaterial({});

  useEffect(() => {
    console.log("test", test);
    console.log("material", material);
  }, [test]);

  return (
    <Entity>
      <Render type="sphere" material={material} />
    </Entity>
  );
};

export default ShaderSphere;
