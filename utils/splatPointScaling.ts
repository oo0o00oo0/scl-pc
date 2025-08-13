/**
 * Simple function to scale splat points based on distance from origin
 */

export interface SplatPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Scale splat points based on distance from origin
 * Points close to center keep full scale, points farther away scale down exponentially
 *
 * @param splatPoints Array of splat center positions
 * @param multiplier Controls how aggressive the scaling is (higher = more aggressive)
 * @returns Array of scale factors (0-1) for each splat point
 */
export function scaleSplatPointsByDistance(
  splatPoints: SplatPoint[],
  multiplier: number = 1.0,
): number[] {
  return splatPoints.map((point) => {
    // Calculate distance from origin
    const distance = Math.sqrt(
      point.x * point.x + point.y * point.y + point.z * point.z,
    );

    // Exponential falloff based on distance and multiplier
    // Close points (distance ~0) return scale ~1.0
    // Far points return scale approaching 0
    const scale = Math.exp(-distance * multiplier);

    return Math.max(0.01, scale); // Minimum scale to avoid invisible splats
  });
}

/**
 * Alternative version with threshold - no scaling within a certain distance
 *
 * @param splatPoints Array of splat center positions
 * @param threshold Distance threshold - no scaling within this distance
 * @param multiplier Controls falloff rate beyond threshold
 * @returns Array of scale factors (0-1) for each splat point
 */
export function scaleSplatPointsWithThreshold(
  splatPoints: SplatPoint[],
  threshold: number = 2.0,
  multiplier: number = 0.5,
): number[] {
  return splatPoints.map((point) => {
    // Calculate distance from origin
    const distance = Math.sqrt(
      point.x * point.x + point.y * point.y + point.z * point.z,
    );

    // No scaling if within threshold
    if (distance <= threshold) {
      return 1.0;
    }

    // Exponential falloff beyond threshold
    const excessDistance = distance - threshold;
    const scale = Math.exp(-excessDistance * multiplier);

    return Math.max(0.01, scale); // Minimum scale to avoid invisible splats
  });
}

/**
 * Get scale factor for a single point
 */
export function getPointScale(
  point: SplatPoint,
  multiplier: number = 1.0,
): number {
  const distance = Math.sqrt(
    point.x * point.x + point.y * point.y + point.z * point.z,
  );
  return Math.max(0.01, Math.exp(-distance * multiplier));
}

/**
 * Get scale factor for a single point with threshold
 */
export function getPointScaleWithThreshold(
  point: SplatPoint,
  threshold: number = 2.0,
  multiplier: number = 0.5,
): number {
  const distance = Math.sqrt(
    point.x * point.x + point.y * point.y + point.z * point.z,
  );

  if (distance <= threshold) {
    return 1.0;
  }

  const excessDistance = distance - threshold;
  return Math.max(0.01, Math.exp(-excessDistance * multiplier));
}
