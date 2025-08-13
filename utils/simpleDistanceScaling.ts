/**
 * Simple distance scaling utility for splats
 * Scales splats based on distance from origin with exponential falloff
 */

export interface SimpleDistanceScalingConfig {
  /** Distance from origin where scaling starts (closer splats keep full size) */
  scaleDistance?: number;
  /** How quickly splats scale down (higher = faster falloff) */
  scaleFalloff?: number;
}

/**
 * Apply simple distance scaling to a splat entity
 * @param entity PlayCanvas Entity with splat material
 * @param config Scaling configuration
 */
export function applySimpleDistanceScaling(
  entity: any, // PlayCanvas Entity
  config: SimpleDistanceScalingConfig = {},
) {
  const {
    scaleDistance = 2.0, // Start scaling at distance 2.0 from origin
    scaleFalloff = 0.5, // Moderate falloff rate
  } = config;

  // Apply uniforms to the entity's material
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances) {
    meshInstances.forEach((meshInstance: any) => {
      if (meshInstance.material) {
        meshInstance.material.setParameter("uScaleDistance", scaleDistance);
        meshInstance.material.setParameter("uScaleFalloff", scaleFalloff);
      }
    });
  }
}

/**
 * Quick setup with common presets
 */
export const SIMPLE_SCALING_PRESETS = {
  // No scaling for close splats, moderate falloff for distant ones
  moderate: {
    scaleDistance: 3.0,
    scaleFalloff: 0.3,
  },

  // Aggressive scaling - starts close to center, rapid falloff
  aggressive: {
    scaleDistance: 1.5,
    scaleFalloff: 1.0,
  },

  // Gentle scaling - large safe zone, slow falloff
  gentle: {
    scaleDistance: 5.0,
    scaleFalloff: 0.1,
  },

  // Very tight - only center splats at full size
  tight: {
    scaleDistance: 0.5,
    scaleFalloff: 2.0,
  },
} as const;

/**
 * Calculate the scale factor for a given distance (for testing/preview)
 */
export function calculateScaleFactor(
  distance: number,
  scaleDistance: number = 2.0,
  scaleFalloff: number = 0.5,
): number {
  if (distance <= scaleDistance) {
    return 1.0;
  }

  const excessDistance = distance - scaleDistance;
  return Math.exp(-excessDistance * scaleFalloff);
}
