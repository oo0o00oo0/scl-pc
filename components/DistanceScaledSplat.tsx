import { forwardRef, useImperativeHandle, useRef } from "react";
import { Entity as PcEntity } from "playcanvas";
import { CustomGSplat } from "../atomic/splats/CustomGSplat";
import { useDistanceScaling } from "../hooks/use-distance-scaling";
import { DistanceScalingConfig } from "../utils/splatScaling";
import { type Asset } from "playcanvas";

interface DistanceScaledSplatProps {
  asset: Asset;
  active: boolean;
  onEntityReady?: () => void;
  /** Distance scaling configuration */
  distanceScaling?: DistanceScalingConfig;
  /** Whether to use the distance-scaled shader */
  useDistanceScaledShader?: boolean;
}

interface DistanceScaledSplatRef {
  destroyEntity: () => void;
  updateScaling: (config: Partial<DistanceScalingConfig>) => void;
  entity: PcEntity | null;
}

/**
 * A Gaussian Splat component with distance-based scaling
 *
 * @example
 * ```tsx
 * <DistanceScaledSplat
 *   asset={splatAsset}
 *   active={true}
 *   distanceScaling={{
 *     maxDistance: 15.0,
 *     minScale: 0.2,
 *     maxScale: 3.0,
 *     curve: 'exponential',
 *     power: 1.5,
 *     invert: false
 *   }}
 *   useDistanceScaledShader={true}
 *   onEntityReady={() => console.log('Splat ready!')}
 * />
 * ```
 */
export const DistanceScaledSplat = forwardRef<
  DistanceScaledSplatRef,
  DistanceScaledSplatProps
>(
  ({
    asset,
    active,
    onEntityReady,
    distanceScaling = {
      maxDistance: 10.0,
      minScale: 0.1,
      maxScale: 2.0,
      curve: "linear",
      invert: false,
    },
    useDistanceScaledShader = false,
  }, ref) => {
    const gsplatRef = useRef<{ destroyEntity: () => void } | null>(null);
    const entityRef = useRef<PcEntity | null>(null);

    // Apply distance scaling when entity is ready
    const { updateScaling } = useDistanceScaling(
      entityRef.current,
      distanceScaling,
    );

    const handleEntityReady = () => {
      // Get the entity reference from the CustomGSplat
      if (gsplatRef.current) {
        // Note: You might need to modify CustomGSplat to expose the entity
        // For now, this assumes the entity is accessible somehow
        // entityRef.current = gsplatRef.current.entity;
      }

      onEntityReady?.();
    };

    useImperativeHandle(ref, () => ({
      destroyEntity: () => {
        gsplatRef.current?.destroyEntity();
        entityRef.current = null;
      },
      updateScaling,
      entity: entityRef.current,
    }));

    // If using distance-scaled shader, you'll need to modify the CustomGSplat
    // to accept a custom vertex shader parameter
    const vertexShader = useDistanceScaledShader
      ? require("../shaders/vert-distance-scaled.vert?raw").default
      : undefined;

    return (
      <CustomGSplat
        ref={gsplatRef}
        asset={asset}
        active={active}
        onEntityReady={handleEntityReady}
      />
    );
  },
);

// Default scaling configurations for common use cases
export const DISTANCE_SCALING_PRESETS = {
  // Closer splats are larger, farther ones are smaller
  closeupEmphasis: {
    maxDistance: 20.0,
    minScale: 0.3,
    maxScale: 2.5,
    curve: "exponential" as const,
    power: 1.5,
    invert: true,
  },

  // Farther splats are larger (good for atmospheric effects)
  atmosphericDepth: {
    maxDistance: 15.0,
    minScale: 0.5,
    maxScale: 3.0,
    curve: "exponential" as const,
    power: 2.0,
    invert: false,
  },

  // Linear scaling from center
  linearFade: {
    maxDistance: 12.0,
    minScale: 0.2,
    maxScale: 1.8,
    curve: "linear" as const,
    invert: false,
  },

  // Logarithmic scaling for subtle effects
  subtleScale: {
    maxDistance: 25.0,
    minScale: 0.7,
    maxScale: 1.4,
    curve: "logarithmic" as const,
    invert: false,
  },
} as const;
