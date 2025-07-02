import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useMaterial } from "@playcanvas/react/hooks";

const AxisHelper = ({ size }: { size: [number, number, number] }) => {
  const xMaterial = useMaterial({
    emissive: "red",
  });

  const yMaterial = useMaterial({
    emissive: "green",
  });

  const zMaterial = useMaterial({
    emissive: "blue",
  });

  return (
    <Entity scale={size}>
      <Entity scale={[100, 0.25, 0.25]}>
        <Render type="box" material={xMaterial} />
      </Entity>
      <Entity scale={[0.25, 100, 0.25]}>
        <Render type="box" material={yMaterial} />
      </Entity>
      <Entity scale={[0.25, 0.25, 100]}>
        <Render type="box" material={zMaterial} />
      </Entity>
    </Entity>
  );
};

export default AxisHelper;
