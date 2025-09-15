import React, { useEffect, useRef, useState } from "react";
import { Mat4, Vec3, Vec4 } from "playcanvas";
import { worldToScreenStandalone } from "../utils";

type CamData = {
  viewProjMatrix: Mat4;
  cameraRect: Vec4;
  canvasWidth: number;
  canvasHeight: number;
};

export const HtmlMarker = (
  {
    worldPosition,
    size,
    isActive,
    onClick,
    useCamStore,
    title,
    pending,
    children,
  }: {
    worldPosition: Vec3;
    size: number;
    pending?: boolean;
    isActive: boolean;
    onClick: () => void;
    useCamStore: () => CamData;
    title?: string | React.ReactElement;
    children: React.ReactNode;
  },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const screenPos = useRef<Vec3>(new Vec3());
  const [hover, setHover] = useState<boolean>(false);

  const camData = useCamStore();

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const { viewProjMatrix, cameraRect, canvasWidth, canvasHeight } = camData;

    const result = worldToScreenStandalone(
      worldPosition,
      viewProjMatrix,
      cameraRect,
      canvasWidth,
      canvasHeight,
      screenPos.current,
    );

    // Hide marker if it's behind the camera
    if (result.isBehindCamera) {
      ref.current.style.display = "none";
      return;
    }

    ref.current.style.display = "block";
    ref.current.style.transform = `translate(${
      result.screenCoord.x - size / 2
    }px, ${result.screenCoord.y - size / 2}px)`;
  }, [worldPosition, isActive, camData]);

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => {
        document.body.style.cursor = "pointer";
        setHover(true);
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
        setHover(false);
      }}
      ref={ref}
      style={{
        opacity: pending ? 0.2 : 1,
        transition: "opacity 0.3s ease-in-out",
        pointerEvents: isActive ? "auto" : "none",
        position: "absolute",
        top: 0,
        left: 0,
        width: `${size}px`,
        height: `${size}px`,
        transformOrigin: "center",
        zIndex: 1,
      }}
    >
      {title && (
        <div
          style={{
            opacity: hover ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.3s ease-in-out",
            backgroundColor: "#fff",
            color: "#1F3C6D",
            padding: "5px 10px",
            position: "absolute",
            top: "100%",
            left: "50%",
            textWrap: "nowrap",
            transform: "translate(-50%, 0)",
            zIndex: 2,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

export default HtmlMarker;
