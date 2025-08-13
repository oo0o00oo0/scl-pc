import { useEffect, useRef } from "react";
import { Entity as PcEntity } from "playcanvas";
import {
  createScalingUniforms,
  DistanceScalingConfig,
} from "../utils/splatScaling";

/**
 * Hook for applying distance-based scaling to splat entities
 */
export function useDistanceScaling(
  entity: PcEntity | null,
  config: DistanceScalingConfig = {},
) {
  const configRef = useRef(config);
  const appliedRef = useRef(false);

  // Update config ref when config changes
  configRef.current = config;

  useEffect(() => {
    if (!entity) {
      appliedRef.current = false;
      return;
    }

    const applyScaling = () => {
      const uniforms = createScalingUniforms(configRef.current);

      // Apply uniforms to all mesh instances in the entity
      const meshInstances = entity.render?.meshInstances;
      if (meshInstances) {
        meshInstances.forEach((meshInstance: any) => {
          if (meshInstance.material) {
            Object.entries(uniforms).forEach(([key, value]) => {
              meshInstance.material.setParameter(key, value);
            });
          }
        });
        appliedRef.current = true;
      }
    };

    // Apply scaling immediately if entity is ready
    if (entity.render?.meshInstances) {
      applyScaling();
    } else {
      // Wait for the entity to be fully initialized
      const checkEntity = () => {
        if (entity.render?.meshInstances) {
          applyScaling();
        } else {
          setTimeout(checkEntity, 10);
        }
      };
      checkEntity();
    }
  }, [entity]);

  // Function to update scaling parameters at runtime
  const updateScaling = (newConfig: Partial<DistanceScalingConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };

    if (entity && appliedRef.current) {
      const uniforms = createScalingUniforms(configRef.current);
      const meshInstances = entity.render?.meshInstances;

      if (meshInstances) {
        meshInstances.forEach((meshInstance: any) => {
          if (meshInstance.material) {
            Object.entries(uniforms).forEach(([key, value]) => {
              meshInstance.material.setParameter(key, value);
            });
          }
        });
      }
    }
  };

  return {
    updateScaling,
    isApplied: appliedRef.current,
  };
}

/**
 * Hook for animating distance scaling parameters over time
 */
export function useAnimatedDistanceScaling(
  entity: PcEntity | null,
  baseConfig: DistanceScalingConfig = {},
  animationSpeed: number = 1.0,
) {
  const { updateScaling } = useDistanceScaling(entity, baseConfig);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!entity) return;

    startTimeRef.current = Date.now();

    const animate = () => {
      if (!startTimeRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const animationValue = Math.sin(elapsed * animationSpeed) * 0.5 + 0.5;

      // Example animation: oscillate between min and max scale
      const animatedMaxScale = (baseConfig.maxScale || 2.0) *
        (0.5 + animationValue * 0.5);

      updateScaling({
        maxScale: animatedMaxScale,
      });

      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [entity, baseConfig, animationSpeed, updateScaling]);

  return { updateScaling };
}
