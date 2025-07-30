import { Entity } from "@playcanvas/react";
import { Camera, Script } from "@playcanvas/react/components";
import { useApp } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
//
// @ts-ignore
import { CameraControls as CameraControlsScript } from "@/libs/scripts/camera-controls.mjs";

import type { CamState } from "@/libs/types/camera.ts";
import { clampAzimuthAngle } from "@/libs/atomic/utils/cameraUtils";
import { Mat4, Vec2, Vec4 } from "playcanvas";
import { useRenderOnCameraChange } from "@/libs/hooks/use-render-on-camera-change";

const CameraControls = (
  { camState, clearColor, onChange = () => {} }: {
    camState: CamState;
    clearColor: string;
    onChange: (camData: {
      viewProjMatrix: Mat4;
      cameraRect: Vec4;
      canvasWidth: number;
      canvasHeight: number;
    }) => void;
  },
) => {
  const app = useApp();
  const {
    position,
    target,
    delay = 0,
    cameraConstraints,
  } = camState || {};

  const { entity: entityRef } = useRenderOnCameraChange(onChange);

  const { pitchRange, azimuth } = cameraConstraints;

  // Ref to store initial touch position for drag calculations
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const scriptComponent = entityRef.current?.script;
    if (!scriptComponent) return;
    const cameraControlsScript = scriptComponent?.get(CameraControlsScript);
    if (!cameraControlsScript) return;

    // Detect if device is mobile/touch-capable
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Different sensitivity values for desktop vs mobile
    const sensitivity = isMobile
      ? { horizontal: -13, vertical: -2.5 } // Reduced sensitivity for mobile
      : { horizontal: -6, vertical: -5 }; // Original desktop sensitivity

    const handlePassivePointerMove = (event: PointerEvent) => {
      // Skip if this is a touch event and the pointer is down (dragging)
      // This prevents camera movement during intentional touch interactions
      if (isMobile && event.pointerType === "touch" && event.pressure > 0) {
        return;
      }

      // Normalize pointer position to [-1, 1] range
      const pointerX = (event.clientX / window.innerWidth) * 2 - 1; // -1 (left) to 1 (right)
      const pointerY = (event.clientY / window.innerHeight) * 2 - 1; // -1 (top) to 1 (bottom)

      // Create gentle movement offsets with device-appropriate sensitivity
      const xOffset = pointerX * sensitivity.horizontal;
      const yOffset = -pointerY * sensitivity.vertical; // Invert Y for natural feel

      // Apply gentle camera movement
      //@ts-ignore
      cameraControlsScript.setGentleMovement(xOffset, yOffset);
    };

    if (isMobile) {
      // Handle touch start to capture initial position
      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        initialTouchRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };

        // Reset base angles for clean movement
        //@ts-ignore
        cameraControlsScript.updateBaseAngles();
      };

      // Handle touch move to calculate offset from initial position
      const handleTouchMove = (event: TouchEvent) => {
        // Only respond to single finger touches
        if (event.touches.length !== 1 || !initialTouchRef.current) return;

        const touch = event.touches[0];

        // Calculate offset from initial touch position
        const deltaX = touch.clientX - initialTouchRef.current.x;
        const deltaY = touch.clientY - initialTouchRef.current.y;

        // Convert pixel deltas to degree values (similar to desktop range)
        // Desktop produces ranges like [-6, 6] and [-5, 5] degrees
        const maxDragDistance =
          Math.min(window.innerWidth, window.innerHeight) * 0.3; // 30% of smaller screen dimension

        // Normalize pixel deltas to [-1, 1] range based on max drag distance
        const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDragDistance));
        const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDragDistance));

        // Apply sensitivity to get degree values (similar to desktop)
        const xOffset = normalizedX * sensitivity.horizontal;
        const yOffset = -normalizedY * sensitivity.vertical; // Invert Y for natural feel

        //@ts-ignore
        cameraControlsScript.setGentleMovement(xOffset, yOffset);
      };

      // Handle touch end to clear initial position
      const handleTouchEnd = () => {
        initialTouchRef.current = null;
      };

      // Add touch event listeners
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
      window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

      return () => {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
      };
    } else {
      // Desktop: use pointer events as before
      window.addEventListener("pointermove", handlePassivePointerMove);

      return () => {
        window.removeEventListener("pointermove", handlePassivePointerMove);
      };
    }
  }, [cameraConstraints]);

  useEffect(() => {
    if (entityRef.current) {
      const scriptComponent = entityRef.current.script;
      const cameraControlsScript = scriptComponent?.get(CameraControlsScript);

      if (!cameraControlsScript) return;

      const clampAnglesHandler = (angles: Vec2) => {
        // Clamp pitch (X component)
        angles.x = Math.max(
          pitchRange.min,
          Math.min(pitchRange.max, angles.x),
        );

        angles.y = clampAzimuthAngle(angles.y, azimuth);
      };

      cameraControlsScript.on("clamp:angles", clampAnglesHandler);

      setTimeout(() => {
        //@ts-ignore
        cameraControlsScript.focus(
          target,
          position,
        );
      }, delay);

      return () => {
        cameraControlsScript.off("clamp:angles", clampAnglesHandler);
      };
    }
  }, [
    app,
    camState,
    position,
    target,
    delay,
    pitchRange,
    azimuth,
  ]);

  return (
    <Entity
      ref={entityRef}
      name="camera"
      position={[position.x, position.y, position.z]}
    >
      <Script
        pitchRange={new Vec2(pitchRange.min, pitchRange.max)}
        enableZoom={true}
        // enableFly={false}
        // enablePan={false}
        // enableOrbit={false}
        //
        script={CameraControlsScript}
      />
      <Camera
        nearClip={0.1}
        farClip={1000}
        clearColor={clearColor}
      />
    </Entity>
  );
};

export default CameraControls;
