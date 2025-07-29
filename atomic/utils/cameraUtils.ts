import type { AzimuthConstraint } from "@/libs/types/camera.ts";

/**
 * Normalize angle to [-180, 180] range
 */
export function normalizeAngle(angle: number): number {
  angle = angle % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

/**
 * Calculate the shortest angular distance between two angles
 */
export function angleDifference(a: number, b: number): number {
  return normalizeAngle(a - b);
}

/**
 * Check if an angle is within the constraint and clamp if necessary
 */
export function clampAzimuthAngle(
  angle: number,
  constraint: AzimuthConstraint,
): number {
  if (constraint.type === "unlimited") {
    return angle;
  }

  if (constraint.type === "range") {
    const center = constraint.center ?? 0;
    const range = constraint.range ?? 45;

    // Calculate difference from center
    const diff = angleDifference(angle, center);

    // Clamp the difference to the range
    const clampedDiff = Math.max(-range, Math.min(range, diff));

    // Return center + clamped difference
    return normalizeAngle(center + clampedDiff);
  }

  if (constraint.type === "sector") {
    const fromAngle = constraint.fromAngle ?? -45;
    const toAngle = constraint.toAngle ?? 45;

    // Normalize all angles
    const normalizedAngle = normalizeAngle(angle);
    const normalizedFrom = normalizeAngle(fromAngle);
    const normalizedTo = normalizeAngle(toAngle);

    // Handle sector that crosses 180/-180 boundary
    if (normalizedFrom > normalizedTo) {
      // Sector crosses the boundary (e.g., from 170° to -170°)
      if (
        normalizedAngle >= normalizedFrom || normalizedAngle <= normalizedTo
      ) {
        return normalizedAngle; // Within sector
      }

      // Find closest boundary
      const distToFrom = Math.abs(
        angleDifference(normalizedAngle, normalizedFrom),
      );
      const distToTo = Math.abs(angleDifference(normalizedAngle, normalizedTo));

      return distToFrom < distToTo ? normalizedFrom : normalizedTo;
    } else {
      // Normal sector (e.g., from -45° to 45°)
      if (
        normalizedAngle >= normalizedFrom && normalizedAngle <= normalizedTo
      ) {
        return normalizedAngle; // Within sector
      }

      // Clamp to closest boundary
      const distToFrom = Math.abs(normalizedAngle - normalizedFrom);
      const distToTo = Math.abs(normalizedAngle - normalizedTo);

      return distToFrom < distToTo ? normalizedFrom : normalizedTo;
    }
  }

  return angle;
}

/**
 * Create constraint presets for common use cases
 */
export const AZIMUTH_PRESETS = {
  unlimited: (): AzimuthConstraint => ({ type: "unlimited" }),

  frontOnly: (range: number = 30): AzimuthConstraint => ({
    type: "range",
    center: 0,
    range,
  }),

  leftRight: (range: number = 90): AzimuthConstraint => ({
    type: "range",
    center: 0,
    range,
  }),

  frontLeft: (): AzimuthConstraint => ({
    type: "sector",
    fromAngle: -90,
    toAngle: 0,
  }),

  frontRight: (): AzimuthConstraint => ({
    type: "sector",
    fromAngle: 0,
    toAngle: 90,
  }),

  custom: (center: number, range: number): AzimuthConstraint => ({
    type: "range",
    center,
    range,
  }),
};
