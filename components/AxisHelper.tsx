import { Entity } from "@playcanvas/react";
import { Render } from "@playcanvas/react/components";
import { useMaterial } from "@playcanvas/react/hooks";

const AxisHelper = (
  { position, size }: {
    position: [number, number, number];
    size: [number, number, number];
  },
) => {
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
    <Entity position={position} scale={size}>
      <Entity position={[50, 0, 0]} scale={[100, 0.25, 0.25]}>
        <Render type="box" material={xMaterial} />
      </Entity>
      <Entity position={[0, 50, 0]} scale={[0.25, 100, 0.25]}>
        <Render type="box" material={yMaterial} />
      </Entity>
      <Entity position={[0, 0, 50]} scale={[0.25, 0.25, 100]}>
        <Render type="box" material={zMaterial} />
      </Entity>
    </Entity>
  );
};

export default AxisHelper;
