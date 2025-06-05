import { Entity } from "@playcanvas/react";
import { useMaterial } from "@playcanvas/react/hooks";
import { useRef } from "react";
import { Render } from "@playcanvas/react/components";
import { Entity as PcEntity } from "playcanvas";

const Occluder = () => {
  const ref = useRef<PcEntity>(null);
  const material = useMaterial({
    emissive: "#0f0f0f",
    diffuse: "#0f0f0f",
    redWrite: false,
    greenWrite: false,

    blueWrite: false,
  });
  return (
    <Entity
      position={[-50, -1, 0]}
      rotation={[0, -30, 0]}
      ref={ref}
      scale={[100, 1, 100]}
    >
      <Render material={material} type="box" />
    </Entity>
  );
};

export default Occluder;
