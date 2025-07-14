import { useEffect, useRef, useState } from "react";
import { Vec3 } from "playcanvas";
import camStore from "@/state/camStore";
import gsap from "gsap";
import { worldToScreenStandalone } from "../utils";

export const HtmlMarker = (
  { worldPosition, size = 150 }: { worldPosition: Vec3; size?: number },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isActive, setIsActive] = useState<boolean>(false);

  const screenPos = useRef<Vec3>(new Vec3());

  useEffect(() => {
    const unsubscribe = camStore.subscribe(
      (state) => state.camData,
      ({ viewProjMatrix, cameraRect, canvasWidth, canvasHeight }) => {
        if (ref.current) {
          worldToScreenStandalone(
            worldPosition,
            viewProjMatrix,
            cameraRect,
            canvasWidth,
            canvasHeight,
            screenPos.current,
          );

          ref.current.style.transform = `translate(${
            screenPos.current.x - size / 2
          }px, ${screenPos.current.y - size / 2}px)`;
        }
      },
    );

    return () => unsubscribe();
  }, [worldPosition]);

  useEffect(() => {
    gsap.to(svgRef.current, {
      stroke: isActive ? "#0d9488" : "#EFEFE6",
      strokeWidth: isActive ? 2 : 1.2,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isActive]);

  return (
    <div
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
      ref={ref}
      style={{
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
        <circle fill={"#3c4c4d7a"} cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
};

export default HtmlMarker;
