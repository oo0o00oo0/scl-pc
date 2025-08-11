import { useEffect, useRef, useState } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { Entity as PcEntity } from "playcanvas";

const nearlyEquals = (
  a: Float32Array,
  b: Float32Array,
  epsilon = 1e-4,
): boolean => {
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) >= epsilon) return false;
  }
  return true;
};

export interface CameraInteractionState {
  isMoving: boolean;
  isInteracting: boolean;
  isSafeToLoad: boolean;
}

/**
 * Hook to detect camera movement and user interaction state
 * Returns whether it's safe to perform heavy background loading operations
 */
export const useCameraInteractionState = (
  cameraEntity: PcEntity | null,
  movementThreshold = 1e-4,
  stillDuration = 1000, // ms to wait after movement stops before considering safe
  interactionEvents = ["pointerdown", "pointermove", "wheel", "keydown"],
): CameraInteractionState => {
  const app = useApp();
  const prevWorld = useRef<Float32Array>(new Float32Array(16));
  const prevProj = useRef<Float32Array>(new Float32Array(16));
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMoving, setIsMoving] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Track camera movement
  useEffect(() => {
    if (!cameraEntity || !app) return;

    const checkCameraMovement = () => {
      const world = cameraEntity.getWorldTransform().data;
      const proj = cameraEntity.camera?.projectionMatrix?.data;

      if (!proj) return;

      const hasChanged =
        !nearlyEquals(world, prevWorld.current, movementThreshold) ||
        !nearlyEquals(proj, prevProj.current, movementThreshold);

      if (hasChanged) {
        setIsMoving(true);

        // Clear existing timeout
        if (movementTimeoutRef.current) {
          clearTimeout(movementTimeoutRef.current);
        }

        // Set new timeout to mark as not moving after stillDuration
        movementTimeoutRef.current = setTimeout(() => {
          setIsMoving(false);
        }, stillDuration);

        // Update reference arrays
        prevWorld.current.set(world);
        prevProj.current.set(proj);
      }
    };

    // Check on every app update
    const updateHandler = () => checkCameraMovement();
    app.on("update", updateHandler);

    return () => {
      app.off("update", updateHandler);
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
    };
  }, [cameraEntity, app, movementThreshold, stillDuration]);

  // Track user interaction
  useEffect(() => {
    const canvas = app?.graphicsDevice?.canvas;
    if (!canvas) return;

    const handleInteractionStart = () => {
      setIsInteracting(true);

      // Clear existing timeout
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };

    const handleInteractionEnd = () => {
      // Clear existing timeout
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }

      // Set timeout to mark as not interacting after delay
      interactionTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, stillDuration);
    };

    // Add event listeners for interaction start
    interactionEvents.forEach((event) => {
      canvas.addEventListener(event, handleInteractionStart, { passive: true });
    });

    // Add event listeners for interaction end
    canvas.addEventListener("pointerup", handleInteractionEnd, {
      passive: true,
    });
    canvas.addEventListener("pointercancel", handleInteractionEnd, {
      passive: true,
    });
    canvas.addEventListener("keyup", handleInteractionEnd, { passive: true });

    return () => {
      interactionEvents.forEach((event) => {
        canvas.removeEventListener(event, handleInteractionStart);
      });
      canvas.removeEventListener("pointerup", handleInteractionEnd);
      canvas.removeEventListener("pointercancel", handleInteractionEnd);
      canvas.removeEventListener("keyup", handleInteractionEnd);

      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [app, stillDuration, interactionEvents]);

  const isSafeToLoad = !isMoving && !isInteracting;

  return {
    isMoving,
    isInteracting,
    isSafeToLoad,
  };
};
