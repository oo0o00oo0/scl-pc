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

  return angle;
}

/**
 * Create constraint presets for common use cases
 */
export const AZIMUTH_PRESETS = {
  unlimited: (): AzimuthConstraint => ({ type: "unlimited" }),

  custom: (center: number, range: number): AzimuthConstraint => ({
    type: "range",
    center,
    range,
  }),
};
