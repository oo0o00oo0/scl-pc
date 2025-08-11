import { Mat4, Vec3, Vec4 } from "playcanvas";

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
};

export const lerpRate = (damping: number, dt: number): number => {
  const t = 1 - Math.pow(damping, dt * 1);
  // Fast ease-in-out - much more subtle curve
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
};

// Alternative easing functions you can use:
export const easeInOutSine = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

export const sceneCenter = new Vec3(0, 0, 0);

export const flatternPOIS = (poi: any) => {
  return Object.entries(poi).flatMap(([scene, items]) =>
    (items as any[]).map((item: any) => ({ ...item, scene }))
  );
};

export function worldToScreenStandalone(
  worldCoord: Vec3,
  viewProjMatrix: Mat4,
  rect: Vec4,
  canvasWidth: number,
  canvasHeight: number,
  screenCoord: Vec3 = new Vec3(),
): { screenCoord: Vec3; isBehindCamera: boolean } {
  // Transform point by view-projection matrix
  viewProjMatrix.transformPoint(worldCoord, screenCoord);

  const vpm = viewProjMatrix.data;
  const w = worldCoord.x * vpm[3] +
    worldCoord.y * vpm[7] +
    worldCoord.z * vpm[11] +
    1 * vpm[15];

  // Check if point is behind camera (negative z in view space means behind camera)
  const isBehindCamera = w <= 0;

  // Normalize and convert to [0,1]
  screenCoord.x = (screenCoord.x / w + 1) * 0.5;
  screenCoord.y = (1 - screenCoord.y / w) * 0.5;

  // Apply camera rect and convert to pixel coordinates
  const { x: rx, y: ry, z: rw, w: rh } = rect;
  screenCoord.x = screenCoord.x * rw * canvasWidth + rx * canvasWidth;
  screenCoord.y = screenCoord.y * rh * canvasHeight +
    (1 - ry - rh) * canvasHeight;

  return { screenCoord, isBehindCamera };
}
