import React, { useEffect, useRef, useState } from "react";
import { Mat4, Vec3, Vec4 } from "playcanvas";
import { worldToScreenStandalone } from "../utils";

type CamData = {
  viewProjMatrix: Mat4;
  cameraRect: Vec4;
  canvasWidth: number;
  canvasHeight: number;
  cameraPosition: Vec3;
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
    minScale = 0.5,
    maxScale = 2.0,
    scaleDistance = { min: 5, max: 50 },
  }: {
    worldPosition: Vec3;
    size: number;
    pending?: boolean;
    isActive: boolean;
    onClick: () => void;
    useCamStore: () => CamData;
    title?: string | React.ReactElement;
    children: React.ReactNode;
    minScale?: number;
    maxScale?: number;
    scaleDistance?: { min: number; max: number };
  },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const screenPos = useRef<Vec3>(new Vec3());
  const [hover, setHover] = useState<boolean>(false);

  const camData = useCamStore();

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const {
      viewProjMatrix,
      cameraRect,
      canvasWidth,
      canvasHeight,
      cameraPosition,
    } = camData;

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

    // Calculate distance from camera to marker
    const distance = cameraPosition.distance(worldPosition);

    // Calculate scale based on distance (closer = larger, farther = smaller)
    // Invert the distance mapping so closer objects are larger
    const normalizedDistance = Math.max(
      0,
      Math.min(
        1,
        (distance - scaleDistance.min) /
          (scaleDistance.max - scaleDistance.min),
      ),
    );
    const currentScale = minScale +
      (maxScale - minScale) * (1 - normalizedDistance);

    const scaledSize = size * currentScale;

    ref.current.style.display = "block";
    ref.current.style.transform = `translate(${
      result.screenCoord.x - scaledSize / 2
    }px, ${result.screenCoord.y - scaledSize / 2}px) scale(${currentScale})`;
  }, [
    worldPosition,
    isActive,
    camData,
    size,
    minScale,
    maxScale,
    scaleDistance,
  ]);

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
        transition: "opacity 0.3s ease-in-out, transform 0.1s ease-out",
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
