import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useModel } from "../../hooks/use-asset";
import { useMaterial } from "@playcanvas/react/hooks";
const Mesh = ({ src, ...props }: { src: string } & any) => {
  const { data: model } = useModel(src) as any;
  const material = useMaterial({
    diffuse: "#0d0",
    // emissive: "red",
    // emissiveIntensity: 10,
  });
  return (
    <Entity {...props}>
      <Render material={material} asset={model} type={"asset"} />
    </Entity>
  );
};

export default Mesh;
