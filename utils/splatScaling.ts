/**
 * Utility functions for scaling splats based on distance from origin
 */

export interface DistanceScalingConfig {
  /** Maximum distance to consider for scaling (beyond this, scaling remains constant) */
  maxDistance?: number;
  /** Minimum scale factor (splats won't get smaller than this) */
  minScale?: number;
  /** Maximum scale factor (splats won't get larger than this) */
  maxScale?: number;
  /** Scaling curve type */
  curve?: "linear" | "exponential" | "inverse" | "logarithmic";
  /** Power for exponential curves (default: 2.0) */
  power?: number;
  /** Invert the scaling (closer = smaller, farther = larger) */
  invert?: boolean;
}

/**
 * Calculate scale factor based on distance from origin
 * @param distance Distance from origin (0,0,0)
 * @param config Scaling configuration
 * @returns Scale factor to apply to splat
 */
export function getDistanceScale(
  distance: number,
  config: DistanceScalingConfig = {},
): number {
  const {
    maxDistance = 10.0,
    minScale = 0.1,
    maxScale = 2.0,
    curve = "linear",
    power = 2.0,
    invert = false,
  } = config;

  // Normalize distance (0 to 1)
  const normalizedDistance = Math.min(distance / maxDistance, 1.0);

  let scaleFactor: number;

  switch (curve) {
    case "exponential":
      scaleFactor = Math.pow(normalizedDistance, power);
      break;

    case "inverse":
      scaleFactor = 1.0 - Math.pow(normalizedDistance, power);
      break;

    case "logarithmic":
      // Logarithmic curve (slower growth)
      scaleFactor = normalizedDistance > 0
        ? Math.log(1 + normalizedDistance * (Math.E - 1)) / Math.log(Math.E)
        : 0;
      break;

    case "linear":
    default:
      scaleFactor = normalizedDistance;
      break;
  }

  // Invert if requested
  if (invert) {
    scaleFactor = 1.0 - scaleFactor;
  }

  // Map to scale range
  const scale = minScale + scaleFactor * (maxScale - minScale);

  return Math.max(minScale, Math.min(maxScale, scale));
}

/**
 * GLSL shader function for distance-based scaling
 * Add this to your vertex shader to scale splats by distance from origin
 */
export const distanceScalingShaderFunction = `
// Distance-based scaling function
// Add these uniforms to your shader:
// uniform float uMaxDistance;     // Maximum distance for scaling
// uniform float uMinScale;        // Minimum scale factor
// uniform float uMaxScale;        // Maximum scale factor
// uniform float uScalePower;      // Power for curve (2.0 = quadratic)
// uniform int uScaleCurve;        // 0=linear, 1=exponential, 2=inverse, 3=logarithmic
// uniform int uInvertScale;       // 1 to invert scaling

float getDistanceScale(vec3 position) {
  float distance = length(position);
  float normalizedDistance = min(distance / uMaxDistance, 1.0);
  
  float scaleFactor;
  
  if (uScaleCurve == 1) {
    // Exponential
    scaleFactor = pow(normalizedDistance, uScalePower);
  } else if (uScaleCurve == 2) {
    // Inverse
    scaleFactor = 1.0 - pow(normalizedDistance, uScalePower);
  } else if (uScaleCurve == 3) {
    // Logarithmic
    scaleFactor = normalizedDistance > 0.0 
      ? log(1.0 + normalizedDistance * (2.71828 - 1.0)) / log(2.71828)
      : 0.0;
  } else {
    // Linear (default)
    scaleFactor = normalizedDistance;
  }
  
  // Invert if requested
  if (uInvertScale == 1) {
    scaleFactor = 1.0 - scaleFactor;
  }
  
  // Map to scale range
  return uMinScale + scaleFactor * (uMaxScale - uMinScale);
}
`;

/**
 * Create scaling uniforms for PlayCanvas
 * @param config Scaling configuration
 * @returns Object with uniform values for PlayCanvas
 */
export function createScalingUniforms(config: DistanceScalingConfig = {}) {
  const {
    maxDistance = 10.0,
    minScale = 0.1,
    maxScale = 2.0,
    curve = "linear",
    power = 2.0,
    invert = false,
  } = config;

  const curveMap = {
    "linear": 0,
    "exponential": 1,
    "inverse": 2,
    "logarithmic": 3,
  };

  return {
    uMaxDistance: maxDistance,
    uMinScale: minScale,
    uMaxScale: maxScale,
    uScalePower: power,
    uScaleCurve: curveMap[curve],
    uInvertScale: invert ? 1 : 0,
  };
}

/**
 * Example usage for setting up distance scaling on a splat entity
 */
export function setupDistanceScaling(
  entity: any, // PlayCanvas Entity
  config: DistanceScalingConfig = {},
) {
  const uniforms = createScalingUniforms(config);

  // Apply uniforms to the entity's material
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
