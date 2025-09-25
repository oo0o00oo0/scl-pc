/**
 * HtmlMarkerConnect - A component that draws SVG paths from anchor points to 3D world markers
 *
 * Usage Examples:
 *
 * // Basic usage with default smooth curve from top-right
 * <HtmlMarkerConnect
 *   worldPosition={new Vec3(0, 0, 0)}
 *   isActive={true}
 *   onClick={() => console.log('clicked')}
 *   useCamStore={useCamStore}
 *   label={{ name: "Point A" }}
 * />
 *
 * // Angled path with custom styling from bottom-left
 * <HtmlMarkerConnect
 *   worldPosition={new Vec3(10, 5, -3)}
 *   isActive={true}
 *   onClick={() => console.log('clicked')}
 *   useCamStore={useCamStore}
 *   label={{ name: "Point B" }}
 *   anchorPoint={{ x: 0, y: 1 }}
 *   pathType="angled"
 *   angleOffset={0.4}
 *   pathStyle={{
 *     stroke: "#FF6B6B",
 *     strokeWidth: 3,
 *     strokeDasharray: "10,5"
 *   }}
 * />
 *
 * // Smooth curve from center with solid line
 * <HtmlMarkerConnect
 *   worldPosition={new Vec3(-5, 2, 8)}
 *   isActive={true}
 *   onClick={() => console.log('clicked')}
 *   useCamStore={useCamStore}
 *   label={{ name: "Smooth Center" }}
 *   anchorPoint={{ x: 0.5, y: 0.5 }}
 *   pathType="smooth"
 *   pathStyle={{
 *     stroke: "#4ECDC4",
 *     strokeWidth: 2,
 *     strokeDasharray: "none"
 *   }}
 * />
 *
 * // Angled path from top-right with early corner
 * <HtmlMarkerConnect
 *   worldPosition={new Vec3(0, 10, 5)}
 *   isActive={true}
 *   onClick={() => console.log('clicked')}
 *   useCamStore={useCamStore}
 *   label={{ name: "Early Corner" }}
 *   pathType="angled"
 *   angleOffset={0.2}
 *   pathStyle={{
 *     stroke: "#9B59B6",
 *     strokeWidth: 2,
 *     strokeDasharray: "8,4"
 *   }}
 * />
 */

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

type AnchorPoint = {
  x: number; // 0-1 (0 = left, 1 = right)
  y: number; // 0-1 (0 = top, 1 = bottom)
};

type PathType = "smooth" | "angled";

export const HtmlMarkerConnect = (
  {
    worldPosition,
    size = 150,
    isActive,
    onClick,
    useCamStore,
    label,
    anchorPoint = { x: .8, y: .9 }, // Default to top-right
    pathType = "smooth", // Default to smooth curves
    pathStyle = {
      stroke: "#ffffff87",
      strokeWidth: 2,
      strokeDasharray: "5,5",
    },
    angleOffset = 0.3, // For angled paths, how far along to place the corner (0-1)
  }: {
    worldPosition: Vec3;
    size?: number;
    isActive: boolean;
    onClick?: () => void;
    useCamStore: () => CamData;
    label: any;
    anchorPoint?: AnchorPoint;
    pathType?: PathType;
    pathStyle?: {
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
    };
    angleOffset?: number; // Controls where the angle corner is placed (0-1)
  },
) => {
  const markerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const markerSvgRef = useRef<SVGSVGElement>(null);
  const screenPos = useRef<Vec3>(new Vec3());
  const [hover, setHover] = useState<boolean>(false);

  const camData = useCamStore();

  useEffect(() => {
    if (
      !isActive || !markerRef.current || !svgContainerRef.current ||
      !pathRef.current
    ) return;

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
      markerRef.current.style.display = "none";
      svgContainerRef.current.style.display = "none";
      return;
    }

    markerRef.current.style.display = "block";
    svgContainerRef.current.style.display = "block";

    // Position the marker
    const markerX = result.screenCoord.x - size / 2;
    const markerY = result.screenCoord.y - size / 2;
    markerRef.current.style.transform = `translate(${markerX}px, ${markerY}px)`;

    // Calculate anchor point in screen coordinates
    const anchorX = anchorPoint.x * canvasWidth;
    const anchorY = anchorPoint.y * canvasHeight;

    // Calculate marker center
    const markerCenterX = result.screenCoord.x;
    const markerCenterY = result.screenCoord.y;

    // Update SVG container to full screen
    svgContainerRef.current.setAttribute("width", canvasWidth.toString());
    svgContainerRef.current.setAttribute("height", canvasHeight.toString());
    svgContainerRef.current.setAttribute(
      "viewBox",
      `0 0 ${canvasWidth} ${canvasHeight}`,
    );

    // Create path based on pathType
    let pathData: string;

    if (pathType === "smooth") {
      // Smooth curved path using cubic Bezier
      const controlX1 = anchorX + (markerCenterX - anchorX) * 0.3;
      const controlY1 = anchorY;
      const controlX2 = anchorX + (markerCenterX - anchorX) * 0.7;
      const controlY2 = markerCenterY;

      pathData =
        `M ${anchorX} ${anchorY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${markerCenterX} ${markerCenterY}`;
    } else {
      // Angled path with two straight lines
      // Calculate the corner point based on angleOffset
      const deltaX = markerCenterX - anchorX;
      const deltaY = markerCenterY - anchorY;

      // Corner point calculation - can be either horizontal-first or vertical-first
      // We'll choose based on which direction is dominant
      const isHorizontalDominant = Math.abs(deltaX) > Math.abs(deltaY);

      let cornerX: number, cornerY: number;

      if (isHorizontalDominant) {
        // Go horizontal first, then vertical
        cornerX = anchorX + deltaX * angleOffset;
        cornerY = anchorY;
      } else {
        // Go vertical first, then horizontal
        cornerX = anchorX;
        cornerY = anchorY + deltaY * angleOffset;
      }

      pathData =
        `M ${anchorX} ${anchorY} L ${cornerX} ${cornerY} L ${markerCenterX} ${markerCenterY}`;
    }

    pathRef.current.setAttribute("d", pathData);
  }, [worldPosition, isActive, camData, anchorPoint, pathType, angleOffset]);

  // Animate marker SVG on hover
  useEffect(() => {
    gsap.to(markerSvgRef.current, {
      stroke: hover ? "#fff" : pathStyle.stroke,
      strokeWidth: hover
        ? (pathStyle.strokeWidth || 2) + 1
        : pathStyle.strokeWidth || 2,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [hover, pathStyle]);

  // Animate path on hover
  useEffect(() => {
    gsap.to(pathRef.current, {
      stroke: hover ? "#fff" : pathStyle.stroke,
      strokeWidth: hover
        ? (pathStyle.strokeWidth || 2) + 0.5
        : pathStyle.strokeWidth || 2,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [hover, pathStyle]);

  // Animate overall opacity based on active state
  useEffect(() => {
    gsap.to([markerSvgRef.current, pathRef.current], {
      opacity: isActive ? 1 : 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isActive]);

  return (
    <>
      {/* Full-screen SVG for the connection path */}
      <svg
        ref={svgContainerRef}
        style={{
          zIndex: 99,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ref={pathRef}
          fill="none"
          stroke={pathStyle.stroke}
          strokeWidth={pathStyle.strokeWidth}
          strokeDasharray={pathStyle.strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Anchor point indicator */}
        <circle
          cx={anchorPoint.x * (camData.canvasWidth || 0)}
          cy={anchorPoint.y * (camData.canvasHeight || 0)}
          r="4"
          fill={pathStyle.stroke}
          opacity={isActive ? 0.8 : 0}
          style={{
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      </svg>

      {/* Positioned marker */}
      <div
        onClick={onClick}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        ref={markerRef}
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
        {/* Label tooltip */}
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
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>

        {/* Marker SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-target-icon lucide-target"
          ref={markerSvgRef}
        >
          <circle fill={pathStyle.stroke} cx="12" cy="12" r="10" />
          <circle
            cx="12"
            cy="12"
            r="6"
            stroke="white"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
      </div>
    </>
  );
};

export default HtmlMarkerConnect;
