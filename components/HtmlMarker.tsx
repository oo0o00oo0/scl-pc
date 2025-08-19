import { useEffect, useRef, useState } from "react";
import { Mat4, Vec3, Vec4 } from "playcanvas";
import gsap from "gsap";
import { worldToScreenStandalone } from "../utils";

type CamData = {
  viewProjMatrix: Mat4;
  cameraRect: Vec4;
  canvasWidth: number;
  canvasHeight: number;
};

export const HtmlMarker = (
  { worldPosition, size = 150, isActive, onClick, useCamStore, label }: {
    worldPosition: Vec3;
    size?: number;
    isActive: boolean;
    onClick: () => void;
    useCamStore: () => CamData;
    label: any;
  },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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

  useEffect(() => {
    gsap.to(svgRef.current, {
      stroke: hover ? "#" : "#EFEFE6",
      strokeWidth: hover ? 2 : 1.2,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [hover]);

  useEffect(() => {
    gsap.to(svgRef.current, {
      opacity: isActive ? 1 : 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isActive]);

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      ref={ref}
      style={{
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
      <div
        style={{
          opacity: hover ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          backgroundColor: "#1F3C6D",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: "5px",
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translate(-50%, 0)",
          zIndex: 2,
        }}
      >
        {label.name}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        // stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-target-icon lucide-target"
        ref={svgRef}
      >
        <circle fill={"#1F3C6D"} cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
};

export default HtmlMarker;
