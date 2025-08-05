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
  { worldPosition, size = 150, isActive, onClick, useCamStore }: {
    worldPosition: Vec3;
    size?: number;
    isActive: boolean;
    onClick: () => void;
    useCamStore: () => CamData;
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

    worldToScreenStandalone(
      worldPosition,
      viewProjMatrix,
      cameraRect,
      canvasWidth,
      canvasHeight,
      screenPos.current,
    );

    // console.log(screenPos.current);

    ref.current.style.transform = `translate(${
      screenPos.current.x - size / 2
    }px, ${screenPos.current.y - size / 2}px)`;
  }, [worldPosition, isActive, camData]);

  useEffect(() => {
    gsap.to(svgRef.current, {
      stroke: hover ? "#0d9488" : "#EFEFE6",
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
        <circle fill={"#3C4C4D"} cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
};

export default HtmlMarker;
