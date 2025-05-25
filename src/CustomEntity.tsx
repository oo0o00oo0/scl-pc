import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useMaterial } from "@playcanvas/react/hooks";
import { useParent } from "@playcanvas/react/hooks";
import { useApp } from "@playcanvas/react/hooks";
import { useState } from "react";
import { Entity as PcEntity } from "playcanvas";
import { Render } from "@playcanvas/react/components";
import { ParentContext } from "@playcanvas/react/hooks";

const CustomEntityTest = () => {
  const app = useApp();
  const parent = useParent();

  const [emissive, setEmissive] = useState("red");

  const material = useMaterial({ emissive });
  const onClick = () => {
    console.log("clicked!");
    setEmissive(emissive === "green" ? "blue" : "green");
    app.renderNextFrame = true;
  };

  const entity = useMemo(() => new PcEntity("Untitled", app), [app]);

  useLayoutEffect(() => {
    parent.addChild(entity);
    return () => {
      parent.removeChild(entity);
      entity.destroy();
    };
  }, [app, parent, entity]);

  useLayoutEffect(() => {
    entity.on("click", onClick);

    return () => {
      if (onClick) entity.off("click", onClick);
    };
  }, [entity, emissive]);

  return (
    <ParentContext.Provider value={entity}>
      <Render type="box" material={material} />
    </ParentContext.Provider>
  );
};

export default CustomEntityTest;
