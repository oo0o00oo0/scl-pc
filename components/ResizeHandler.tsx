import { useApp } from "@playcanvas/react/hooks";
import { useEffect } from "react";

const ResizeHandler = () => {
  const app = useApp();

  useEffect(() => {
    const canvas = app.graphicsDevice.canvas;
    const observer = new ResizeObserver(() => {
      console.log("resize");
      app.renderNextFrame = true;
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [app]);

  return null;
};

export default ResizeHandler;
