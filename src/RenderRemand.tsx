import { forwardRef, useImperativeHandle } from "react";
import { useApp } from "@playcanvas/react/hooks";

const RenderDemand = forwardRef((_, ref) => {
  const app = useApp();

  useImperativeHandle(ref, () => {
    return {
      render: () => {
        console.log("render", app.autoRender);
        app.autoRender = false;
      },
    };
  });

  return null;
});

export default RenderDemand;
